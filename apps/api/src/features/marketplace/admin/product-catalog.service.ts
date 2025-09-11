import { Article, ArticleStatus, ArticleType, UniteStock } from '@erp/entities'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import { In, type Repository } from 'typeorm'
import type {
  MarketplaceProductAdapter,
  MarketplaceProductView,
  PaginationOptions,
  ProductFilters,
  ProductListResponse,
  ProductSortOptions,
} from '../adapters/marketplace-product.adapter'
import type { MarketplaceStockService } from '../stock/marketplace-stock.service'

// Re-export types from adapter
export {
  PaginationOptions,
  ProductFilters,
  ProductListResponse,
  ProductSortOptions,
} from '../adapters/marketplace-product.adapter'

// Les interfaces sont maintenant exportées depuis l'adapter

export interface CreateMarketplaceProductDto {
  designation: string // Article.designation
  description?: string
  reference: string // Article.reference (SKU)
  famille?: string // Article.famille (category)
  sousFamille?: string // Article.sousFamille (subcategory)
  marque?: string // Article.marque (brand)
  prixVenteHT: number // Article.prixVenteHT
  stockPhysique?: number // Article.stockPhysique
  stockMini?: number // Article.stockMini
  poids?: number // Article.poids
  longueur?: number // Article.longueur
  largeur?: number // Article.largeur
  hauteur?: number // Article.hauteur
  caracteristiquesTechniques?: Record<string, unknown> // Article.caracteristiquesTechniques
  marketplaceSettings?: {
    basePrice?: number
    categories?: string[]
    description?: string
    images?: string[]
    seoTitle?: string
    seoDescription?: string
    tags?: string[]
  }
}

export interface UpdateMarketplaceProductDto extends Partial<CreateMarketplaceProductDto> {
  id: string
}

export interface BulkUpdateDto {
  productIds: string[]
  updates: {
    famille?: string // category
    sousFamille?: string // subcategory
    marque?: string // brand
    isMarketplaceEnabled?: boolean
    marketplaceSettings?: Partial<Article['marketplaceSettings']>
    priceAdjustment?: {
      type: 'percentage' | 'fixed'
      value: number
    }
  }
}

