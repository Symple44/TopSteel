import { Article } from '@erp/entities'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import { LessThan, MoreThan, type Repository } from 'typeorm'
import { MarketplaceCoupon } from '../entities/marketplace-coupon.entity'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplacePromotion } from '../entities/marketplace-promotion.entity'

export interface CreatePromotionDto {
  name: string
  description?: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'FREE_SHIPPING' | 'BUNDLE'
  value: number
  conditions?: PromotionConditions
  startDate: Date
  endDate?: Date
  isActive?: boolean
  priority?: number
  maxUsages?: number
  maxUsagesPerCustomer?: number
  minimumOrderAmount?: number
  applicableProducts?: string[]
  applicableCategories?: string[]
  excludedProducts?: string[]
  excludedCategories?: string[]
  customerGroups?: string[]
  stackable?: boolean
  requiresCoupon?: boolean
  couponCode?: string
  metadata?: Record<string, unknown>
}

export interface UpdatePromotionDto extends Partial<CreatePromotionDto> {
  id: string
}

export interface PromotionConditions {
  minQuantity?: number
  maxQuantity?: number
  minAmount?: number
  maxAmount?: number
  validDays?: number[] // 0-6 (Sunday-Saturday)
  validHours?: { start: number; end: number }
  customerType?: 'NEW' | 'RETURNING' | 'VIP' | 'ALL'
  paymentMethods?: string[]
  shippingMethods?: string[]
  regions?: string[]
  bundleProducts?: string[] // For bundle promotions
  buyProducts?: string[] // For Buy X Get Y
  getProducts?: string[] // For Buy X Get Y
  buyQuantity?: number // For Buy X Get Y
  getQuantity?: number // For Buy X Get Y
}

export interface CreateCouponDto {
  code: string
  description?: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
  value: number
  startDate?: Date
  endDate?: Date
  isActive?: boolean
  maxUsages?: number
  maxUsagesPerCustomer?: number
  minimumOrderAmount?: number
  applicableProducts?: string[]
  applicableCategories?: string[]
  excludedProducts?: string[]
  excludedCategories?: string[]
  customerGroups?: string[]
  customerEmails?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {
  id: string
}

export interface ApplyCouponResult {
  valid: boolean
  discount: number
  message?: string
  appliedCoupon?: MarketplaceCoupon
  appliedPromotions?: MarketplacePromotion[]
}

export interface PromotionValidationResult {
  valid: boolean
  reason?: string
  discount?: number
  appliedTo?: string[] // Product IDs
}

@Injectable()
export class MarketplacePromotionsService {
  private readonly logger = new Logger(MarketplacePromotionsService.name)
  private readonly CACHE_TTL = 300 // 5 minutes

  constructor(
    @InjectRepository(MarketplacePromotion)
    private readonly promotionRepository: Repository<MarketplacePromotion>,
    @InjectRepository(MarketplaceCoupon)
    private readonly couponRepository: Repository<MarketplaceCoupon>,
    @InjectRepository(Article) readonly _productRepository: Repository<Article>,
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceCustomer)
    private readonly customerRepository: Repository<MarketplaceCustomer>,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis
  ) {}

