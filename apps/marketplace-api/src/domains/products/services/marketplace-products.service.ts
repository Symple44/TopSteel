import { PriceRuleChannel } from '@erp/entities'
import type { HttpService } from '@nestjs/axios'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Cache } from 'cache-manager'
import { firstValueFrom } from 'rxjs'
import { type DataSource, In, type Repository } from 'typeorm'
import { Article, ArticleStatus } from '../../../shared/entities/erp/article.entity'
import type { PostgreSQLError } from '../../../shared/types/common.types'
import { MarketplaceProduct } from '../entities/marketplace-product.entity'

export interface ProductFilters {
  search?: string
  categories?: string[]
  tags?: string[]
  priceRange?: { min: number; max: number }
  inStock?: boolean
  featured?: boolean
  limit?: number
  offset?: number
  sortBy?: 'name' | 'price' | 'date' | 'popularity'
  sortOrder?: 'ASC' | 'DESC'
}

export interface ProductListResult {
  products: MarketplaceProductView[]
  total: number
  hasMore: boolean
}

export interface MarketplaceProductView {
  id: string
  erpArticleId: string
  reference: string
  designation: string
  description?: string
  shortDescription?: string
  images: Array<{ url: string; alt?: string; isMain: boolean }>
  basePrice: number
  calculatedPrice?: number
  stockDisponible?: number
  inStock: boolean
  categories: string[]
  tags: string[]
  isActive: boolean
  isFeatured: boolean
  seo: {
    title?: string
    description?: string
    slug: string
  }
}

@Injectable()
export class MarketplaceProductsService {
  constructor(
    @InjectRepository(MarketplaceProduct, 'marketplace')
    private marketplaceProductRepo: Repository<MarketplaceProduct>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,

    private readonly httpService: HttpService
  ) {}

  async getProducts(
    erpConnection: DataSource | null,
    societeId: string,
    filters: ProductFilters = {},
    customerId?: string
  ): Promise<ProductListResult> {
    // Si pas de connexion ERP, retourner des données de démonstration
    if (!erpConnection) {
      const demoProducts = this.getDemoFeaturedProducts(filters.limit || 20)
      return {
        products: demoProducts,
        total: demoProducts.length,
        hasMore: false,
      }
    }
    const cacheKey = `products:${societeId}:${JSON.stringify(filters)}:${customerId || 'guest'}`

    // Vérifier cache
    const cached = await this.cacheManager.get<ProductListResult>(cacheKey)
    if (cached) return cached

    try {
      // Construire requête articles ERP
      const articlesRepo = erpConnection.getRepository(Article)

      const articlesQuery = articlesRepo
        .createQueryBuilder('article')
        .where('article.societeId = :societeId', { societeId })
        .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
        .andWhere('article.isMarketplaceEnabled = true')

      // Appliquer filtres
      if (filters.search) {
        articlesQuery.andWhere(
          '(article.designation ILIKE :search OR article.reference ILIKE :search OR article.description ILIKE :search)',
          { search: `%${filters.search}%` }
        )
      }

      if (filters.categories?.length) {
        articlesQuery.andWhere('article.famille IN (:...categories)', {
          categories: filters.categories,
        })
      }

      if (filters.priceRange) {
        articlesQuery.andWhere('article.prixVenteHT BETWEEN :minPrice AND :maxPrice', {
          minPrice: filters.priceRange.min,
          maxPrice: filters.priceRange.max,
        })
      }

      if (filters.inStock) {
        articlesQuery.andWhere('article.stockDisponible > 0')
      }

      const total = await articlesQuery.getCount()

      // Appliquer tri
      switch (filters.sortBy) {
        case 'name':
          articlesQuery.orderBy('article.designation', filters.sortOrder || 'ASC')
          break
        case 'price':
          articlesQuery.orderBy('article.prixVenteHT', filters.sortOrder || 'ASC')
          break
        case 'date':
          articlesQuery.orderBy('article.updatedAt', filters.sortOrder || 'DESC')
          break
        default:
          articlesQuery.orderBy('article.designation', 'ASC')
      }

      // Pagination
      const limit = Math.min(filters.limit || 20, 100)
      const offset = filters.offset || 0

      articlesQuery.limit(limit).offset(offset)
      const articles = await articlesQuery.getMany()

      // Enrichir avec données marketplace
      const products = await Promise.all(
        articles.map((article) => this.enrichArticleWithMarketplaceData(article, customerId))
      )

      // Filtrer par featured si demandé
      const filteredProducts = filters.featured ? products.filter((p) => p.isFeatured) : products

      const result = {
        products: filteredProducts,
        total,
        hasMore: offset + limit < total,
      }

      // Mettre en cache
      await this.cacheManager.set(cacheKey, result, 300) // 5 minutes

      return result
    } catch (_error: unknown) {
      // Si les tables n'existent pas ou toute autre erreur, retourner des données de démo
      const demoProducts = this.getDemoFeaturedProducts(filters.limit || 20)
      return {
        products: demoProducts,
        total: demoProducts.length,
        hasMore: false,
      }
    }
  }

