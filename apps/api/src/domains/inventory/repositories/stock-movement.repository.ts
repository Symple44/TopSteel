import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, In, Like, MoreThan, type Repository } from 'typeorm'
import { StockMovement } from '../entities/stock-movement.entity'
import {
  type IStockMovementFilters,
  type StockMovementPriority,
  StockMovementStatus,
  StockMovementType,
} from '../interfaces/stock-movement.interface'

export interface StockMovementStats {
  totalMovements: number
  totalEntrees: number
  totalSorties: number
  totalTransferts: number
  totalInventaires: number
  totalAjustements: number
  volumeTotal: number
  valeurTotale: number
  mouvementsEnAttente: number
  mouvementsCompletes: number
  mouvementsAnnules: number
}

export interface StockAnalysis {
  articleId: string
  stockActuel: number
  mouvementsJour: number
  mouvementsSemaine: number
  mouvementsMois: number
  tendance: 'hausse' | 'baisse' | 'stable'
  rotationStock: number
  couvertureStock: number // En jours
}

@Injectable()
export class StockMovementRepository {
  constructor(
    @InjectRepository(StockMovement)
    private repository: Repository<StockMovement>
  ) {}

  async create(data: Partial<StockMovement>): Promise<StockMovement> {
    const movement = this.repository.create(data)
    return await this.repository.save(movement)
  }

