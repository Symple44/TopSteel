import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { Article, ArticleStatus, ArticleType } from '../entities/article.entity'
import type { ArticleSearchCriteria, ArticleStatistics } from '../services/article.service'
import type { ArticleAdvancedFilters, IArticleRepository } from './article.repository'

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

  async hasStockMovements(_articleId: string): Promise<boolean> {
    // TODO: Implémenter selon votre logique de mouvements de stock
    return false
  }

  async findWithFilters(_filters: ArticleAdvancedFilters): Promise<{
    items: Article[]
    total: number
    page: number
    limit: number
  }> {
    // TODO: Implémenter la recherche avancée avec filtres
    const items = await this.repository.find()
    return {
      items,
      total: items.length,
      page: 1,
      limit: 10,
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
      },
      repartitionParFamille: {}, // TODO: Implémenter si nécessaire
      articlesGeresEnStock: await this.repository.count({ where: { gereEnStock: true } }),
      valeurTotaleStock: 0, // TODO: Calculer la valeur totale
      articlesEnRupture: 0, // TODO: Calculer
      articlesSousStockMini: 0, // TODO: Calculer
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
    // TODO: Implémenter avec une requête optimisée
    return {}
  }

  async getRecentStockMovements(
    _articleId: string,
    _limit: number
  ): Promise<Record<string, unknown>[]> {
    // TODO: Implémenter selon votre système de mouvements
    return []
  }

  async getBestSellers(
    limit: number,
    _periode?: { debut: Date; fin: Date }
  ): Promise<Array<Article & { quantiteVendue: number }>> {
    // TODO: Implémenter avec les données de vente
    const articles = await this.repository.find({ take: limit })
    return articles.map((article) => {
      const result = Object.assign(article, { quantiteVendue: 0 })
      return result as Article & { quantiteVendue: number }
    })
  }

  async getSlowMovingArticles(nbJoursSansVente: number): Promise<Article[]> {
    const date = new Date()
    date.setDate(date.getDate() - nbJoursSansVente)

    // TODO: Implémenter avec les données de mouvement
    return await this.repository.find()
  }

  // Méthodes de l'interface IBusinessRepository
  async save(entity: Article): Promise<Article> {
    return await this.repository.save(entity)
  }

  async findBySpecification(_spec: any): Promise<Article[]> {
    // Implémentation basique - pourrait être améliorée avec le pattern Specification
    return await this.repository.find()
  }
}
