import { PriceRule, PriceRuleChannel } from '@erp/entities'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import {
  type DataSource,
  type FindManyOptions,
  type FindOneOptions,
  In,
  LessThanOrEqual,
  Not,
  type Repository,
} from 'typeorm'
import type { IPriceRuleRepository } from './price-rule.repository.interface'

/**
 * Repository pour la gestion des règles de prix
 * Implémente toute la logique d'accès aux données pour les règles de tarification
 */
@Injectable()
export class PriceRuleRepository implements IPriceRuleRepository {
  private readonly logger = new Logger(PriceRuleRepository.name)

  constructor(
    @InjectRepository(PriceRule, 'tenant')
    private readonly repository: Repository<PriceRule>,
    @InjectDataSource('tenant')
    private readonly dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis
  ) {}

  /**
   * Créer une nouvelle règle de prix
   */
  async create(priceRule: Partial<PriceRule>): Promise<PriceRule> {
    const entity = this.repository.create(priceRule)
    const saved = await this.repository.save(entity)

    // Invalider le cache pour cette société
    if (saved.societeId) {
      await this.clearCache(saved.societeId)
    }

    this.logger.log(`Règle de prix créée: ${saved.id} - ${saved.ruleName}`)
    return saved
  }

  /**
   * Sauvegarder une règle de prix
   */
  async save(priceRule: PriceRule): Promise<PriceRule> {
    const saved = await this.repository.save(priceRule)

    if (saved.societeId) {
      await this.clearCache(saved.societeId)
    }

    return saved
  }

  /**
   * Sauvegarder plusieurs règles
   */
  async saveMany(priceRules: PriceRule[]): Promise<PriceRule[]> {
    const saved = await this.repository.save(priceRules)

    // Invalider le cache pour toutes les sociétés concernées
    const societeIds = [...new Set(priceRules.map((r) => r.societeId).filter(Boolean))]
    for (const societeId of societeIds) {
      await this.clearCache(societeId)
    }

    return saved
  }

  /**
   * Trouver une règle par son ID
   */
  async findById(id: string): Promise<PriceRule | null> {
    const cacheKey = `price_rule:${id}`

    // Vérifier le cache
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // Requête base de données
    const rule = await this.repository.findOne({
      where: { id },
    })

    // Mettre en cache si trouvé
    if (rule) {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(rule)) // Cache 1h
    }