  async getProductById(
    erpConnection: DataSource,
    societeId: string,
    productId: string,
    customerId?: string
  ): Promise<MarketplaceProductView> {
    const cacheKey = `product:${productId}:${customerId || 'guest'}`

    const cached = await this.cacheManager.get<MarketplaceProductView>(cacheKey)
    if (cached) return cached

    // Récupérer article ERP
    const articlesRepo = erpConnection.getRepository(Article)
    const article = await articlesRepo.findOne({
      where: {
        id: productId,
        societeId,
        status: ArticleStatus.ACTIF,
        isMarketplaceEnabled: true,
      },
    })

    if (!article) {
      throw new NotFoundException('Produit non trouvé')
    }

    const product = await this.enrichArticleWithMarketplaceData(article, customerId)

    // Incrémenter vues
    await this.incrementProductViews(productId, societeId)

    // Mettre en cache
    await this.cacheManager.set(cacheKey, product, 600) // 10 minutes

    return product
  }

  async getFeaturedProducts(
    erpConnection: DataSource | null,
    societeId: string,
    limit = 8,
    customerId?: string
  ): Promise<MarketplaceProductView[]> {
    try {
      // Si pas de connexion ERP, retourner des données de démonstration
      if (!erpConnection) {
        return this.getDemoFeaturedProducts(limit)
      }

      // Essayer de récupérer les produits marketplace, mais s'attendre à ce que ça puisse échouer
      const marketplaceProducts = await this.marketplaceProductRepo.find({
        where: {
          societeId,
          isActive: true,
          isVisible: true,
          isFeatured: true,
        },
        order: { sortOrder: 'ASC', updatedAt: 'DESC' },
        take: limit,
      })

      if (marketplaceProducts.length === 0) {
        return this.getDemoFeaturedProducts(limit)
      }

      const articleIds = marketplaceProducts.map((p) => p.erpArticleId)
      const articlesRepo = erpConnection.getRepository(Article)

      const articles = await articlesRepo.find({
        where: {
          id: In(articleIds),
          status: ArticleStatus.ACTIF,
          isMarketplaceEnabled: true,
        },
      })

      return Promise.all(
        articles.map((article) => this.enrichArticleWithMarketplaceData(article, customerId))
      )
    } catch (error: unknown) {
      // Si les tables n'existent pas ou toute autre erreur, retourner des données de démo
      if (
        (error instanceof Error && error.message?.includes("n'existe pas")) ||
        (error as PostgreSQLError)?.code === '42P01'
      ) {
      }
      return this.getDemoFeaturedProducts(limit)
    }
  }

  async getProductsByCategory(
    erpConnection: DataSource,
    societeId: string,
    category: string,
    limit = 20,
    offset = 0,
    customerId?: string
  ): Promise<ProductListResult> {
    return this.getProducts(
      erpConnection,
      societeId,
      {
        categories: [category],
        limit,
        offset,
      },
      customerId
    )
  }

