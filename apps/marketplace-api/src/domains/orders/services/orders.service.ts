import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DataSource, Repository } from 'typeorm'
import { Article } from '../../../shared/entities/erp/article.entity'
import { MarketplaceCustomer } from '../../customers/entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity'

export interface CreateOrderDto {
  customerId: string
  items: Array<{
    productId: string
    quantity: number
    price?: number
  }>
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
    additionalInfo?: string
  }
  billingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
    additionalInfo?: string
  }
  paymentMethod?: string
  notes?: string
}

export interface UpdateOrderStatusDto {
  status: string
  notes?: string
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(MarketplaceOrder, 'marketplace')
    private orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceOrderItem, 'marketplace')
    private orderItemRepository: Repository<MarketplaceOrderItem>,
    @InjectRepository(MarketplaceCustomer, 'marketplace')
    private customerRepository: Repository<MarketplaceCustomer>
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    tenantId: string,
    erpConnection?: DataSource
  ): Promise<MarketplaceOrder> {
    // Validate customer
    const customer = await this.customerRepository.findOne({
      where: {
        id: createOrderDto.customerId,
        tenantId,
        isActive: true,
      },
    })

    if (!customer) {
      throw new NotFoundException('Customer not found')
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId)

    // Calculate totals
    let subtotal = 0
    const orderItems: Partial<MarketplaceOrderItem>[] = []

    for (const item of createOrderDto.items) {
      let productName = `Product ${item.productId}`
      let unitPrice = item.price || 0

      // Try to get product info from ERP if available
      if (erpConnection) {
        try {
          const articlesRepo = erpConnection.getRepository(Article)
          const article = await articlesRepo.findOne({
            where: { id: item.productId },
          })

          if (article) {
            productName = article.designation
            unitPrice = item.price || article.prixVenteHT || 0
          }
        } catch (_error) {
          // Continue with default values if ERP connection fails
        }
      }

      const itemTotal = unitPrice * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: item.productId,
        productName,
        quantity: item.quantity,
        unitPriceHT: unitPrice,
        totalHT: itemTotal,
        tvaRate: 20, // Default 20% VAT
        totalTVA: itemTotal * 0.2,
        totalTTC: itemTotal * 1.2,
        unit: 'PCS',
        erpArticleId: item.productId,
        productReference: `REF-${item.productId}`,
      })
    }

    // Calculate tax (example: 20% VAT)
    const taxRate = 0.2
    const tax = subtotal * taxRate
    const total = subtotal + tax

    // Create order
    const order = this.orderRepository.create({
      societeId: tenantId,
      customerId: createOrderDto.customerId,
      orderNumber,
      status: 'PENDING' as any,
      paymentStatus: 'PENDING' as any,
      subtotalHT: subtotal,
      shippingCostHT: 0, // Calculate based on business rules
      discountAmount: 0,
      totalTVA: tax,
      totalTTC: total,
      currency: 'EUR',
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress || createOrderDto.shippingAddress,
      customerNotes: createOrderDto.notes,
    })

    const savedOrder = await this.orderRepository.save(order)

    // Create order items
    for (const itemData of orderItems) {
      const orderItem = this.orderItemRepository.create({
        ...itemData,
        orderId: savedOrder.id,
        order: savedOrder,
      })
      await this.orderItemRepository.save(orderItem)
    }

    // Load complete order with items
    const completeOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'customer'],
    })

    return completeOrder!
  }

  async getOrderById(
    orderId: string,
    tenantId: string,
    customerId?: string
  ): Promise<MarketplaceOrder> {
    const where: any = {
      id: orderId,
      societeId: tenantId,
    }

    if (customerId) {
      where.customerId = customerId
    }

    const order = await this.orderRepository.findOne({
      where,
      relations: ['items', 'customer'],
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    return order
  }

  async getCustomerOrders(
    customerId: string,
    tenantId: string,
    options?: {
      status?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ orders: MarketplaceOrder[]; total: number }> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.customerId = :customerId', { customerId })
      .andWhere('order.tenantId = :tenantId', { tenantId })

    if (options?.status) {
      query.andWhere('order.status = :status', { status: options.status })
    }

    query.orderBy('order.createdAt', 'DESC')

    const total = await query.getCount()

    if (options?.limit) {
      query.take(options.limit)
    }
    if (options?.offset) {
      query.skip(options.offset)
    }

    const orders = await query.getMany()

    return { orders, total }
  }

  async updateOrderStatus(
    orderId: string,
    tenantId: string,
    updateDto: UpdateOrderStatusDto
  ): Promise<MarketplaceOrder> {
    const order = await this.getOrderById(orderId, tenantId)

    // Update status
    order.status = updateDto.status as any

    // Update specific timestamps based on status
    switch (updateDto.status) {
      case 'SHIPPED':
        order.shippedAt = new Date()
        break
      case 'DELIVERED':
        order.deliveredAt = new Date()
        break
    }

    // Update notes
    if (updateDto.notes) {
      order.internalNotes = updateDto.notes
    }

    return await this.orderRepository.save(order)
  }

  async updatePaymentStatus(
    orderId: string,
    tenantId: string,
    paymentStatus: string,
    paymentDetails?: any
  ): Promise<MarketplaceOrder> {
    const order = await this.getOrderById(orderId, tenantId)

    order.paymentStatus = paymentStatus as any

    if (paymentDetails) {
      if (!order.paymentData) {
        order.paymentData = {}
      }
      order.paymentData = {
        ...order.paymentData,
        ...paymentDetails,
      }
    }

    return await this.orderRepository.save(order)
  }

  async cancelOrder(
    orderId: string,
    tenantId: string,
    customerId: string,
    reason?: string
  ): Promise<MarketplaceOrder> {
    const order = await this.getOrderById(orderId, tenantId, customerId)

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled')
    }

    if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order that has been shipped or delivered')
    }

    return await this.updateOrderStatus(orderId, tenantId, {
      status: 'CANCELLED',
      notes: reason || 'Order cancelled by customer',
    })
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    // Count orders for today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setHours(23, 59, 59, 999))

    const count = await this.orderRepository.count({
      where: {
        societeId: tenantId,
        createdAt: Between(startOfDay, endOfDay),
      },
    })

    const sequence = String(count + 1).padStart(4, '0')
    return `ORD-${year}${month}${day}-${sequence}`
  }
}

// Add the missing import
import { Between } from 'typeorm'