  /**
   * Create a new promotion
   */
  async createPromotion(
    tenantId: string,
    promotionData: CreatePromotionDto
  ): Promise<MarketplacePromotion> {
    try {
      // Validate promotion data
      this.validatePromotionData(promotionData)

      // Check for code uniqueness if it requires a coupon
      if (promotionData.requiresCoupon && promotionData.couponCode) {
        const existingCoupon = await this.couponRepository.findOne({
          where: { code: promotionData.couponCode, tenantId },
        })

        if (existingCoupon) {
          throw new BadRequestException(`Coupon code ${promotionData.couponCode} already exists`)
        }
      }

      const promotion = this.promotionRepository.create({
        ...promotionData,
        tenantId,
        usageCount: 0,
        isActive: promotionData.isActive ?? true,
        priority: promotionData.priority ?? 0,
        stackable: promotionData.stackable ?? false,
      })

      const savedPromotion = await this.promotionRepository.save(promotion)

      // Create associated coupon if required
      if (promotionData.requiresCoupon && promotionData.couponCode) {
        await this.createCoupon(tenantId, {
          code: promotionData.couponCode,
          description: promotionData.description,
          type:
            promotionData.type === 'FREE_SHIPPING'
              ? 'FREE_SHIPPING'
              : promotionData.type === 'PERCENTAGE'
                ? 'PERCENTAGE'
                : 'FIXED_AMOUNT',
          value: promotionData.value,
          startDate: promotionData.startDate,
          endDate: promotionData.endDate,
          isActive: promotionData.isActive,
          minimumOrderAmount: promotionData.minimumOrderAmount,
          applicableProducts: promotionData.applicableProducts,
          applicableCategories: promotionData.applicableCategories,
          metadata: { promotionId: savedPromotion.id },
        })
      }

      // Clear cache
      await this.clearPromotionsCache(tenantId)

      // Emit event
      this.eventEmitter.emit('marketplace.promotion.created', {
        promotionId: savedPromotion.id,
        tenantId,
        name: savedPromotion.name,
        type: savedPromotion.type,
      })

      this.logger.log(`Promotion created: ${savedPromotion.name} (${savedPromotion.type})`)

      return savedPromotion
    } catch (error) {
      this.logger.error('Failed to create promotion:', error)
      throw error
    }
  }

  /**
   * Update existing promotion
   */
  async updatePromotion(
    tenantId: string,
    updateData: UpdatePromotionDto
  ): Promise<MarketplacePromotion> {
    try {
      const promotion = await this.promotionRepository.findOne({
        where: { id: updateData.id, tenantId },
      })

      if (!promotion) {
        throw new NotFoundException(`Promotion ${updateData.id} not found`)
      }

      // Validate update data
      if (updateData.type || updateData.value !== undefined || updateData.conditions) {
        const validationData = { ...promotion, ...updateData }
        if (updateData.type) {
          validationData.type = updateData.type as unknown
        }
        // Type check workaround for validation
        this.validatePromotionData(validationData as unknown)
      }

      Object.assign(promotion, updateData)
      promotion.updatedAt = new Date()

      const updatedPromotion = await this.promotionRepository.save(promotion)

      // Clear cache
      await this.clearPromotionsCache(tenantId)

      // Emit event
      this.eventEmitter.emit('marketplace.promotion.updated', {
        promotionId: updatedPromotion.id,
        tenantId,
        changes: updateData,
      })

      this.logger.log(`Promotion updated: ${updatedPromotion.name}`)

      return updatedPromotion
    } catch (error) {
      this.logger.error(`Failed to update promotion ${updateData.id}:`, error)
      throw error
    }
  }

