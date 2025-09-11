import { BadRequestException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { vi } from 'vitest'
import type { CreateProductDto, UpdateProductDto } from '../dto/product.dto'
import { MarketplaceCategory } from '../entities/marketplace-category.entity'
import { MarketplaceProduct } from '../entities/marketplace-product.entity'
import { MarketplaceProductService } from '../services/marketplace-product.service'

describe('MarketplaceProductService', () => {
  let service: MarketplaceProductService
  let _productRepository: Repository<MarketplaceProduct>
  let _categoryRepository: Repository<MarketplaceCategory>
  let _eventEmitter: EventEmitter2

  const mockProductRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createQueryBuilder: vi.fn(),
    manager: {
      transaction: vi.fn(),
    },
  }

  const mockCategoryRepository = {
    findOne: vi.fn(),
  }

  const mockEventEmitter = {
    emit: vi.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceProductService,
        {
          provide: getRepositoryToken(MarketplaceProduct),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(MarketplaceCategory),
          useValue: mockCategoryRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    service = module.get<MarketplaceProductService>(MarketplaceProductService)
    _productRepository = module.get<Repository<MarketplaceProduct>>(
      getRepositoryToken(MarketplaceProduct)
    )
    _categoryRepository = module.get<Repository<MarketplaceCategory>>(
      getRepositoryToken(MarketplaceCategory)
    )
    _eventEmitter = module.get<EventEmitter2>(EventEmitter2)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new product successfully', async () => {
      const tenantId = 'tenant-123'
      const createProductDto: CreateProductDto = {
        name: 'Steel Beam',
        description: 'High quality steel beam',
        price: 299.99,
        categoryId: 'cat-123',
        sku: 'BEAM-001',
        stockQuantity: 100,
        specifications: {
          length: '10m',
          weight: '150kg',
        },
      }

      const mockCategory = { id: 'cat-123', name: 'Beams' }
      const mockProduct = {
        id: 'prod-123',
        ...createProductDto,
        tenantId,
        category: mockCategory,
      }

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory)
      mockProductRepository.create.mockReturnValue(mockProduct)
      mockProductRepository.save.mockResolvedValue(mockProduct)

      const result = await service.create(tenantId, createProductDto)

      expect(result).toEqual(mockProduct)
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-123', tenantId },
      })
      expect(mockProductRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        tenantId,
        category: mockCategory,
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('product.created', {
        product: mockProduct,
      })
    })

    it('should throw NotFoundException when category does not exist', async () => {
      const tenantId = 'tenant-123'
      const createProductDto: CreateProductDto = {
        name: 'Steel Beam',
        description: 'High quality steel beam',
        price: 299.99,
        categoryId: 'invalid-cat',
        sku: 'BEAM-001',
        stockQuantity: 100,
      }

      mockCategoryRepository.findOne.mockResolvedValue(null)

      await expect(service.create(tenantId, createProductDto)).rejects.toThrow(NotFoundException)
    })

    it('should validate price is positive', async () => {
      const tenantId = 'tenant-123'
      const createProductDto: CreateProductDto = {
        name: 'Steel Beam',
        description: 'High quality steel beam',
        price: -10,
        categoryId: 'cat-123',
        sku: 'BEAM-001',
        stockQuantity: 100,
      }

      await expect(service.create(tenantId, createProductDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const tenantId = 'tenant-123'
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ]

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProducts, 2]),
      }

      mockProductRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.findAll(tenantId, { page: 1, limit: 10 })

      expect(result).toEqual({
        items: mockProducts,
        total: 2,
        page: 1,
        pages: 1,
      })
    })

    it('should filter products by category', async () => {
      const tenantId = 'tenant-123'
      const categoryId = 'cat-123'
      const mockProducts = [{ id: '1', name: 'Product 1', categoryId }]

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProducts, 1]),
      }

      mockProductRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.findAll(tenantId, {
        page: 1,
        limit: 10,
        categoryId,
      })

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.categoryId = :categoryId', {
        categoryId,
      })
      expect(result.items).toEqual(mockProducts)
    })

    it('should search products by name', async () => {
      const tenantId = 'tenant-123'
      const search = 'steel'
      const mockProducts = [
        { id: '1', name: 'Steel Beam' },
        { id: '2', name: 'Steel Plate' },
      ]

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProducts, 2]),
      }

      mockProductRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      await service.findAll(tenantId, { page: 1, limit: 10, search })

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      )
    })
  })

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const mockProduct = {
        id: productId,
        name: 'Steel Beam',
        tenantId,
      }

      mockProductRepository.findOne.mockResolvedValue(mockProduct)

      const result = await service.findOne(tenantId, productId)

      expect(result).toEqual(mockProduct)
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId, tenantId },
        relations: ['category', 'reviews'],
      })
    })

    it('should throw NotFoundException when product not found', async () => {
      const tenantId = 'tenant-123'
      const productId = 'invalid-id'

      mockProductRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(tenantId, productId)).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a product successfully', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Steel Beam',
        price: 349.99,
      }

      const existingProduct = {
        id: productId,
        name: 'Steel Beam',
        price: 299.99,
        tenantId,
      }

      const updatedProduct = {
        ...existingProduct,
        ...updateProductDto,
      }

      mockProductRepository.findOne.mockResolvedValue(existingProduct)
      mockProductRepository.save.mockResolvedValue(updatedProduct)

      const result = await service.update(tenantId, productId, updateProductDto)

      expect(result).toEqual(updatedProduct)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('product.updated', {
        product: updatedProduct,
        changes: updateProductDto,
      })
    })

    it('should handle stock updates with validation', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const updateProductDto: UpdateProductDto = {
        stockQuantity: -5,
      }

      const existingProduct = {
        id: productId,
        stockQuantity: 10,
        tenantId,
      }

      mockProductRepository.findOne.mockResolvedValue(existingProduct)

      await expect(service.update(tenantId, productId, updateProductDto)).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('remove', () => {
    it('should soft delete a product', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const mockProduct = {
        id: productId,
        name: 'Steel Beam',
        tenantId,
      }

      mockProductRepository.findOne.mockResolvedValue(mockProduct)
      mockProductRepository.save.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
      })

      await service.remove(tenantId, productId)

      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        })
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('product.deleted', {
        productId,
      })
    })
  })

  describe('updateStock', () => {
    it('should update stock with pessimistic locking', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const quantity = -5

      const mockProduct = {
        id: productId,
        stockQuantity: 10,
        tenantId,
      }

      const mockQueryBuilder = {
        setLock: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockProduct),
      }

      const mockTransactionManager = {
        createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
        save: vi.fn().mockResolvedValue({
          ...mockProduct,
          stockQuantity: 5,
        }),
      }

      mockProductRepository.manager.transaction.mockImplementation(async (callback) =>
        callback(mockTransactionManager)
      )

      const result = await service.updateStock(tenantId, productId, quantity)

      expect(result.stockQuantity).toBe(5)
      expect(mockQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write')
    })

    it('should throw error when insufficient stock', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const quantity = -15

      const mockProduct = {
        id: productId,
        stockQuantity: 10,
        tenantId,
      }

      const mockQueryBuilder = {
        setLock: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockProduct),
      }

      const mockTransactionManager = {
        createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
      }

      mockProductRepository.manager.transaction.mockImplementation(async (callback) =>
        callback(mockTransactionManager)
      )

      await expect(service.updateStock(tenantId, productId, quantity)).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('bulkUpdatePrices', () => {
    it('should update multiple product prices', async () => {
      const tenantId = 'tenant-123'
      const updates = [
        { productId: 'prod-1', price: 199.99 },
        { productId: 'prod-2', price: 299.99 },
      ]

      const mockProducts = [
        { id: 'prod-1', price: 150, tenantId },
        { id: 'prod-2', price: 250, tenantId },
      ]

      mockProductRepository.find.mockResolvedValue(mockProducts)
      mockProductRepository.save.mockResolvedValue(mockProducts)

      await service.bulkUpdatePrices(tenantId, updates)

      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'prod-1', price: 199.99 }),
          expect.objectContaining({ id: 'prod-2', price: 299.99 }),
        ])
      )
    })
  })
})
