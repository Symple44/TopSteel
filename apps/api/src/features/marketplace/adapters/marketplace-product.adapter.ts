import { Article, ArticleStatus } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository, SelectQueryBuilder } from 'typeorm'

export interface MarketplaceProductView {
  id: string
  name: string
  description?: string
  shortDescription?: string
  sku: string
  category?: string
  subcategory?: string
  brand?: string
  price: number
  stockQuantity: number
  reservedStock: number
  minStockLevel?: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images?: string[]
  specifications?: Record<string, unknown>
  tags?: string[]
  isMarketplaceEnabled: boolean
  visibility: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductFilters {
  category?: string
  subcategory?: string
  brand?: string
  priceMin?: number
  priceMax?: number
  stockMin?: number
  stockMax?: number
  isMarketplaceEnabled?: boolean
  search?: string
  tags?: string[]
  visibility?: string
}

export interface ProductSortOptions {
  field: 'designation' | 'prixVenteHT' | 'stockDisponible' | 'createdAt' | 'updatedAt'
  direction: 'ASC' | 'DESC'
}

// Champs de tri autorisés pour la sécurité
const ALLOWED_SORT_FIELDS = [
  'designation',
  'prixVenteHT',
  'stockDisponible',
  'createdAt',
  'updatedAt',
] as const
const ALLOWED_SORT_DIRECTIONS = ['ASC', 'DESC'] as const
type AllowedSortField = (typeof ALLOWED_SORT_FIELDS)[number]
type AllowedSortDirection = (typeof ALLOWED_SORT_DIRECTIONS)[number]

export interface PaginationOptions {
  page: number
  limit: number
}

export interface ProductListResponse {
  products: MarketplaceProductView[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Adapter pour transformer les entités Article ERP en vue Marketplace
 * Utilise l'entité Article existante avec ses champs marketplace natifs
 */
@Injectable()
export class MarketplaceProductAdapter {
  private readonly logger = new Logger(MarketplaceProductAdapter.name)

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>
  ) {}

  /**
   * Récupérer les produits marketplace avec filtres et pagination
   */
  async getMarketplaceProducts(
    tenantId: string,
    filters: ProductFilters = {},
    sort: ProductSortOptions = { field: 'createdAt', direction: 'DESC' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<ProductListResponse> {
    try {
      // Validation sécurisée des paramètres de tri
      if (!ALLOWED_SORT_FIELDS.includes(sort.field as AllowedSortField)) {
        throw new Error(`Invalid sort field: ${sort.field}`)
      }
      if (!ALLOWED_SORT_DIRECTIONS.includes(sort.direction as AllowedSortDirection)) {
        throw new Error(`Invalid sort direction: ${sort.direction}`)
      }

      // Validation de la pagination (limites de sécurité)
      const safePagination = {
        page: Math.max(1, Math.min(pagination.page, 1000)), // Max 1000 pages
        limit: Math.max(1, Math.min(pagination.limit, 100)), // Max 100 items par page
      }

      const queryBuilder = this.articleRepository
        .createQueryBuilder('article')
        // Multi-tenant handled at connection level
        .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
        .andWhere('article.isMarketplaceEnabled = true')

      // Appliquer les filtres sécurisés
      this.applySecureFilters(queryBuilder, filters)

      // Obtenir le total
      const total = await queryBuilder.getCount()

      // Appliquer le tri sécurisé (sans interpolation de chaîne)
      queryBuilder.orderBy(`article.${sort.field}`, sort.direction as 'ASC' | 'DESC')

      // Appliquer la pagination sécurisée
      const offset = (safePagination.page - 1) * safePagination.limit
      queryBuilder.skip(offset).take(safePagination.limit)

      const articles = await queryBuilder.getMany()
      const products = articles.map((article) => this.articleToMarketplaceView(article, tenantId))

      return {
        products,
        total,
        page: safePagination.page,
        limit: safePagination.limit,
        totalPages: Math.ceil(total / safePagination.limit),
      }
    } catch (error) {
      this.logger.error(`Failed to get marketplace products for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Récupérer un produit marketplace par ID
   */
  async getMarketplaceProductById(
    tenantId: string,
    productId: string
  ): Promise<MarketplaceProductView | null> {
    const article = await this.articleRepository.findOne({
      where: {
        id: productId,
        status: ArticleStatus.ACTIF,
        isMarketplaceEnabled: true,
      },
    })

    return article ? this.articleToMarketplaceView(article, tenantId) : null
  }

  /**
   * Récupérer un produit marketplace par SKU (référence)
   */
  async getMarketplaceProductBySku(
    tenantId: string,
    sku: string
  ): Promise<MarketplaceProductView | null> {
    const article = await this.articleRepository.findOne({
      where: {
        reference: sku,
        status: ArticleStatus.ACTIF,
        isMarketplaceEnabled: true,
      },
    })

    return article ? this.articleToMarketplaceView(article, tenantId) : null
  }

  /**
   * Activer/désactiver un produit sur le marketplace
   */
  async toggleMarketplaceEnabled(
    _tenantId: string,
    productId: string,
    enabled: boolean
  ): Promise<void> {
    await this.articleRepository.update({ id: productId }, { isMarketplaceEnabled: enabled })
  }

  /**
   * Mettre à jour les paramètres marketplace d'un produit
   */
  async updateMarketplaceSettings(
    _tenantId: string,
    productId: string,
    settings: Partial<Article['marketplaceSettings']>
  ): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: { id: productId },
    })

    if (!article) {
      throw new Error(`Article ${productId} not found`)
    }

    article.marketplaceSettings = {
      ...article.marketplaceSettings,
      ...settings,
    }

    await this.articleRepository.save(article)
  }

  /**
   * Obtenir les catégories des produits marketplace
   */
  async getMarketplaceCategories(
    tenantId: string
  ): Promise<Array<{ category: string; subcategories: string[]; count: number }>> {
    const results = await this.articleRepository
      .createQueryBuilder('article')
      .select(['article.famille', 'article.sousFamille'])
      .addSelect('COUNT(*)', 'count')
      .where('article.tenantId = :tenantId', { tenantId })
      .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
      .andWhere('article.isMarketplaceEnabled = :isEnabled', { isEnabled: true })
      .andWhere('article.famille IS NOT NULL')
      .groupBy('article.famille, article.sousFamille')
      .getRawMany()

    // Grouper par famille (catégorie)
    const categoryMap = new Map<string, { subcategories: Set<string>; count: number }>()

    for (const result of results) {
      const category = result.article_famille
      const subcategory = result.article_sous_famille
      const count = parseInt(result.count, 10)

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { subcategories: new Set(), count: 0 })
      }

      const categoryData = categoryMap.get(category)!
      if (subcategory) {
        categoryData.subcategories.add(subcategory)
      }
      categoryData.count += count
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      subcategories: Array.from(data.subcategories).sort(),
      count: data.count,
    }))
  }

  /**
   * Obtenir les marques des produits marketplace
   */
  async getMarketplaceBrands(tenantId: string): Promise<Array<{ brand: string; count: number }>> {
    const results = await this.articleRepository
      .createQueryBuilder('article')
      .select(['article.marque', 'COUNT(*) as count'])
      .where('article.tenantId = :tenantId', { tenantId })
      .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
      .andWhere('article.isMarketplaceEnabled = :isEnabled', { isEnabled: true })
      .andWhere('article.marque IS NOT NULL')
      .groupBy('article.marque')
      .orderBy('count', 'DESC')
      .getRawMany()

    return results.map((result) => ({
      brand: result.article_marque,
      count: parseInt(result.count, 10),
    }))
  }

  /**
   * Transformer un Article ERP en vue Marketplace
   */
  private articleToMarketplaceView(article: Article, tenantId?: string): MarketplaceProductView {
    const basePrice = article.marketplaceSettings?.basePrice || article.prixVenteHT || 0
    const images = article.marketplaceSettings?.images || []
    const tags = article.marketplaceSettings?.tags || []
    const seoTitle = article.marketplaceSettings?.seoTitle
    const seoDescription = article.marketplaceSettings?.seoDescription

    return {
      id: article.id,
      name: article.designation,
      description: article.marketplaceSettings?.description || article.description,
      shortDescription: article.description?.substring(0, 500),
      sku: article.reference,
      category: article.famille,
      subcategory: article.sousFamille,
      brand: article.marque,
      price: basePrice,
      stockQuantity: article.stockPhysique || 0,
      reservedStock: article.stockReserve || 0,
      minStockLevel: article.stockMini,
      weight: article.poids,
      dimensions:
        article.longueur && article.largeur && article.hauteur
          ? {
              length: article.longueur,
              width: article.largeur,
              height: article.hauteur,
            }
          : undefined,
      images,
      specifications: article.caracteristiquesTechniques,
      tags,
      isMarketplaceEnabled: article.isMarketplaceEnabled || false,
      visibility: article.isMarketplaceEnabled ? 'PUBLIC' : 'HIDDEN',
      seoTitle,
      seoDescription,
      seoKeywords: tags,
      tenantId: tenantId || '', // From parameter, not article
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }
  }

  /**
   * Appliquer les filtres sécurisés à la requête
   */
  private applySecureFilters(
    queryBuilder: SelectQueryBuilder<Article>,
    filters: ProductFilters
  ): void {
    // Validation et sanitisation des filtres
    if (
      filters.category &&
      typeof filters.category === 'string' &&
      filters.category.length <= 100
    ) {
      queryBuilder.andWhere('article.famille = :category', { category: filters.category })
    }

    if (
      filters.subcategory &&
      typeof filters.subcategory === 'string' &&
      filters.subcategory.length <= 100
    ) {
      queryBuilder.andWhere('article.sousFamille = :subcategory', {
        subcategory: filters.subcategory,
      })
    }

    if (filters.brand && typeof filters.brand === 'string' && filters.brand.length <= 100) {
      queryBuilder.andWhere('article.marque = :brand', { brand: filters.brand })
    }

    // Validation des prix (nombres positifs)
    if (
      filters.priceMin !== undefined &&
      typeof filters.priceMin === 'number' &&
      filters.priceMin >= 0
    ) {
      queryBuilder.andWhere('article.prixVenteHT >= :priceMin', { priceMin: filters.priceMin })
    }

    if (
      filters.priceMax !== undefined &&
      typeof filters.priceMax === 'number' &&
      filters.priceMax >= 0
    ) {
      queryBuilder.andWhere('article.prixVenteHT <= :priceMax', { priceMax: filters.priceMax })
    }

    // Validation des stocks (nombres positifs)
    if (
      filters.stockMin !== undefined &&
      typeof filters.stockMin === 'number' &&
      filters.stockMin >= 0
    ) {
      queryBuilder.andWhere('article.stockDisponible >= :stockMin', { stockMin: filters.stockMin })
    }

    if (
      filters.stockMax !== undefined &&
      typeof filters.stockMax === 'number' &&
      filters.stockMax >= 0
    ) {
      queryBuilder.andWhere('article.stockDisponible <= :stockMax', { stockMax: filters.stockMax })
    }

    // Recherche sécurisée (limitation longueur et caractères)
    if (filters.search && typeof filters.search === 'string' && filters.search.length <= 200) {
      // Échapper les caractères spéciaux pour éviter l'injection
      const sanitizedSearch = filters.search.replace(/[%_\\]/g, '\\$&')
      queryBuilder.andWhere(
        '(article.designation ILIKE :search OR article.description ILIKE :search OR article.reference ILIKE :search)',
        { search: `%${sanitizedSearch}%` }
      )
    }

    // Tags sécurisés (validation du tableau)
    if (
      filters.tags &&
      Array.isArray(filters.tags) &&
      filters.tags.length > 0 &&
      filters.tags.length <= 10
    ) {
      // Valider que tous les tags sont des chaînes courtes
      const validTags = filters.tags.filter(
        (tag) => typeof tag === 'string' && tag.length <= 50 && /^[a-zA-Z0-9\-_]+$/.test(tag)
      )

      if (validTags.length > 0) {
        queryBuilder.andWhere("article.marketplaceSettings->'tags' ?| array[:tags]", {
          tags: validTags,
        })
      }
    }
  }
}