    return rule
  }

  /**
   * Trouver une règle avec options
   */
  async findOne(options: FindOneOptions<PriceRule>): Promise<PriceRule | null> {
    return await this.repository.findOne(options)
  }

  /**
   * Trouver toutes les règles avec options
   */
  async findMany(options?: FindManyOptions<PriceRule>): Promise<PriceRule[]> {
    return await this.repository.find(options || {})
  }

  /**
   * Trouver les règles actives pour une société
   */
  async findActiveBySociete(societeId: string): Promise<PriceRule[]> {
    const cacheKey = `active_rules:${societeId}`

    // Vérifier le cache
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const now = new Date()
    const rules = await this.repository.find({
      where: {
        societeId,
        isActive: true,
      },
      order: {
        priority: 'DESC',
        createdAt: 'DESC',
      },
    })

    // Filtrer par date de validité
    const validRules = rules.filter((rule) => {
      if (rule.validFrom && now < rule.validFrom) return false
      if (rule.validUntil && now > rule.validUntil) return false
      return true
    })

    // Mettre en cache
    await this.redis.setex(cacheKey, 300, JSON.stringify(validRules)) // Cache 5 min

    return validRules
  }

  /**
   * Trouver les règles par canal
   */
  async findByChannel(societeId: string, channel: string): Promise<PriceRule[]> {
    const rules = await this.repository.find({
      where: [
        { societeId, channel: channel as PriceRuleChannel, isActive: true },
        { societeId, channel: PriceRuleChannel.ALL, isActive: true },
      ],
      order: {
        priority: 'DESC',
      },
    })

    return rules
  }

  /**
   * Trouver les règles applicables pour un article
   */
  async findApplicableRules(
    societeId: string,
    articleReference: string,
    customerGroup?: string,
    quantity?: number
  ): Promise<PriceRule[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('rule')
      .where('rule.societeId = :societeId', { societeId })
      .andWhere('rule.isActive = :isActive', { isActive: true })
      .andWhere('(rule.validFrom IS NULL OR rule.validFrom <= :now)', { now: new Date() })
      .andWhere('(rule.validUntil IS NULL OR rule.validUntil >= :now)', { now: new Date() })

    // Filtrer par conditions
    queryBuilder.andWhere(
      `
      rule.conditions @> :articleCondition OR
      rule.conditions @> :allArticlesCondition
    `,
      {
        articleCondition: JSON.stringify([{ type: 'article_reference', value: articleReference }]),
        allArticlesCondition: JSON.stringify([{ type: 'all_articles', value: true }]),
      }
    )

    if (customerGroup) {
      queryBuilder.andWhere(
        `
        rule.conditions @> :customerGroupCondition OR
        NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(rule.conditions) AS c
          WHERE c->>'type' = 'customer_group'
        )
      `,
        {
          customerGroupCondition: JSON.stringify([
            { type: 'customer_group', value: customerGroup },
          ]),
        }
      )
    }

    if (quantity) {
      queryBuilder.andWhere(
        `
        NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(rule.conditions) AS c
          WHERE c->>'type' = 'quantity' AND (c->>'value')::numeric > :quantity
        ) OR
        NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(rule.conditions) AS c
          WHERE c->>'type' = 'quantity'
        )
      `,
        { quantity }
      )
    }

    const rules = await queryBuilder
      .orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'DESC')
      .getMany()

    return rules
  }

  /**
   * Mettre à jour une règle
   */
  async update(id: string, updates: Partial<PriceRule>): Promise<PriceRule> {
    const rule = await this.findById(id)
    if (!rule) {
      throw new NotFoundException(`Règle de prix ${id} non trouvée`)
    }

    Object.assign(rule, updates)
    const updated = await this.repository.save(rule)

    // Invalider le cache
    if (updated.societeId) {
      await this.clearCache(updated.societeId)
    }
    await this.redis.del(`price_rule:${id}`)

    this.logger.log(`Règle de prix mise à jour: ${id}`)
    return updated
  }

  /**
   * Activer/Désactiver une règle
   */
  async toggleActive(id: string, isActive: boolean): Promise<PriceRule> {
    return await this.update(id, { isActive })
  }

  /**
   * Supprimer une règle (soft delete)
   */
  async softDelete(id: string): Promise<void> {
    const rule = await this.findById(id)
    if (!rule) {
      throw new NotFoundException(`Règle de prix ${id} non trouvée`)
    }

    await this.repository.softDelete(id)

    // Invalider le cache
    if (rule.societeId) {
      await this.clearCache(rule.societeId)
    }
    await this.redis.del(`price_rule:${id}`)

    this.logger.log(`Règle de prix supprimée (soft): ${id}`)
  }

  /**
   * Restaurer une règle supprimée
   */
  async restore(id: string): Promise<void> {
    await this.repository.restore(id)

    const rule = await this.findById(id)
    if (rule?.societeId) {
      await this.clearCache(rule.societeId)
    }

    this.logger.log(`Règle de prix restaurée: ${id}`)
  }

  /**
   * Supprimer définitivement une règle
   */
  async hardDelete(id: string): Promise<void> {
    const rule = await this.findById(id)

    await this.repository.delete(id)

    if (rule?.societeId) {
      await this.clearCache(rule.societeId)
    }
    await this.redis.del(`price_rule:${id}`)

    this.logger.log(`Règle de prix supprimée définitivement: ${id}`)
  }

  /**
   * Compter les règles pour une société
   */
  async countBySociete(societeId: string): Promise<number> {
    return await this.repository.count({
      where: { societeId },
    })
  }

  /**
   * Vérifier si une règle existe
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id },
    })
    return count > 0
  }

  /**
   * Cloner une règle
   */
  async clone(id: string, newName: string): Promise<PriceRule> {
    const original = await this.findById(id)
    if (!original) {
      throw new NotFoundException(`Règle de prix ${id} non trouvée`)
    }

    const cloned = this.repository.create({
      ...original,
      id: undefined,
      ruleName: newName,
      createdAt: undefined,
      updatedAt: undefined,
    })

    const saved = await this.repository.save(cloned)

    if (saved.societeId) {
      await this.clearCache(saved.societeId)
    }

    this.logger.log(`Règle de prix clonée: ${id} -> ${saved.id}`)
    return saved
  }

  /**
   * Rechercher des règles
   */
  async search(criteria: {
    societeId: string
    searchTerm?: string
    channel?: string
    isActive?: boolean
    startDate?: Date
    endDate?: Date
  }): Promise<PriceRule[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('rule')
      .where('rule.societeId = :societeId', { societeId: criteria.societeId })

    if (criteria.searchTerm) {
      queryBuilder.andWhere('(rule.ruleName ILIKE :search OR rule.description ILIKE :search)', {
        search: `%${criteria.searchTerm}%`,
      })
    }

    if (criteria.channel) {
      queryBuilder.andWhere('rule.channel = :channel', { channel: criteria.channel })
    }

    if (criteria.isActive !== undefined) {
      queryBuilder.andWhere('rule.isActive = :isActive', { isActive: criteria.isActive })
    }

    if (criteria.startDate) {
      queryBuilder.andWhere('rule.validFrom >= :startDate', { startDate: criteria.startDate })
    }

    if (criteria.endDate) {
      queryBuilder.andWhere('rule.validUntil <= :endDate', { endDate: criteria.endDate })
    }

    return await queryBuilder
      .orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'DESC')
      .getMany()
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats(id: string): Promise<{
    totalApplications: number
    lastApplied?: Date
    averageDiscount?: number
  }> {
    // Cette méthode nécessiterait une table de logs d'application
    // Pour l'instant, retourner des stats basiques
    const result = await this.dataSource.query(
      `
      SELECT 
        COUNT(*) as total_applications,
        MAX(created_at) as last_applied,
        AVG(
          CASE 
            WHEN adjustment_type = 'PERCENTAGE' THEN adjustment_value
            ELSE 0
          END
        ) as average_discount
      FROM pricing_logs
      WHERE rule_id = $1
    `,
      [id]
    )

    return {
      totalApplications: parseInt(result[0]?.total_applications || '0'),
      lastApplied: result[0]?.last_applied,
      averageDiscount: parseFloat(result[0]?.average_discount || '0'),
    }
  }

  /**
   * Archiver les règles expirées
   */
  async archiveExpiredRules(societeId: string): Promise<number> {
    const result = await this.repository.update(
      {
        societeId,
        validUntil: LessThanOrEqual(new Date()),
        isActive: true,
      },
      {
        isActive: false,
      }
    )

    await this.clearCache(societeId)

    const count = result.affected || 0
    this.logger.log(`${count} règles expirées archivées pour société ${societeId}`)
    return count
  }

  /**
   * Valider l'unicité d'une règle
   */
  async validateUniqueness(rule: Partial<PriceRule>): Promise<boolean> {
    const existing = await this.repository.findOne({
      where: {
        societeId: rule.societeId,
        ruleName: rule.ruleName,
        id: rule.id ? Not(rule.id) : undefined,
      },
    })

    return !existing
  }

  /**
   * Activer plusieurs règles
   */
  async bulkActivate(ids: string[]): Promise<void> {
    await this.repository.update({ id: In(ids) }, { isActive: true })

    // Invalider le cache pour toutes les sociétés concernées
    const rules = await this.repository.find({
      where: { id: In(ids) },
      select: ['societeId'],
    })

    const societeIds = [...new Set(rules.map((r) => r.societeId).filter(Boolean))]
    for (const societeId of societeIds) {
      await this.clearCache(societeId)
    }
  }

  /**
   * Désactiver plusieurs règles
   */
  async bulkDeactivate(ids: string[]): Promise<void> {
    await this.repository.update({ id: In(ids) }, { isActive: false })

    const rules = await this.repository.find({
      where: { id: In(ids) },
      select: ['societeId'],
    })

    const societeIds = [...new Set(rules.map((r) => r.societeId).filter(Boolean))]
    for (const societeId of societeIds) {
      await this.clearCache(societeId)
    }
  }

  /**
   * Supprimer plusieurs règles
   */
  async bulkDelete(ids: string[]): Promise<void> {
    const rules = await this.repository.find({
      where: { id: In(ids) },
      select: ['societeId'],
    })

    await this.repository.softDelete(ids)

    const societeIds = [...new Set(rules.map((r) => r.societeId).filter(Boolean))]
    for (const societeId of societeIds) {
      await this.clearCache(societeId)
    }
  }

  /**
   * Préchauffer le cache
   */
  async warmCache(societeId: string): Promise<void> {
    const rules = await this.findActiveBySociete(societeId)
    this.logger.log(`Cache préchauffé pour société ${societeId}: ${rules.length} règles`)
  }

  /**
   * Vider le cache
   */
  async clearCache(societeId: string): Promise<void> {
    await this.redis.del(`active_rules:${societeId}`)
    // Supprimer toutes les clés de règles de prix
    const keys = await this.redis.keys('price_rule:*')
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
    this.logger.debug(`Cache vidé pour société ${societeId}`)
  }
}
