import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, In, LessThan, MoreThan, type Repository } from 'typeorm'
import { toTypeORMUpdate } from '../../../core/database/typeorm-helpers'
import {
  type InteractionDirection,
  type InteractionPriority,
  InteractionStatus,
  type InteractionType,
  PartnerInteraction,
} from '../entities/partner-interaction.entity'

export interface InteractionSearchCriteria {
  partnerId?: string
  userId?: string
  type?: InteractionType[]
  status?: InteractionStatus[]
  priority?: InteractionPriority[]
  direction?: InteractionDirection[]
  dateMin?: Date
  dateMax?: Date
  searchText?: string
  tags?: string[]
  hasActions?: boolean
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface InteractionStats {
  totalInteractions: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  byDirection: Record<string, number>
  averageDuration: number
  averageSatisfaction: number
  totalDuration: number
  interactionsWithActions: number
  completionRate: number
}

@Injectable()
export class PartnerInteractionRepository {
  constructor(
    @InjectRepository(PartnerInteraction)
    private repository: Repository<PartnerInteraction>
  ) {}

  async create(data: Partial<PartnerInteraction>): Promise<PartnerInteraction> {
    const interaction = this.repository.create(data)
    return await this.repository.save(interaction)
  }

  async findById(id: string): Promise<PartnerInteraction | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['partner'],
    })
  }

  async findByPartner(
    partnerId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PartnerInteraction[]> {
    return await this.repository.find({
      where: { partnerId },
      order: { dateInteraction: 'DESC' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
      relations: ['partner'],
    })
  }

  async findByUser(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PartnerInteraction[]> {
    return await this.repository.find({
      where: { userId },
      order: { dateInteraction: 'DESC' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
      relations: ['partner'],
    })
  }

  async search(criteria: InteractionSearchCriteria): Promise<{
    items: PartnerInteraction[]
    total: number
    hasMore: boolean
  }> {
    const query = this.repository
      .createQueryBuilder('interaction')
      .leftJoinAndSelect('interaction.partner', 'partner')

    // Filtres de base
    if (criteria.partnerId) {
      query.andWhere('interaction.partnerId = :partnerId', { partnerId: criteria.partnerId })
    }

    if (criteria.userId) {
      query.andWhere('interaction.userId = :userId', { userId: criteria.userId })
    }

    if (criteria.type?.length) {
      query.andWhere('interaction.type IN (:...types)', { types: criteria.type })
    }

    if (criteria.status?.length) {
      query.andWhere('interaction.status IN (:...statuses)', { statuses: criteria.status })
    }

    if (criteria.priority?.length) {
      query.andWhere('interaction.priority IN (:...priorities)', { priorities: criteria.priority })
    }

    if (criteria.direction?.length) {
      query.andWhere('interaction.direction IN (:...directions)', {
        directions: criteria.direction,
      })
    }

    // Filtres de date
    if (criteria.dateMin && criteria.dateMax) {
      query.andWhere('interaction.dateInteraction BETWEEN :dateMin AND :dateMax', {
        dateMin: criteria.dateMin,
        dateMax: criteria.dateMax,
      })
    } else if (criteria.dateMin) {
      query.andWhere('interaction.dateInteraction >= :dateMin', { dateMin: criteria.dateMin })
    } else if (criteria.dateMax) {
      query.andWhere('interaction.dateInteraction <= :dateMax', { dateMax: criteria.dateMax })
    }

    // Recherche textuelle
    if (criteria.searchText) {
      query.andWhere(
        '(interaction.sujet ILIKE :search OR interaction.description ILIKE :search OR interaction.resultat ILIKE :search)',
        { search: `%${criteria.searchText}%` }
      )
    }

    // Filtres JSON
    if (criteria.tags?.length) {
      query.andWhere('interaction.tags ?| :tags', { tags: criteria.tags })
    }

    if (criteria.hasActions === true) {
      query.andWhere('jsonb_array_length(interaction.actionsRequises) > 0')
    } else if (criteria.hasActions === false) {
      query.andWhere(
        '(interaction.actionsRequises IS NULL OR jsonb_array_length(interaction.actionsRequises) = 0)'
      )
    }

    // Tri
    const orderBy = criteria.orderBy || 'dateInteraction'
    const orderDirection = criteria.orderDirection || 'DESC'
    query.orderBy(`interaction.${orderBy}`, orderDirection)

    // Pagination
    const limit = criteria.limit || 50
    const offset = criteria.offset || 0
    query.take(limit + 1) // +1 pour détecter hasMore
    query.skip(offset)

    const items = await query.getMany()
    const hasMore = items.length > limit
    if (hasMore) {
      items.pop() // Retirer l'élément supplémentaire
    }

    const total = await query.getCount()

    return { items, total, hasMore }
  }

  async save(interaction: PartnerInteraction): Promise<PartnerInteraction> {
    return await this.repository.save(interaction)
  }

  async update(id: string, data: Partial<PartnerInteraction>): Promise<PartnerInteraction> {
    await this.repository.update(id, toTypeORMUpdate(data))
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Interaction ${id} not found`)
    }
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  /**
   * Méthodes de statistiques
   */
  async getStatsByPartner(
    partnerId: string,
    period?: { start: Date; end: Date }
  ): Promise<InteractionStats> {
    const whereClause: Record<string, unknown> = { partnerId }
    if (period) {
      whereClause.dateInteraction = Between(period.start, period.end)
    }

    const interactions = await this.repository.find({ where: whereClause })

    return this.calculateStats(interactions)
  }

  async getStatsByUser(
    userId: string,
    period?: { start: Date; end: Date }
  ): Promise<InteractionStats> {
    const whereClause: Record<string, unknown> = { userId }
    if (period) {
      whereClause.dateInteraction = Between(period.start, period.end)
    }

    const interactions = await this.repository.find({ where: whereClause })

    return this.calculateStats(interactions)
  }

  async getGlobalStats(period?: { start: Date; end: Date }): Promise<InteractionStats> {
    const whereClause: Record<string, unknown> = {}
    if (period) {
      whereClause.dateInteraction = Between(period.start, period.end)
    }

    const interactions = await this.repository.find({ where: whereClause })

    return this.calculateStats(interactions)
  }

  async getStatsByType(
    type: InteractionType,
    period?: { start: Date; end: Date }
  ): Promise<{
    count: number
    averageDuration: number
    averageSatisfaction: number
    topUsers: Array<{ userId: string; userName: string; count: number }>
    topPartners: Array<{ partnerId: string; partnerName: string; count: number }>
  }> {
    const whereClause: Record<string, unknown> = { type }
    if (period) {
      whereClause.dateInteraction = Between(period.start, period.end)
    }

    const interactions = await this.repository.find({
      where: whereClause,
      relations: ['partner'],
    })

    // Calculer les statistiques
    const count = interactions.length
    const averageDuration = interactions.reduce((sum, i) => sum + (i.duree || 0), 0) / count || 0
    const averageSatisfaction =
      interactions
        .filter((i) => i.satisfactionScore)
        .reduce((sum, i) => sum + (i.satisfactionScore || 0), 0) /
        interactions.filter((i) => i.satisfactionScore).length || 0

    // Top users
    const userCounts = new Map<string, { name: string; count: number }>()
    interactions.forEach((i) => {
      const current = userCounts.get(i.userId) || { name: i.utilisateurNom, count: 0 }
      current.count++
      userCounts.set(i.userId, current)
    })
    const topUsers = Array.from(userCounts.entries())
      .map(([userId, data]) => ({ userId, userName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top partners
    const partnerCounts = new Map<string, { name: string; count: number }>()
    interactions.forEach((i) => {
      const partnerName = i.partner?.denomination || 'Unknown'
      const current = partnerCounts.get(i.partnerId) || { name: partnerName, count: 0 }
      current.count++
      partnerCounts.set(i.partnerId, current)
    })
    const topPartners = Array.from(partnerCounts.entries())
      .map(([partnerId, data]) => ({ partnerId, partnerName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      count,
      averageDuration,
      averageSatisfaction,
      topUsers,
      topPartners,
    }
  }

  async getTrendsByPeriod(
    groupBy: 'day' | 'week' | 'month',
    period: { start: Date; end: Date }
  ): Promise<
    Array<{
      periode: string
      count: number
      types: Record<string, number>
    }>
  > {
    const interactions = await this.repository.find({
      where: {
        dateInteraction: Between(period.start, period.end),
      },
      order: { dateInteraction: 'ASC' },
    })

    const grouped = new Map<string, PartnerInteraction[]>()

    interactions.forEach((interaction) => {
      const date = interaction.dateInteraction
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
        grouped.set(key, [])
      }
      grouped.get(key)?.push(interaction)
    })

    return Array.from(grouped.entries()).map(([periode, items]) => {
      const types: Record<string, number> = {}
      items.forEach((item) => {
        types[item.type] = (types[item.type] || 0) + 1
      })

      return {
        periode,
        count: items.length,
        types,
      }
    })
  }

  async getUpcomingInteractions(limit = 10, userId?: string): Promise<PartnerInteraction[]> {
    const whereClause: Record<string, unknown> = {
      status: InteractionStatus.PLANIFIE,
      dateInteraction: MoreThan(new Date()),
    }

    if (userId) {
      whereClause.userId = userId
    }

    return await this.repository.find({
      where: whereClause,
      order: { dateInteraction: 'ASC' },
      take: limit,
      relations: ['partner'],
    })
  }

  async getOverdueInteractions(userId?: string): Promise<PartnerInteraction[]> {
    const whereClause: Record<string, unknown> = {
      status: In([InteractionStatus.PLANIFIE, InteractionStatus.EN_COURS]),
      dateInteraction: LessThan(new Date()),
    }

    if (userId) {
      whereClause.userId = userId
    }

    return await this.repository.find({
      where: whereClause,
      order: { dateInteraction: 'DESC' },
      relations: ['partner'],
    })
  }

  private calculateStats(interactions: PartnerInteraction[]): InteractionStats {
    const stats: InteractionStats = {
      totalInteractions: interactions.length,
      byType: {},
      byStatus: {},
      byPriority: {},
      byDirection: {},
      averageDuration: 0,
      averageSatisfaction: 0,
      totalDuration: 0,
      interactionsWithActions: 0,
      completionRate: 0,
    }

    if (interactions.length === 0) {
      return stats
    }

    let totalDuration = 0
    let totalSatisfaction = 0
    let satisfactionCount = 0
    let completedCount = 0

    interactions.forEach((interaction) => {
      // Par type
      stats.byType[interaction.type] = (stats.byType[interaction.type] || 0) + 1

      // Par status
      stats.byStatus[interaction.status] = (stats.byStatus[interaction.status] || 0) + 1

      // Par priorité
      stats.byPriority[interaction.priority] = (stats.byPriority[interaction.priority] || 0) + 1

      // Par direction
      stats.byDirection[interaction.direction] = (stats.byDirection[interaction.direction] || 0) + 1

      // Durée
      if (interaction.duree) {
        totalDuration += interaction.duree
      }

      // Satisfaction
      if (interaction.satisfactionScore) {
        totalSatisfaction += interaction.satisfactionScore
        satisfactionCount++
      }

      // Actions
      if (interaction.hasActions()) {
        stats.interactionsWithActions++
      }

      // Complétées
      if (interaction.isCompleted()) {
        completedCount++
      }
    })

    stats.totalDuration = totalDuration
    stats.averageDuration = totalDuration / interactions.length
    stats.averageSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0
    stats.completionRate = (completedCount / interactions.length) * 100

    return stats
  }
}
