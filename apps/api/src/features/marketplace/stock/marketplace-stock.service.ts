import { Article } from '@erp/entities'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import type { DataSource, Repository } from 'typeorm'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity'

export interface StockReservation {
  id: string
  productId: string
  quantity: number
  reservedAt: Date
  expiresAt: Date
  customerId: string
  orderId?: string
}

export interface StockUpdateResult {
  success: boolean
  currentStock: number
  reservedStock: number
  availableStock: number
  error?: string
}

export interface StockAlertConfig {
  lowStockThreshold: number
  outOfStockAlert: boolean
  emailNotifications: boolean
  adminEmails: string[]
}

@Injectable()
export class MarketplaceStockService {
  private readonly logger = new Logger(MarketplaceStockService.name)
  private readonly RESERVATION_EXPIRY_MINUTES = 30 // Reservation expires after 30 minutes
  private readonly STOCK_CACHE_TTL = 300 // 5 minutes cache for stock levels

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(MarketplaceOrder) readonly _orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceOrderItem)
    readonly _orderItemRepository: Repository<MarketplaceOrderItem>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis
  ) {}

  /**
   * Check available stock for a product
   */
  async getAvailableStock(productId: string): Promise<number> {
    try {
      // Try to get from cache first
      const cacheKey = `stock:available:${productId}`
      const cachedStock = await this.redisService.get(cacheKey)

      if (cachedStock !== null) {
        return parseInt(cachedStock, 10)
      }

      // Get article with current stock
      const article = await this.articleRepository.findOne({
        where: { id: productId },
        select: ['id', 'stockPhysique', 'stockReserve', 'stockMini'],
      })

      if (!article) {
        throw new NotFoundException(`Article ${productId} not found`)
      }

      // Calculate available stock (total - reserved - pending orders)
      const reservedStock = article.stockReserve || 0
      const availableStock = Math.max(0, article.stockPhysique - reservedStock)

      // Cache the result
      await this.redisService.setex(cacheKey, this.STOCK_CACHE_TTL, availableStock.toString())

      return availableStock
    } catch (error) {
      this.logger.error(`Failed to get available stock for product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Reserve stock for checkout
   */
  async reserveStock(
    productId: string,
    quantity: number,
    customerId: string,
    orderId?: string
  ): Promise<StockReservation> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Lock the article row to prevent race conditions
      const article = await queryRunner.manager
        .createQueryBuilder(Article, 'article')
        .where('article.id = :productId', { productId })
        .setLock('pessimistic_write')
        .getOne()

      if (!article) {
        throw new NotFoundException(`Article ${productId} not found`)
      }

      // Check if article is available for marketplace
      if (!article.isMarketplaceEnabled) {
        throw new BadRequestException(`Article ${productId} is not available on marketplace`)
      }

      // Calculate available stock
      const reservedStock = article.stockReserve || 0
      const availableStock = article.stockPhysique - reservedStock

      if (availableStock < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
        )
      }

      // Update reserved stock
      await queryRunner.manager.update(Article, productId, {
        stockReserve: reservedStock + quantity,
      })

      // Create reservation record
      const reservation: StockReservation = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId,
        quantity,
        reservedAt: new Date(),
        expiresAt: new Date(Date.now() + this.RESERVATION_EXPIRY_MINUTES * 60 * 1000),
        customerId,
        orderId,
      }

      // Store reservation in Redis with expiry
      const reservationKey = `reservation:${reservation.id}`
      await this.redisService.setex(
        reservationKey,
        this.RESERVATION_EXPIRY_MINUTES * 60,
        JSON.stringify(reservation)
      )

      // Store product-level reservations for cleanup
      const productReservationsKey = `reservations:product:${productId}`
      await this.redisService.sadd(productReservationsKey, reservation.id)
      await this.redisService.expire(productReservationsKey, this.RESERVATION_EXPIRY_MINUTES * 60)

      await queryRunner.commitTransaction()

      // Clear cache
      await this.clearStockCache(productId)

      // Emit stock reserved event
      this.eventEmitter.emit('marketplace.stock.reserved', {
        productId,
        quantity,
        customerId,
        reservationId: reservation.id,
      })

      this.logger.log(
        `Stock reserved: ${quantity} units of product ${productId} for customer ${customerId}`
      )

      return reservation
    } catch (error) {
      await queryRunner.rollbackTransaction()
      this.logger.error(`Failed to reserve stock:`, error)
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Confirm stock reservation (convert to actual order)
   */
  async confirmReservation(reservationId: string): Promise<StockUpdateResult> {
    try {
      const reservationKey = `reservation:${reservationId}`
      const reservationData = await this.redisService.get(reservationKey)

      if (!reservationData) {
        throw new NotFoundException('Stock reservation not found or expired')
      }

      const reservation: StockReservation = JSON.parse(reservationData)

      // Update article stock (reduce actual stock, reduce reserved stock)
      const result = await this.dataSource.transaction(async (manager) => {
        const article = await manager.findOne(Article, {
          where: { id: reservation.productId },
        })

        if (!article) {
          throw new NotFoundException(`Article ${reservation.productId} not found`)
        }

        const newStockQuantity = article.stockPhysique - reservation.quantity
        const newReservedStock = Math.max(0, (article.stockReserve || 0) - reservation.quantity)

        await manager.update(Article, reservation.productId, {
          stockPhysique: newStockQuantity,
          stockReserve: newReservedStock,
        })

        return {
          success: true,
          currentStock: newStockQuantity,
          reservedStock: newReservedStock,
          availableStock: newStockQuantity - newReservedStock,
        }
      })

      // Clean up reservation
      await this.redisService.del(reservationKey)
      await this.redisService.srem(`reservations:product:${reservation.productId}`, reservationId)

      // Clear cache
      await this.clearStockCache(reservation.productId)

      // Check for low stock alerts
      await this.checkStockLevels(reservation.productId)

      // Emit stock confirmed event
      this.eventEmitter.emit('marketplace.stock.confirmed', {
        productId: reservation.productId,
        quantity: reservation.quantity,
        customerId: reservation.customerId,
        reservationId,
      })

      this.logger.log(`Stock reservation confirmed: ${reservationId}`)

      return result
    } catch (error) {
      this.logger.error(`Failed to confirm reservation ${reservationId}:`, error)
      throw error
    }
  }

  /**
   * Release stock reservation
   */
  async releaseReservation(reservationId: string): Promise<void> {
    try {
      const reservationKey = `reservation:${reservationId}`
      const reservationData = await this.redisService.get(reservationKey)

      if (!reservationData) {
        // Reservation already expired or doesn't exist
        return
      }

      const reservation: StockReservation = JSON.parse(reservationData)

      // Return reserved stock to available stock
      await this.articleRepository.update(reservation.productId, {
        stockReserve: () => `GREATEST(0, "stockReserve" - ${reservation.quantity})`,
      })

      // Clean up reservation
      await this.redisService.del(reservationKey)
      await this.redisService.srem(`reservations:product:${reservation.productId}`, reservationId)

      // Clear cache
      await this.clearStockCache(reservation.productId)

      // Emit stock released event
      this.eventEmitter.emit('marketplace.stock.released', {
        productId: reservation.productId,
        quantity: reservation.quantity,
        customerId: reservation.customerId,
        reservationId,
      })

      this.logger.log(`Stock reservation released: ${reservationId}`)
    } catch (error) {
      this.logger.error(`Failed to release reservation ${reservationId}:`, error)
      throw error
    }
  }

  /**
   * Clean up expired reservations
   */
  async cleanupExpiredReservations(): Promise<void> {
    try {
      const pattern = 'reservations:product:*'
      const keys = await this.redisService.keys(pattern)

      for (const key of keys) {
        const reservationIds = await this.redisService.smembers(key)

        for (const reservationId of reservationIds) {
          const reservationKey = `reservation:${reservationId}`
          const exists = await this.redisService.exists(reservationKey)

          if (!exists) {
            // Reservation has expired, clean up
            await this.redisService.srem(key, reservationId)
          }
        }
      }

      this.logger.log('Expired stock reservations cleaned up')
    } catch (error) {
      this.logger.error('Failed to cleanup expired reservations:', error)
    }
  }

  /**
   * Check stock levels and trigger alerts if needed
   */
  async checkStockLevels(productId: string): Promise<void> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: productId },
        select: ['id', 'designation', 'stockPhysique', 'stockMini', 'stockReserve'],
      })

      if (!article) {
        return
      }

      const availableStock = article.stockPhysique - (article.stockReserve || 0)
      const minStock = article.stockMini || 0

      // Check for low stock
      if (availableStock <= minStock && availableStock > 0) {
        this.eventEmitter.emit('marketplace.stock.low', {
          productId: article.id,
          productName: article.designation,
          currentStock: availableStock,
          minStockLevel: minStock,
        })
      }

      // Check for out of stock
      if (availableStock <= 0) {
        this.eventEmitter.emit('marketplace.stock.out', {
          productId: article.id,
          productName: article.designation,
          currentStock: availableStock,
        })
      }
    } catch (error) {
      this.logger.error(`Failed to check stock levels for product ${productId}:`, error)
    }
  }

  /**
   * Update product stock (for admin/ERP operations)
   */
  async updateStock(
    productId: string,
    newQuantity: number,
    reason?: string
  ): Promise<StockUpdateResult> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: productId },
      })

      if (!article) {
        throw new NotFoundException(`Article ${productId} not found`)
      }

      const oldQuantity = article.stockPhysique
      const difference = newQuantity - oldQuantity

      await this.articleRepository.update(productId, {
        stockPhysique: newQuantity,
        updatedAt: new Date(),
      })

      // Clear cache
      await this.clearStockCache(productId)

      // Check stock levels after update
      await this.checkStockLevels(productId)

      // Emit stock updated event
      this.eventEmitter.emit('marketplace.stock.updated', {
        productId,
        oldQuantity,
        newQuantity,
        difference,
        reason: reason || 'Manual update',
      })

      const reservedStock = article.stockReserve || 0

      this.logger.log(
        `Stock updated for product ${productId}: ${oldQuantity} -> ${newQuantity} (${difference >= 0 ? '+' : ''}${difference})`
      )

      return {
        success: true,
        currentStock: newQuantity,
        reservedStock,
        availableStock: newQuantity - reservedStock,
      }
    } catch (error) {
      this.logger.error(`Failed to update stock for product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Get stock reservation details
   */
  async getReservation(reservationId: string): Promise<StockReservation | null> {
    try {
      const reservationKey = `reservation:${reservationId}`
      const reservationData = await this.redisService.get(reservationKey)

      if (!reservationData) {
        return null
      }

      return JSON.parse(reservationData)
    } catch (error) {
      this.logger.error(`Failed to get reservation ${reservationId}:`, error)
      return null
    }
  }

  /**
   * Clear stock cache for a product
   */
  private async clearStockCache(productId: string): Promise<void> {
    try {
      const cacheKey = `stock:available:${productId}`
      await this.redisService.del(cacheKey)
    } catch (error) {
      this.logger.error(`Failed to clear stock cache for product ${productId}:`, error)
    }
  }
}