@Injectable()
export class ProductCatalogService {
  private readonly logger = new Logger(ProductCatalogService.name)
  private readonly CACHE_TTL = 600 // 10 minutes

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly adapter: MarketplaceProductAdapter,
    private readonly stockService: MarketplaceStockService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis
  ) {}

  /**
   * Get products with filtering, sorting and pagination
   */
  async getProducts(
    tenantId: string,
    filters: ProductFilters = {},
    sort: ProductSortOptions = { field: 'createdAt', direction: 'DESC' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<ProductListResponse> {
    try {
      return await this.adapter.getMarketplaceProducts(tenantId, filters, sort, pagination)
    } catch (error) {
      this.logger.error(`Failed to get products for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(tenantId: string, productId: string): Promise<MarketplaceProductView> {
    const product = await this.adapter.getMarketplaceProductById(tenantId, productId)

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`)
    }

    return product
  }

  /**
   * Create new marketplace product (Article ERP)
   */
  async createProduct(
    tenantId: string,
    productData: CreateMarketplaceProductDto
  ): Promise<MarketplaceProductView> {
    try {
      // Check if reference (SKU) already exists
      const existingArticle = await this.articleRepository.findOne({
        where: { reference: productData.reference },
      })

      if (existingArticle) {
        throw new BadRequestException(
          `Article with reference ${productData.reference} already exists`
        )
      }

      // Create Article ERP with marketplace settings
      const articleData: Partial<Article> = {
        ...productData,
        type: ArticleType.PRODUIT_FINI,
        status: ArticleStatus.ACTIF,
        uniteStock: UniteStock.PIECE,
        gereEnStock: true,
        isMarketplaceEnabled: true,
        stockPhysique: productData.stockPhysique || 0,
        stockDisponible: productData.stockPhysique || 0,
      }
      const article = this.articleRepository.create(articleData)

      const savedArticle = await this.articleRepository.save(article)

      // Clear cache
      await this.clearProductCache(tenantId)

      // Convert to marketplace view
      const marketplaceProduct = await this.adapter.getMarketplaceProductById(
        tenantId,
        savedArticle.id
      )

      // Emit product created event
      this.eventEmitter.emit('marketplace.product.created', {
        productId: savedArticle.id,
        tenantId,
        sku: savedArticle.reference,
      })

      this.logger.log(
        `Marketplace product created: ${savedArticle.designation} (${savedArticle.reference})`
      )

      return marketplaceProduct!
    } catch (error) {
      this.logger.error('Failed to create marketplace product:', error)
      throw error
    }
  }

  /**
   * Update existing marketplace product
   */
  async updateProduct(
    tenantId: string,
    updateData: UpdateMarketplaceProductDto
  ): Promise<MarketplaceProductView> {
    try {
      // Get existing article
      const article = await this.articleRepository.findOne({
        where: { id: updateData.id },
      })

      if (!article) {
        throw new NotFoundException(`Article ${updateData.id} not found`)
      }

      // If reference (SKU) is being updated, check for conflicts
      if (updateData.reference && updateData.reference !== article.reference) {
        const existingArticle = await this.articleRepository.findOne({
          where: { reference: updateData.reference },
        })

        if (existingArticle && existingArticle.id !== article.id) {
          throw new BadRequestException(
            `Article with reference ${updateData.reference} already exists`
          )
        }
      }

      // Update article
      Object.assign(article, updateData)
      article.updatedAt = new Date()

      // Recalculate available stock if physical stock changed
      if (updateData.stockPhysique !== undefined) {
        article.stockDisponible = article.calculerStockDisponible()
      }

      const updatedArticle = await this.articleRepository.save(article)

      // Clear cache
      await this.clearProductCache(tenantId)

      // Convert to marketplace view
      const marketplaceProduct = await this.adapter.getMarketplaceProductById(
        tenantId,
        updatedArticle.id
      )

      // Emit product updated event
      this.eventEmitter.emit('marketplace.product.updated', {
        productId: updatedArticle.id,
        tenantId,
        changes: updateData,
      })

      this.logger.log(
        `Marketplace product updated: ${updatedArticle.designation} (${updatedArticle.reference})`
      )

      return marketplaceProduct!
    } catch (error) {
      this.logger.error(`Failed to update marketplace product ${updateData.id}:`, error)
      throw error
    }
  }

  /**
   * Bulk update marketplace products
   */
  async bulkUpdateProducts(
    tenantId: string,
    bulkUpdate: BulkUpdateDto
  ): Promise<{ updated: number }> {
    try {
      const articles = await this.articleRepository.find({
        where: {
          id: In(bulkUpdate.productIds),
        },
      })

      if (articles.length === 0) {
        throw new NotFoundException('No articles found for bulk update')
      }

      for (const article of articles) {
        // Apply basic field updates
        if (bulkUpdate.updates.famille) article.famille = bulkUpdate.updates.famille
        if (bulkUpdate.updates.sousFamille) article.sousFamille = bulkUpdate.updates.sousFamille
        if (bulkUpdate.updates.marque) article.marque = bulkUpdate.updates.marque
        if (bulkUpdate.updates.isMarketplaceEnabled !== undefined) {
          article.isMarketplaceEnabled = bulkUpdate.updates.isMarketplaceEnabled
        }
        if (bulkUpdate.updates.marketplaceSettings) {
          article.marketplaceSettings = {
            ...article.marketplaceSettings,
            ...bulkUpdate.updates.marketplaceSettings,
          }
        }

        // Apply price adjustment
        if (bulkUpdate.updates.priceAdjustment && article.prixVenteHT) {
          const { type, value } = bulkUpdate.updates.priceAdjustment
          if (type === 'percentage') {
            article.prixVenteHT = article.prixVenteHT * (1 + value / 100)
          } else if (type === 'fixed') {
            article.prixVenteHT = Math.max(0, article.prixVenteHT + value)
          }
          // Round to 4 decimal places (ERP standard)
          article.prixVenteHT = Math.round(article.prixVenteHT * 10000) / 10000
        }

        article.updatedAt = new Date()
      }

      await this.articleRepository.save(articles)

      // Clear cache
      await this.clearProductCache(tenantId)

      // Emit bulk update event
      this.eventEmitter.emit('marketplace.products.bulk_updated', {
        productIds: bulkUpdate.productIds,
        tenantId,
        updates: bulkUpdate.updates,
        count: articles.length,
      })

      this.logger.log(`Bulk updated ${articles.length} marketplace products for tenant ${tenantId}`)

      return { updated: articles.length }
    } catch (error) {
      this.logger.error('Failed to bulk update marketplace products:', error)
      throw error
    }
  }

  /**
   * Delete marketplace product (disable marketplace visibility)
   */
  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: productId },
      })

      if (!article) {
        throw new NotFoundException(`Article ${productId} not found`)
      }

      // Disable marketplace visibility (keep ERP article intact)
      article.isMarketplaceEnabled = false
      article.updatedAt = new Date()

      await this.articleRepository.save(article)

      // Clear cache
      await this.clearProductCache(tenantId)

      // Emit product deleted event
      this.eventEmitter.emit('marketplace.product.deleted', {
        productId,
        tenantId,
        sku: article.reference,
      })

      this.logger.log(`Marketplace product disabled: ${article.designation} (${article.reference})`)
    } catch (error) {
      this.logger.error(`Failed to delete marketplace product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Restore marketplace product
   */
  async restoreProduct(tenantId: string, productId: string): Promise<MarketplaceProductView> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: productId },
      })

      if (!article) {
        throw new NotFoundException(`Article ${productId} not found`)
      }

      if (article.isMarketplaceEnabled) {
        throw new BadRequestException('Product is already enabled on marketplace')
      }

      article.isMarketplaceEnabled = true
      article.updatedAt = new Date()

      const restoredArticle = await this.articleRepository.save(article)

      // Clear cache
      await this.clearProductCache(tenantId)

      // Convert to marketplace view
      const marketplaceProduct = await this.adapter.getMarketplaceProductById(
        tenantId,
        restoredArticle.id
      )

      // Emit product restored event
      this.eventEmitter.emit('marketplace.product.restored', {
        productId,
        tenantId,
        sku: article.reference,
      })

      this.logger.log(`Marketplace product restored: ${article.designation} (${article.reference})`)

      return marketplaceProduct!
    } catch (error) {
      this.logger.error(`Failed to restore marketplace product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Get marketplace product categories
   */
  async getCategories(
    tenantId: string
  ): Promise<Array<{ category: string; subcategories: string[]; count: number }>> {
    try {
      const cacheKey = `marketplace_categories:${tenantId}`
      const cached = await this.redisService.get(cacheKey)

      if (cached) {
        return JSON.parse(cached)
      }

      const categories = await this.adapter.getMarketplaceCategories(tenantId)

      // Cache for 10 minutes
      await this.redisService.setex(cacheKey, this.CACHE_TTL, JSON.stringify(categories))

      return categories
    } catch (error) {
      this.logger.error(`Failed to get marketplace categories for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Get marketplace product brands
   */
  async getBrands(tenantId: string): Promise<Array<{ brand: string; count: number }>> {
    try {
      return await this.adapter.getMarketplaceBrands(tenantId)
    } catch (error) {
      this.logger.error(`Failed to get marketplace brands for tenant ${tenantId}:`, error)
      return []
    }
  }

  /**
   * Update product stock
   */
  async updateProductStock(
    tenantId: string,
    productId: string,
    quantity: number,
    reason?: string
  ): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: { id: productId },
    })

    if (!article) {
      throw new NotFoundException(`Article ${productId} not found`)
    }

    await this.stockService.updateStock(productId, quantity, reason)

    // Clear cache
    await this.clearProductCache(tenantId)
  }

  // Les filtres sont maintenant gérés dans l'adapter

  /**
   * Clear marketplace product cache
   */
  private async clearProductCache(tenantId: string): Promise<void> {
    try {
      const patterns = [
        `marketplace_articles:${tenantId}:*`,
        `marketplace_categories:${tenantId}`,
        `dashboard:*:${tenantId}:*`,
      ]

      for (const pattern of patterns) {
        const keys = await this.redisService.keys(pattern)
        if (keys.length > 0) {
          await this.redisService.del(...keys)
        }
      }
    } catch (error) {
      this.logger.error('Failed to clear marketplace product cache:', error)
    }
  }
}
