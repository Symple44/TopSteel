import { Article } from '@erp/entities'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import { MoreThan, type Repository, type SelectQueryBuilder } from 'typeorm'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity'

export interface OrderModerationFilters {
  status?: string
  paymentStatus?: string
  customerEmail?: string
  dateFrom?: Date
  dateTo?: Date
  amountMin?: number
  amountMax?: number
  flagged?: boolean
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo?: string
}

export interface OrderModerationResponse {
  orders: OrderModerationItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: {
    pending: number
    flagged: number
    urgent: number
  }
}

export interface OrderModerationItem {
  id: string
  orderNumber: string
  customer: {
    id: string
    name: string
    email: string
    isVerified: boolean
  }
  total: number
  status: string
  paymentStatus: string
  createdAt: Date
  updatedAt: Date
  flags: OrderFlag[]
  priority: string
  assignedTo?: string
  notes: ModerationNote[]
  items: {
    id: string
    productName: string
    quantity: number
    price: number
  }[]
}

export type OrderFlagType = 
  | 'PAYMENT_FAILED'
  | 'HIGH_VALUE'
  | 'NEW_CUSTOMER'
  | 'SUSPICIOUS_ACTIVITY'
  | 'INVENTORY_ISSUE'
  | 'CUSTOM'

export interface OrderFlag {
  type: OrderFlagType
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
  createdAt: Date
  resolvedAt?: Date
  resolvedBy?: string
}

export interface ModerationNote {
  id: string
  message: string
  createdBy: string
  createdAt: Date
  isInternal: boolean
}

export interface OrderModerationAction {
  action: 'APPROVE' | 'REJECT' | 'HOLD' | 'FLAG' | 'ASSIGN' | 'ADD_NOTE' | 'RESOLVE_FLAG'
  reason?: string
  assignTo?: string
  flagType?: string
  noteMessage?: string
  isInternalNote?: boolean
}

@Injectable()
export class OrderModerationService {
  private readonly logger = new Logger(OrderModerationService.name)

