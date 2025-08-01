import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { MarketplaceOrder } from './marketplace-order.entity'

@Entity('marketplace_order_items')
export class MarketplaceOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  orderId!: string

  @Column({ type: 'uuid' })
  @Index()
  productId!: string // Référence vers MarketplaceProduct

  @Column({ type: 'uuid' })
  erpArticleId!: string // Référence vers Article ERP

  @Column({ type: 'varchar', length: 30 })
  productReference!: string // Reference article ERP

  @Column({ type: 'varchar', length: 255 })
  productName!: string

  @Column({ type: 'text', nullable: true })
  productDescription?: string

  @Column({ type: 'integer' })
  quantity!: number

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  unitPriceHT!: number

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalHT!: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tvaRate!: number // Taux TVA en %

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  totalTVA!: number

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalTTC!: number

  @Column({ type: 'varchar', length: 10 })
  unit!: string // Unité (PCS, KG, etc.)

  @Column({ type: 'boolean', default: false })
  isDigital!: boolean

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  weight?: number // Poids en kg

  @Column({ type: 'jsonb', nullable: true })
  productSnapshot?: {
    images?: string[]
    specifications?: Record<string, any>
    categories?: string[]
    erpData?: Record<string, any>
  }

  @Column({ type: 'jsonb', nullable: true })
  priceDetails?: {
    basePrice: number
    appliedRules?: Array<{
      ruleId: string
      ruleName: string
      adjustment: number
      adjustmentType: string
    }>
    finalPrice: number
  }

  @Column({ type: 'jsonb', nullable: true })
  customizations?: {
    options?: Record<string, any>
    instructions?: string
    deliveryDate?: string
  }

  // Relations
  @ManyToOne(() => MarketplaceOrder, order => order.items)
  @JoinColumn({ name: 'orderId' })
  order!: MarketplaceOrder

  // Méthodes utilitaires
  calculateTotals(): void {
    this.totalHT = this.quantity * this.unitPriceHT
    this.totalTVA = this.totalHT * (this.tvaRate / 100)
    this.totalTTC = this.totalHT + this.totalTVA
  }

  getTotalWeight(): number {
    return (this.weight || 0) * this.quantity
  }

  getDiscountAmount(): number {
    if (!this.priceDetails?.basePrice) return 0
    return (this.priceDetails.basePrice - this.unitPriceHT) * this.quantity
  }

  getDiscountPercentage(): number {
    if (!this.priceDetails?.basePrice || this.priceDetails.basePrice === 0) return 0
    const discount = this.priceDetails.basePrice - this.unitPriceHT
    return (discount / this.priceDetails.basePrice) * 100
  }

  hasCustomizations(): boolean {
    return !!this.customizations && Object.keys(this.customizations).length > 0
  }
}