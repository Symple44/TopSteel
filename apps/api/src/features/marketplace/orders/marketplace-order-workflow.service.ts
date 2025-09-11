import { Article } from '@erp/entities'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import type { DataSource, Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import type { EmailService } from '../../../core/email/email.service'
import type { PricingEngineService } from '../../pricing/services/pricing-engine.service'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity'
import type { MarketplaceStockService } from '../stock/marketplace-stock.service'

export enum OrderStatus {
  CART = 'CART',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

interface CreateOrderDto {
  customerId: string
  items: Array<{
    productId: string
    quantity: number
    customizations?: Record<string, unknown>
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
  }
  paymentMethod: string
  notes?: string
}

interface OrderTransition {
  from: OrderStatus[]
  to: OrderStatus
  handler: (order: MarketplaceOrder) => Promise<void>
  notifyCustomer: boolean
}

@Injectable()
export class MarketplaceOrderWorkflowService {
  private readonly logger = new Logger(MarketplaceOrderWorkflowService.name)
  private readonly transitions: Map<OrderStatus, OrderTransition>

  constructor(
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceOrderItem)
    readonly _orderItemRepository: Repository<MarketplaceOrderItem>,
    @InjectRepository(Article) readonly _productRepository: Repository<Article>,
    @InjectRepository(MarketplaceCustomer)
    readonly _customerRepository: Repository<MarketplaceCustomer>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly pricingEngine: PricingEngineService,
    private readonly emailService: EmailService,
    @InjectRedis() private readonly redisService: Redis,
    private readonly stockService: MarketplaceStockService
  ) {
    this.setupTransitions()
  }

  private setupTransitions() {
    ;(this as any).transitions = new Map([
      [
        OrderStatus.PENDING,
        {
          from: [OrderStatus.CART],
          to: OrderStatus.PENDING,
          handler: this.handlePendingTransition.bind(this),
          notifyCustomer: true,
        },
      ],
      [
        OrderStatus.CONFIRMED,
        {
          from: [OrderStatus.PENDING],
          to: OrderStatus.CONFIRMED,
          handler: this.handleConfirmedTransition.bind(this),
          notifyCustomer: true,
        },
      ],
      [
        OrderStatus.PROCESSING,
        {
          from: [OrderStatus.CONFIRMED],
          to: OrderStatus.PROCESSING,
          handler: this.handleProcessingTransition.bind(this),
          notifyCustomer: true,
        },
      ],
      [
        OrderStatus.SHIPPED,
        {
          from: [OrderStatus.PROCESSING],
          to: OrderStatus.SHIPPED,
          handler: this.handleShippedTransition.bind(this),
          notifyCustomer: true,
        },
      ],
      [
        OrderStatus.DELIVERED,
        {
          from: [OrderStatus.SHIPPED],
          to: OrderStatus.DELIVERED,
          handler: this.handleDeliveredTransition.bind(this),
          notifyCustomer: true,
        },
      ],
      [
        OrderStatus.CANCELLED,
        {
          from: [OrderStatus.CART, OrderStatus.PENDING, OrderStatus.CONFIRMED],
          to: OrderStatus.CANCELLED,
          handler: this.handleCancelledTransition.bind(this),
          notifyCustomer: true,
        },
      ],
    ])
  }

  /**
   * Créer une nouvelle commande
   */
  async createOrder(data: CreateOrderDto, tenantId: string): Promise<MarketplaceOrder> {
    return await this.dataSource.transaction(async (manager) => {
      // Vérifier le client
      const customer = await manager.findOne(MarketplaceCustomer, {
        where: { id: data.customerId },
      })

      if (!customer) {
        throw new NotFoundException('Customer not found')
      }

      // Créer la commande
      const order = manager.create(MarketplaceOrder, {
        customer,
        tenantId,
        status: OrderStatus.CART,
        paymentStatus: PaymentStatus.PENDING,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        currency: 'EUR',
        orderNumber: await this.generateOrderNumber(tenantId),
      })

      const savedOrder = await manager.save(order)

      // Ajouter les items
      let subtotal = 0
      const items: MarketplaceOrderItem[] = []

      for (const itemData of data.items) {
        const product = await manager.findOne(Article, {
          where: { id: itemData.productId },
        })

        if (!product) {
          throw new NotFoundException(`Product ${itemData.productId} not found`)
        }

        // Réserver le stock pour cette commande
        try {
          const reservation = await this.stockService.reserveStock(
            product.id,
            itemData.quantity,
            customer.id,
            savedOrder.id
          )

          // Store reservation ID for later confirmation or release
          if (!savedOrder.metadata) {
            savedOrder.metadata = {}
          }
          if (!savedOrder.metadata.stockReservations) {
            savedOrder.metadata.stockReservations = []
          }
          ;(savedOrder.metadata.stockReservations as string[]).push(reservation.id)
        } catch (error) {
          throw new BadRequestException(
            `Cannot reserve stock for ${product.designation}: ${getErrorMessage(error)}`
          )
        }

        // Calculer le prix avec le moteur de pricing
        const priceCalculation = await this.pricingEngine.calculatePrice({
          articleId: product.id,
          quantity: itemData.quantity,
          customerId: customer.erpPartnerId,
          channel: 'MARKETPLACE' as any,
          societeId: tenantId,
        })

        const item = manager.create(MarketplaceOrderItem, {
          order: savedOrder,
          product,
          quantity: itemData.quantity,
          price: priceCalculation.basePrice,
          totalPrice: priceCalculation.finalPrice,
          customizations: itemData.customizations,
          discount: priceCalculation.totalDiscount || 0,
        } as any)

        items.push(item)
        subtotal += priceCalculation.finalPrice
      }

      await manager.save(MarketplaceOrderItem, items)

      // Calculer les totaux
      const shippingCost = await this.calculateShipping(savedOrder, items)
      const tax = this.calculateTax(subtotal + shippingCost)

      savedOrder.items = items
      savedOrder.subtotal = subtotal
      savedOrder.shippingCost = shippingCost
      savedOrder.tax = tax
      savedOrder.total = subtotal + shippingCost + tax

      await manager.save(savedOrder)

      // Émettre l'événement
      this.eventEmitter.emit('marketplace.order.created', {
        orderId: savedOrder.id,
        tenantId,
        customerId: customer.id,
      })

      return savedOrder
    })
  }

  /**
   * Faire progresser une commande dans le workflow
   */
  async transitionOrder(orderId: string, toStatus: OrderStatus): Promise<MarketplaceOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'items', 'items.product'],
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    const transition = this.transitions.get(toStatus)
    if (!transition) {
      throw new BadRequestException(`Invalid transition to ${toStatus}`)
    }

    if (!transition.from.includes(order.status as OrderStatus)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${toStatus}`)
    }

    // Exécuter la transition
    await transition.handler(order)

    // Mettre à jour le statut
    order.status = toStatus
    order.statusHistory = order.statusHistory || []
    order.statusHistory.push({
      status: toStatus,
      timestamp: new Date(),
      notes: `Transitioned from ${order.status} to ${toStatus}`,
    })

    const updatedOrder = await this.orderRepository.save(order)

    // Notifier le client si nécessaire
    if (transition.notifyCustomer) {
      await this.notifyCustomer(updatedOrder, toStatus)
    }

    // Émettre l'événement
    this.eventEmitter.emit('marketplace.order.status.changed', {
      orderId: order.id,
      fromStatus: order.status,
      toStatus,
      tenantId: order.tenantId,
    })

    return updatedOrder
  }

  /**
   * Processus de checkout
   */
  async checkout(orderId: string, paymentDetails: { paymentMethodId: string; savePaymentMethod?: boolean }): Promise<MarketplaceOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, status: OrderStatus.CART },
      relations: ['customer', 'items', 'items.product'],
    })

    if (!order) {
      throw new NotFoundException('Order not found or not in cart status')
    }

    return await this.dataSource.transaction(async (manager) => {
      // Vérifier à nouveau le stock
      for (const item of order.items) {
        const product = await manager.findOne(Article, {
          where: { id: item.product.id },
          lock: { mode: 'pessimistic_write' },
        })

        if (!product) {
          throw new BadRequestException(`Product not found: ${item.product.id}`)
        }

        if ((product.stockDisponible || 0) < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.designation}`)
        }

        // Réserver le stock
        product.stockReserve = (product.stockReserve || 0) + item.quantity
        product.stockDisponible = (product.stockPhysique || 0) - (product.stockReserve || 0)
        await manager.save(product)
      }

      // Passer la commande en PENDING
      order.status = OrderStatus.PENDING
      order.paymentStatus = PaymentStatus.PROCESSING
      order.paymentDetails = paymentDetails
      order.placedAt = new Date()

      const updatedOrder = await manager.save(order)

      // Créer une tâche de paiement asynchrone
      await this.processPayment(updatedOrder)

      return updatedOrder
    })
  }

  /**
   * Handlers de transition
   */
  private async handlePendingTransition(order: MarketplaceOrder): Promise<void> {
    this.logger.log(`Order ${order.orderNumber} moved to PENDING`)

    // Vérifier le paiement
    if (order.paymentStatus !== PaymentStatus.PROCESSING) {
      order.paymentStatus = PaymentStatus.PROCESSING
    }
  }

  private async handleConfirmedTransition(order: MarketplaceOrder): Promise<void> {
    this.logger.log(`Order ${order.orderNumber} CONFIRMED`)

    // Le paiement doit être validé
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order must be paid before confirmation')
    }

    // Confirmer les réservations de stock
    if (order.metadata?.stockReservations) {
      for (const reservationId of order.metadata.stockReservations as string[]) {
        try {
          await this.stockService.confirmReservation(reservationId)
          this.logger.log(
            `Stock reservation confirmed: ${reservationId} for order ${order.orderNumber}`
          )
        } catch (error) {
          this.logger.error(`Failed to confirm stock reservation ${reservationId}:`, error)
          throw new BadRequestException(`Stock confirmation failed for order ${order.orderNumber}`)
        }
      }
    }

    // Synchroniser avec l'ERP
    this.eventEmitter.emit('marketplace.order.confirmed', {
      orderId: order.id,
      tenantId: order.tenantId,
    })
  }

  private async handleProcessingTransition(order: MarketplaceOrder): Promise<void> {
    this.logger.log(`Order ${order.orderNumber} in PROCESSING`)

    // Créer les documents ERP
    this.eventEmitter.emit('marketplace.order.processing', {
      orderId: order.id,
      tenantId: order.tenantId,
    })
  }

  private async handleShippedTransition(order: MarketplaceOrder): Promise<void> {
    this.logger.log(`Order ${order.orderNumber} SHIPPED`)

    // Ajouter les informations de livraison
    order.shippingInfo = {
      carrier: 'DHL', // À récupérer dynamiquement
      trackingNumber: await this.generateTrackingNumber(),
    }
    order.shippedAt = new Date()
  }

  private async handleDeliveredTransition(order: MarketplaceOrder): Promise<void> {
    this.logger.log(`Order ${order.orderNumber} DELIVERED`)

    order.deliveredAt = new Date()

    // Déclencher le processus de facturation finale
    this.eventEmitter.emit('marketplace.order.delivered', {
      orderId: order.id,
      tenantId: order.tenantId,
    })
  }

  private async handleCancelledTransition(order: MarketplaceOrder): Promise<void> {
    this.logger.log(`Order ${order.orderNumber} CANCELLED`)

    // Libérer les réservations de stock
    if (order.metadata?.stockReservations) {
      for (const reservationId of order.metadata.stockReservations as string[]) {
        try {
          await this.stockService.releaseReservation(reservationId)
          this.logger.log(
            `Stock reservation released: ${reservationId} for cancelled order ${order.orderNumber}`
          )
        } catch (error) {
          this.logger.error(`Failed to release stock reservation ${reservationId}:`, error)
          // Continue with other reservations even if one fails
        }
      }
    }

    // Initier le remboursement si nécessaire
    if (order.paymentStatus === PaymentStatus.PAID) {
      order.paymentStatus = PaymentStatus.REFUNDED
      await this.processRefund(order)
    }

    order.cancelledAt = new Date()
  }

  /**
   * Méthodes utilitaires
   */
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    const counter = await this.redisService.incr(`order:counter:${tenantId}:${year}${month}${day}`)

    // Expirer le compteur après 48h
    await this.redisService.expire(`order:counter:${tenantId}:${year}${month}${day}`, 172800)

    return `ORD-${year}${month}${day}-${String(counter).padStart(5, '0')}`
  }

  private async calculateShipping(
    _order: MarketplaceOrder,
    items: MarketplaceOrderItem[]
  ): Promise<number> {
    // Logique de calcul des frais de port
    const totalWeight = items.reduce((acc, item) => {
      return acc + (item.product.poids || 0) * item.quantity
    }, 0)

    // Tarifs de base
    if (totalWeight <= 1) return 5.9
    if (totalWeight <= 5) return 8.9
    if (totalWeight <= 10) return 12.9
    if (totalWeight <= 30) return 19.9

    return 29.9 + Math.ceil((totalWeight - 30) / 10) * 5
  }

  private calculateTax(amount: number): number {
    // TVA 20%
    return Math.round(amount * 0.2 * 100) / 100
  }

  private async notifyCustomer(order: MarketplaceOrder, newStatus: OrderStatus): Promise<void> {
    const emailTemplates: Record<OrderStatus, string> = {
      [OrderStatus.CART]: 'cart-reminder',
      [OrderStatus.PENDING]: 'order-received',
      [OrderStatus.CONFIRMED]: 'order-confirmed',
      [OrderStatus.PROCESSING]: 'order-processing',
      [OrderStatus.SHIPPED]: 'order-shipped',
      [OrderStatus.DELIVERED]: 'order-delivered',
      [OrderStatus.CANCELLED]: 'order-cancelled',
      [OrderStatus.REFUNDED]: 'order-refunded',
    }

    const template = emailTemplates[newStatus]
    if (template) {
      // Notification par email - intégration avec le service EmailService externe
      try {
        await this.emailService.sendEmail({
          to: order.customer.email,
          subject: `Commande ${order.orderNumber} - ${this.getStatusLabel(newStatus)}`,
          template,
          context: {
            orderNumber: order.orderNumber,
            status: this.getStatusLabel(newStatus),
            customerName: order.customer.firstName,
            total: order.total,
          },
        })
      } catch (error) {
        this.logger.error(
          `Failed to send email notification for order ${order.orderNumber}:`,
          error
        )
      }
    }
  }

  private getStatusLabel(status: OrderStatus): string {
    const labels = {
      [OrderStatus.CART]: 'Panier',
      [OrderStatus.PENDING]: 'En attente',
      [OrderStatus.CONFIRMED]: 'Confirmée',
      [OrderStatus.PROCESSING]: 'En préparation',
      [OrderStatus.SHIPPED]: 'Expédiée',
      [OrderStatus.DELIVERED]: 'Livrée',
      [OrderStatus.CANCELLED]: 'Annulée',
      [OrderStatus.REFUNDED]: 'Remboursée',
    }
    return labels[status] || status
  }

  private async processPayment(order: MarketplaceOrder): Promise<void> {
    // À implémenter avec Stripe/PayPal
    this.logger.log(`Processing payment for order ${order.orderNumber}`)
  }

  private async processRefund(order: MarketplaceOrder): Promise<void> {
    // À implémenter avec Stripe/PayPal
    this.logger.log(`Processing refund for order ${order.orderNumber}`)
  }

  private async generateTrackingNumber(): Promise<string> {
    return `TRK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
  }
}
