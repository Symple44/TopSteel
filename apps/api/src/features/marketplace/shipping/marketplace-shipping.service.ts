import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import type { Repository } from 'typeorm'
import { getErrorMessage, hasStack } from '../../../core/common/utils'
import type { EmailService } from '../../../core/email/email.service'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceShipment } from '../entities/marketplace-shipment.entity'
import { ShippingMethod, TrackingStatus } from '../types/shipping.types'

export interface CreateShipmentDto {
  orderId: string
  carrierName: string
  trackingNumber: string
  trackingUrl?: string
  estimatedDeliveryDate?: Date
  shippingMethod: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  notes?: string
}

export interface TrackingUpdate {
  status: TrackingStatus
  location: string
  timestamp: Date
  description: string
  nextAction?: string
}

// Re-export types for backward compatibility
export { ShippingMethod, TrackingStatus } from '../types/shipping.types'

@Injectable()
export class MarketplaceShippingService {
  private readonly logger = new Logger(MarketplaceShippingService.name)
  private readonly TRACKING_CACHE_TTL = 1800 // 30 minutes

  constructor(
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceShipment)
    private readonly shipmentRepository: Repository<MarketplaceShipment>,
    private readonly eventEmitter: EventEmitter2,
    readonly _configService: ConfigService,
    @InjectRedis() private readonly redisService: Redis,
    private readonly emailService: EmailService
  ) {}

  /**
   * Create a new shipment for an order
   */
  async createShipment(shipmentData: CreateShipmentDto): Promise<MarketplaceShipment> {
    try {
      // Find the order
      const order = await this.orderRepository.findOne({
        where: { id: shipmentData.orderId },
        relations: ['customer', 'items'],
      })

      if (!order) {
        throw new NotFoundException(`Order ${shipmentData.orderId} not found`)
      }

      // Validate order status
      if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
        throw new BadRequestException('Order must be confirmed or processing to create shipment')
      }

      // Check if shipment already exists for this order
      const existingShipment = await this.shipmentRepository.findOne({
        where: { orderId: shipmentData.orderId },
      })

      if (existingShipment) {
        throw new BadRequestException('Shipment already exists for this order')
      }

      // Create the shipment
      const shipment = this.shipmentRepository.create({
        orderId: shipmentData.orderId,
        order,
        carrierName: shipmentData.carrierName,
        trackingNumber: shipmentData.trackingNumber,
        trackingUrl: shipmentData.trackingUrl,
        estimatedDeliveryDate: shipmentData.estimatedDeliveryDate,
        shippingMethod: shipmentData.shippingMethod,
        weight: shipmentData.weight,
        dimensions: shipmentData.dimensions,
        notes: shipmentData.notes,
        status: TrackingStatus.LABEL_CREATED,
        shippedAt: new Date(),
        trackingHistory: [
          {
            status: TrackingStatus.LABEL_CREATED,
            location: 'Warehouse',
            timestamp: new Date(),
            description: 'Shipping label created and package prepared for pickup',
          },
        ],
      })

      const savedShipment = await this.shipmentRepository.save(shipment)

      // Update order status to SHIPPED
      await this.orderRepository.update(shipmentData.orderId, {
        status: 'SHIPPED',
        shippedAt: new Date(),
      })

      // Send shipping notification email
      await this.sendShippingNotificationEmail(order, savedShipment)

      // Emit shipment created event
      this.eventEmitter.emit('marketplace.shipment.created', {
        shipmentId: savedShipment.id,
        orderId: order.id,
        trackingNumber: savedShipment.trackingNumber,
        customerId: order.customer.id,
      })

      this.logger.log(
        `Shipment created for order ${order.orderNumber}: ${savedShipment.trackingNumber}`
      )

      return savedShipment
    } catch (error) {
      this.logger.error(
        `Failed to create shipment: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      throw error
    }
  }

  /**
   * Update tracking information for a shipment
   */
  async updateTrackingInfo(
    shipmentId: string,
    trackingUpdate: TrackingUpdate
  ): Promise<MarketplaceShipment> {
    try {
      const shipment = await this.shipmentRepository.findOne({
        where: { id: shipmentId },
        relations: ['order', 'order.customer'],
      })

      if (!shipment) {
        throw new NotFoundException(`Shipment ${shipmentId} not found`)
      }

      // Add the tracking update to history
      if (!shipment.trackingHistory) {
        shipment.trackingHistory = []
      }

      shipment.trackingHistory.push(trackingUpdate)
      shipment.status = trackingUpdate.status
      shipment.lastLocationUpdate = trackingUpdate.location
      shipment.updatedAt = new Date()

      // Update estimated delivery if provided
      if (trackingUpdate.nextAction?.includes('delivery')) {
        // Extract estimated delivery date if available in tracking update
        // This would depend on carrier API format
      }

      const updatedShipment = await this.shipmentRepository.save(shipment)

      // Clear cached tracking info
      await this.clearTrackingCache(shipment.trackingNumber)

      // Handle specific status updates
      await this.handleTrackingStatusUpdate(updatedShipment, trackingUpdate)

      this.logger.log(
        `Tracking updated for shipment ${shipmentId}: ${trackingUpdate.status} at ${trackingUpdate.location}`
      )

      return updatedShipment
    } catch (error) {
      this.logger.error(
        `Failed to update tracking info: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      throw error
    }
  }

  /**
   * Get tracking information for a shipment
   */
  async getTrackingInfo(trackingNumber: string): Promise<MarketplaceShipment | null> {
    try {
      // Check cache first
      const cacheKey = `tracking:${trackingNumber}`
      const cachedInfo = await this.redisService.get(cacheKey)

      if (cachedInfo) {
        return JSON.parse(cachedInfo)
      }

      // Fetch from database
      const shipment = await this.shipmentRepository.findOne({
        where: { trackingNumber },
        relations: ['order', 'order.customer'],
      })

      if (!shipment) {
        return null
      }

      // Cache the result
      await this.redisService.setex(cacheKey, this.TRACKING_CACHE_TTL, JSON.stringify(shipment))

      return shipment
    } catch (error) {
      this.logger.error(`Failed to get tracking info for ${trackingNumber}:`, error)
      return null
    }
  }

  /**
   * Track shipment by order ID
   */
  async trackByOrderId(orderId: string): Promise<MarketplaceShipment | null> {
    try {
      const shipment = await this.shipmentRepository.findOne({
        where: { orderId },
        relations: ['order', 'order.customer'],
      })

      return shipment
    } catch (error) {
      this.logger.error(`Failed to track shipment for order ${orderId}:`, error)
      return null
    }
  }

  /**
   * Get all shipments for a customer
   */
  async getCustomerShipments(customerId: string): Promise<MarketplaceShipment[]> {
    try {
      const shipments = await this.shipmentRepository
        .createQueryBuilder('shipment')
        .leftJoinAndSelect('shipment.order', 'order')
        .leftJoinAndSelect('order.customer', 'customer')
        .where('customer.id = :customerId', { customerId })
        .orderBy('shipment.createdAt', 'DESC')
        .getMany()

      return shipments
    } catch (error) {
      this.logger.error(`Failed to get customer shipments: ${getErrorMessage(error)}`, error)
      return []
    }
  }

  /**
   * Calculate shipping cost based on order and destination
   */
  async calculateShippingCost(order: MarketplaceOrder, shippingMethod: ShippingMethod): Promise<number> {
    try {
      // This is a simplified calculation
      // In production, this would integrate with carrier APIs

      const baseRates = {
        [ShippingMethod.STANDARD]: 5.99,
        [ShippingMethod.EXPRESS]: 12.99,
        [ShippingMethod.OVERNIGHT]: 24.99,
        [ShippingMethod.PICKUP]: 0,
      }

      let cost = baseRates[shippingMethod]

      // Add weight-based pricing
      const totalWeight =
        order.items?.reduce(
          (weight: number, item: { product?: { poids?: number }; quantity: number }) => 
            weight + (item.product?.poids || 1) * item.quantity,
          0
        ) || 1

      if (totalWeight > 10) {
        cost += (totalWeight - 10) * 0.5 // €0.50 per kg over 10kg
      }

      // Free shipping for orders over €100
      if ((order.total || 0) >= 100) {
        cost = shippingMethod === ShippingMethod.PICKUP ? 0 : Math.max(0, cost - 5.99)
      }

      return Math.round(cost * 100) / 100 // Round to 2 decimals
    } catch (error) {
      this.logger.error('Failed to calculate shipping cost:', error)
      const baseRates: Record<string, number> = {
        STANDARD: 5.99,
        EXPRESS: 12.99,
        PREMIUM: 19.99,
      }
      return baseRates[shippingMethod] || 5.99
    }
  }

  /**
   * Get available shipping methods for an order
   */
  async getAvailableShippingMethods(orderId: string): Promise<
    Array<{
      method: ShippingMethod
      name: string
      cost: number
      estimatedDays: string
      description: string
    }>
  > {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['items', 'items.product'],
      })

      if (!order) {
        throw new NotFoundException('Order not found')
      }

      const methods = [
        {
          method: ShippingMethod.STANDARD,
          name: 'Livraison Standard',
          cost: await this.calculateShippingCost(order, ShippingMethod.STANDARD),
          estimatedDays: '3-5 jours',
          description: 'Livraison économique par transporteur',
        },
        {
          method: ShippingMethod.EXPRESS,
          name: 'Livraison Express',
          cost: await this.calculateShippingCost(order, ShippingMethod.EXPRESS),
          estimatedDays: '1-2 jours',
          description: 'Livraison rapide garantie',
        },
        {
          method: ShippingMethod.OVERNIGHT,
          name: 'Livraison 24h',
          cost: await this.calculateShippingCost(order, ShippingMethod.OVERNIGHT),
          estimatedDays: '1 jour',
          description: 'Livraison le lendemain avant 12h',
        },
        {
          method: ShippingMethod.PICKUP,
          name: 'Retrait en Point Relais',
          cost: await this.calculateShippingCost(order, ShippingMethod.PICKUP),
          estimatedDays: '2-3 jours',
          description: 'Retrait dans un point relais près de chez vous',
        },
      ]

      return methods
    } catch (error) {
      this.logger.error(`Failed to get shipping methods for order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Handle tracking status updates with specific business logic
   */
  private async handleTrackingStatusUpdate(
    shipment: MarketplaceShipment,
    update: TrackingUpdate
  ): Promise<void> {
    try {
      switch (update.status) {
        case TrackingStatus.OUT_FOR_DELIVERY:
          // Send out for delivery notification
          await this.sendDeliveryNotificationEmail(shipment, 'out_for_delivery')
          break

        case TrackingStatus.DELIVERED:
          // Update order status to DELIVERED
          await this.orderRepository.update(shipment.orderId, {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          })

          // Send delivery confirmation
          await this.sendDeliveryNotificationEmail(shipment, 'delivered')

          // Emit delivered event
          this.eventEmitter.emit('marketplace.order.delivered', {
            orderId: shipment.orderId,
            shipmentId: shipment.id,
            deliveredAt: new Date(),
          })
          break

        case TrackingStatus.DELIVERY_FAILED:
          // Send delivery failed notification
          await this.sendDeliveryNotificationEmail(shipment, 'delivery_failed')
          break

        case TrackingStatus.EXCEPTION:
          // Send exception notification
          await this.sendDeliveryNotificationEmail(shipment, 'exception')
          break
      }

      // Emit general tracking update event
      this.eventEmitter.emit('marketplace.tracking.updated', {
        shipmentId: shipment.id,
        orderId: shipment.orderId,
        status: update.status,
        location: update.location,
        timestamp: update.timestamp,
      })
    } catch (error) {
      this.logger.error(`Failed to handle tracking status update: ${getErrorMessage(error)}`, error)
    }
  }

  /**
   * Send shipping notification email
   */
  private async sendShippingNotificationEmail(
    order: MarketplaceOrder,
    shipment: MarketplaceShipment
  ): Promise<void> {
    try {
      const emailResult = await this.emailService.sendShippingNotificationEmail(
        order.customer.email,
        `${order.customer.firstName} ${order.customer.lastName}`,
        order.orderNumber,
        shipment.trackingNumber,
        shipment.carrierName
      )

      if (emailResult.success) {
        this.logger.log(`Shipping notification sent for order ${order.orderNumber}`)
      } else {
        this.logger.error(`Failed to send shipping notification: ${emailResult.error}`)
      }
    } catch (error) {
      this.logger.error('Failed to send shipping notification email:', error)
    }
  }

  /**
   * Send delivery notification emails
   */
  private async sendDeliveryNotificationEmail(
    shipment: MarketplaceShipment,
    type: string
  ): Promise<void> {
    try {
      const subject = this.getDeliveryEmailSubject(type, shipment.order.orderNumber)
      const template = this.getDeliveryEmailTemplate(type)

      const emailResult = await this.emailService.sendEmail({
        to: shipment.order.customer.email,
        subject,
        template,
        context: {
          customerName: `${shipment.order.customer.firstName} ${shipment.order.customer.lastName}`,
          orderNumber: shipment.order.orderNumber,
          trackingNumber: shipment.trackingNumber,
          carrierName: shipment.carrierName,
          year: new Date().getFullYear(),
        },
      })

      if (emailResult.success) {
        this.logger.log(`${type} notification sent for order ${shipment.order.orderNumber}`)
      } else {
        this.logger.error(`Failed to send ${type} notification: ${emailResult.error}`)
      }
    } catch (error) {
      this.logger.error(`Failed to send ${type} notification email:`, error)
    }
  }

  private getDeliveryEmailSubject(type: string, orderNumber: string): string {
    switch (type) {
      case 'out_for_delivery':
        return `🚚 Votre commande #${orderNumber} est en cours de livraison`
      case 'delivered':
        return `✅ Votre commande #${orderNumber} a été livrée`
      case 'delivery_failed':
        return `⚠️ Échec de livraison pour la commande #${orderNumber}`
      case 'exception':
        return `🚨 Incident de livraison - Commande #${orderNumber}`
      default:
        return `Mise à jour de livraison - Commande #${orderNumber}`
    }
  }

  private getDeliveryEmailTemplate(type: string): string {
    switch (type) {
      case 'out_for_delivery':
        return 'delivery-out-for-delivery'
      case 'delivered':
        return 'delivery-confirmed'
      case 'delivery_failed':
        return 'delivery-failed'
      case 'exception':
        return 'delivery-exception'
      default:
        return 'delivery-update'
    }
  }

  /**
   * Clear tracking cache
   */
  private async clearTrackingCache(trackingNumber: string): Promise<void> {
    try {
      const cacheKey = `tracking:${trackingNumber}`
      await this.redisService.del(cacheKey)
    } catch (error) {
      this.logger.error(`Failed to clear tracking cache: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Health check for shipping service
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Test database connectivity
      await this.shipmentRepository.count()

      // Test Redis connectivity
      await this.redisService.ping()

      return true
    } catch (error) {
      this.logger.error('Shipping service health check failed:', error)
      return false
    }
  }
}