  /**
   * Get active promotions
   */
  async getActivePromotions(tenantId: string): Promise<MarketplacePromotion[]> {
    try {
      const cacheKey = `active-promotions:${tenantId}`
      const cached = await this.redisService.get(cacheKey)

      if (cached) {
        return JSON.parse(cached)
      }

      const now = new Date()
      const promotions = await this.promotionRepository.find({
        where: {
          tenantId,
          isActive: true,
          startDate: LessThan(now),
          endDate: MoreThan(now),
        },
        order: {
          priority: 'DESC',
          createdAt: 'ASC',
        },
      })

      // Cache for 5 minutes
      await this.redisService.setex(cacheKey, this.CACHE_TTL, JSON.stringify(promotions))

      return promotions
    } catch (error) {
      this.logger.error(`Failed to get active promotions for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Create a new coupon
   */
  async createCoupon(tenantId: string, couponData: CreateCouponDto): Promise<MarketplaceCoupon> {
    try {
      // Check if coupon code already exists
      const existingCoupon = await this.couponRepository.findOne({
        where: { code: couponData.code.toUpperCase(), tenantId },
      })

      if (existingCoupon) {
        throw new BadRequestException(`Coupon code ${couponData.code} already exists`)
      }

      const coupon = this.couponRepository.create({
        ...couponData,
        code: couponData.code.toUpperCase(),
        tenantId,
        usageCount: 0,
        isActive: couponData.isActive ?? true,
      })

      const savedCoupon = await this.couponRepository.save(coupon)

      // Clear cache
      await this.clearCouponsCache(tenantId)

      // Emit event
      this.eventEmitter.emit('marketplace.coupon.created', {
        couponId: savedCoupon.id,
        tenantId,
        code: savedCoupon.code,
      })

      this.logger.log(`Coupon created: ${savedCoupon.code}`)

      return savedCoupon
    } catch (error) {
      this.logger.error('Failed to create coupon:', error)
      throw error
    }
  }

  /**
   * Validate and apply coupon to order
   */
  async applyCoupon(
    tenantId: string,
    couponCode: string,
    orderId: string,
    customerId?: string
  ): Promise<ApplyCouponResult> {
    try {
      const coupon = await this.couponRepository.findOne({
        where: {
          code: couponCode.toUpperCase(),
          tenantId,
          isActive: true,
        },
      })

      if (!coupon) {
        return {
          valid: false,
          discount: 0,
          message: 'Invalid or expired coupon code',
        }
      }

      // Validate coupon
      const validation = await this.validateCoupon(coupon, orderId, customerId)
      if (!validation.valid) {
        return {
          valid: false,
          discount: 0,
          message: validation.reason,
        }
      }

      // Get order details
      const order = await this.orderRepository.findOne({
        where: { id: orderId, tenantId },
        relations: ['items', 'items.product'],
      })

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`)
      }

      // Calculate discount
      const discount = await this.calculateCouponDiscount(coupon, order)

      // Apply coupon to order
      order.appliedCouponId = coupon.id
      order.appliedCouponCode = coupon.code
      order.discountAmount = discount
      order.total = order.subtotal + order.tax + order.shippingCost - discount

      await this.orderRepository.save(order)

      // Track coupon usage
      await this.trackCouponUsage(coupon.id, customerId)

      // Get applicable promotions
      const promotions = await this.getApplicablePromotions(order, customerId)

      return {
        valid: true,
        discount,
        message: 'Coupon applied successfully',
        appliedCoupon: coupon,
        appliedPromotions: promotions,
      }
    } catch (error) {
      this.logger.error(`Failed to apply coupon ${couponCode}:`, error)
      throw error
    }
  }

  /**
   * Remove coupon from order
   */
  async removeCoupon(tenantId: string, orderId: string): Promise<void> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId, tenantId },
      })

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`)
      }

      order.appliedCouponId = ''
      order.appliedCouponCode = ''
      order.discountAmount = 0
      order.total = order.subtotal + order.tax + order.shippingCost

      await this.orderRepository.save(order)

      this.logger.log(`Coupon removed from order ${orderId}`)
    } catch (error) {
      this.logger.error(`Failed to remove coupon from order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Get applicable promotions for an order
   */
  async getApplicablePromotions(
    order: MarketplaceOrder,
    customerId?: string
  ): Promise<MarketplacePromotion[]> {
    try {
      const activePromotions = await this.getActivePromotions(order.tenantId)
      const applicablePromotions: MarketplacePromotion[] = []

      for (const promotion of activePromotions) {
        // Skip promotions that require coupons
        if (promotion.requiresCoupon) continue

        const validation = await this.validatePromotion(promotion, order, customerId)
        if (validation.valid) {
          applicablePromotions.push(promotion)
        }
      }

      // Sort by priority and stackability
      return applicablePromotions.sort((a, b) => {
        if (a.stackable !== b.stackable) {
          return a.stackable ? 1 : -1 // Non-stackable first
        }
        return b.priority - a.priority
      })
    } catch (error) {
      this.logger.error('Failed to get applicable promotions:', error)
      return []
    }
  }

  /**
   * Calculate total discount for order
   */
  async calculateOrderDiscount(
    tenantId: string,
    orderId: string,
    customerId?: string,
    couponCode?: string
  ): Promise<{ total: number; breakdown: Array<{ source: string; amount: number }> }> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId, tenantId },
        relations: ['items', 'items.product'],
      })

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`)
      }

      const breakdown: Array<{ source: string; amount: number }> = []
      let totalDiscount = 0

      // Apply coupon if provided
      if (couponCode) {
        const couponResult = await this.applyCoupon(tenantId, couponCode, orderId, customerId)
        if (couponResult.valid && couponResult.discount > 0) {
          breakdown.push({
            source: `Coupon: ${couponCode}`,
            amount: couponResult.discount,
          })
          totalDiscount += couponResult.discount
        }
      }

      // Get applicable promotions
      const promotions = await this.getApplicablePromotions(order, customerId)

      for (const promotion of promotions) {
        // Skip if not stackable and we already have a discount
        if (!promotion.stackable && totalDiscount > 0) continue

        const validation = await this.validatePromotion(promotion, order, customerId)
        if (validation.valid && validation.discount) {
          breakdown.push({
            source: `Promotion: ${promotion.name}`,
            amount: validation.discount,
          })
          totalDiscount += validation.discount

          // If not stackable, stop here
          if (!promotion.stackable) break
        }
      }

      return {
        total: totalDiscount,
        breakdown,
      }
    } catch (error) {
      this.logger.error(`Failed to calculate order discount for order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Generate bulk coupon codes
   */
  async generateBulkCoupons(
    tenantId: string,
    baseConfig: Omit<CreateCouponDto, 'code'>,
    quantity: number,
    prefix?: string
  ): Promise<MarketplaceCoupon[]> {
    try {
      const coupons: MarketplaceCoupon[] = []
      const batchId = `BATCH_${Date.now()}`

      for (let i = 0; i < quantity; i++) {
        const code = this.generateCouponCode(prefix)
        const coupon = await this.createCoupon(tenantId, {
          ...baseConfig,
          code,
          metadata: {
            ...baseConfig.metadata,
            batchId,
            batchIndex: i + 1,
          },
        })
        coupons.push(coupon)
      }

      this.logger.log(`Generated ${quantity} bulk coupons for tenant ${tenantId}`)

      return coupons
    } catch (error) {
      this.logger.error('Failed to generate bulk coupons:', error)
      throw error
    }
  }

  /**
   * Get promotion statistics
   */
  async getPromotionStatistics(
    tenantId: string,
    promotionId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    try {
      const promotion = await this.promotionRepository.findOne({
        where: { id: promotionId, tenantId },
      })

      if (!promotion) {
        throw new NotFoundException(`Promotion ${promotionId} not found`)
      }

      // Get usage statistics
      const usageStats = await this.getPromotionUsageStats(promotionId, dateRange)

      // Calculate revenue impact
      const revenueImpact = await this.calculatePromotionRevenueImpact(promotionId, dateRange)

      return {
        promotion: {
          id: promotion.id,
          name: promotion.name,
          type: promotion.type,
          value: promotion.value,
          status: this.getPromotionStatus(promotion),
        },
        usage: {
          totalUsages: promotion.usageCount,
          uniqueCustomers: usageStats.uniqueCustomers,
          averageDiscountPerUse: usageStats.averageDiscount,
          totalDiscountGiven: usageStats.totalDiscount,
        },
        revenue: {
          totalRevenue: revenueImpact.totalRevenue,
          discountAmount: revenueImpact.discountAmount,
          netRevenue: revenueImpact.netRevenue,
          conversionRate: revenueImpact.conversionRate,
        },
        performance: {
          redemptionRate: this.calculateRedemptionRate(promotion),
          remainingUsages: promotion.maxUsages ? promotion.maxUsages - promotion.usageCount : null,
          daysRemaining: this.calculateDaysRemaining(promotion),
        },
      }
    } catch (error) {
      this.logger.error(`Failed to get promotion statistics for ${promotionId}:`, error)
      throw error
    }
  }

  /**
   * Validate promotion data
   */
  private validatePromotionData(data: Partial<CreatePromotionDto>): void {
    if (!data.name?.trim()) {
      throw new BadRequestException('Promotion name is required')
    }

    if (!data.type) {
      throw new BadRequestException('Promotion type is required')
    }

    if (data.value === undefined || data.value < 0) {
      throw new BadRequestException('Promotion value must be positive')
    }

    if (data.type === 'PERCENTAGE' && data.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%')
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new BadRequestException('End date must be after start date')
    }

    if (data.type === 'BUY_X_GET_Y') {
      if (!data.conditions?.buyProducts?.length || !data.conditions?.getProducts?.length) {
        throw new BadRequestException('Buy X Get Y promotion requires buy and get products')
      }
      if (!data.conditions.buyQuantity || !data.conditions.getQuantity) {
        throw new BadRequestException('Buy X Get Y promotion requires quantities')
      }
    }

    if (data.type === 'BUNDLE' && !data.conditions?.bundleProducts?.length) {
      throw new BadRequestException('Bundle promotion requires bundle products')
    }
  }

  /**
   * Validate coupon
   */
  private async validateCoupon(
    coupon: MarketplaceCoupon,
    _orderId: string,
    customerId?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check if active
    if (!coupon.isActive) {
      return { valid: false, reason: 'Coupon is not active' }
    }

    // Check dates
    const now = new Date()
    if (coupon.startDate && coupon.startDate > now) {
      return { valid: false, reason: 'Coupon is not yet valid' }
    }
    if (coupon.endDate && coupon.endDate < now) {
      return { valid: false, reason: 'Coupon has expired' }
    }

    // Check usage limits
    if (coupon.maxUsages && coupon.usageCount >= coupon.maxUsages) {
      return { valid: false, reason: 'Coupon usage limit reached' }
    }

    // Check customer usage limit
    if (customerId && coupon.maxUsagesPerCustomer) {
      const customerUsage = await this.getCustomerCouponUsage(coupon.id, customerId)
      if (customerUsage >= coupon.maxUsagesPerCustomer) {
        return { valid: false, reason: 'Customer usage limit reached for this coupon' }
      }
    }

    // Check customer eligibility
    if (coupon.customerEmails?.length && customerId) {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      })
      if (!customer || !coupon.customerEmails.includes(customer.email)) {
        return { valid: false, reason: 'Coupon not valid for this customer' }
      }
    }

    return { valid: true }
  }

  /**
   * Validate promotion
   */
  private async validatePromotion(
    promotion: MarketplacePromotion,
    order: MarketplaceOrder,
    customerId?: string
  ): Promise<PromotionValidationResult> {
    // Basic validation
    if (!promotion.isActive) {
      return { valid: false, reason: 'Promotion is not active' }
    }

    // Date validation
    const now = new Date()
    if (promotion.startDate > now) {
      return { valid: false, reason: 'Promotion not yet started' }
    }
    if (promotion.endDate && promotion.endDate < now) {
      return { valid: false, reason: 'Promotion has ended' }
    }

    // Minimum order amount
    if (promotion.minimumOrderAmount && order.subtotal < promotion.minimumOrderAmount) {
      return { valid: false, reason: 'Order does not meet minimum amount' }
    }

    // Usage limits
    if (promotion.maxUsages && promotion.usageCount >= promotion.maxUsages) {
      return { valid: false, reason: 'Promotion usage limit reached' }
    }

    // Customer-specific validation
    if (customerId && promotion.maxUsagesPerCustomer) {
      const customerUsage = await this.getCustomerPromotionUsage(promotion.id, customerId)
      if (customerUsage >= promotion.maxUsagesPerCustomer) {
        return { valid: false, reason: 'Customer usage limit reached' }
      }
    }

    // Product/Category validation
    const applicableItems = this.getApplicableOrderItems(order, promotion)
    if (applicableItems.length === 0) {
      return { valid: false, reason: 'No applicable items in order' }
    }

    // Calculate discount
    const discount = this.calculatePromotionDiscount(promotion, order, applicableItems)

    return {
      valid: true,
      discount,
      appliedTo: applicableItems.map((item) => item.productId),
    }
  }

  /**
   * Calculate coupon discount
   */
  private async calculateCouponDiscount(
    coupon: MarketplaceCoupon,
    order: MarketplaceOrder
  ): Promise<number> {
    switch (coupon.type) {
      case 'PERCENTAGE':
        return (order.subtotal * coupon.value) / 100

      case 'FIXED_AMOUNT':
        return Math.min(coupon.value, order.subtotal)

      case 'FREE_SHIPPING':
        return order.shippingCost

      default:
        return 0
    }
  }

  /**
   * Calculate promotion discount
   */
  private calculatePromotionDiscount(
    promotion: MarketplacePromotion,
    order: MarketplaceOrder,
    applicableItems: unknown[]
  ): number {
    const applicableTotal = applicableItems.reduce((sum, item) => sum + item.totalPrice, 0)

    switch (promotion.type) {
      case 'PERCENTAGE':
        return (applicableTotal * promotion.value) / 100

      case 'FIXED_AMOUNT':
        return Math.min(promotion.value, applicableTotal)

      case 'FREE_SHIPPING':
        return order.shippingCost

      case 'BUY_X_GET_Y':
        return this.calculateBuyXGetYDiscount(promotion, order)

      case 'BUNDLE':
        return this.calculateBundleDiscount(promotion, order)

      default:
        return 0
    }
  }

  /**
   * Get applicable order items for promotion
   */
  private getApplicableOrderItems(order: MarketplaceOrder, promotion: MarketplacePromotion): unknown[] {
    return order.items.filter((item) => {
      // Check excluded products
      if (promotion.excludedProducts?.includes(item.productId)) {
        return false
      }

      // Check excluded categories
      if (promotion.excludedCategories?.includes(item.product.famille)) {
        return false
      }

      // Check applicable products
      if (promotion.applicableProducts?.length) {
        return promotion.applicableProducts.includes(item.productId)
      }

      // Check applicable categories
      if (promotion.applicableCategories?.length) {
        return promotion.applicableCategories.includes(item.product.famille)
      }

      return true
    })
  }

  /**
   * Calculate Buy X Get Y discount
   */
  private calculateBuyXGetYDiscount(
    promotion: MarketplacePromotion,
    order: MarketplaceOrder
  ): number {
    const buyProducts = promotion.conditions?.buyProducts || []
    const getProducts = promotion.conditions?.getProducts || []
    const buyQuantity = promotion.conditions?.buyQuantity || 1
    const getQuantity = promotion.conditions?.getQuantity || 1

    // Count buy products in order
    const buyCount = order.items
      .filter((item) => buyProducts.includes(item.productId))
      .reduce((sum, item) => sum + item.quantity, 0)

    // Check if buy condition is met
    const qualifyingTimes = Math.floor(buyCount / buyQuantity)
    if (qualifyingTimes === 0) return 0

    // Calculate discount on get products
    const getItems = order.items.filter((item) => getProducts.includes(item.productId))
    const freeQuantity = qualifyingTimes * getQuantity

    let discount = 0
    let remainingFree = freeQuantity

    for (const item of getItems) {
      if (remainingFree <= 0) break
      const discountQuantity = Math.min(item.quantity, remainingFree)
      discount += item.price * discountQuantity * (promotion.value / 100)
      remainingFree -= discountQuantity
    }

    return discount
  }

  /**
   * Calculate bundle discount
   */
  private calculateBundleDiscount(
    promotion: MarketplacePromotion,
    order: MarketplaceOrder
  ): number {
    const bundleProducts = promotion.conditions?.bundleProducts || []

    // Check if all bundle products are in order
    const orderProductIds = order.items.map((item) => item.productId)
    const hasAllProducts = bundleProducts.every((productId) => orderProductIds.includes(productId))

    if (!hasAllProducts) return 0

    // Calculate bundle discount
    const bundleItems = order.items.filter((item) => bundleProducts.includes(item.productId))
    const bundleTotal = bundleItems.reduce((sum, item) => sum + item.totalPrice, 0)

    return promotion.type === 'PERCENTAGE'
      ? (bundleTotal * promotion.value) / 100
      : Math.min(promotion.value, bundleTotal)
  }

  /**
   * Track coupon usage
   */
  private async trackCouponUsage(couponId: string, customerId?: string): Promise<void> {
    await this.couponRepository.increment({ id: couponId }, 'usageCount', 1)

    if (customerId) {
      // Track customer-specific usage in Redis
      const key = `coupon-usage:${couponId}:${customerId}`
      const current = await this.redisService.get(key)
      const count = current ? parseInt(current, 10) + 1 : 1
      await this.redisService.set(key, count.toString())
    }
  }

  /**
   * Get customer coupon usage count
   */
  private async getCustomerCouponUsage(couponId: string, customerId: string): Promise<number> {
    const key = `coupon-usage:${couponId}:${customerId}`
    const usage = await this.redisService.get(key)
    return usage ? parseInt(usage, 10) : 0
  }

  /**
   * Get customer promotion usage count
   */
  private async getCustomerPromotionUsage(
    promotionId: string,
    customerId: string
  ): Promise<number> {
    const key = `promotion-usage:${promotionId}:${customerId}`
    const usage = await this.redisService.get(key)
    return usage ? parseInt(usage, 10) : 0
  }

  /**
   * Get promotion usage statistics
   */
  private async getPromotionUsageStats(
    _promotionId: string,
    _dateRange?: { start: Date; end: Date }
  ) {
    // This would query actual usage data from orders
    // Simplified for now
    return {
      uniqueCustomers: 0,
      averageDiscount: 0,
      totalDiscount: 0,
    }
  }

  /**
   * Calculate promotion revenue impact
   */
  private async calculatePromotionRevenueImpact(
    _promotionId: string,
    _dateRange?: { start: Date; end: Date }
  ) {
    // This would analyze order data to calculate revenue impact
    // Simplified for now
    return {
      totalRevenue: 0,
      discountAmount: 0,
      netRevenue: 0,
      conversionRate: 0,
    }
  }

  /**
   * Get promotion status
   */
  private getPromotionStatus(promotion: MarketplacePromotion): string {
    const now = new Date()

    if (!promotion.isActive) return 'INACTIVE'
    if (promotion.startDate > now) return 'SCHEDULED'
    if (promotion.endDate && promotion.endDate < now) return 'EXPIRED'
    if (promotion.maxUsages && promotion.usageCount >= promotion.maxUsages) return 'DEPLETED'

    return 'ACTIVE'
  }

  /**
   * Calculate redemption rate
   */
  private calculateRedemptionRate(promotion: MarketplacePromotion): number {
    if (!promotion.maxUsages) return 0
    return (promotion.usageCount / promotion.maxUsages) * 100
  }

  /**
   * Calculate days remaining
   */
  private calculateDaysRemaining(promotion: MarketplacePromotion): number | null {
    if (!promotion.endDate) return null
    const now = new Date()
    const diff = promotion.endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  /**
   * Generate unique coupon code
   */
  private generateCouponCode(prefix?: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const length = 8
    let code = prefix ? `${prefix}_` : ''

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return code
  }

  /**
   * Clear promotions cache
   */
  private async clearPromotionsCache(tenantId: string): Promise<void> {
    try {
      const patterns = [`active-promotions:${tenantId}`, `promotion-stats:${tenantId}:*`]
      for (const pattern of patterns) {
        const keys = await this.redisService.keys(pattern)
        if (keys.length > 0) {
          await this.redisService.del(...keys)
        }
      }
    } catch (error) {
      this.logger.error('Failed to clear promotions cache:', error)
    }
  }

  /**
   * Clear coupons cache
   */
  private async clearCouponsCache(tenantId: string): Promise<void> {
    try {
      const patterns = [`coupons:${tenantId}:*`]
      for (const pattern of patterns) {
        const keys = await this.redisService.keys(pattern)
        if (keys.length > 0) {
          await this.redisService.del(...keys)
        }
      }
    } catch (error) {
      this.logger.error('Failed to clear coupons cache:', error)
    }
  }
}