  async searchProducts(
    erpConnection: DataSource,
    societeId: string,
    query: string,
    limit = 20,
    offset = 0,
    customerId?: string
  ): Promise<ProductListResult> {
    return this.getProducts(
      erpConnection,
      societeId,
      {
        search: query,
        limit,
        offset,
        sortBy: 'name',
      },
      customerId
    )
  }

  private async enrichArticleWithMarketplaceData(
    article: Article,
    customerId?: string
  ): Promise<MarketplaceProductView> {
    // Récupérer données marketplace si elles existent
    const marketplaceProduct = await this.marketplaceProductRepo.findOne({
      where: { erpArticleId: article.id },
    })

    // Calculer prix via l'API centralisée
    let calculatedPrice = article.prixVenteHT || 0
    try {
      const priceResponse = await firstValueFrom(
        this.httpService.post(
          `${process.env.API_URL || 'http://localhost:3002'}/pricing/calculate`,
          {
            articleId: article.id,
            article: {
              id: article.id,
              reference: article.reference,
              designation: article.designation,
              famille: article.famille,
              prixVenteHT: article.prixVenteHT,
              poids: article.poids,
              longueur: article.longueur,
              largeur: article.largeur,
              hauteur: article.hauteur,
              uniteStock: article.uniteStock,
              uniteVente: article.uniteVente,
            },
            customerId,
            channel: PriceRuleChannel.MARKETPLACE,
            quantity: 1,
          }
        )
      )
      calculatedPrice = priceResponse.data.finalPrice
    } catch (_error: unknown) {
      // Fallback sur le prix de base si l'API échoue
      calculatedPrice = article.prixVenteHT || 0
    }

    return {
      id: article.id,
      erpArticleId: article.id,
      reference: article.reference,
      designation: article.designation,
      description: article.marketplaceSettings?.description || article.description,
      shortDescription: article.marketplaceSettings?.description?.substring(0, 150),
      images: this.formatImages(article.marketplaceSettings?.images || []),
      basePrice: article.prixVenteHT || 0,
      calculatedPrice,
      stockDisponible: article.stockDisponible,
      inStock: !article.estEnRupture(),
      categories:
        article.marketplaceSettings?.categories || (article.famille ? [article.famille] : []),
      tags: article.marketplaceSettings?.tags || [],
      isActive: marketplaceProduct?.isActive ?? true,
      isFeatured: marketplaceProduct?.isFeatured ?? false,
      seo: {
        title: article.marketplaceSettings?.seoTitle || article.designation,
        description:
          article.marketplaceSettings?.seoDescription || article.description?.substring(0, 160),
        slug: this.generateSlug(article.reference, article.designation),
      },
    }
  }

  private formatImages(imageUrls: string[]): Array<{ url: string; alt?: string; isMain: boolean }> {
    return imageUrls.map((url, index) => ({
      url,
      alt: `Product image ${index + 1}`,
      isMain: index === 0,
    }))
  }

