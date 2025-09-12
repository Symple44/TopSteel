import 'reflect-metadata'
import { Article, ArticleStatus, ArticleType, UniteStock } from '@erp/entities'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { vi } from 'vitest'
import type { CreateMarketplaceProductDto, UpdateMarketplaceProductDto } from '../admin/product-catalog.service'
import { ProductCatalogService } from '../admin/product-catalog.service'
import type { MarketplaceProductAdapter } from '../adapters/marketplace-product.adapter'
import type { MarketplaceStockService } from '../stock/marketplace-stock.service'

describe('ProductCatalogService', () => {
  let service: ProductCatalogService
  let _articleRepository: Repository<Article>
  let _adapter: MarketplaceProductAdapter
  let _stockService: MarketplaceStockService
  let _eventEmitter: EventEmitter2

  const mockArticleRepository = {
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

  const mockAdapter = {
    getMarketplaceProducts: vi.fn(),
    getMarketplaceProductById: vi.fn(),
    getMarketplaceCategories: vi.fn(),
    getMarketplaceBrands: vi.fn(),
  }

  const mockStockService = {
    updateStock: vi.fn(),
  }

  const mockEventEmitter = {
    emit: vi.fn(),
  }

  const mockRedisService = {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCatalogService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
        {
          provide: 'MarketplaceProductAdapter',
          useValue: mockAdapter,
        },
        {
          provide: 'MarketplaceStockService',
          useValue: mockStockService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: mockRedisService,
        },
      ],
    }).compile()

    service = module.get<ProductCatalogService>(ProductCatalogService)
    _articleRepository = module.get<Repository<Article>>(getRepositoryToken(Article))
    _adapter = module.get<MarketplaceProductAdapter>('MarketplaceProductAdapter')
    _stockService = module.get<MarketplaceStockService>('MarketplaceStockService')
    _eventEmitter = module.get<EventEmitter2>(EventEmitter2)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      const tenantId = 'tenant-123'
      const createProductDto: CreateMarketplaceProductDto = {
        designation: 'Steel Beam',
        description: 'High quality steel beam',
        reference: 'BEAM-001',
        prixVenteHT: 299.99,
        famille: 'Beams',
        stockPhysique: 100,
        caracteristiquesTechniques: {
          length: '10m',
          weight: '150kg',
        },
      }

      const mockArticle = {
        id: 'article-123',
        ...createProductDto,
        type: ArticleType.PRODUIT_FINI,
        status: ArticleStatus.ACTIF,
        uniteStock: UniteStock.PIECE,
        gereEnStock: true,
        isMarketplaceEnabled: true,
        stockDisponible: 100,
      }

      const mockMarketplaceView = {
        id: 'article-123',
        name: 'Steel Beam',
        sku: 'BEAM-001',
        price: 299.99,
        category: 'Beams',
        stockQuantity: 100,
      }

      mockArticleRepository.findOne.mockResolvedValue(null) // No existing article
      mockArticleRepository.create.mockReturnValue(mockArticle)
      mockArticleRepository.save.mockResolvedValue(mockArticle)
      mockAdapter.getMarketplaceProductById.mockResolvedValue(mockMarketplaceView)

      const result = await service.createProduct(tenantId, createProductDto)

      expect(result).toEqual(mockMarketplaceView)
      expect(mockArticleRepository.findOne).toHaveBeenCalledWith({
        where: { reference: 'BEAM-001' },
      })
      expect(mockArticleRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        type: ArticleType.PRODUIT_FINI,
        status: ArticleStatus.ACTIF,
        uniteStock: UniteStock.PIECE,
        gereEnStock: true,
        isMarketplaceEnabled: true,
        stockPhysique: 100,
        stockDisponible: 100,
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('marketplace.product.created', {
        productId: 'article-123',
        tenantId,
        sku: 'BEAM-001',
      })
    })

    it('should throw BadRequestException when reference already exists', async () => {
      const tenantId = 'tenant-123'
      const createProductDto: CreateMarketplaceProductDto = {
        designation: 'Steel Beam',
        description: 'High quality steel beam',
        reference: 'BEAM-001',
        prixVenteHT: 299.99,
        famille: 'Beams',
        stockPhysique: 100,
      }

      const existingArticle = { id: 'existing-123', reference: 'BEAM-001' }
      mockArticleRepository.findOne.mockResolvedValue(existingArticle)

      await expect(service.createProduct(tenantId, createProductDto)).rejects.toThrow(
        BadRequestException
      )
    })

  })

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const tenantId = 'tenant-123'
      const mockResponse = {
        products: [
          { id: '1', name: 'Product 1', price: 100 },
          { id: '2', name: 'Product 2', price: 200 },
        ],
        total: 2,
        page: 1,
        pages: 1,
        hasMore: false,
      }

      mockAdapter.getMarketplaceProducts.mockResolvedValue(mockResponse)

      const result = await service.getProducts(tenantId, {}, { field: 'createdAt', direction: 'DESC' }, { page: 1, limit: 10 })

      expect(result).toEqual(mockResponse)
      expect(mockAdapter.getMarketplaceProducts).toHaveBeenCalledWith(
        tenantId,
        {},
        { field: 'createdAt', direction: 'DESC' },
        { page: 1, limit: 10 }
      )
    })

    it('should filter products by category', async () => {
      const tenantId = 'tenant-123'
      const category = 'Beams'
      const mockResponse = {
        products: [{ id: '1', name: 'Product 1', category }],
        total: 1,
        page: 1,
        pages: 1,
        hasMore: false,
      }

      mockAdapter.getMarketplaceProducts.mockResolvedValue(mockResponse)

      const result = await service.getProducts(
        tenantId,
        { category },
        { field: 'createdAt', direction: 'DESC' },
        { page: 1, limit: 10 }
      )

      expect(mockAdapter.getMarketplaceProducts).toHaveBeenCalledWith(
        tenantId,
        { category },
        { field: 'createdAt', direction: 'DESC' },
        { page: 1, limit: 10 }
      )
      expect(result.products).toEqual([{ id: '1', name: 'Product 1', category }])
    })

    it('should search products by name', async () => {
      const tenantId = 'tenant-123'
      const search = 'steel'
      const mockResponse = {
        products: [
          { id: '1', name: 'Steel Beam' },
          { id: '2', name: 'Steel Plate' },
        ],
        total: 2,
        page: 1,
        pages: 1,
        hasMore: false,
      }

      mockAdapter.getMarketplaceProducts.mockResolvedValue(mockResponse)

      await service.getProducts(
        tenantId,
        { search },
        { field: 'createdAt', direction: 'DESC' },
        { page: 1, limit: 10 }
      )

      expect(mockAdapter.getMarketplaceProducts).toHaveBeenCalledWith(
        tenantId,
        { search },
        { field: 'createdAt', direction: 'DESC' },
        { page: 1, limit: 10 }
      )
    })
  })

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const mockProduct = {
        id: productId,
        name: 'Steel Beam',
        sku: 'BEAM-001',
        price: 299.99,
      }

      mockAdapter.getMarketplaceProductById.mockResolvedValue(mockProduct)

      const result = await service.getProductById(tenantId, productId)

      expect(result).toEqual(mockProduct)
      expect(mockAdapter.getMarketplaceProductById).toHaveBeenCalledWith(tenantId, productId)
    })

    it('should throw NotFoundException when product not found', async () => {
      const tenantId = 'tenant-123'
      const productId = 'invalid-id'

      mockAdapter.getMarketplaceProductById.mockResolvedValue(null)

      await expect(service.getProductById(tenantId, productId)).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const updateProductDto: UpdateMarketplaceProductDto = {
        id: productId,
        designation: 'Updated Steel Beam',
        prixVenteHT: 349.99,
      }

      const existingArticle = {
        id: productId,
        designation: 'Steel Beam',
        prixVenteHT: 299.99,
        reference: 'BEAM-001',
      }

      const updatedArticle = {
        ...existingArticle,
        designation: 'Updated Steel Beam',
        prixVenteHT: 349.99,
        updatedAt: new Date(),
      }

      const mockMarketplaceView = {
        id: productId,
        name: 'Updated Steel Beam',
        sku: 'BEAM-001',
        price: 349.99,
      }

      mockArticleRepository.findOne.mockResolvedValue(existingArticle)
      mockArticleRepository.save.mockResolvedValue(updatedArticle)
      mockAdapter.getMarketplaceProductById.mockResolvedValue(mockMarketplaceView)

      const result = await service.updateProduct(tenantId, updateProductDto)

      expect(result).toEqual(mockMarketplaceView)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('marketplace.product.updated', {
        productId,
        tenantId,
        changes: updateProductDto,
      })
    })

  })

  describe('deleteProduct', () => {
    it('should disable marketplace visibility for a product', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const mockArticle = {
        id: productId,
        designation: 'Steel Beam',
        reference: 'BEAM-001',
        isMarketplaceEnabled: true,
      }

      mockArticleRepository.findOne.mockResolvedValue(mockArticle)
      mockArticleRepository.save.mockResolvedValue({
        ...mockArticle,
        isMarketplaceEnabled: false,
        updatedAt: new Date(),
      })

      await service.deleteProduct(tenantId, productId)

      expect(mockArticleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isMarketplaceEnabled: false,
          updatedAt: expect.any(Date),
        })
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('marketplace.product.deleted', {
        productId,
        tenantId,
        sku: 'BEAM-001',
      })
    })
  })

  describe('updateProductStock', () => {
    it('should update stock through stock service', async () => {
      const tenantId = 'tenant-123'
      const productId = 'prod-123'
      const quantity = 5
      const reason = 'Inventory adjustment'

      const mockArticle = {
        id: productId,
        designation: 'Steel Beam',
        reference: 'BEAM-001',
      }

      mockArticleRepository.findOne.mockResolvedValue(mockArticle)
      mockStockService.updateStock.mockResolvedValue(undefined)

      await service.updateProductStock(tenantId, productId, quantity, reason)

      expect(mockArticleRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      })
      expect(mockStockService.updateStock).toHaveBeenCalledWith(productId, quantity, reason)
    })

  })

  describe('bulkUpdateProducts', () => {
    it('should update multiple products', async () => {
      const tenantId = 'tenant-123'
      const bulkUpdate = {
        productIds: ['prod-1', 'prod-2'],
        updates: {
          famille: 'Updated Category',
          marque: 'Updated Brand',
          priceAdjustment: {
            type: 'percentage' as const,
            value: 10,
          },
        },
      }

      const mockArticles = [
        { id: 'prod-1', prixVenteHT: 100, famille: 'Old Category', marque: 'Old Brand' },
        { id: 'prod-2', prixVenteHT: 200, famille: 'Old Category', marque: 'Old Brand' },
      ]

      mockArticleRepository.find.mockResolvedValue(mockArticles)
      mockArticleRepository.save.mockResolvedValue(mockArticles)

      const result = await service.bulkUpdateProducts(tenantId, bulkUpdate)

      expect(result).toEqual({ updated: 2 })
      expect(mockArticleRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'prod-1',
            famille: 'Updated Category',
            marque: 'Updated Brand',
            prixVenteHT: 110, // 10% increase
          }),
          expect.objectContaining({
            id: 'prod-2',
            famille: 'Updated Category',
            marque: 'Updated Brand',
            prixVenteHT: 220, // 10% increase
          }),
        ])
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('marketplace.products.bulk_updated', {
        productIds: ['prod-1', 'prod-2'],
        tenantId,
        updates: bulkUpdate.updates,
        count: 2,
      })
    })
  })
})
