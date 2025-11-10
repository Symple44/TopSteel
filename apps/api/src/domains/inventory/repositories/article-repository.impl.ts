import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Article, ArticleStatus, ArticleType } from '../entities/article.entity'
import type { ArticleSearchCriteria, ArticleStatistics } from '../services/article.service'
import { ArticleAdvancedFilters, IArticleRepository } from './article.repository'

/**
 * Implémentation concrète du repository Article avec TypeORM
 */
@Injectable()
export class ArticleRepositoryImpl implements IArticleRepository {
  constructor(
    @InjectRepository(Article, 'tenant')
    private readonly repository: Repository<Article>
  ) {}

  async findById(id: string): Promise<Article | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findByReference(reference: string): Promise<Article | null> {
    return await this.repository.findOne({ where: { reference } })
  }

  async findByCodeEAN(codeEAN: string): Promise<Article | null> {
    return await this.repository.findOne({ where: { codeEAN } })
  }

  async findByType(type: ArticleType): Promise<Article[]> {
    return await this.repository.find({ where: { type } })
  }

  async findByStatus(status: ArticleStatus): Promise<Article[]> {
    return await this.repository.find({ where: { status } })
  }

  async findByFamille(famille: string): Promise<Article[]> {
    return await this.repository.find({ where: { famille } })
  }

  async findByFournisseur(fournisseurId: string): Promise<Article[]> {
    return await this.repository.find({ where: { fournisseurPrincipalId: fournisseurId } })
  }

  async findAll(): Promise<Article[]> {
    return await this.repository.find()
  }

  async create(entity: Article): Promise<Article> {
    const savedEntity = await this.repository.save(entity)
    return savedEntity
  }