  async findById(id: string): Promise<StockMovement | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['article'],
    })
  }

  async findByReference(reference: string): Promise<StockMovement | null> {
    return await this.repository.findOne({
      where: { reference },
      relations: ['article'],
    })
  }

  async findByArticle(
    articleId: string,
    options?: {
      limit?: number
      offset?: number
      dateMin?: Date
      dateMax?: Date
      type?: StockMovementType[]
      status?: StockMovementStatus[]
    }
  ): Promise<StockMovement[]> {
    const query = this.repository
      .createQueryBuilder('movement')
      .where('movement.articleId = :articleId', { articleId })
      .orderBy('movement.dateCreation', 'DESC')

    if (options?.dateMin && options?.dateMax) {
      query.andWhere('movement.dateCreation BETWEEN :dateMin AND :dateMax', {
        dateMin: options.dateMin,
        dateMax: options.dateMax,
      })
    }

    if (options?.type?.length) {
      query.andWhere('movement.type IN (:...types)', { types: options.type })
    }

    if (options?.status?.length) {
      query.andWhere('movement.statut IN (:...statuses)', { statuses: options.status })
    }

    if (options?.limit) {
      query.take(options.limit)
    }

    if (options?.offset) {
      query.skip(options.offset)
    }

    return await query.getMany()
  }

  async findWithFilters(filters: IStockMovementFilters): Promise<{
    items: StockMovement[]
    total: number
    page: number
    limit: number
  }> {
    const query = this.repository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.article', 'article')

    // Filtres de base
    if (filters.articleIds?.length) {
      query.andWhere('movement.articleId IN (:...articleIds)', { articleIds: filters.articleIds })
    }

    if (filters.types?.length) {
      query.andWhere('movement.type IN (:...types)', { types: filters.types })
    }

    if (filters.status?.length) {
      query.andWhere('movement.statut IN (:...statuses)', { statuses: filters.status })
    }

    if (filters.motifs?.length) {
      query.andWhere('movement.motif IN (:...motifs)', { motifs: filters.motifs })
    }

    if (filters.priorite?.length) {
      query.andWhere('movement.priorite IN (:...priorites)', { priorites: filters.priorite })
    }

    // Filtres de date
    if (filters.dateDebut && filters.dateFin) {
      query.andWhere('movement.dateCreation BETWEEN :dateDebut AND :dateFin', {
        dateDebut: filters.dateDebut,
        dateFin: filters.dateFin,
      })
    } else if (filters.dateDebut) {
      query.andWhere('movement.dateCreation >= :dateDebut', { dateDebut: filters.dateDebut })
    } else if (filters.dateFin) {
      query.andWhere('movement.dateCreation <= :dateFin', { dateFin: filters.dateFin })
    }

    // Filtres de document
    if (filters.typeDocumentSource) {
      query.andWhere('movement.documentType = :documentType', {
        documentType: filters.typeDocumentSource,
      })
    }

    if (filters.documentSourceIds?.length) {
      query.andWhere('movement.documentId IN (:...documentIds)', {
        documentIds: filters.documentSourceIds,
      })
    }

    // Filtres d'emplacement
    if (filters.emplacements?.length) {
      query.andWhere(
        '(movement.emplacementSource IN (:...emplacements) OR movement.emplacementDestination IN (:...emplacements))',
        { emplacements: filters.emplacements }
      )
    }

    // Filtres de lot
    if (filters.numeroLot) {
      query.andWhere('movement.numeroLot = :numeroLot', { numeroLot: filters.numeroLot })
    }

    // Filtres utilisateur
    if (filters.utilisateurIds?.length) {
      query.andWhere(
        '(movement.creeParId IN (:...userIds) OR movement.traiteParId IN (:...userIds) OR movement.annuleParId IN (:...userIds))',
        { userIds: filters.utilisateurIds }
      )
    }

    // Tri
    const orderBy = filters.sortBy || 'dateCreation'
    const orderDirection = filters.sortOrder || 'DESC'
    query.orderBy(`movement.${orderBy}`, orderDirection)

    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 50
    const offset = (page - 1) * limit

    query.skip(offset).take(limit)

    const [items, total] = await query.getManyAndCount()

    return {
      items,
      total,
      page,
      limit,
    }
  }

  async findPendingMovements(options?: {
    articleId?: string
    type?: StockMovementType[]
    priorite?: StockMovementPriority[]
    limit?: number
  }): Promise<StockMovement[]> {
    const query = this.repository
      .createQueryBuilder('movement')
      .where('movement.statut = :status', { status: StockMovementStatus.EN_ATTENTE })
      .orderBy('movement.priorite', 'DESC')
      .addOrderBy('movement.dateCreation', 'ASC')

    if (options?.articleId) {
      query.andWhere('movement.articleId = :articleId', { articleId: options.articleId })
    }

    if (options?.type?.length) {
      query.andWhere('movement.type IN (:...types)', { types: options.type })
    }

    if (options?.priorite?.length) {
      query.andWhere('movement.priorite IN (:...priorites)', { priorites: options.priorite })
    }

    if (options?.limit) {
      query.take(options.limit)
    }

    return await query.getMany()
  }

  async save(movement: StockMovement): Promise<StockMovement> {
    return await this.repository.save(movement)
  }

  async update(id: string, data: Partial<StockMovement>): Promise<StockMovement> {
    // Exclure les propriétés de relation pour l'update
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { article: _article, ...updateData } = data
    await this.repository.update(id, updateData as any)
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Movement ${id} not found`)
    }
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  /**
   * Méthodes de statistiques
   */
  async getStatsByArticle(
    articleId: string,
    period?: { start: Date; end: Date }
  ): Promise<StockMovementStats> {
    const whereClause: any = { articleId }
    if (period) {
      whereClause.dateCreation = Between(period.start, period.end)
    }

    const movements = await this.repository.find({ where: whereClause })

    return this.calculateStats(movements)
  }

  async getGlobalStats(
    tenantId: string,
    period?: { start: Date; end: Date }
  ): Promise<StockMovementStats> {
    const whereClause: any = { tenantId }
    if (period) {
      whereClause.dateCreation = Between(period.start, period.end)
    }

    const movements = await this.repository.find({ where: whereClause })

    return this.calculateStats(movements)
  }

  async getStockAnalysis(articleId: string): Promise<StockAnalysis> {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Mouvements par période
    const [mouvementsJour, mouvementsSemaine, mouvementsMois] = await Promise.all([
      this.repository.count({
        where: {
          articleId,
          dateCreation: MoreThan(dayAgo),
          statut: StockMovementStatus.COMPLETE,
        },
      }),
      this.repository.count({
        where: {
          articleId,
          dateCreation: MoreThan(weekAgo),
          statut: StockMovementStatus.COMPLETE,
        },
      }),
      this.repository.count({
        where: {
          articleId,
          dateCreation: MoreThan(monthAgo),
          statut: StockMovementStatus.COMPLETE,
        },
      }),
    ])

    // Stock actuel (dernier mouvement complété)
    const lastMovement = await this.repository.findOne({
      where: {
        articleId,
        statut: StockMovementStatus.COMPLETE,
      },
      order: { dateCreation: 'DESC' },
    })

    const stockActuel = lastMovement?.stockApres || 0

    // Calculer la tendance
    const tendance =
      mouvementsJour > mouvementsSemaine / 7
        ? 'hausse'
        : mouvementsJour < mouvementsSemaine / 7
          ? 'baisse'
          : 'stable'

    // Rotation du stock (sorties moyennes par jour)
    const sortiesMois =
      (await this.repository.sum('quantite', {
        articleId,
        type: In([StockMovementType.SORTIE, StockMovementType.CORRECTION_NEGATIVE]),
        dateCreation: MoreThan(monthAgo),
        statut: StockMovementStatus.COMPLETE,
      })) || 0

    const rotationStock = sortiesMois / 30

    // Couverture de stock (jours restants)
    const couvertureStock = rotationStock > 0 ? stockActuel / rotationStock : 999

    return {
      articleId,
      stockActuel,
      mouvementsJour,
      mouvementsSemaine,
      mouvementsMois,
      tendance,
      rotationStock,
      couvertureStock,
    }
  }

  async getMovementTrends(
    articleId: string,
    groupBy: 'day' | 'week' | 'month',
    period: { start: Date; end: Date }
  ): Promise<
    Array<{
      periode: string
      entrees: number
      sorties: number
      solde: number
    }>
  > {
    const movements = await this.repository.find({
      where: {
        articleId,
        dateCreation: Between(period.start, period.end),
        statut: StockMovementStatus.COMPLETE,
      },
      order: { dateCreation: 'ASC' },
    })

    const grouped = new Map<string, { entrees: number; sorties: number }>()

    movements.forEach((movement) => {
      const date = movement.dateCreation
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week': {
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }

      if (!grouped.has(key)) {
        grouped.set(key, { entrees: 0, sorties: 0 })
      }

      const current = grouped.get(key)!
      if (movement.isEntree()) {
        current.entrees += movement.quantite
      } else if (movement.isSortie()) {
        current.sorties += movement.quantite
      }
    })

    return Array.from(grouped.entries()).map(([periode, data]) => ({
      periode,
      entrees: data.entrees,
      sorties: data.sorties,
      solde: data.entrees - data.sorties,
    }))
  }

  async getLastMovements(articleId: string, limit = 10): Promise<StockMovement[]> {
    return await this.repository.find({
      where: { articleId },
      order: { dateCreation: 'DESC' },
      take: limit,
      relations: ['article'],
    })
  }

  async getMovementsByDocument(documentType: string, documentId: string): Promise<StockMovement[]> {
    return await this.repository.find({
      where: {
        documentType,
        documentId,
      },
      order: { dateCreation: 'DESC' },
      relations: ['article'],
    })
  }

  async generateReference(type: StockMovementType): Promise<string> {
    const prefix = this.getTypePrefix(type)
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    // Compter les mouvements du mois
    const count = await this.repository.count({
      where: {
        reference: Like(`${prefix}${year}${month}%`),
      },
    })

    const sequence = String(count + 1).padStart(4, '0')
    return `${prefix}${year}${month}${sequence}`
  }

  private getTypePrefix(type: StockMovementType): string {
    switch (type) {
      case StockMovementType.ENTREE:
        return 'ENT'
      case StockMovementType.SORTIE:
        return 'SOR'
      case StockMovementType.TRANSFERT:
        return 'TRF'
      case StockMovementType.INVENTAIRE:
        return 'INV'
      case StockMovementType.CORRECTION_POSITIVE:
        return 'CRP'
      case StockMovementType.CORRECTION_NEGATIVE:
        return 'CRN'
      case StockMovementType.RETOUR:
        return 'RET'
      case StockMovementType.RESERVATION:
        return 'RES'
      default:
        return 'MVT'
    }
  }

  private calculateStats(movements: StockMovement[]): StockMovementStats {
    const stats: StockMovementStats = {
      totalMovements: movements.length,
      totalEntrees: 0,
      totalSorties: 0,
      totalTransferts: 0,
      totalInventaires: 0,
      totalAjustements: 0,
      volumeTotal: 0,
      valeurTotale: 0,
      mouvementsEnAttente: 0,
      mouvementsCompletes: 0,
      mouvementsAnnules: 0,
    }

    movements.forEach((movement) => {
      // Par type
      if (movement.isEntree()) {
        stats.totalEntrees++
        stats.volumeTotal += movement.quantite
      } else if (movement.isSortie()) {
        stats.totalSorties++
        stats.volumeTotal += movement.quantite
      } else if (movement.type === StockMovementType.TRANSFERT) {
        stats.totalTransferts++
      } else if (movement.type === StockMovementType.INVENTAIRE) {
        stats.totalInventaires++
      } else if (
        movement.type === StockMovementType.CORRECTION_POSITIVE ||
        movement.type === StockMovementType.CORRECTION_NEGATIVE
      ) {
        stats.totalAjustements++
      }

      // Par statut
      switch (movement.statut) {
        case StockMovementStatus.EN_ATTENTE:
          stats.mouvementsEnAttente++
          break
        case StockMovementStatus.COMPLETE:
          stats.mouvementsCompletes++
          break
        case StockMovementStatus.ANNULE:
          stats.mouvementsAnnules++
          break
      }

      // Valeur totale
      if (movement.coutTotal) {
        stats.valeurTotale += Number(movement.coutTotal)
      }
    })

    return stats
  }
}
