import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import type { Repository } from 'typeorm'
import { getErrorMessage, hasStack } from '../../../core/common/utils'
import type { EmailService } from '../../../core/email/email.service'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import type { MarketplaceOrderWorkflowService } from '../orders/marketplace-order-workflow.service'
import { OrderStatus } from '../orders/marketplace-order-workflow.service'

export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, unknown>
  timestamp: Date
  processed: boolean
  source: 'stripe' | 'internal' | 'external'
  tenantId?: string
}

interface WebhookData {
  id: string
  url: string
  events: string[]
  secret: string
  active: boolean
  createdAt: Date
  retryConfig: RetryConfig
}

interface PaymentEvent {
  orderId: string
  amount: number
  currency: string
  paymentIntentId?: string
  reason?: string
  refundId?: string
}

interface OrderEvent {
  orderId: string
  customerId?: string
  tenantId?: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
  deliveredAt?: string
}

interface CustomerEvent {
  customerId: string
  email: string
  tenantId?: string
}

interface ProductEvent {
  articleId?: string
  productId: string
  tenantId?: string
  stock?: number
}

export interface RetryConfig {
  maxAttempts: number
  backoffMs: number
  exponential: boolean
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    backoffMs: 1000,
    exponential: true,
  }

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redisService: Redis,
    private readonly emailService: EmailService,
    private readonly orderWorkflowService: MarketplaceOrderWorkflowService,
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>
  ) {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Payment events from Stripe service
    this.eventEmitter.on('marketplace.payment.succeeded', this.handlePaymentSucceeded.bind(this))
    this.eventEmitter.on('marketplace.payment.failed', this.handlePaymentFailed.bind(this))
    this.eventEmitter.on('marketplace.payment.refunded', this.handlePaymentRefunded.bind(this))

    // Order events
    this.eventEmitter.on('marketplace.order.created', this.handleOrderCreated.bind(this))
    this.eventEmitter.on('marketplace.order.confirmed', this.handleOrderConfirmed.bind(this))
    this.eventEmitter.on('marketplace.order.shipped', this.handleOrderShipped.bind(this))
    this.eventEmitter.on('marketplace.order.delivered', this.handleOrderDelivered.bind(this))

    // Customer events
    this.eventEmitter.on(
      'marketplace.customer.registered',
      this.handleCustomerRegistered.bind(this)
    )

    // ERP sync events
    this.eventEmitter.on('marketplace.product.synced', this.handleProductSynced.bind(this))
    this.eventEmitter.on('marketplace.stock.updated', this.handleStockUpdated.bind(this))
  }

  /**
   * Register external webhook
   */
  async registerWebhook(url: string, events: string[], secret?: string): Promise<string> {
    const webhookId = crypto.randomUUID()
    const webhookData = {
      id: webhookId,
      url,
      events,
      secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true,
      createdAt: new Date(),
      retryConfig: this.defaultRetryConfig,
    }

    // Store webhook configuration
    await this.redisService.hset('webhooks:registered', webhookId, JSON.stringify(webhookData))

    this.logger.log(`Webhook registered: ${webhookId} for URL: ${url}`)
    return webhookId
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(
    webhookId: string,
    eventType: string,
    data: Record<string, unknown>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<boolean> {
    const webhookData = await this.getWebhookData(webhookId)
    if (!webhookData || !webhookData.active) {
      this.logger.warn(`Webhook ${webhookId} not found or inactive`)
      return false
    }

    if (!webhookData.events.includes(eventType) && !webhookData.events.includes('*')) {
      // Webhook not subscribed to this event type
      return true
    }

    const config = { ...this.defaultRetryConfig, ...retryConfig }
    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      data,
      timestamp: new Date(),
      processed: false,
      source: 'internal',
      tenantId: data.tenantId as string,
    }

    return await this.sendWebhookWithRetry(webhookData, event, config)
  }

  /**
   * Broadcast event to all subscribed webhooks
   */
  async broadcastEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    const webhooks = await this.getAllActiveWebhooks()

    const promises = webhooks
      .filter((webhook) => webhook.events.includes(eventType) || webhook.events.includes('*'))
      .map((webhook) =>
        this.sendWebhook(webhook.id, eventType, data).catch((error) => {
          this.logger.error(`Failed to send webhook ${webhook.id}: ${getErrorMessage(error)}`)
        })
      )

    await Promise.allSettled(promises)
  }

  /**
   * Event Handlers
   */
  private async handlePaymentSucceeded(event: PaymentEvent): Promise<void> {
    this.logger.log(`Payment succeeded for order ${event.orderId}`)

    try {
      // Update order status to confirmed
      await this.orderWorkflowService.transitionOrder(event.orderId, OrderStatus.CONFIRMED)

      // Send payment confirmation email
      const order = await this.orderRepository.findOne({
        where: { id: event.orderId },
        relations: ['customer', 'items'],
      })

      if (order) {
        await this.emailService.sendEmail({
          to: order.customer.email,
          subject: `Paiement confirmé pour la commande #${order.orderNumber}`,
          template: 'marketplace-payment-confirmed',
          context: {
            customerName: order.customer.firstName,
            orderNumber: order.orderNumber,
            amount: (event.amount / 100).toFixed(2),
            currency: event.currency.toUpperCase(),
          },
        })
      }

      // Broadcast to external webhooks
      await this.broadcastEvent('payment.succeeded', {
        orderId: event.orderId,
        amount: event.amount,
        currency: event.currency,
        paymentIntentId: event.paymentIntentId,
      })
    } catch (error) {
      this.logger.error(
        `Error handling payment success: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  private async handlePaymentFailed(event: PaymentEvent): Promise<void> {
    this.logger.log(`Payment failed for order ${event.orderId}: ${event.reason}`)

    try {
      // Send payment failure notification
      const order = await this.orderRepository.findOne({
        where: { id: event.orderId },
        relations: ['customer'],
      })

      if (order) {
        await this.emailService.sendEmail({
          to: order.customer.email,
          subject: 'Échec du paiement de votre commande',
          template: 'marketplace-payment-failed',
          context: {
            customerName: order.customer.firstName,
            orderNumber: order.orderNumber,
            reason: event.reason,
            retryUrl: `${this.configService.get('MARKETPLACE_URL')}/orders/${event.orderId}/retry-payment`,
          },
        })
      }

      // Broadcast to external webhooks
      await this.broadcastEvent('payment.failed', {
        orderId: event.orderId,
        reason: event.reason,
        amount: event.amount,
      })
    } catch (error) {
      this.logger.error(
        `Error handling payment failure: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  private async handlePaymentRefunded(event: PaymentEvent): Promise<void> {
    this.logger.log(`Payment refunded for order ${event.orderId}`)

    try {
      // Send refund notification
      const order = await this.orderRepository.findOne({
        where: { id: event.orderId },
        relations: ['customer'],
      })

      if (order) {
        await this.emailService.sendEmail({
          to: order.customer.email,
          subject: `Remboursement traité pour la commande #${order.orderNumber}`,
          template: 'marketplace-refund-processed',
          context: {
            customerName: order.customer.firstName,
            orderNumber: order.orderNumber,
            refundAmount: (event.amount / 100).toFixed(2),
            refundId: event.refundId,
            reason: event.reason || 'Requested by customer',
          },
        })
      }

      // Broadcast to external webhooks
      await this.broadcastEvent('payment.refunded', {
        orderId: event.orderId,
        refundId: event.refundId,
        amount: event.amount,
        reason: event.reason,
      })
    } catch (error) {
      this.logger.error(
        `Error handling refund: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  private async handleOrderCreated(event: OrderEvent): Promise<void> {
    this.logger.log(`Order created: ${event.orderId}`)

    await this.broadcastEvent('order.created', {
      orderId: event.orderId,
      customerId: event.customerId,
      tenantId: event.tenantId,
    })
  }

  private async handleOrderConfirmed(event: OrderEvent): Promise<void> {
    this.logger.log(`Order confirmed: ${event.orderId}`)

    // Trigger ERP sync
    this.eventEmitter.emit('marketplace.order.sync_to_erp', {
      orderId: event.orderId,
      tenantId: event.tenantId,
    })

    await this.broadcastEvent('order.confirmed', {
      orderId: event.orderId,
      tenantId: event.tenantId,
    })
  }

  private async handleOrderShipped(event: OrderEvent): Promise<void> {
    this.logger.log(`Order shipped: ${event.orderId}`)

    try {
      const order = await this.orderRepository.findOne({
        where: { id: event.orderId },
        relations: ['customer'],
      })

      if (order) {
        await this.emailService.sendEmail({
          to: order.customer.email,
          subject: `Votre commande #${order.orderNumber} a été expédiée`,
          template: 'marketplace-order-shipped',
          context: {
            customerName: order.customer.firstName,
            orderNumber: order.orderNumber,
            trackingNumber: event.trackingNumber,
            carrier: event.carrier,
            estimatedDelivery: event.estimatedDelivery,
          },
        })
      }

      await this.broadcastEvent('order.shipped', {
        orderId: event.orderId,
        trackingNumber: event.trackingNumber,
        carrier: event.carrier,
      })
    } catch (error) {
      this.logger.error(
        `Error handling order shipped: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  private async handleOrderDelivered(event: OrderEvent): Promise<void> {
    this.logger.log(`Order delivered: ${event.orderId}`)

    try {
      const order = await this.orderRepository.findOne({
        where: { id: event.orderId },
        relations: ['customer'],
      })

      if (order) {
        await this.emailService.sendEmail({
          to: order.customer.email,
          subject: `Votre commande #${order.orderNumber} a été livrée`,
          template: 'marketplace-order-delivered',
          context: {
            customerName: order.customer.firstName,
            orderNumber: order.orderNumber,
            deliveredAt: event.deliveredAt,
            feedbackUrl: `${this.configService.get('MARKETPLACE_URL')}/orders/${event.orderId}/feedback`,
          },
        })
      }

      await this.broadcastEvent('order.delivered', {
        orderId: event.orderId,
        deliveredAt: event.deliveredAt,
      })
    } catch (error) {
      this.logger.error(
        `Error handling order delivered: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  private async handleCustomerRegistered(event: CustomerEvent): Promise<void> {
    this.logger.log(`Customer registered: ${event.customerId}`)

    await this.broadcastEvent('customer.registered', {
      customerId: event.customerId,
      email: event.email,
      tenantId: event.tenantId,
    })
  }

  private async handleProductSynced(event: ProductEvent): Promise<void> {
    this.logger.log(`Product synced: ${event.productId}`)

    await this.broadcastEvent('product.synced', {
      articleId: event.articleId,
      productId: event.productId,
      tenantId: event.tenantId,
    })
  }

  private async handleStockUpdated(event: ProductEvent): Promise<void> {
    this.logger.log(`Stock updated: ${event.productId}`)

    await this.broadcastEvent('stock.updated', {
      productId: event.productId,
      stock: event.stock,
      tenantId: event.tenantId,
    })
  }

  /**
   * Private helper methods
   */
  private async sendWebhookWithRetry(
    webhookData: WebhookData,
    event: WebhookEvent,
    config: RetryConfig
  ): Promise<boolean> {
    let attempt = 0

    while (attempt < config.maxAttempts) {
      try {
        const response = await this.makeWebhookRequest(webhookData, event)

        if (response.ok) {
          this.logger.log(`Webhook ${webhookData.id} sent successfully`)
          return true
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        attempt++
        this.logger.warn(
          `Webhook ${webhookData.id} attempt ${attempt} failed: ${getErrorMessage(error)}`
        )

        if (attempt < config.maxAttempts) {
          const delay = config.exponential
            ? config.backoffMs * 2 ** (attempt - 1)
            : config.backoffMs

          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    this.logger.error(`Webhook ${webhookData.id} failed after ${config.maxAttempts} attempts`)
    return false
  }

  private async makeWebhookRequest(
    webhookData: WebhookData,
    event: WebhookEvent
  ): Promise<Response> {
    const payload = JSON.stringify(event)
    const signature = crypto.createHmac('sha256', webhookData.secret).update(payload).digest('hex')

    return fetch(webhookData.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': event.type,
        'User-Agent': 'TopSteel-Marketplace/1.0',
      },
      body: payload,
    })
  }

  private async getWebhookData(webhookId: string): Promise<WebhookData | null> {
    const data = await this.redisService.hget('webhooks:registered', webhookId)
    return data ? JSON.parse(data) : null
  }

  private async getAllActiveWebhooks(): Promise<WebhookData[]> {
    const webhookMap = await this.redisService.hgetall('webhooks:registered')
    return Object.values(webhookMap)
      .map((data) => JSON.parse(data as string))
      .filter((webhook) => webhook.active)
  }
}
