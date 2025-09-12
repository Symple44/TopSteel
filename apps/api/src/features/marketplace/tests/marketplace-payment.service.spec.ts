// TODO: This test file references services and entities that don't exist yet.
// The MarketplacePaymentService and MarketplacePayment entity are not implemented.
// This test should be updated once the actual payment service is implemented.

/*
import 'reflect-metadata'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import Stripe from 'stripe'
import type { Repository } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplacePayment } from '../entities/marketplace-payment.entity'
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum'
import { MarketplacePaymentService } from '../services/marketplace-payment.service'*/

/*
vi.mock('stripe')

describe('MarketplacePaymentService', () => {
  let service: MarketplacePaymentService
  let _paymentRepository: Repository<MarketplacePayment>
  let _orderRepository: Repository<MarketplaceOrder>
  let _eventEmitter: EventEmitter2
  let stripe: {
    paymentIntents: { create: () => void; confirm: () => void }
    customers: { create: () => void }
  }

  const mockPaymentRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    createQueryBuilder: vi.fn(),
  }

  const mockOrderRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
  }

  const mockEventEmitter = {
    emit: vi.fn(),
  }

  const mockConfigService = {
    get: vi.fn().mockReturnValue('sk_test_stripe_key'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplacePaymentService,
        {
          provide: getRepositoryToken(MarketplacePayment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(MarketplaceOrder),
          useValue: mockOrderRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<MarketplacePaymentService>(MarketplacePaymentService)
    _paymentRepository = module.get<Repository<MarketplacePayment>>(
      getRepositoryToken(MarketplacePayment)
    )
    _orderRepository = module.get<Repository<MarketplaceOrder>>(
      getRepositoryToken(MarketplaceOrder)
    )
    _eventEmitter = module.get<EventEmitter2>(EventEmitter2)

    // Mock Stripe instance
    stripe = new Stripe('sk_test_stripe_key', { apiVersion: '2023-10-16' }) as unknown
    ;(service as unknown).stripe = stripe
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('processPayment', () => {
    it('should process card payment successfully', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'order-123'
      const amount = 1000
      const currency = 'EUR'

      const mockOrder = {
        id: orderId,
        tenantId,
        totalAmount: amount,
        customer: { email: 'test@example.com' },
      }

      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount,
        currency,
      }

      const mockPayment = {
        id: 'payment-123',
        orderId,
        amount,
        currency,
        status: PaymentStatus.COMPLETED,
        stripePaymentIntentId: mockPaymentIntent.id,
      }

      mockOrderRepository.findOne.mockResolvedValue(mockOrder)
      stripe.paymentIntents = {
        create: vi.fn().mockResolvedValue(mockPaymentIntent),
      } as unknown
      mockPaymentRepository.create.mockReturnValue(mockPayment)
      mockPaymentRepository.save.mockResolvedValue(mockPayment)

      const result = await service.processPayment(tenantId, {
        orderId,
        amount,
        currency,
        paymentMethod: {
          type: PaymentMethod.CARD,
          token: 'tok_visa',
        },
      })

      expect(result).toEqual(mockPayment)
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount,
        currency,
        payment_method_types: ['card'],
        metadata: { orderId, tenantId },
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payment.completed', {
        payment: mockPayment,
      })
    })

    it('should handle payment failure', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'order-123'

      const mockOrder = {
        id: orderId,
        tenantId,
        totalAmount: 1000,
      }

      mockOrderRepository.findOne.mockResolvedValue(mockOrder)
      stripe.paymentIntents = {
        create: vi.fn().mockRejectedValue(new Error('Card declined')),
      } as unknown

      await expect(
        service.processPayment(tenantId, {
          orderId,
          amount: 1000,
          currency: 'EUR',
          paymentMethod: {
            type: PaymentMethod.CARD,
            token: 'tok_visa_declined',
          },
        })
      ).rejects.toThrow('Card declined')

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payment.failed', {
        orderId,
        error: 'Card declined',
      })
    })

    it('should validate order exists', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'invalid-order'

      mockOrderRepository.findOne.mockResolvedValue(null)

      await expect(
        service.processPayment(tenantId, {
          orderId,
          amount: 1000,
          currency: 'EUR',
          paymentMethod: {
            type: PaymentMethod.CARD,
            token: 'tok_visa',
          },
        })
      ).rejects.toThrow(NotFoundException)
    })

    it('should validate payment amount matches order', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'order-123'

      const mockOrder = {
        id: orderId,
        tenantId,
        totalAmount: 1000,
      }

      mockOrderRepository.findOne.mockResolvedValue(mockOrder)

      await expect(
        service.processPayment(tenantId, {
          orderId,
          amount: 500, // Wrong amount
          currency: 'EUR',
          paymentMethod: {
            type: PaymentMethod.CARD,
            token: 'tok_visa',
          },
        })
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const tenantId = 'tenant-123'
      const paymentId = 'payment-123'
      const amount = 500

      const mockPayment = {
        id: paymentId,
        tenantId,
        amount: 1000,
        status: PaymentStatus.COMPLETED,
        stripePaymentIntentId: 'pi_test_123',
      }

      const mockRefund = {
        id: 're_test_123',
        amount,
        status: 'succeeded',
      }

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment)
      stripe.refunds = {
        create: vi.fn().mockResolvedValue(mockRefund),
      } as unknown
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REFUNDED,
        refundedAmount: amount,
      })

      const result = await service.refundPayment(tenantId, paymentId, {
        amount,
        reason: 'Customer request',
      })

      expect(result.status).toBe(PaymentStatus.REFUNDED)
      expect(result.refundedAmount).toBe(amount)
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount,
        reason: 'requested_by_customer',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payment.refunded', {
        payment: expect.objectContaining({ status: PaymentStatus.REFUNDED }),
        amount,
      })
    })

    it('should validate refund amount', async () => {
      const tenantId = 'tenant-123'
      const paymentId = 'payment-123'

      const mockPayment = {
        id: paymentId,
        tenantId,
        amount: 1000,
        status: PaymentStatus.COMPLETED,
        refundedAmount: 200,
      }

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment)

      await expect(
        service.refundPayment(tenantId, paymentId, {
          amount: 900, // Too much
          reason: 'Customer request',
        })
      ).rejects.toThrow(BadRequestException)
    })

    it('should handle partial refunds', async () => {
      const tenantId = 'tenant-123'
      const paymentId = 'payment-123'

      const mockPayment = {
        id: paymentId,
        tenantId,
        amount: 1000,
        status: PaymentStatus.COMPLETED,
        stripePaymentIntentId: 'pi_test_123',
        refundedAmount: 0,
      }

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment)
      stripe.refunds = {
        create: vi.fn().mockResolvedValue({
          id: 're_test_123',
          amount: 300,
          status: 'succeeded',
        }),
      } as unknown

      const updatedPayment = {
        ...mockPayment,
        status: PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: 300,
      }
      mockPaymentRepository.save.mockResolvedValue(updatedPayment)

      const result = await service.refundPayment(tenantId, paymentId, {
        amount: 300,
        reason: 'Product defect',
      })

      expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED)
      expect(result.refundedAmount).toBe(300)
    })
  })

  describe('getPaymentsByOrder', () => {
    it('should return payments for an order', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'order-123'

      const mockPayments = [
        {
          id: 'payment-1',
          orderId,
          amount: 500,
          status: PaymentStatus.COMPLETED,
        },
        {
          id: 'payment-2',
          orderId,
          amount: 500,
          status: PaymentStatus.COMPLETED,
        },
      ]

      mockPaymentRepository.find.mockResolvedValue(mockPayments)

      const result = await service.getPaymentsByOrder(tenantId, orderId)

      expect(result).toEqual(mockPayments)
      expect(mockPaymentRepository.find).toHaveBeenCalledWith({
        where: { orderId, tenantId },
        order: { createdAt: 'DESC' },
      })
    })
  })

  describe('webhookHandler', () => {
    it('should handle successful payment webhook', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              orderId: 'order-123',
              tenantId: 'tenant-123',
            },
          },
        },
      }

      const mockPayment = {
        id: 'payment-123',
        stripePaymentIntentId: 'pi_test_123',
        status: PaymentStatus.PENDING,
      }

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment)
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      })

      await service.handleWebhook(event as unknown)

      expect(mockPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.COMPLETED })
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payment.webhook.processed', {
        event: event.type,
        paymentId: mockPayment.id,
      })
    })

    it('should handle failed payment webhook', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              orderId: 'order-123',
              tenantId: 'tenant-123',
            },
          },
        },
      }

      const mockPayment = {
        id: 'payment-123',
        stripePaymentIntentId: 'pi_test_123',
        status: PaymentStatus.PENDING,
      }

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment)
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
      })

      await service.handleWebhook(event as unknown)

      expect(mockPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.FAILED })
      )
    })
  })

  describe('getPaymentStatistics', () => {
    it('should calculate payment statistics', async () => {
      const tenantId = 'tenant-123'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({
          totalAmount: '10000',
          successCount: '50',
          failedCount: '5',
          refundedAmount: '500',
        }),
      }

      mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.getPaymentStatistics(tenantId, startDate, endDate)

      expect(result).toEqual({
        totalAmount: 10000,
        successCount: 50,
        failedCount: 5,
        refundedAmount: 500,
        successRate: 0.91,
      })
    })
  })
})
*/
