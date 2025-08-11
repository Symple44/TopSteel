import { Column, Entity, Index } from 'typeorm'
import { BusinessEntity } from '../base/business-entity'

export enum AdjustmentType {
  PERCENTAGE = 'PERCENTAGE', // -10% de réduction
  FIXED_AMOUNT = 'FIXED_AMOUNT', // -50€ sur le prix
  FIXED_PRICE = 'FIXED_PRICE', // Prix fixe à 99€
  PRICE_PER_WEIGHT = 'PRICE_PER_WEIGHT', // €/kg, €/tonne
  PRICE_PER_LENGTH = 'PRICE_PER_LENGTH', // €/m, €/mm
  PRICE_PER_SURFACE = 'PRICE_PER_SURFACE', // €/m²
  PRICE_PER_VOLUME = 'PRICE_PER_VOLUME', // €/m³
  FORMULA = 'FORMULA', // Calcul personnalisé
}

export enum PriceRuleChannel {
  ALL = 'ALL',
  ERP = 'ERP',
  MARKETPLACE = 'MARKETPLACE',
  API = 'API',
  B2B = 'B2B',
}

export interface PricingCondition {
  type:
    | 'customer_group'
    | 'customer_email'
    | 'customer_code'
    | 'quantity'
    | 'date_range'
    | 'article_reference'
    | 'article_family'
    | 'custom'
  operator: 'equals' | 'in' | 'between' | 'greater_than' | 'less_than' | 'contains' | 'starts_with'
  value: unknown
  field?: string // Pour conditions custom
}

/**
 * Entité métier : Règle de Prix
 * Gestion centralisée des règles de tarification pour tous les canaux
 */
@Entity('price_rules')
@Index(['societeId', 'isActive'])
export class PriceRule extends BusinessEntity {
  @Column({ type: 'varchar', length: 100 })
  ruleName!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  // Canal d'application (optionnel, ALL par défaut)
  @Column({ type: 'enum', enum: PriceRuleChannel, default: PriceRuleChannel.ALL })
  @Index()
  channel!: PriceRuleChannel

  // Article ou groupe d'articles concernés
  @Column({ type: 'uuid', nullable: true })
  @Index()
  articleId?: string // Règle pour un article spécifique

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  articleFamily?: string // Ou pour une famille d'articles

  // Type d'ajustement et valeur
  @Column({ type: 'enum', enum: AdjustmentType })
  adjustmentType!: AdjustmentType

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  adjustmentValue!: number

  @Column({ type: 'varchar', length: 10, nullable: true })
  adjustmentUnit?: string // Pour PRICE_PER_* (KG, T, M, M2, M3...)

  @Column({ type: 'text', nullable: true })
  formula?: string // Pour FORMULA type

  // Conditions d'application
  @Column({ type: 'jsonb', default: [] })
  conditions!: PricingCondition[]

  // Priorité et combinaison
  @Column({ type: 'integer', default: 0 })
  priority!: number // Plus élevé = plus prioritaire

  @Column({ type: 'boolean', default: true })
  combinable!: boolean // Peut être combiné avec d'autres règles

  // Période de validité
  @Column({ type: 'timestamptz', nullable: true })
  validFrom?: Date

  @Column({ type: 'timestamptz', nullable: true })
  validUntil?: Date

  // Limites d'utilisation
  @Column({ type: 'integer', nullable: true })
  usageLimit?: number // Limite d'utilisation totale

  @Column({ type: 'integer', nullable: true })
  usageLimitPerCustomer?: number // Limite par client

  @Column({ type: 'integer', default: 0 })
  usageCount!: number // Nombre d'utilisations

