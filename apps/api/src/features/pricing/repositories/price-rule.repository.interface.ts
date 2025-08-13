import type { PriceRule } from '@erp/entities'
import type { FindManyOptions, FindOneOptions } from 'typeorm'

/**
 * Interface pour le repository des règles de prix
 * Suit le pattern Repository pour une architecture DDD
 */
export interface IPriceRuleRepository {
  /**
   * Créer une nouvelle règle de prix
   */
  create(priceRule: Partial<PriceRule>): Promise<PriceRule>

  /**
   * Sauvegarder une règle de prix (création ou mise à jour)
   */
  save(priceRule: PriceRule): Promise<PriceRule>

  /**
   * Sauvegarder plusieurs règles de prix
   */
  saveMany(priceRules: PriceRule[]): Promise<PriceRule[]>

  /**
   * Trouver une règle par son ID
   */
  findById(id: string): Promise<PriceRule | null>

  /**
   * Trouver une règle avec des options
   */
  findOne(options: FindOneOptions<PriceRule>): Promise<PriceRule | null>

  /**
   * Trouver toutes les règles avec des options
   */
  findMany(options?: FindManyOptions<PriceRule>): Promise<PriceRule[]>

  /**
   * Trouver toutes les règles actives pour une société
   */
  findActiveBySociete(societeId: string): Promise<PriceRule[]>

  /**
   * Trouver les règles par canal de vente
   */
  findByChannel(societeId: string, channel: string): Promise<PriceRule[]>

  /**
   * Trouver les règles applicables pour un article
   */
  findApplicableRules(
    societeId: string,
    articleReference: string,
    customerGroup?: string,
    quantity?: number
  ): Promise<PriceRule[]>

  /**
   * Mettre à jour une règle
   */
  update(id: string, updates: Partial<PriceRule>): Promise<PriceRule>

  /**
   * Activer/Désactiver une règle
   */
  toggleActive(id: string, isActive: boolean): Promise<PriceRule>

  /**
   * Supprimer une règle (soft delete)
   */
  softDelete(id: string): Promise<void>

  /**
   * Restaurer une règle supprimée
   */
  restore(id: string): Promise<void>

  /**
   * Supprimer définitivement une règle
   */
  hardDelete(id: string): Promise<void>

  /**
   * Compter les règles pour une société
   */
  countBySociete(societeId: string): Promise<number>

  /**
   * Vérifier si une règle existe
   */
  exists(id: string): Promise<boolean>

  /**
   * Cloner une règle de prix
   */
  clone(id: string, newName: string): Promise<PriceRule>

  /**
   * Rechercher des règles par critères
   */
  search(criteria: {
    societeId: string
    searchTerm?: string
    channel?: string
    isActive?: boolean
    startDate?: Date
    endDate?: Date
  }): Promise<PriceRule[]>

  /**
   * Obtenir les statistiques d'utilisation d'une règle
   */
  getUsageStats(id: string): Promise<{
    totalApplications: number
    lastApplied?: Date
    averageDiscount?: number
  }>

  /**
   * Archiver les règles expirées
   */
  archiveExpiredRules(societeId: string): Promise<number>

  /**
   * Valider l'unicité d'une règle
   */
  validateUniqueness(rule: Partial<PriceRule>): Promise<boolean>

  /**
   * Bulk operations
   */
  bulkActivate(ids: string[]): Promise<void>
  bulkDeactivate(ids: string[]): Promise<void>
  bulkDelete(ids: string[]): Promise<void>

  /**
   * Optimisation et performance
   */
  warmCache(societeId: string): Promise<void>
  clearCache(societeId: string): Promise<void>
}

// Token d'injection pour NestJS
export const PRICE_RULE_REPOSITORY = Symbol('IPriceRuleRepository')
