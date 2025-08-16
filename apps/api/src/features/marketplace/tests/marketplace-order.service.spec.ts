import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketplaceOrderService } from '../services/marketplace-order.service';
import { MarketplaceOrder } from '../entities/marketplace-order.entity';
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity';
import { MarketplaceProduct } from '../entities/marketplace-product.entity';
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity';
import { CreateOrderDto } from '../dto/order.dto';
import { OrderStatus, PaymentStatus } from '../enums/order.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MarketplaceOrderService', () => {
  let service: MarketplaceOrderService;
  let orderRepository: Repository<MarketplaceOrder>;
  let orderItemRepository: Repository<MarketplaceOrderItem>;
  let productRepository: Repository<MarketplaceProduct>;
  let customerRepository: Repository<MarketplaceCustomer>;
  let eventEmitter: EventEmitter2;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockOrderItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCustomerRepository = {
    findOne: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

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
    }).compile();

    service = module.get<MarketplaceOrderService>(MarketplaceOrderService);
    orderRepository = module.get<Repository<MarketplaceOrder>>(
      getRepositoryToken(MarketplaceOrder),
    );
    orderItemRepository = module.get<Repository<MarketplaceOrderItem>>(
      getRepositoryToken(MarketplaceOrderItem),
    );
    productRepository = module.get<Repository<MarketplaceProduct>>(
      getRepositoryToken(MarketplaceProduct),
    );
    customerRepository = module.get<Repository<MarketplaceCustomer>>(
      getRepositoryToken(MarketplaceCustomer),
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const tenantId = 'tenant-123';
      const customerId = 'customer-123';
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
      };

      const mockCustomer = { id: customerId, email: 'test@example.com' };
      const mockProducts = [
        { id: 'prod-1', stockQuantity: 10, price: 100 },
        { id: 'prod-2', stockQuantity: 5, price: 200 },
      ];

      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2024-0001',
        tenantId,
        customerId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 400,
        items: [],
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockProductRepository.findOne.mockImplementation((options) => {
        const productId = options.where.id;
        return mockProducts.find((p) => p.id === productId);
      });

      const mockTransactionManager = {
        save: jest.fn().mockImplementation((entity) => {
          if (entity.constructor.name === 'MarketplaceOrder') {
            return mockOrder;
          }
          return entity;
        }),
        create: jest.fn().mockImplementation((Entity, data) => data),
      };

      mockOrderRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager),
      );

      const result = await service.createOrder(tenantId, createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockCustomerRepository.findOne).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.created', {
        order: mockOrder,
      });
    });

    it('should validate stock availability', async () => {
      const tenantId = 'tenant-123';
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
      };

      const mockCustomer = { id: 'customer-123' };
      const mockProduct = { id: 'prod-1', stockQuantity: 10 };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      await expect(
        service.createOrder(tenantId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reserve stock when creating order', async () => {
      const tenantId = 'tenant-123';
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
      };

      const mockCustomer = { id: 'customer-123' };
      const mockProduct = { id: 'prod-1', stockQuantity: 10, price: 100 };
      const mockOrder = {
        id: 'order-123',
        totalAmount: 200,
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(mockOrder),
        create: jest.fn().mockImplementation((Entity, data) => data),
      };

      mockOrderRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager),
      );

      await service.createOrder(tenantId, createOrderDto);

      expect(mockTransactionManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stockQuantity: 8,
        }),
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-123';
      const newStatus = OrderStatus.PROCESSING;

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        tenantId,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: newStatus,
      });

      const result = await service.updateOrderStatus(
        tenantId,
        orderId,
        newStatus,
      );

      expect(result.status).toBe(newStatus);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.status.updated',
        {
          order: expect.objectContaining({ status: newStatus }),
          previousStatus: OrderStatus.PENDING,
        },
      );
    });

    it('should validate status transitions', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-123';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.CANCELLED,
        tenantId,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.updateOrderStatus(tenantId, orderId, OrderStatus.PROCESSING),
      ).rejects.toThrow(BadRequestException);
    });

    it('should release stock when cancelling order', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-123';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        tenantId,
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 },
        ],
      };

      const mockProducts = [
        { id: 'prod-1', stockQuantity: 8 },
        { id: 'prod-2', stockQuantity: 4 },
      ];

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockProductRepository.findOne.mockImplementation((options) => {
        const productId = options.where.id;
        return mockProducts.find((p) => p.id === productId);
      });
      mockProductRepository.save.mockImplementation((product) => product);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      await service.updateOrderStatus(tenantId, orderId, OrderStatus.CANCELLED);

      expect(mockProductRepository.save).toHaveBeenCalledTimes(2);
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'prod-1', stockQuantity: 10 }),
      );
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'prod-2', stockQuantity: 5 }),
      );
    });
  });

  describe('calculateOrderTotals', () => {
    it('should calculate order totals correctly', async () => {
      const items = [
        { productId: 'prod-1', quantity: 2, price: 100 },
        { productId: 'prod-2', quantity: 1, price: 200 },
      ];
      const shippingCost = 10;
      const taxRate = 0.2;

      const result = await service.calculateOrderTotals(
        items,
        shippingCost,
        taxRate,
      );

      expect(result).toEqual({
        subtotal: 400,
        shipping: 10,
        tax: 80,
        total: 490,
      });
    });

    it('should apply discounts correctly', async () => {
      const items = [
        { productId: 'prod-1', quantity: 2, price: 100 },
      ];
      const shippingCost = 10;
      const taxRate = 0.2;
      const discount = 20;

      const result = await service.calculateOrderTotals(
        items,
        shippingCost,
        taxRate,
        discount,
      );

      expect(result).toEqual({
        subtotal: 200,
        discount: 20,
        shipping: 10,
        tax: 36, // (200 - 20) * 0.2
        total: 226,
      });
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should return customer orders with pagination', async () => {
      const tenantId = 'tenant-123';
      const customerId = 'customer-123';
      const mockOrders = [
        { id: 'order-1', customerId, totalAmount: 100 },
        { id: 'order-2', customerId, totalAmount: 200 },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockOrders, 2]),
      };

      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getOrdersByCustomer(
        tenantId,
        customerId,
        { page: 1, limit: 10 },
      );

      expect(result).toEqual({
        items: mockOrders,
        total: 2,
        page: 1,
        pages: 1,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'order.tenantId = :tenantId AND order.customerId = :customerId',
        { tenantId, customerId },
      );
    });
  });

  describe('getOrderStatistics', () => {
    it('should calculate order statistics', async () => {
      const tenantId = 'tenant-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalOrders: '10',
          totalRevenue: '5000',
          averageOrderValue: '500',
        }),
      };

      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getOrderStatistics(
        tenantId,
        startDate,
        endDate,
      );

      expect(result).toEqual({
        totalOrders: 10,
        totalRevenue: 5000,
        averageOrderValue: 500,
      });
    });
  });
});