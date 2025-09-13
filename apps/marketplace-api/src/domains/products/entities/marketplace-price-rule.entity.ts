import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// Removed direct import to avoid circular dependency
// import { MarketplaceProduct } from './marketplace-product.entity'
import type { MarketplaceProduct } from './marketplace-product.entity'

export enum AdjustmentType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FIXED_PRICE = 'FIXED_PRICE',
}

export interface PricingCondition {
  type: 'customer_group' | 'customer_email' | 'customer_code' | 'quantity' | 'date_range' | 'custom'
  operator: 'equals' | 'in' | 'between' | 'greater_than' | 'less_than' | 'contains'
  value: unknown
  field?: string // Pour conditions custom
}

@Entity('marketplace_price_rules')
@Index(['societeId', 'productId'])
export class MarketplacePriceRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  societeId!: string

  @Column({ type: 'uuid' })
  productId!: string

  @Column({ type: 'varchar', length: 100 })
  ruleName!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'jsonb', default: [] })
  conditions!: PricingCondition[]

  @Column({ type: 'enum', enum: AdjustmentType })
  adjustmentType!: AdjustmentType

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  adjustmentValue!: number

  @Column({ type: 'integer', default: 0 })
  priority!: number // Plus élevé = plus prioritaire

  @Column({ type: 'date', nullable: true })
  validFrom?: Date

  @Column({ type: 'date', nullable: true })
  validUntil?: Date

  @Column({ type: 'integer', nullable: true })
  usageLimit?: number // Limite d'utilisation

  @Column({ type: 'integer', default: 0 })
  usageCount!: number // Nombre d'utilisations

  @Column({ type: 'boolean', default: false })
  combinable!: boolean // Peut être combiné avec d'autres règles

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    createdBy?: string
    notes?: string
    tags?: string[]
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne('MarketplaceProduct', 'priceRules', { lazy: true })
  @JoinColumn({ name: 'productId' })
  product!: MarketplaceProduct

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

    return this.conditions.every((condition) => this.evaluateCondition(condition, context))
  }

  private evaluateCondition(condition: PricingCondition, context: Record<string, unknown>): boolean {
    if (!context || typeof context !== 'object') return false

    const contextValue = condition.field ? context[condition.field] : context[condition.type]

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue)

      case 'between':
        if (!Array.isArray(condition.value) || condition.value.length < 2) return false
        return typeof contextValue === 'number' &&
               contextValue >= (condition.value[0] as number) &&
               contextValue <= (condition.value[1] as number)

      case 'greater_than':
        return typeof contextValue === 'number' && typeof condition.value === 'number' &&
               contextValue > condition.value

      case 'less_than':
        return typeof contextValue === 'number' && typeof condition.value === 'number' &&
               contextValue < condition.value

      case 'contains':
        return String(contextValue).toLowerCase().includes(String(condition.value).toLowerCase())

      default:
        return false
    }
  }

  calculatePrice(basePrice: number): number {
    switch (this.adjustmentType) {
      case AdjustmentType.PERCENTAGE:
        return basePrice * (1 + this.adjustmentValue / 100)

      case AdjustmentType.FIXED_AMOUNT:
        return basePrice + this.adjustmentValue

      case AdjustmentType.FIXED_PRICE:
        return this.adjustmentValue

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

  incrementUsage(): void {
    this.usageCount++
  }
}