  // Groupes clients éligibles
  @Column({ type: 'varchar', array: true, nullable: true })
  customerGroups?: string[]

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    createdBy?: string
    approvedBy?: string
    notes?: string
    tags?: string[]
    minQuantity?: number
    maxQuantity?: number
  }

  // Méthodes utilitaires
  isValid(date: Date = new Date()): boolean {
    if (!this.isActive) return false

    if (this.validFrom && date < this.validFrom) return false
    if (this.validUntil && date > this.validUntil) return false

    if (this.usageLimit && this.usageCount >= this.usageLimit) return false

    return true
  }

  canBeApplied(context: Record<string, unknown>): boolean {
    if (!this.isValid()) return false

    // Vérifier le canal si spécifié
    if (this.channel !== PriceRuleChannel.ALL) {
      const contextChannel = context.channel as string
      if (contextChannel && contextChannel !== this.channel) return false
    }

    // Si pas de conditions, la règle s'applique toujours (règle globale)
    if (!this.conditions || this.conditions.length === 0) {
      return true
    }

    // Vérifier toutes les conditions
    return this.conditions.every((condition) => this.evaluateCondition(condition, context))
  }

  private evaluateCondition(
    condition: PricingCondition,
    context: Record<string, unknown>
  ): boolean {
    const contextValue = condition.field ? context[condition.field] : context[condition.type]

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue)

      case 'between': {
        const [min, max] = condition.value as [number, number]
        return Number(contextValue) >= min && Number(contextValue) <= max
      }

      case 'greater_than':
        return Number(contextValue) > Number(condition.value)

      case 'less_than':
        return Number(contextValue) < Number(condition.value)

      case 'contains':
        return String(contextValue).toLowerCase().includes(String(condition.value).toLowerCase())

      case 'starts_with':
        return String(contextValue).toLowerCase().startsWith(String(condition.value).toLowerCase())

      default:
        return false
    }
  }

  calculatePrice(basePrice: number, _context?: Record<string, unknown>): number {
    switch (this.adjustmentType) {
      case AdjustmentType.PERCENTAGE:
        return basePrice * (1 + this.adjustmentValue / 100)

      case AdjustmentType.FIXED_AMOUNT:
        return basePrice + this.adjustmentValue

      case AdjustmentType.FIXED_PRICE:
        return this.adjustmentValue

      case AdjustmentType.PRICE_PER_WEIGHT:
      case AdjustmentType.PRICE_PER_LENGTH:
      case AdjustmentType.PRICE_PER_SURFACE:
      case AdjustmentType.PRICE_PER_VOLUME:
        // Ces calculs nécessitent le service de conversion
        // Ils seront implémentés dans PricingEngineService
        return basePrice

      case AdjustmentType.FORMULA:
        // L'évaluation de formule nécessite un sandbox sécurisé
        // Sera implémenté dans PricingEngineService
        return basePrice

      default:
        return basePrice
    }
  }

  getDiscountAmount(basePrice: number): number {
    const newPrice = this.calculatePrice(basePrice)
    return basePrice - newPrice
  }

  getDiscountPercentage(basePrice: number): number {
    if (basePrice === 0) return 0
    const discount = this.getDiscountAmount(basePrice)
    return (discount / basePrice) * 100
  }

  incrementUsage(_customerId?: string): void {
    this.usageCount++
    // La gestion par client sera dans une table séparée price_rule_usage
  }

  // Implémentation de la méthode abstraite de BusinessEntity
  validate(): string[] {
    const errors: string[] = []

    if (!this.ruleName?.trim()) {
      errors.push('Le nom de la règle est requis')
    }

    if (!this.adjustmentType) {
      errors.push("Le type d'ajustement est requis")
    }

    if (this.adjustmentValue === undefined || this.adjustmentValue === null) {
      errors.push("La valeur d'ajustement est requise")
    }

    // Validation spécifique par type
    if (this.adjustmentType === AdjustmentType.PERCENTAGE) {
      if (Math.abs(this.adjustmentValue) > 100) {
        errors.push("L'ajustement en pourcentage ne peut pas dépasser 100%")
      }
    }

    if (this.adjustmentType === AdjustmentType.FIXED_PRICE && this.adjustmentValue < 0) {
      errors.push('Le prix fixe ne peut pas être négatif')
    }

    // Validation des types nécessitant une unité
    const requiresUnit = [
      AdjustmentType.PRICE_PER_WEIGHT,
      AdjustmentType.PRICE_PER_LENGTH,
      AdjustmentType.PRICE_PER_SURFACE,
      AdjustmentType.PRICE_PER_VOLUME,
    ]
    if (requiresUnit.includes(this.adjustmentType) && !this.adjustmentUnit) {
      errors.push(`L'unité est requise pour le type ${this.adjustmentType}`)
    }

    // Validation de la formule
    if (this.adjustmentType === AdjustmentType.FORMULA && !this.formula?.trim()) {
      errors.push('La formule est requise pour le type FORMULA')
    }

    // Validation des dates
    if (this.validFrom && this.validUntil && this.validFrom > this.validUntil) {
      errors.push('La date de début ne peut pas être après la date de fin')
    }

    // Validation des limites d'usage
    if (this.usageLimit && this.usageLimit < 1) {
      errors.push("La limite d'utilisation doit être au moins de 1")
    }

    if (this.usageLimitPerCustomer && this.usageLimitPerCustomer < 1) {
      errors.push('La limite par client doit être au moins de 1')
    }

    // Validation des conditions - optionnelles pour permettre des règles globales
    // Une règle sans condition s'appliquera à tous les articles du canal spécifié

    return errors
  }
}
