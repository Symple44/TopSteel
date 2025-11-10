import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { BusinessContext } from '../../core/interfaces/business-service.interface'
import { Article, ArticleStatus, ArticleType } from '../entities/article.entity'

export interface ArticleSearchCriteria {
  page?: number
  limit?: number
  search?: string
  designation?: string
  reference?: string
  type?: ArticleType
  status?: ArticleStatus
  famille?: string
  marque?: string
  stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  fournisseurId?: string
  gereEnStock?: boolean
  tenantId?: string
}

export interface ArticleStatistics {
  totalArticles: number
  repartitionParType: Record<ArticleType, number>
  repartitionParStatus: Record<ArticleStatus, number>
  repartitionParFamille: Record<string, number>
  articlesGeresEnStock: number
  valeurTotaleStock: number
  articlesEnRupture: number
  articlesSousStockMini: number
  articlesObsoletes: number
}

export interface StockValorisation {
  nombreArticles: number
  valeurTotale: number
  valeurParFamille: Record<string, number>
  articlesSansStock: number
  articlesEnRupture: number
  articlesSousStockMini: number
}

/**
 * Service pour la gestion des articles
 */
@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article, 'tenant')
    private readonly articleRepository: Repository<Article>
  ) {}

  /**
   * Rechercher des articles avec filtres et pagination
   */
  async searchArticles(criteria: ArticleSearchCriteria): Promise<Article[]> {
    const queryBuilder = this.articleRepository.createQueryBuilder('article')

    // Filtrage par tenant
    if (criteria.tenantId) {
      queryBuilder.andWhere('article.societeId = :societeId', { societeId: criteria.tenantId })
    }

    // Filtrage par recherche textuelle
    if (criteria.search) {
      queryBuilder.andWhere(
        '(article.reference ILIKE :search OR article.designation ILIKE :search OR article.famille ILIKE :search)',
        { search: `%${criteria.search}%` }
      )
    }

    // Filtrage par type
    if (criteria.type) {
      queryBuilder.andWhere('article.type = :type', { type: criteria.type })
    }

    // Filtrage par statut
    if (criteria.status) {
      queryBuilder.andWhere('article.status = :status', { status: criteria.status })
    }

    // Filtrage par famille
    if (criteria.famille) {
      queryBuilder.andWhere('article.famille ILIKE :famille', { famille: `%${criteria.famille}%` })
    }

    // Filtrage par marque
    if (criteria.marque) {
      queryBuilder.andWhere('article.marque ILIKE :marque', { marque: `%${criteria.marque}%` })
    }

    // Filtrage par condition de stock
    if (criteria.stockCondition) {
      switch (criteria.stockCondition) {
        case 'rupture':
          queryBuilder.andWhere('article.gereEnStock = true AND article.stockPhysique = 0')
          break
        case 'sous_mini':
          queryBuilder.andWhere(
            'article.gereEnStock = true AND article.stockPhysique > 0 AND article.stockPhysique <= article.stockMini'
          )
          break
        case 'normal':
          queryBuilder.andWhere(
            'article.gereEnStock = true AND (article.stockMini IS NULL OR article.stockPhysique > article.stockMini)'
          )
          break
        case 'surstock':
          queryBuilder.andWhere(
            'article.gereEnStock = true AND article.stockMaxi IS NOT NULL AND article.stockPhysique > article.stockMaxi'
          )
          break
      }
    }

    // Tri
    const sortBy = criteria.sortBy || 'reference'
    const sortOrder = criteria.sortOrder === 'DESC' ? 'DESC' : 'ASC'
    queryBuilder.orderBy(`article.${sortBy}`, sortOrder)

    // Pagination
    const page = criteria.page || 1
    const limit = criteria.limit || 25
    const offset = (page - 1) * limit

    queryBuilder.skip(offset).take(limit)

    return await queryBuilder.getMany()
  }

  /**
   * Obtenir les statistiques des articles
   */
  async getStatistiques(_context: BusinessContext): Promise<ArticleStatistics> {
    // Version simplifiée pour test initial
    return {
      totalArticles: 0,
      articlesGeresEnStock: 0,
      articlesEnRupture: 0,
      articlesSousStockMini: 0,
      articlesObsoletes: 0,
      valeurTotaleStock: 0,
      repartitionParType: {
        [ArticleType.MATIERE_PREMIERE]: 0,
        [ArticleType.PRODUIT_FINI]: 0,
        [ArticleType.PRODUIT_SEMI_FINI]: 0,
        [ArticleType.FOURNITURE]: 0,
        [ArticleType.CONSOMMABLE]: 0,
        [ArticleType.SERVICE]: 0,
      },
      repartitionParStatus: {
        [ArticleStatus.ACTIF]: 0,
        [ArticleStatus.INACTIF]: 0,
        [ArticleStatus.OBSOLETE]: 0,
        [ArticleStatus.EN_COURS_CREATION]: 0,
        [ArticleStatus.EN_ATTENTE]: 0,
      },
      repartitionParFamille: {},
    }
  }

  /**
   * Calculer la valorisation du stock
   */
  async calculerValorisationStock(
    _famille?: string,
    _context?: BusinessContext
  ): Promise<StockValorisation> {
    // Version simplifiée pour test initial
    return {
      nombreArticles: 0,
      valeurTotale: 0,
      valeurParFamille: {},
      articlesSansStock: 0,
      articlesEnRupture: 0,
      articlesSousStockMini: 0,
    }
  }

  /**
   * Obtenir les articles en rupture
   */
  async getArticlesEnRupture(context: BusinessContext): Promise<Article[]> {
    return await this.articleRepository
      .createQueryBuilder('article')
      .where('article.societeId = :societeId', { societeId: context.tenantId })
      .andWhere('article.gereEnStock = true')
      .andWhere('article.stockPhysique = 0')
      .orderBy('article.reference', 'ASC')
      .getMany()
  }

  /**
   * Obtenir les articles sous stock minimum
   */
  async getArticlesSousStockMini(context: BusinessContext): Promise<Article[]> {
    return await this.articleRepository
      .createQueryBuilder('article')
      .where('article.societeId = :societeId', { societeId: context.tenantId })
      .andWhere('article.gereEnStock = true')
      .andWhere('article.stockPhysique > 0')
      .andWhere('article.stockMini IS NOT NULL')
      .andWhere('article.stockPhysique <= article.stockMini')
      .orderBy('article.reference', 'ASC')
      .getMany()
  }

  /**
   * Obtenir les articles à réapprovisionner
   */
  async getArticlesAReapprovisionner(context: BusinessContext): Promise<Article[]> {
    return await this.articleRepository
      .createQueryBuilder('article')
      .where('article.societeId = :societeId', { societeId: context.tenantId })
      .andWhere('article.gereEnStock = true')
      .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
      .andWhere(
        '(article.stockPhysique = 0 OR (article.stockMini IS NOT NULL AND article.stockPhysique <= article.stockMini))'
      )
      .getMany()
  }

  /**
   * Obtenir un article par ID
   */
  async findById(id: string, context: BusinessContext): Promise<Article | null> {
    return await this.articleRepository.findOne({
      where: {
        id,
        societeId: context.tenantId,
      },
    })
  }

  /**
   * Créer un nouvel article
   */
  async create(data: Partial<Article>, context: BusinessContext): Promise<Article> {
    const article = this.articleRepository.create({
      ...data,
      societeId: context.tenantId,
      createdById: context.userId,
      updatedById: context.userId,
      dateCreationFiche: new Date(),
      dateDerniereModification: new Date(),
    })

    return await this.articleRepository.save(article)
  }

  /**
   * Mettre à jour un article
   */
  async update(id: string, data: Partial<Article>, context: BusinessContext): Promise<Article> {
    const article = await this.findById(id, context)
    if (!article) {
      throw new Error(`Article avec l'ID ${id} introuvable`)
    }

    // Mettre à jour les champs
    Object.assign(article, {
      ...data,
      updatedById: context.userId,
      dateDerniereModification: new Date(),
    })

    return await this.articleRepository.save(article)
  }

  /**
   * Supprimer un article
   */
  async delete(id: string, context: BusinessContext): Promise<void> {
    const article = await this.findById(id, context)
    if (!article) {
      throw new Error(`Article avec l'ID ${id} introuvable`)
    }

    await this.articleRepository.remove(article)
  }

  /**
   * Effectuer un inventaire
   */
  async effectuerInventaire(
    id: string,
    stockPhysiqueReel: number,
    _commentaire?: string,
    context?: BusinessContext
  ): Promise<Article> {
    if (!context) {
      throw new Error('Context is required for effectuerInventaire')
    }

    const article = await this.findById(id, context)
    if (!article) {
      throw new Error('Article non trouvé')
    }

    // Mettre à jour le stock
    article.stockPhysique = stockPhysiqueReel
    article.stockDisponible = Math.max(0, stockPhysiqueReel - (article.stockReserve || 0))
    article.dateDernierInventaire = new Date()
    article.updatedById = context.userId

    return await this.articleRepository.save(article)
  }

  /**
   * Dupliquer un article
   */
  async dupliquerArticle(
    id: string,
    nouvelleReference: string,
    modifications?: Partial<Article>,
    context?: BusinessContext
  ): Promise<Article> {
    if (!context) {
      throw new Error('Context is required for dupliquerArticle')
    }

    const sourceArticle = await this.findById(id, context)
    if (!sourceArticle) {
      throw new Error('Article original non trouvé')
    }

    // Créer le nouvel article
    const newArticleData = {
      ...sourceArticle,
      id: undefined, // Laisse TypeORM générer un nouvel ID
      reference: nouvelleReference,
      stockPhysique: 0, // Reset stock pour le nouvel article
      stockReserve: 0,
      stockDisponible: 0,
      dateDernierInventaire: undefined,
      dateDernierMouvement: undefined,
      dateCreationFiche: new Date(),
      dateDerniereModification: new Date(),
      createdById: context.userId,
      updatedById: context.userId,
      createdAt: undefined, // TypeORM va générer automatiquement
      updatedAt: undefined,
      ...modifications,
    }

    const newArticle = this.articleRepository.create(newArticleData)

    return await this.articleRepository.save(newArticle)
  }

  /**
   * Créer une commande de réapprovisionnement
   */
  async creerCommandeReapprovisionnement(
    fournisseurId: string,
    context: BusinessContext
  ): Promise<{ articles: Article[]; quantitesTotales: number }> {
    const articles = await this.getArticlesAReapprovisionner(context)
    const articlesFiltered = articles.filter((a) => a.fournisseurPrincipalId === fournisseurId)

    return {
      articles: articlesFiltered,
      quantitesTotales: articlesFiltered.length,
    }
  }
}
