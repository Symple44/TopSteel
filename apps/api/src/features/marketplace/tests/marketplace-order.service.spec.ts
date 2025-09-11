import { BadRequestException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { vi } from 'vitest'
import type { CreateOrderDto } from '../dto/order.dto'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity'
import { MarketplaceProduct } from '../entities/marketplace-product.entity'
import { OrderStatus, PaymentStatus } from '../enums/order.enum'
import { MarketplaceOrderService } from '../services/marketplace-order.service'

describe('MarketplaceOrderService', () => {
  let service: MarketplaceOrderService
  let _orderRepository: Repository<MarketplaceOrder>
  let _orderItemRepository: Repository<MarketplaceOrderItem>
  let _productRepository: Repository<MarketplaceProduct>
  let _customerRepository: Repository<MarketplaceCustomer>
  let _eventEmitter: EventEmitter2

  const mockOrderRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    createQueryBuilder: vi.fn(),
    manager: {
      transaction: vi.fn(),
    },
  }

  const mockOrderItemRepository = {
    create: vi.fn(),
    save: vi.fn(),
  }

  const mockProductRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
  }

  const mockCustomerRepository = {
    findOne: vi.fn(),
  }

  const mockEventEmitter = {
    emit: vi.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceOrderService,
        {
          provide: getRepositoryToken(MarketplaceOrder),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(MarketplaceOrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(MarketplaceProduct),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(MarketplaceCustomer),
          useValue: mockCustomerRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    service = module.get<MarketplaceOrderService>(MarketplaceOrderService)
    _orderRepository = module.get<Repository<MarketplaceOrder>>(
      getRepositoryToken(MarketplaceOrder)
    )
    _orderItemRepository = module.get<Repository<MarketplaceOrderItem>>(
      getRepositoryToken(MarketplaceOrderItem)
    )
    _productRepository = module.get<Repository<MarketplaceProduct>>(
      getRepositoryToken(MarketplaceProduct)
    )
    _customerRepository = module.get<Repository<MarketplaceCustomer>>(
      getRepositoryToken(MarketplaceCustomer)
    )
    _eventEmitter = module.get<EventEmitter2>(EventEmitter2)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const createOrderDto: CreateOrderDto = {
        customerId,
        items: [
          { productId: 'prod-1', quantity: 2, price: 100 },
          { productId: 'prod-2', quantity: 1, price: 200 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        paymentMethod: 'card',
      }

      const mockCustomer = { id: customerId, email: 'test@example.com' }
      const mockProducts = [
        { id: 'prod-1', stockQuantity: 10, price: 100 },
        { id: 'prod-2', stockQuantity: 5, price: 200 },
      ]

      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2024-0001',
        tenantId,
        customerId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 400,
        items: [],
      }

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer)
      mockProductRepository.findOne.mockImplementation((options) => {
        const productId = options.where.id
        return mockProducts.find((p) => p.id === productId)
      })

      const mockTransactionManager = {
        save: vi.fn().mockImplementation((entity) => {
          if (entity.constructor.name === 'MarketplaceOrder') {
            return mockOrder
          }
          return entity
        }),
        create: vi.fn().mockImplementation((_Entity, data) => data),
      }

      mockOrderRepository.manager.transaction.mockImplementation(async (callback) =>
        callback(mockTransactionManager)
      )

      const result = await service.createOrder(tenantId, createOrderDto)

      expect(result).toEqual(mockOrder)
      expect(mockCustomerRepository.findOne).toHaveBeenCalled()
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.created', {
        order: mockOrder,
      })
    })

    it('should validate stock availability', async () => {
      const tenantId = 'tenant-123'
      const createOrderDto: CreateOrderDto = {
        customerId: 'customer-123',
        items: [{ productId: 'prod-1', quantity: 20, price: 100 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        paymentMethod: 'card',
      }

      const mockCustomer = { id: 'customer-123' }
      const mockProduct = { id: 'prod-1', stockQuantity: 10 }

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer)
      mockProductRepository.findOne.mockResolvedValue(mockProduct)

      await expect(service.createOrder(tenantId, createOrderDto)).rejects.toThrow(
        BadRequestException
      )
    })

    it('should reserve stock when creating order', async () => {
      const tenantId = 'tenant-123'
      const createOrderDto: CreateOrderDto = {
        customerId: 'customer-123',
        items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        paymentMethod: 'card',
      }

      const mockCustomer = { id: 'customer-123' }
      const mockProduct = { id: 'prod-1', stockQuantity: 10, price: 100 }
      const mockOrder = {
        id: 'order-123',
        totalAmount: 200,
      }

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer)
      mockProductRepository.findOne.mockResolvedValue(mockProduct)

      const mockTransactionManager = {
        save: vi.fn().mockResolvedValue(mockOrder),
        create: vi.fn().mockImplementation((_Entity, data) => data),
      }

      mockOrderRepository.manager.transaction.mockImplementation(async (callback) =>
        callback(mockTransactionManager)
      )

      await service.createOrder(tenantId, createOrderDto)

      expect(mockTransactionManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stockQuantity: 8,
        })
      )
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'order-123'
      const newStatus = OrderStatus.PROCESSING

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        tenantId,
      }

      mockOrderRepository.findOne.mockResolvedValue(mockOrder)
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: newStatus,
      })

      const result = await service.updateOrderStatus(tenantId, orderId, newStatus)

      expect(result.status).toBe(newStatus)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.status.updated', {
        order: expect.objectContaining({ status: newStatus }),
        previousStatus: OrderStatus.PENDING,
      })
    })

    it('should validate status transitions', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'order-123'

      const mockOrder = {
        id: orderId,
        status: OrderStatus.CANCELLED,
        tenantId,
      }

      mockOrderRepository.findOne.mockResolvedValue(mockOrder)

      await expect(
        service.updateOrderStatus(tenantId, orderId, OrderStatus.PROCESSING)
      ).rejects.toThrow(BadRequestException)
    })

    it('should release stock when cancelling order', async () => {
      const tenantId = 'tenant-123'
      const orderId = 'order-123'

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        tenantId,
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 },
        ],
      }

      const mockProducts = [
        { id: 'prod-1', stockQuantity: 8 },
        { id: 'prod-2', stockQuantity: 4 },
      ]

      mockOrderRepository.findOne.mockResolvedValue(mockOrder)
      mockProductRepository.findOne.mockImplementation((options) => {
        const productId = options.where.id
        return mockProducts.find((p) => p.id === productId)
      })
      mockProductRepository.save.mockImplementation((product) => product)
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      })

      await service.updateOrderStatus(tenantId, orderId, OrderStatus.CANCELLED)

      expect(mockProductRepository.save).toHaveBeenCalledTimes(2)
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'prod-1', stockQuantity: 10 })
      )
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'prod-2', stockQuantity: 5 })
      )
    })
  })

  describe('calculateOrderTotals', () => {
    it('should calculate order totals correctly', async () => {
      const items = [
        { productId: 'prod-1', quantity: 2, price: 100 },
        { productId: 'prod-2', quantity: 1, price: 200 },
      ]
      const shippingCost = 10
      const taxRate = 0.2

      const result = await service.calculateOrderTotals(items, shippingCost, taxRate)

      expect(result).toEqual({
        subtotal: 400,
        shipping: 10,
        tax: 80,
        total: 490,
      })
    })

    it('should apply discounts correctly', async () => {
      const items = [{ productId: 'prod-1', quantity: 2, price: 100 }]
      const shippingCost = 10
      const taxRate = 0.2
      const discount = 20

      const result = await service.calculateOrderTotals(items, shippingCost, taxRate, discount)

      expect(result).toEqual({
        subtotal: 200,
        discount: 20,
        shipping: 10,
        tax: 36, // (200 - 20) * 0.2
        total: 226,
      })
    })
  })

  describe('getOrdersByCustomer', () => {
    it('should return customer orders with pagination', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const mockOrders = [
        { id: 'order-1', customerId, totalAmount: 100 },
        { id: 'order-2', customerId, totalAmount: 200 },
      ]

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockOrders, 2]),
      }

      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.getOrdersByCustomer(tenantId, customerId, { page: 1, limit: 10 })

      expect(result).toEqual({
        items: mockOrders,
        total: 2,
        page: 1,
        pages: 1,
      })
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'order.tenantId = :tenantId AND order.customerId = :customerId',
        { tenantId, customerId }
      )
    })
  })

  describe('getOrderStatistics', () => {
    it('should calculate order statistics', async () => {
      const tenantId = 'tenant-123'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({
          totalOrders: '10',
          totalRevenue: '5000',
          averageOrderValue: '500',
        }),
      }

      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.getOrderStatistics(tenantId, startDate, endDate)

      expect(result).toEqual({
        totalOrders: 10,
        totalRevenue: 5000,
        averageOrderValue: 500,
      })
    })
  })
})