  constructor(
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceOrderItem)
    readonly _orderItemRepository: Repository<MarketplaceOrderItem>,
    @InjectRepository(Article) readonly _articleRepository: Repository<Article>,
    @InjectRepository(MarketplaceCustomer)
    readonly _customerRepository: Repository<MarketplaceCustomer>,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis
  ) {}

  /**
   * Get orders for moderation with filtering and pagination
   */
  async getOrdersForModeration(
    tenantId: string,
    filters: OrderModerationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<OrderModerationResponse> {
    try {
      const queryBuilder = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .where('order.tenant_id = :tenantId', { tenantId })

      // Apply filters
      this.applyModerationFilters(queryBuilder, filters)

      // Get total count
      const total = await queryBuilder.getCount()

      // Apply pagination and ordering
      const offset = (page - 1) * limit
      queryBuilder.orderBy('order.created_at', 'DESC').skip(offset).take(limit)

      const orders = await queryBuilder.getMany()

      // Transform to moderation format
      const moderationOrders = await Promise.all(
        orders.map((order) => this.transformToModerationItem(order))
      )

      // Get summary statistics
      const summary = await this.getModerationSummary(tenantId)

      return {
        orders: moderationOrders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary,
      }
    } catch (error) {
      this.logger.error(`Failed to get orders for moderation for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Get single order for detailed moderation
   */
  async getOrderForDetailedModeration(
    tenantId: string,
    orderId: string
  ): Promise<OrderModerationItem> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
      relations: ['customer', 'items', 'items.product'],
    })

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`)
    }

    return this.transformToModerationItem(order)
  }

  /**
   * Perform moderation action on order
   */
  async performModerationAction(
    tenantId: string,
    orderId: string,
    action: OrderModerationAction,
    moderatorId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId, tenantId },
        relations: ['customer', 'items'],
      })

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`)
      }

      let result: { success: boolean; message: string }

      switch (action.action) {
        case 'APPROVE':
          result = await this.approveOrder(order, action.reason ?? '', moderatorId)
          break
        case 'REJECT':
          result = await this.rejectOrder(order, action.reason ?? '', moderatorId)
          break
        case 'HOLD':
          result = await this.holdOrder(order, action.reason ?? '', moderatorId)
          break
        case 'FLAG':
          result = await this.flagOrder(
            order,
            action.flagType ?? 'GENERAL',
            action.reason ?? '',
            moderatorId
          )
          break
        case 'ASSIGN':
          result = await this.assignOrder(order, action.assignTo ?? '', moderatorId)
          break
        case 'ADD_NOTE':
          result = await this.addNote(
            order,
            action.noteMessage ?? '',
            moderatorId,
            action.isInternalNote
          )
          break
        case 'RESOLVE_FLAG':
          result = await this.resolveFlag(order, action.flagType ?? 'GENERAL', moderatorId)
          break
        default:
          throw new BadRequestException(`Unknown moderation action: ${action.action}`)
      }

      // Clear cache
      await this.clearModerationCache(tenantId)

      return result
    } catch (error) {
      this.logger.error(`Failed to perform moderation action on order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Auto-flag orders based on criteria
   */
  async autoFlagOrders(tenantId: string): Promise<{ flagged: number }> {
    try {
      const flaggedCount = await this.runAutoFlagRules(tenantId)

      this.logger.log(`Auto-flagged ${flaggedCount} orders for tenant ${tenantId}`)

      return { flagged: flaggedCount }
    } catch (error) {
      this.logger.error(`Failed to auto-flag orders for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(tenantId: string, dateRange?: { start: Date; end: Date }) {
    try {
      const baseQuery = this.orderRepository
        .createQueryBuilder('order')
        .where('order.tenant_id = :tenantId', { tenantId })

      if (dateRange) {
        baseQuery.andWhere('order.created_at BETWEEN :start AND :end', dateRange)
      }

      const [
        totalOrders,
        pendingOrders,
        approvedOrders,
        rejectedOrders,
        flaggedOrders,
        avgProcessingTime,
      ] = await Promise.all([
        baseQuery.getCount(),
        baseQuery.clone().andWhere("order.moderation_status = 'PENDING'").getCount(),
        baseQuery.clone().andWhere("order.moderation_status = 'APPROVED'").getCount(),
        baseQuery.clone().andWhere("order.moderation_status = 'REJECTED'").getCount(),
        baseQuery.clone().andWhere('JSON_LENGTH(order.flags) > 0').getCount(),
        this.getAverageProcessingTime(tenantId, dateRange),
      ])

      return {
        totalOrders,
        pendingOrders,
        approvedOrders,
        rejectedOrders,
        flaggedOrders,
        avgProcessingTime,
        flaggedPercentage: totalOrders > 0 ? Math.round((flaggedOrders / totalOrders) * 100) : 0,
        approvalRate: totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0,
      }
    } catch (error) {
      this.logger.error(`Failed to get moderation stats for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Transform order entity to moderation item
   */
  private async transformToModerationItem(order: MarketplaceOrder): Promise<OrderModerationItem> {
    const flags = this.parseOrderFlags(order.flags)
    const notes = this.parseOrderNotes(order.moderationNotes)

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.customer.id,
        name: `${order.customer.firstName} ${order.customer.lastName}`,
        email: order.customer.email,
        isVerified: order.customer.emailVerified,
      },
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      flags,
      priority: this.calculateOrderPriority(order, flags),
      assignedTo: order.assignedModerator,
      notes,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product.designation,
        quantity: item.quantity,
        price: item.price,
      })),
    }
  }

  /**
   * Apply moderation filters to query
   */
  private applyModerationFilters(queryBuilder: SelectQueryBuilder<MarketplaceOrder>, filters: OrderModerationFilters): void {
    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status })
    }

    if (filters.paymentStatus) {
      queryBuilder.andWhere('order.payment_status = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      })
    }

    if (filters.customerEmail) {
      queryBuilder.andWhere('customer.email ILIKE :email', { email: `%${filters.customerEmail}%` })
    }

    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('order.created_at BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      })
    }

    if (filters.amountMin !== undefined) {
      queryBuilder.andWhere('order.total >= :amountMin', { amountMin: filters.amountMin })
    }

    if (filters.amountMax !== undefined) {
      queryBuilder.andWhere('order.total <= :amountMax', { amountMax: filters.amountMax })
    }

    if (filters.flagged) {
      queryBuilder.andWhere('COALESCE(JSON_ARRAY_LENGTH(order.flags), 0) > 0')
    }

    if (filters.priority) {
      queryBuilder.andWhere('order.priority = :priority', { priority: filters.priority })
    }

    if (filters.assignedTo) {
      queryBuilder.andWhere('order.assigned_moderator = :assignedTo', {
        assignedTo: filters.assignedTo,
      })
    }
  }

  /**
   * Get moderation summary statistics
   */
  private async getModerationSummary(tenantId: string) {
    const [pending, flagged, urgent] = await Promise.all([
      this.orderRepository.count({
        where: { tenantId, moderationStatus: 'PENDING' },
      }),
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.tenant_id = :tenantId', { tenantId })
        .andWhere('COALESCE(JSON_ARRAY_LENGTH(order.flags), 0) > 0')
        .getCount(),
      this.orderRepository.count({
        where: { tenantId, priority: 'URGENT' },
      }),
    ])

    return { pending, flagged, urgent }
  }

  /**
   * Parse order flags from JSON
   */
  private parseOrderFlags(flagsJson: unknown): OrderFlag[] {
    if (!flagsJson) return []

    try {
      return Array.isArray(flagsJson) ? flagsJson : []
    } catch {
      return []
    }
  }

  /**
   * Parse order notes from JSON
   */
  private parseOrderNotes(notesJson: unknown): ModerationNote[] {
    if (!notesJson) return []

    try {
      return Array.isArray(notesJson) ? notesJson : []
    } catch {
      return []
    }
  }

  /**
   * Calculate order priority based on flags and order data
   */
  private calculateOrderPriority(order: MarketplaceOrder, flags: OrderFlag[]): string {
    if (flags.some((f) => f.severity === 'HIGH')) return 'URGENT'
    if (order.total > 10000) return 'HIGH'
    if (flags.some((f) => f.severity === 'MEDIUM')) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Approve order
   */
  private async approveOrder(order: MarketplaceOrder, reason: string, moderatorId: string) {
    order.moderationStatus = 'APPROVED'
    order.moderatedBy = moderatorId
    order.moderatedAt = new Date()

    if (reason) {
      const notes = this.parseOrderNotes(order.moderationNotes)
      notes.push({
        id: `note_${Date.now()}`,
        message: `Order approved: ${reason}`,
        createdBy: moderatorId,
        createdAt: new Date(),
        isInternal: false,
      })
      order.moderationNotes = notes
    }

    await this.orderRepository.save(order)

    this.eventEmitter.emit('marketplace.order.approved', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      moderatorId,
      reason,
    })

    return { success: true, message: 'Order approved successfully' }
  }

  /**
   * Reject order
   */
  private async rejectOrder(order: MarketplaceOrder, reason: string, moderatorId: string) {
    order.moderationStatus = 'REJECTED'
    order.moderatedBy = moderatorId
    order.moderatedAt = new Date()
    order.status = 'CANCELLED'

    const notes = this.parseOrderNotes(order.moderationNotes)
    notes.push({
      id: `note_${Date.now()}`,
      message: `Order rejected: ${reason}`,
      createdBy: moderatorId,
      createdAt: new Date(),
      isInternal: false,
    })
    order.moderationNotes = notes

    await this.orderRepository.save(order)

    this.eventEmitter.emit('marketplace.order.rejected', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      moderatorId,
      reason,
    })

    return { success: true, message: 'Order rejected successfully' }
  }

  /**
   * Hold order
   */
  private async holdOrder(order: MarketplaceOrder, reason: string, moderatorId: string) {
    order.moderationStatus = 'ON_HOLD'
    order.status = 'ON_HOLD'

    const notes = this.parseOrderNotes(order.moderationNotes)
    notes.push({
      id: `note_${Date.now()}`,
      message: `Order put on hold: ${reason}`,
      createdBy: moderatorId,
      createdAt: new Date(),
      isInternal: true,
    })
    order.moderationNotes = notes

    await this.orderRepository.save(order)

    this.eventEmitter.emit('marketplace.order.held', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      moderatorId,
      reason,
    })

    return { success: true, message: 'Order put on hold successfully' }
  }

  /**
   * Flag order
   */
  private async flagOrder(
    order: MarketplaceOrder,
    flagType: string,
    reason: string,
    moderatorId: string
  ) {
    const flags = this.parseOrderFlags(order.flags)

    flags.push({
      type: flagType as OrderFlagType,
      severity: 'MEDIUM' as const,
      message: reason,
      createdAt: new Date(),
    })

    order.flags = flags
    order.priority = this.calculateOrderPriority(order, flags)

    await this.orderRepository.save(order)

    this.eventEmitter.emit('marketplace.order.flagged', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      flagType,
      reason,
      moderatorId,
    })

    return { success: true, message: 'Order flagged successfully' }
  }

  /**
   * Assign order to moderator
   */
  private async assignOrder(order: MarketplaceOrder, assignTo: string, moderatorId: string) {
    order.assignedModerator = assignTo

    const notes = this.parseOrderNotes(order.moderationNotes)
    notes.push({
      id: `note_${Date.now()}`,
      message: `Order assigned to ${assignTo}`,
      createdBy: moderatorId,
      createdAt: new Date(),
      isInternal: true,
    })
    order.moderationNotes = notes

    await this.orderRepository.save(order)

    this.eventEmitter.emit('marketplace.order.assigned', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      assignedTo: assignTo,
      moderatorId,
    })

    return { success: true, message: 'Order assigned successfully' }
  }

  /**
   * Add note to order
   */
  private async addNote(
    order: MarketplaceOrder,
    message: string,
    moderatorId: string,
    isInternal: boolean = false
  ) {
    const notes = this.parseOrderNotes(order.moderationNotes)
    notes.push({
      id: `note_${Date.now()}`,
      message,
      createdBy: moderatorId,
      createdAt: new Date(),
      isInternal,
    })
    order.moderationNotes = notes

    await this.orderRepository.save(order)

    return { success: true, message: 'Note added successfully' }
  }

  /**
   * Resolve flag
   */
  private async resolveFlag(order: MarketplaceOrder, flagType: string, moderatorId: string) {
    const flags = this.parseOrderFlags(order.flags)
    const flagIndex = flags.findIndex((f) => f.type === flagType)

    if (flagIndex !== -1) {
      flags[flagIndex].resolvedAt = new Date()
      flags[flagIndex].resolvedBy = moderatorId
      order.flags = flags
      order.priority = this.calculateOrderPriority(order, flags)

      await this.orderRepository.save(order)
    }

    return { success: true, message: 'Flag resolved successfully' }
  }

  /**
   * Run auto-flagging rules
   */
  private async runAutoFlagRules(tenantId: string): Promise<number> {
    let flaggedCount = 0

    // Flag high-value orders
    const highValueOrders = await this.orderRepository.find({
      where: {
        tenantId,
        total: MoreThan(5000),
        moderationStatus: 'PENDING',
      },
    })

    for (const order of highValueOrders) {
      const flags = this.parseOrderFlags(order.flags)
      if (!flags.some((f) => f.type === 'HIGH_VALUE')) {
        flags.push({
          type: 'HIGH_VALUE',
          severity: 'MEDIUM',
          message: `High value order: $${order.total}`,
          createdAt: new Date(),
        })
        order.flags = flags
        await this.orderRepository.save(order)
        flaggedCount++
      }
    }

    // Flag orders from new customers
    const newCustomerOrders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.customer', 'customer')
      .where('order.tenant_id = :tenantId', { tenantId })
      .andWhere('order.moderation_status = :status', { status: 'PENDING' })
      .andWhere('customer.created_at > :date', {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .getMany()

    for (const order of newCustomerOrders) {
      const flags = this.parseOrderFlags(order.flags)
      if (!flags.some((f) => f.type === 'NEW_CUSTOMER')) {
        flags.push({
          type: 'NEW_CUSTOMER',
          severity: 'LOW',
          message: 'Order from new customer (less than 7 days old)',
          createdAt: new Date(),
        })
        order.flags = flags
        await this.orderRepository.save(order)
        flaggedCount++
      }
    }

    return flaggedCount
  }

  /**
   * Get average processing time
   */
  private async getAverageProcessingTime(
    tenantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<number> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(EXTRACT(EPOCH FROM (order.moderated_at - order.created_at))/3600)', 'avg_hours')
      .where('order.tenant_id = :tenantId', { tenantId })
      .andWhere('order.moderated_at IS NOT NULL')

    if (dateRange) {
      query.andWhere('order.created_at BETWEEN :start AND :end', dateRange)
    }

    const result = await query.getRawOne()
    return parseFloat(result?.avg_hours || '0')
  }

  /**
   * Clear moderation cache
   */
  private async clearModerationCache(tenantId: string): Promise<void> {
    try {
      const patterns = [`moderation:${tenantId}:*`]

      for (const pattern of patterns) {
        const keys = await this.redisService.keys(pattern)
        if (keys.length > 0) {
          await this.redisService.del(...keys)
        }
      }
    } catch (error) {
      this.logger.error('Failed to clear moderation cache:', error)
    }
  }
}
