import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Cache } from 'cache-manager'
import type { Repository } from 'typeorm'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceProduct } from '../entities/marketplace-product.entity'
import { MarketplaceCartService } from '../services/marketplace-cart.service'

describe('MarketplaceCartService', () => {
  let service: MarketplaceCartService
  let _productRepository: Repository<MarketplaceProduct>
  let _customerRepository: Repository<MarketplaceCustomer>
  let _cacheManager: Cache
  let _eventEmitter: EventEmitter2

  const mockProductRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  }

  const mockCustomerRepository = {
    findOne: jest.fn(),
  }

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }

  const mockEventEmitter = {
    emit: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceCartService,
        {
          provide: getRepositoryToken(MarketplaceProduct),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(MarketplaceCustomer),
          useValue: mockCustomerRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    service = module.get<MarketplaceCartService>(MarketplaceCartService)
    _productRepository = module.get<Repository<MarketplaceProduct>>(
      getRepositoryToken(MarketplaceProduct)
    )
    _customerRepository = module.get<Repository<MarketplaceCustomer>>(
      getRepositoryToken(MarketplaceCustomer)
    )
    _cacheManager = module.get<Cache>(CACHE_MANAGER)
    _eventEmitter = module.get<EventEmitter2>(EventEmitter2)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getCart', () => {
    it('should return cart from cache if exists', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'
      const mockCart = {
        items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
        total: 200,
      }

      mockCacheManager.get.mockResolvedValue(mockCart)

      const result = await service.getCart(tenantId, sessionId)

      expect(result).toEqual(mockCart)
      expect(mockCacheManager.get).toHaveBeenCalledWith(`cart:${tenantId}:${sessionId}`)
    })

    it('should return empty cart if not in cache', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'

      mockCacheManager.get.mockResolvedValue(null)

      const result = await service.getCart(tenantId, sessionId)

      expect(result).toEqual({
        items: [],
        total: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
      })
    })
  })

  describe('addToCart', () => {
    it('should add product to cart', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'
      const productId = 'prod-1'
      const quantity = 2

      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 100,
        stockQuantity: 10,
        tenantId,
      }

      const existingCart = {
        items: [],
        total: 0,
        subtotal: 0,
      }

      mockProductRepository.findOne.mockResolvedValue(mockProduct)
      mockCacheManager.get.mockResolvedValue(existingCart)
      mockCacheManager.set.mockResolvedValue(undefined)

      const result = await service.addToCart(tenantId, sessionId, {
        productId,
        quantity,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual({
        productId,
        quantity,
        price: mockProduct.price,
        name: mockProduct.name,
        subtotal: 200,
      })
      expect(result.subtotal).toBe(200)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('cart.item.added', {
        sessionId,
        productId,
        quantity,
      })
    })

    it('should update quantity if product already in cart', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'
      const productId = 'prod-1'

      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 100,
        stockQuantity: 10,
        tenantId,
      }

      const existingCart = {
        items: [
          {
            productId,
            quantity: 1,
            price: 100,
            name: 'Test Product',
            subtotal: 100,
          },
        ],
        subtotal: 100,
        total: 100,
      }

      mockProductRepository.findOne.mockResolvedValue(mockProduct)
      mockCacheManager.get.mockResolvedValue(existingCart)
      mockCacheManager.set.mockResolvedValue(undefined)

      const result = await service.addToCart(tenantId, sessionId, {
        productId,
        quantity: 2,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].quantity).toBe(3)
      expect(result.items[0].subtotal).toBe(300)
    })

    it('should validate stock availability', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'
      const productId = 'prod-1'

      const mockProduct = {
        id: productId,
        stockQuantity: 2,
        tenantId,
      }

      mockProductRepository.findOne.mockResolvedValue(mockProduct)
      mockCacheManager.get.mockResolvedValue({ items: [] })

      await expect(
        service.addToCart(tenantId, sessionId, {
          productId,
          quantity: 5,
        })
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException if product does not exist', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'

      mockProductRepository.findOne.mockResolvedValue(null)

      await expect(
        service.addToCart(tenantId, sessionId, {
          productId: 'invalid-product',
          quantity: 1,
        })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'
      const productId = 'prod-1'
      const newQuantity = 5

      const mockProduct = {
        id: productId,
        stockQuantity: 10,
        price: 100,
        tenantId,
      }

      const existingCart = {
        items: [
          {
            productId,
            quantity: 2,
            price: 100,
            name: 'Test Product',
            subtotal: 200,
          },
        ],
        subtotal: 200,
        total: 200,
      }

      mockProductRepository.findOne.mockResolvedValue(mockProduct)
      mockCacheManager.get.mockResolvedValue(existingCart)
      mockCacheManager.set.mockResolvedValue(undefined)

      const result = await service.updateCartItem(tenantId, sessionId, productId, {
        quantity: newQuantity,
      })

      expect(result.items[0].quantity).toBe(newQuantity)
      expect(result.items[0].subtotal).toBe(500)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('cart.item.updated', {
        sessionId,
        productId,
        quantity: newQuantity,
      })
    })

    it('should remove item if quantity is 0', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'
      const productId = 'prod-1'

      const existingCart = {
        items: [
          {
            productId,
            quantity: 2,
            price: 100,
            subtotal: 200,
          },
        ],
        subtotal: 200,
        total: 200,
      }

      mockCacheManager.get.mockResolvedValue(existingCart)
      mockCacheManager.set.mockResolvedValue(undefined)

      const result = await service.updateCartItem(tenantId, sessionId, productId, {
        quantity: 0,
      })

      expect(result.items).toHaveLength(0)
      expect(result.subtotal).toBe(0)
    })
  })

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'
      const productId = 'prod-1'

      const existingCart = {
        items: [
          {
            productId,
            quantity: 2,
            price: 100,
            subtotal: 200,
          },
          {
            productId: 'prod-2',
            quantity: 1,
            price: 50,
            subtotal: 50,
          },
        ],
        subtotal: 250,
        total: 250,
      }

      mockCacheManager.get.mockResolvedValue(existingCart)
      mockCacheManager.set.mockResolvedValue(undefined)

      const result = await service.removeFromCart(tenantId, sessionId, productId)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].productId).toBe('prod-2')
      expect(result.subtotal).toBe(50)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('cart.item.removed', {
        sessionId,
        productId,
      })
    })
  })

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'

      mockCacheManager.del.mockResolvedValue(undefined)

      const result = await service.clearCart(tenantId, sessionId)

      expect(result).toEqual({
        items: [],
        total: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
      })
      expect(mockCacheManager.del).toHaveBeenCalledWith(`cart:${tenantId}:${sessionId}`)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('cart.cleared', {
        sessionId,
      })
    })
  })

  describe('mergeCart', () => {
    it('should merge guest cart with customer cart', async () => {
      const tenantId = 'tenant-123'
      const guestSessionId = 'guest-123'
      const customerId = 'customer-123'

      const guestCart = {
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            price: 100,
            subtotal: 200,
          },
        ],
        subtotal: 200,
      }

      const customerCart = {
        items: [
          {
            productId: 'prod-2',
            quantity: 1,
            price: 50,
            subtotal: 50,
          },
        ],
        subtotal: 50,
      }

      mockCacheManager.get.mockResolvedValueOnce(guestCart).mockResolvedValueOnce(customerCart)
      mockCacheManager.set.mockResolvedValue(undefined)
      mockCacheManager.del.mockResolvedValue(undefined)

      const mockProducts = [
        { id: 'prod-1', stockQuantity: 10 },
        { id: 'prod-2', stockQuantity: 10 },
      ]
      mockProductRepository.find.mockResolvedValue(mockProducts)

      const result = await service.mergeCart(tenantId, guestSessionId, customerId)

      expect(result.items).toHaveLength(2)
      expect(result.subtotal).toBe(250)
      expect(mockCacheManager.del).toHaveBeenCalledWith(`cart:${tenantId}:${guestSessionId}`)
    })

    it('should combine quantities for duplicate products', async () => {
      const tenantId = 'tenant-123'
      const guestSessionId = 'guest-123'
      const customerId = 'customer-123'

      const guestCart = {
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            price: 100,
            subtotal: 200,
          },
        ],
      }

      const customerCart = {
        items: [
          {
            productId: 'prod-1',
            quantity: 3,
            price: 100,
            subtotal: 300,
          },
        ],
      }

      mockCacheManager.get.mockResolvedValueOnce(guestCart).mockResolvedValueOnce(customerCart)
      mockCacheManager.set.mockResolvedValue(undefined)
      mockCacheManager.del.mockResolvedValue(undefined)

      const mockProduct = { id: 'prod-1', stockQuantity: 10 }
      mockProductRepository.find.mockResolvedValue([mockProduct])

      const result = await service.mergeCart(tenantId, guestSessionId, customerId)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].quantity).toBe(5)
      expect(result.items[0].subtotal).toBe(500)
    })
  })

  describe('validateCart', () => {
    it('should validate cart items availability', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'

      const cart = {
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            price: 100,
          },
          {
            productId: 'prod-2',
            quantity: 1,
            price: 50,
          },
        ],
      }

      const mockProducts = [
        { id: 'prod-1', stockQuantity: 10, price: 100, isActive: true },
        { id: 'prod-2', stockQuantity: 5, price: 50, isActive: true },
      ]

      mockCacheManager.get.mockResolvedValue(cart)
      mockProductRepository.find.mockResolvedValue(mockProducts)

      const result = await service.validateCart(tenantId, sessionId)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect out of stock items', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'

      const cart = {
        items: [
          {
            productId: 'prod-1',
            quantity: 5,
            price: 100,
          },
        ],
      }

      const mockProduct = {
        id: 'prod-1',
        stockQuantity: 2,
        price: 100,
        isActive: true,
      }

      mockCacheManager.get.mockResolvedValue(cart)
      mockProductRepository.find.mockResolvedValue([mockProduct])

      const result = await service.validateCart(tenantId, sessionId)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          productId: 'prod-1',
          error: 'Insufficient stock',
        })
      )
    })

    it('should detect price changes', async () => {
      const tenantId = 'tenant-123'
      const sessionId = 'session-123'

      const cart = {
        items: [
          {
            productId: 'prod-1',
            quantity: 1,
            price: 100,
          },
        ],
      }

      const mockProduct = {
        id: 'prod-1',
        stockQuantity: 10,
        price: 120, // Price changed
        isActive: true,
      }

      mockCacheManager.get.mockResolvedValue(cart)
      mockProductRepository.find.mockResolvedValue([mockProduct])

      const result = await service.validateCart(tenantId, sessionId)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          productId: 'prod-1',
          error: 'Price changed',
          oldPrice: 100,
          newPrice: 120,
        })
      )
    })
  })
})