  private generateSlug(reference: string, designation: string): string {
    return `${reference}-${designation}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private async incrementProductViews(productId: string, societeId: string): Promise<void> {
    const marketplaceProduct = await this.marketplaceProductRepo.findOne({
      where: { erpArticleId: productId, societeId },
    })

    if (marketplaceProduct) {
      marketplaceProduct.incrementViews()
      await this.marketplaceProductRepo.save(marketplaceProduct)
    }
  }

  async invalidateProductCache(productId: string): Promise<void> {
    // Pattern would be used for advanced cache invalidation: `product:${productId}:*`
    // Implementation dépend du cache manager utilisé
    // await this.cacheManager.reset() // Method 'reset' not available in cache-manager v7
    // Instead, we would need to implement pattern-based deletion
    // For now, we'll just clear specific keys
    const keys = [`product:${productId}`, `product:${productId}:detail`]
    for (const key of keys) {
      await this.cacheManager.del(key)
    }
  }

  async getCategories(erpConnection: DataSource | null, societeId: string): Promise<string[]> {
    // Si pas de connexion ERP, retourner des catégories de démonstration
    if (!erpConnection) {
      return ['Poutrelles', 'Tôles', 'Tubes', 'Barres', 'Cornières', 'Profilés']
    }

    const cacheKey = `categories:${societeId}`

    const cached = await this.cacheManager.get<string[]>(cacheKey)
    if (cached) return cached

    try {
      const articlesRepo = erpConnection.getRepository(Article)
      const result = await articlesRepo
        .createQueryBuilder('article')
        .select('DISTINCT article.famille', 'famille')
        .where('article.societeId = :societeId', { societeId })
        .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
        .andWhere('article.isMarketplaceEnabled = true')
        .andWhere('article.famille IS NOT NULL')
        .orderBy('article.famille', 'ASC')
        .getRawMany()

      const categories = result.map((r) => r.famille).filter(Boolean)

      await this.cacheManager.set(cacheKey, categories, 3600) // 1 heure

      return categories
    } catch (error: unknown) {
      // Si les tables ERP n'existent pas, retourner des données de démo
      if (
        (error instanceof Error && error.message?.includes("n'existe pas")) ||
        (error as PostgreSQLError)?.code === '42P01'
      ) {
        return ['Poutrelles', 'Tôles', 'Tubes', 'Barres', 'Cornières', 'Profilés']
      }
      throw error
    }
  }

  // Méthodes de démonstration pour les tests sans connexion ERP
  private getDemoFeaturedProducts(limit = 8): MarketplaceProductView[] {
    const demoProducts: MarketplaceProductView[] = [
      {
        id: 'demo-1',
        erpArticleId: 'ART001',
        reference: 'IPN200',
        designation: 'Poutre IPN 200',
        description: 'Poutre IPN acier galvanisé de 200mm',
        shortDescription: 'Poutre IPN acier galvanisé de 200mm',
        basePrice: 45.99,
        calculatedPrice: 45.99,
        stockDisponible: 150,
        images: [{ url: '/api/images/demo/ipn-200.jpg', alt: 'Poutre IPN 200', isMain: true }],
        categories: ['Poutrelles'],
        tags: ['acier', 'galvanisé', 'construction'],
        inStock: true,
        isActive: true,
        isFeatured: true,
        seo: {
          title: 'Poutre IPN 200',
          description: 'Poutre IPN acier galvanisé de 200mm',
          slug: 'ipn200-poutre-ipn-200',
        },
      },
      {
        id: 'demo-2',
        erpArticleId: 'ART002',
        reference: 'PLA10MM',
        designation: 'Plaque Acier 10mm',
        description: "Plaque d'acier épaisseur 10mm, dimensions 2x1m",
        shortDescription: "Plaque d'acier épaisseur 10mm, dimensions 2x1m",
        basePrice: 89.5,
        calculatedPrice: 89.5,
        stockDisponible: 75,
        images: [
          { url: '/api/images/demo/plaque-acier.jpg', alt: 'Plaque Acier 10mm', isMain: true },
        ],
        categories: ['Tôles'],
        tags: ['acier', 'plaque', 'découpe'],
        inStock: true,
        isActive: true,
        isFeatured: true,
        seo: {
          title: 'Plaque Acier 10mm',
          description: "Plaque d'acier épaisseur 10mm, dimensions 2x1m",
          slug: 'pla10mm-plaque-acier-10mm',
        },
      },
      {
        id: 'demo-3',
        erpArticleId: 'ART003',
        reference: 'TUB40x40',
        designation: 'Tube Carré 40x40',
        description: 'Tube carré acier 40x40mm, épaisseur 3mm',
        shortDescription: 'Tube carré acier 40x40mm, épaisseur 3mm',
        basePrice: 12.75,
        calculatedPrice: 12.75,
        stockDisponible: 200,
        images: [{ url: '/api/images/demo/tube-carre.jpg', alt: 'Tube Carré 40x40', isMain: true }],
        categories: ['Tubes'],
        tags: ['tube', 'carré', 'structure'],
        inStock: true,
        isActive: true,
        isFeatured: true,
        seo: {
          title: 'Tube Carré 40x40',
          description: 'Tube carré acier 40x40mm, épaisseur 3mm',
          slug: 'tub40x40-tube-carre-40x40',
        },
      },
    ]

    return demoProducts.slice(0, limit)
  }
}
