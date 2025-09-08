import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import Stripe from 'stripe'
import type { Repository } from 'typeorm'
import { getErrorMessage, hasStack } from '../../../core/common/utils'
import type { StripePaymentIntent, StripeCustomer, StripeCheckoutSession, MarketplaceOrder } from '../../../types/marketplace/marketplace.types'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder as MarketplaceOrderEntity } from '../entities/marketplace-order.entity'

export interface CreatePaymentIntentDto {
  orderId: string
  customerId: string
  amount: number // in cents
  currency: string
  paymentMethodId?: string
  savePaymentMethod?: boolean
  returnUrl?: string
}

export interface PaymentResult {
  success: boolean
  paymentIntentId: string
  clientSecret?: string
  status: string
  error?: string
}

export interface RefundResult {
  success: boolean
  refundId?: string
  amount: number
  error?: string
}

export interface PaymentMethodResult {
  success: boolean
  paymentMethodId?: string
  error?: string
}

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name)
  private readonly stripe: Stripe
  private readonly webhookSecret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis,
    @InjectRepository(MarketplaceOrderEntity)
    private readonly orderRepository: Repository<MarketplaceOrderEntity>,
    @InjectRepository(MarketplaceCustomer)
    private readonly customerRepository: Repository<MarketplaceCustomer>
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY')
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is required')
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
      telemetry: false, // Disable telemetry for security
    })

    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || ''

    // Production security: Webhook secret is mandatory
    if (!this.webhookSecret) {
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production'
      if (isProduction) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required in production environment')
      }
      this.logger.warn(
        'STRIPE_WEBHOOK_SECRET not configured - webhook validation disabled in development'
      )
    }
  }

  /**
   * Create payment intent for marketplace order
   */
  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentResult> {
    try {
      // Validate order
      const order = await this.orderRepository.findOne({
        where: { id: data.orderId },
        relations: ['customer'],
      })

      if (!order) {
        throw new BadRequestException('Order not found')
      }

      if (order.paymentStatus === 'PAID') {
        throw new BadRequestException('Order is already paid')
      }

      // Get or create Stripe customer
      const stripeCustomer = await this.getOrCreateStripeCustomer(order.customer)

      // Calculate final amount (ensure minimum charge)
      const finalAmount = Math.max(data.amount, 50) // Stripe minimum 50 cents

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: finalAmount,
        currency: data.currency.toLowerCase(),
        customer: stripeCustomer.id,
        payment_method: data.paymentMethodId,
        confirmation_method: 'manual',
        confirm: !!data.paymentMethodId,
        return_url: data.returnUrl,
        setup_future_usage: data.savePaymentMethod ? 'off_session' : undefined,
        metadata: {
          orderId: data.orderId,
          // Note: Avoid sensitive data in Stripe metadata
          type: 'marketplace_order',
          environment: this.configService.get<string>('NODE_ENV') || 'development',
        },
        description: `TopSteel Marketplace Order #${order.orderNumber}`,
        receipt_email: order.customer.email,
        shipping: order.shippingAddress
          ? {
              name: `${order.customer.firstName} ${order.customer.lastName}`,
              address: {
                line1: order.shippingAddress.street,
                line2: order.shippingAddress.additionalInfo || undefined,
                city: order.shippingAddress.city,
                postal_code: order.shippingAddress.postalCode,
                country: order.shippingAddress.country,
              },
            }
          : undefined,
      })

      // Store payment intent ID in order
      order.paymentIntentId = paymentIntent.id
      order.paymentProvider = 'stripe'
      await this.orderRepository.save(order)

      // Cache payment intent for quick access
      await this.redisService.setex(
        `payment_intent:${paymentIntent.id}`,
        3600, // 1 hour
        JSON.stringify({
          orderId: data.orderId,
          customerId: data.customerId,
          amount: finalAmount,
          currency: data.currency,
        })
      )

      this.logger.log(`Payment intent created for order ${data.orderId.substring(0, 8)}...`)

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret ?? undefined,
        status: paymentIntent.status,
      }
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )

      if ((error as any).type === 'StripeError') {
        return {
          success: false,
          paymentIntentId: '',
          status: 'failed',
          error: `Payment processing error: ${getErrorMessage(error)}`,
        }
      }

      throw new InternalServerErrorException('Payment processing failed')
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentResult> {
    try {
      const updateData: Stripe.PaymentIntentConfirmParams = {}

      if (paymentMethodId) {
        updateData.payment_method = paymentMethodId
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, updateData)

      // Handle different statuses
      switch (paymentIntent.status) {
        case 'succeeded':
          await this.handlePaymentSuccess(paymentIntent)
          break
        case 'requires_action':
        case 'requires_source_action' as Stripe.PaymentIntent.Status:
          // 3D Secure or similar authentication required
          break
        case 'requires_payment_method':
          return {
            success: false,
            paymentIntentId,
            status: paymentIntent.status,
            error: 'Payment method required',
          }
        case 'canceled':
          await this.handlePaymentFailure(paymentIntent, 'Payment was canceled')
          break
      }

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId,
        clientSecret: paymentIntent.client_secret ?? undefined,
        status: paymentIntent.status,
      }
    } catch (error) {
      this.logger.error(
        `Failed to confirm payment: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )

      if ((error as any).type === 'StripeError') {
        return {
          success: false,
          paymentIntentId,
          status: 'failed',
          error: getErrorMessage(error),
        }
      }

      throw new InternalServerErrorException('Payment confirmation failed')
    }
  }

  /**
   * Process refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<RefundResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Cannot refund unsuccessful payment')
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // undefined = full refund
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          orderId: paymentIntent.metadata.orderId || '',
          processedBy: 'marketplace_system',
        },
      })

      // Update order status
      const orderId = paymentIntent.metadata.orderId
      if (orderId) {
        await this.updateOrderPaymentStatus(orderId, 'REFUNDED')

        // Emit refund event
        this.eventEmitter.emit('marketplace.payment.refunded', {
          orderId,
          paymentIntentId,
          refundId: refund.id,
          amount: refund.amount,
          reason,
        })
      }

      this.logger.log(`Refund created: ${refund.id} for payment ${paymentIntentId}`)

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
      }
    } catch (error) {
      this.logger.error(
        `Failed to create refund: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )

      return {
        success: false,
        amount: amount || 0,
        error: getErrorMessage(error),
      }
    }
  }

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<PaymentMethodResult> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      })

      if (!customer) {
        throw new BadRequestException('Customer not found')
      }

      // Get or create Stripe customer
      const stripeCustomer = await this.getOrCreateStripeCustomer(customer)

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomer.id,
      })

      this.logger.log(`Payment method ${paymentMethodId} saved for customer ${customerId}`)

      return {
        success: true,
        paymentMethodId,
      }
    } catch (error) {
      this.logger.error(
        `Failed to save payment method: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )

      return {
        success: false,
        error: getErrorMessage(error),
      }
    }
  }

  /**
   * Get customer's saved payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      })

      if (!customer || !customer.metadata?.stripeCustomerId) {
        return []
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customer.metadata.stripeCustomerId,
        type: 'card',
      })

      return paymentMethods.data
    } catch (error) {
      this.logger.error(
        `Failed to get payment methods: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      return []
    }
  }

  /**
   * Handle Stripe webhook with origin validation
   */
  async handleWebhook(body: string, signature: string, originUrl?: string): Promise<void> {
    if (!this.webhookSecret) {
      throw new BadRequestException('Webhook secret not configured')
    }

    // Validate webhook origin in production
    if (originUrl) {
      this.validateWebhookOrigin(originUrl)
    }

    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret)

      this.logger.log(`Stripe webhook received: ${event.type}`, {
        eventId: event.id,
        origin: originUrl,
        type: event.type,
      })

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
          break

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent, 'Payment failed')
          break

        case 'payment_intent.canceled':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent, 'Payment was canceled')
          break

        case 'refund.created':
          await this.handleRefundCreated(event.data.object as Stripe.Refund)
          break

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`, {
            eventId: event.id,
            type: event.type,
          })
      }
    } catch (error) {
      this.logger.error(
        `Webhook handling failed: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined,
        {
          origin: originUrl,
        }
      )
      throw new BadRequestException('Webhook verification failed')
    }
  }

  /**
   * Validate webhook origin against whitelist
   */
  private validateWebhookOrigin(originUrl: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production'

    if (!isProduction) {
      // Skip validation in development
      return
    }

    // Get allowed domains from configuration
    const allowedDomains = this.configService.get<string>(
      'STRIPE_WEBHOOK_ALLOWED_DOMAINS',
      'stripe.com'
    )
    const domainWhitelist = allowedDomains.split(',').map((d) => d.trim())

    try {
      const url = new URL(originUrl)
      const hostname = url.hostname

      // Check if hostname is in whitelist or is a subdomain of whitelisted domain
      const isAllowed = domainWhitelist.some((allowedDomain) => {
        return hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`)
      })

      if (!isAllowed) {
        this.logger.error(`Webhook origin not allowed: ${hostname}`, {
          hostname,
          allowedDomains: domainWhitelist,
        })
        throw new BadRequestException('Webhook origin not allowed')
      }

      this.logger.log(`Webhook origin validated: ${hostname}`)
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      this.logger.error(`Invalid webhook origin URL: ${originUrl}`, error)
      throw new BadRequestException('Invalid webhook origin URL')
    }
  }

  /**
   * Private helper methods
   */
  private async getOrCreateStripeCustomer(customer: MarketplaceCustomer): Promise<Stripe.Customer> {
    // Check if customer already has Stripe ID
    const existingStripeId = customer.metadata?.stripeCustomerId

    if (existingStripeId) {
      try {
        return await this.stripe.customers.retrieve(existingStripeId) as Stripe.Customer
      } catch (_error) {
        this.logger.warn(`Stripe customer ${existingStripeId} not found, creating new one`)
      }
    }

    // Create new Stripe customer
    const stripeCustomer = await this.stripe.customers.create({
      email: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phone,
      metadata: {
        marketplaceCustomerId: customer.id,
        tenantId: customer.tenantId,
      },
    })

    // Save Stripe customer ID
    customer.metadata = {
      ...customer.metadata,
      stripeCustomerId: stripeCustomer.id,
    }
    await this.customerRepository.save(customer)

    return stripeCustomer
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId

    if (!orderId) {
      this.logger.warn(`Payment succeeded but no orderId in metadata: ${paymentIntent.id}`)
      return
    }

    await this.updateOrderPaymentStatus(orderId, 'PAID')

    // Emit payment success event
    this.eventEmitter.emit('marketplace.payment.succeeded', {
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })

    this.logger.log(
      `Payment succeeded for order ${orderId ? `${orderId.substring(0, 8)}...` : 'unknown'}`
    )
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent, reason: string): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId

    if (!orderId) {
      return
    }

    await this.updateOrderPaymentStatus(orderId, 'FAILED')

    // Emit payment failure event
    this.eventEmitter.emit('marketplace.payment.failed', {
      orderId,
      paymentIntentId: paymentIntent.id,
      reason,
      amount: paymentIntent.amount,
    })

    this.logger.log(
      `Payment failed for order ${orderId ? `${orderId.substring(0, 8)}...` : 'unknown'}: ${reason}`
    )
  }

  private async handleRefundCreated(refund: Stripe.Refund): Promise<void> {
    this.logger.log(`Refund created: ${refund.id}, amount: ${refund.amount}`)

    // Additional refund handling logic if needed
  }

  private async updateOrderPaymentStatus(orderId: string, status: string): Promise<void> {
    const updateData: any = {
      paymentStatus: status,
    }
    
    if (status === 'PAID') {
      updateData.paidAt = new Date()
    }
    
    await this.orderRepository.update(orderId, updateData)
  }
}