  async update(id: string, entity: Partial<Article>): Promise<Article> {
    await this.repository.update(id, entity as Record<string, unknown>)
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Article with id ${id} not found after update`)
    }
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } })
    return count > 0
  }

  async count(): Promise<number> {
    return await this.repository.count()
  }

  // Méthodes additionnelles spécifiques au business
  async countByType(type: ArticleType): Promise<number> {
    return await this.repository.count({ where: { type } })
  }

  async searchByCriteria(criteria: ArticleSearchCriteria): Promise<Article[]> {
    const query = this.repository.createQueryBuilder('article')

    if (criteria.type?.length) {
      query.andWhere('article.type IN (:...types)', { types: criteria.type })
    }

    if (criteria.status?.length) {
      query.andWhere('article.status IN (:...statuses)', { statuses: criteria.status })
    }

    if (criteria.famille?.length) {
      query.andWhere('article.famille IN (:...familles)', { familles: criteria.famille })
    }

    if (criteria.designation) {
      query.andWhere('article.designation ILIKE :designation', {
        designation: `%${criteria.designation}%`,
      })
    }

    if (criteria.reference) {
      query.andWhere('article.reference ILIKE :reference', { reference: `%${criteria.reference}%` })
    }

    if (criteria.marque) {
      query.andWhere('article.marque ILIKE :marque', { marque: `%${criteria.marque}%` })
    }

    if (criteria.fournisseurId) {
      query.andWhere('article.fournisseurPrincipalId = :fournisseurId', {
        fournisseurId: criteria.fournisseurId,
      })
    }

    if (criteria.gereEnStock !== undefined) {
      query.andWhere('article.gereEnStock = :gereEnStock', { gereEnStock: criteria.gereEnStock })
    }

    if (criteria.stockCondition) {
      switch (criteria.stockCondition) {
        case 'rupture':
          query.andWhere('article.stockDisponible <= 0')
          break
        case 'sous_mini':
          query.andWhere('article.stockDisponible < article.stockMini')
          break
        case 'normal':
          query.andWhere(
            'article.stockDisponible >= article.stockMini AND article.stockDisponible <= article.stockMaxi'
          )
          break
        case 'surstock':
          query.andWhere('article.stockDisponible > article.stockMaxi')
          break
      }
    }

    // Pagination
    if (criteria.limit) {
      query.limit(criteria.limit)
    }

    if (criteria.page && criteria.limit) {
      query.offset((criteria.page - 1) * criteria.limit)
    }

    // Tri
    if (criteria.sortBy) {
      const order = criteria.sortOrder || 'ASC'
      query.orderBy(`article.${criteria.sortBy}`, order)
    }

    return await query.getMany()
  }

  async findByStockCondition(
    condition: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  ): Promise<Article[]> {
    const query = this.repository.createQueryBuilder('article').where('article.gereEnStock = true')

    switch (condition) {
      case 'rupture':
        query.andWhere('article.stockDisponible <= 0')
        break
      case 'sous_mini':
        query.andWhere('article.stockDisponible < article.stockMini')
        break
      case 'normal':
        query.andWhere('article.stockDisponible >= article.stockMini')
        query.andWhere('article.stockDisponible <= article.stockMaxi')
        break
      case 'surstock':
        query.andWhere('article.stockDisponible > article.stockMaxi')
        break
    }

    return await query.getMany()
  }

  async hasStockMovements(articleId: string): Promise<boolean> {
    // Vérifier s'il existe des mouvements de stock pour cet article
    const count = await this.repository.manager
      .createQueryBuilder('stock_movements', 'movement')
      .where('movement.articleId = :articleId', { articleId })
      .andWhere('movement.statut != :statut', { statut: 'ANNULE' })
      .getCount()

    return count > 0
  }

  async findWithFilters(filters: ArticleAdvancedFilters): Promise<{
    items: Article[]
    total: number
    page: number
    limit: number
  }> {
    const query = this.repository.createQueryBuilder('article')

    // Filtres de stock
    if (filters.stock) {
      if (filters.stock.min !== undefined) {
        query.andWhere('article.stockPhysique >= :stockMin', { stockMin: filters.stock.min })
      }
      if (filters.stock.max !== undefined) {
        query.andWhere('article.stockPhysique <= :stockMax', { stockMax: filters.stock.max })
      }
      if (filters.stock.disponible !== undefined) {
        query.andWhere(
          '(article.stockPhysique - COALESCE(article.stockReserve, 0)) >= :disponible',
          {
            disponible: filters.stock.disponible,
          }
        )
      }
      if (filters.stock.enRupture === true) {
        query.andWhere('article.stockPhysique <= COALESCE(article.stockMinimum, 0)')
      }
      if (filters.stock.sousStockMinimum === true) {
        query.andWhere('article.stockPhysique < article.stockMinimum')
        query.andWhere('article.stockPhysique > 0')
      }
    }

    // Filtres de prix
    if (filters.prix) {
      if (filters.prix.min !== undefined) {
        query.andWhere('article.prixVenteHT >= :prixMin', { prixMin: filters.prix.min })
      }
      if (filters.prix.max !== undefined) {
        query.andWhere('article.prixVenteHT <= :prixMax', { prixMax: filters.prix.max })
      }
    }

    // Filtre par catégories
    if (filters.categories && filters.categories.length > 0) {
      query.andWhere('article.famille IN (:...categories)', { categories: filters.categories })
    }

    // Filtre par fournisseurs
    if (filters.fournisseurs && filters.fournisseurs.length > 0) {
      query.andWhere('article.fournisseurId IN (:...fournisseurs)', {
        fournisseurs: filters.fournisseurs,
      })
    }

    // Filtre par statut actif
    if (filters.actif !== undefined) {
      query.andWhere('article.actif = :actif', { actif: filters.actif })
    }

    // Recherche textuelle
    if (filters.recherche) {
      query.andWhere(
        '(article.designation ILIKE :search OR article.reference ILIKE :search OR article.description ILIKE :search)',
        { search: `%${filters.recherche}%` }
      )
    }

    // Tri
    const sortField = filters.tri?.champ || 'reference'
    const sortOrder = filters.tri?.ordre || 'ASC'
    query.orderBy(`article.${sortField}`, sortOrder)

    // Pagination
    const page = filters.pagination?.page || 1
    const limit = filters.pagination?.limite || 20
    const skip = (page - 1) * limit

    query.skip(skip).take(limit)

    // Exécution
    const [items, total] = await query.getManyAndCount()

    return {
      items,
      total,
      page,
      limit,
    }
  }

  async searchByText(searchText: string, limit?: number): Promise<Article[]> {
    const query = this.repository
      .createQueryBuilder('article')
      .where(
        '(article.designation ILIKE :text OR article.reference ILIKE :text OR article.description ILIKE :text)',
        { text: `%${searchText}%` }
      )

    if (limit) {
      query.limit(limit)
    }

    return await query.getMany()
  }

  async getArticleStats(): Promise<ArticleStatistics> {
    const totalArticles = await this.repository.count()

    // Implementation basique - peut être améliorée avec des requêtes optimisées
    return {
      totalArticles,
      repartitionParType: {
        [ArticleType.MATIERE_PREMIERE]: await this.repository.count({
          where: { type: ArticleType.MATIERE_PREMIERE },
        }),
        [ArticleType.PRODUIT_FINI]: await this.repository.count({
          where: { type: ArticleType.PRODUIT_FINI },
        }),
        [ArticleType.PRODUIT_SEMI_FINI]: await this.repository.count({
          where: { type: ArticleType.PRODUIT_SEMI_FINI },
        }),
        [ArticleType.FOURNITURE]: await this.repository.count({
          where: { type: ArticleType.FOURNITURE },
        }),
        [ArticleType.CONSOMMABLE]: await this.repository.count({
          where: { type: ArticleType.CONSOMMABLE },
        }),
        [ArticleType.SERVICE]: await this.repository.count({
          where: { type: ArticleType.SERVICE },
        }),
      },
      repartitionParStatus: {
        [ArticleStatus.ACTIF]: await this.repository.count({
          where: { status: ArticleStatus.ACTIF },
        }),
        [ArticleStatus.INACTIF]: await this.repository.count({
          where: { status: ArticleStatus.INACTIF },
        }),
        [ArticleStatus.OBSOLETE]: await this.repository.count({
          where: { status: ArticleStatus.OBSOLETE },
        }),
        [ArticleStatus.EN_COURS_CREATION]: await this.repository.count({
          where: { status: ArticleStatus.EN_COURS_CREATION },
        }),
        [ArticleStatus.EN_ATTENTE]: await this.repository.count({
          where: { status: ArticleStatus.EN_ATTENTE },
        }),
      },
      repartitionParFamille: await this.getRepartitionParFamille(),
      articlesGeresEnStock: await this.repository.count({ where: { gereEnStock: true } }),
      valeurTotaleStock: await this.calculateTotalStockValue(),
      articlesEnRupture: await this.countArticlesEnRupture(),
      articlesSousStockMini: await this.countArticlesSousStockMinimum(),
      articlesObsoletes: await this.repository.count({ where: { status: ArticleStatus.OBSOLETE } }),
    }
  }

  async findCreatedBetween(dateDebut: Date, dateFin: Date): Promise<Article[]> {
    return await this.repository
      .createQueryBuilder('article')
      .where('article.dateCreationFiche BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
      .getMany()
  }

  async findRecentlyModified(nbJours: number): Promise<Article[]> {
    const date = new Date()
    date.setDate(date.getDate() - nbJours)

    return await this.repository
      .createQueryBuilder('article')
      .where('article.dateDerniereModification > :date', { date })
      .getMany()
  }

  async findByDimensions(
    longueurMin?: number,
    longueurMax?: number,
    largeurMin?: number,
    largeurMax?: number
  ): Promise<Article[]> {
    const query = this.repository.createQueryBuilder('article')

    if (longueurMin !== undefined) {
      query.andWhere('article.longueur >= :longueurMin', { longueurMin })
    }
    if (longueurMax !== undefined) {
      query.andWhere('article.longueur <= :longueurMax', { longueurMax })
    }
    if (largeurMin !== undefined) {
      query.andWhere('article.largeur >= :largeurMin', { largeurMin })
    }
    if (largeurMax !== undefined) {
      query.andWhere('article.largeur <= :largeurMax', { largeurMax })
    }

    return await query.getMany()
  }

  async findByPriceRange(
    prixMin?: number,
    prixMax?: number,
    typePrix?: 'achat' | 'vente'
  ): Promise<Article[]> {
    const query = this.repository.createQueryBuilder('article')

    const priceField = typePrix === 'achat' ? 'prixAchatMoyen' : 'prixVenteHT'

    if (prixMin !== undefined) {
      query.andWhere(`article.${priceField} >= :prixMin`, { prixMin })
    }
    if (prixMax !== undefined) {
      query.andWhere(`article.${priceField} <= :prixMax`, { prixMax })
    }

    return await query.getMany()
  }

  async findRequiringSpecialStorage(): Promise<Article[]> {
    return await this.repository
      .createQueryBuilder('article')
      .where("article.informationsLogistiques->>'stockageSpecial' = 'true'")
      .getMany()
  }

  async findHazardousArticles(): Promise<Article[]> {
    return await this.repository
      .createQueryBuilder('article')
      .where("article.caracteristiquesTechniques->>'dangereux' = 'true'")
      .getMany()
  }

  async findByCertifications(certifications: string[]): Promise<Article[]> {
    return await this.repository
      .createQueryBuilder('article')
      .where("article.caracteristiquesTechniques->>'certifications' ?| ARRAY[:...certs]", {
        certs: certifications,
      })
      .getMany()
  }

  async findBySupplyDelay(delaiMax: number): Promise<Article[]> {
    return await this.repository
      .createQueryBuilder('article')
      .where('article.delaiApprovisionnement <= :delaiMax', { delaiMax })
      .getMany()
  }

  async getStockValuationByFamily(): Promise<Record<string, { quantite: number; valeur: number }>> {
    const result = await this.repository
      .createQueryBuilder('article')
      .select('article.famille', 'famille')
      .addSelect('SUM(article.stockPhysique)', 'quantite')
      .addSelect('SUM(article.stockPhysique * article.prixVenteHT)', 'valeur')
      .where('article.gereEnStock = :gereEnStock', { gereEnStock: true })
      .andWhere('article.actif = :actif', { actif: true })
      .andWhere('article.famille IS NOT NULL')
      .groupBy('article.famille')
      .getRawMany()

    const stockValuation: Record<string, { quantite: number; valeur: number }> = {}
    result.forEach((item) => {
      if (item.famille) {
        stockValuation[item.famille] = {
          quantite: parseFloat(item.quantite || '0'),
          valeur: parseFloat(item.valeur || '0'),
        }
      }
    })

    return stockValuation
  }

  async getRecentStockMovements(
    articleId: string,
    limit: number
  ): Promise<Record<string, unknown>[]> {
    // Utiliser le manager pour accéder à la table stock_movements
    const movements = await this.repository.manager
      .createQueryBuilder()
      .select([
        'movement.id',
        'movement.articleId',
        'movement.quantite',
        'movement.typeOperation',
        'movement.statut',
        'movement.dateOperation',
        'movement.numeroDocumentSource',
        'movement.commentaire',
        'movement.utilisateur',
        'movement.dateCreation',
      ])
      .from('stock_movements', 'movement')
      .where('movement.articleId = :articleId', { articleId })
      .andWhere('movement.statut != :statut', { statut: 'ANNULE' })
      .orderBy('movement.dateOperation', 'DESC')
      .limit(limit)
      .getRawMany()

    return movements.map((movement) => ({
      id: movement.movement_id,
      articleId: movement.movement_articleId,
      quantite: parseFloat(movement.movement_quantite || '0'),
      typeOperation: movement.movement_typeOperation,
      statut: movement.movement_statut,
      dateOperation: movement.movement_dateOperation,
      numeroDocumentSource: movement.movement_numeroDocumentSource,
      commentaire: movement.movement_commentaire,
      utilisateur: movement.movement_utilisateur,
      dateCreation: movement.movement_dateCreation,
    }))
  }

  async getBestSellers(
    limit: number,
    periode?: { debut: Date; fin: Date }
  ): Promise<Array<Article & { quantiteVendue: number }>> {
    // Construire la requête avec jointure sur les mouvements de vente
    const query = this.repository
      .createQueryBuilder('article')
      .leftJoin(
        'stock_movements',
        'movement',
        'movement.articleId = article.id AND movement.typeOperation IN (:...saleTypes) AND movement.statut != :cancelledStatus',
        {
          saleTypes: ['VENTE', 'LIVRAISON_CLIENT', 'SORTIE_PRODUCTION'],
          cancelledStatus: 'ANNULE',
        }
      )
      .select('article.*')
      .addSelect('COALESCE(SUM(ABS(movement.quantite)), 0)', 'quantiteVendue')
      .where('article.actif = :actif', { actif: true })
      .groupBy('article.id')
      .orderBy('quantiteVendue', 'DESC')
      .limit(limit)

    // Ajouter le filtre de période si spécifié
    if (periode?.debut) {
      query.andWhere('movement.dateOperation >= :dateDebut', { dateDebut: periode.debut })
    }
    if (periode?.fin) {
      query.andWhere('movement.dateOperation <= :dateFin', { dateFin: periode.fin })
    }

    const result = await query.getRawAndEntities()

    // Combiner les entités Article avec les quantités vendues
    return result.entities.map((article, index) => {
      const quantiteVendue = parseInt(result.raw[index].quantiteVendue || '0', 10)
      return Object.assign(article, { quantiteVendue }) as Article & { quantiteVendue: number }
    })
  }

  async getSlowMovingArticles(nbJoursSansVente: number): Promise<Article[]> {
    const dateLimite = new Date()
    dateLimite.setDate(dateLimite.getDate() - nbJoursSansVente)

    // Articles qui n'ont pas eu de mouvement de sortie récent
    const articles = await this.repository
      .createQueryBuilder('article')
      .leftJoin(
        'stock_movements',
        'recent_movement',
        `recent_movement.articleId = article.id 
         AND recent_movement.typeOperation IN ('VENTE', 'LIVRAISON_CLIENT', 'SORTIE_PRODUCTION')
         AND recent_movement.statut != 'ANNULE'
         AND recent_movement.dateOperation > :dateLimite`
      )
      .where('article.actif = :actif', { actif: true })
      .andWhere('article.gereEnStock = :gereEnStock', { gereEnStock: true })
      .andWhere('article.stockPhysique > :stockMin', { stockMin: 0 })
      .andWhere('recent_movement.id IS NULL') // Aucun mouvement récent
      .setParameter('dateLimite', dateLimite)
      .getMany()

    return articles
  }

  // Méthodes de l'interface IBusinessRepository
  async save(entity: Article): Promise<Article> {
    return await this.repository.save(entity)
  }

  async findBySpecification(_spec: unknown): Promise<Article[]> {
    // Implémentation basique - pourrait être améliorée avec le pattern Specification
    return await this.repository.find()
  }

  /**
   * Méthodes privées helper
   */
  private async getRepartitionParFamille(): Promise<Record<string, number>> {
    const result = await this.repository
      .createQueryBuilder('article')
      .select('article.famille', 'famille')
      .addSelect('COUNT(*)', 'count')
      .groupBy('article.famille')
      .getRawMany()

    const repartition: Record<string, number> = {}
    result.forEach((item) => {
      if (item.famille) {
        repartition[item.famille] = parseInt(item.count, 10)
      }
    })
    return repartition
  }

  private async calculateTotalStockValue(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('article')
      .select('SUM(article.stockPhysique * article.prixVenteHT)', 'total')
      .getRawOne()

    return parseFloat(result?.total || '0')
  }

  private async countArticlesEnRupture(): Promise<number> {
    return await this.repository
      .createQueryBuilder('article')
      .where('article.stockPhysique <= 0')
      .andWhere('article.actif = true')
      .andWhere('article.gereEnStock = true')
      .getCount()
  }

  private async countArticlesSousStockMinimum(): Promise<number> {
    return await this.repository
      .createQueryBuilder('article')
      .where('article.stockPhysique > 0')
      .andWhere('article.stockPhysique < article.stockMinimum')
      .andWhere('article.actif = true')
      .andWhere('article.gereEnStock = true')
      .getCount()
  }
}
