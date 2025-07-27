import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { PurchasePool } from './purchase-pool.entity'
import { Supplier } from './supplier.entity'

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN'
}

@Entity('procurement_supplier_quotes')
export class SupplierQuote {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Relations
  @ManyToOne(() => PurchasePool, pool => pool.quotes)
  @JoinColumn({ name: 'pool_id' })
  pool: PurchasePool

  @Column({ name: 'pool_id' })
  poolId: string

  @ManyToOne(() => Supplier, supplier => supplier.quotes)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier

  @Column({ name: 'supplier_id' })
  supplierId: string

  // Informations de base
  @Column({ type: 'varchar', length: 100 })
  quoteNumber: string

  @Column({ 
    type: 'enum', 
    enum: QuoteStatus,
    default: QuoteStatus.DRAFT 
  })
  status: QuoteStatus

  // Pricing
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  volumeDiscount: number // % de remise volume

  @Column({ type: 'json', nullable: true })
  priceBreakdowns: {
    description: string
    unitPrice: number
    quantity: number
    totalPrice: number
  }[]

  // Conditions commerciales  
  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentTerms: string // "30 jours fin de mois", etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryTerms: string // "Franco de port", etc.

  @Column({ type: 'int', default: 30 })
  validityDays: number // Validité du devis en jours

  @Column({ type: 'date' })
  expiryDate: Date

  @Column({ type: 'date' })
  proposedDeliveryDate: Date

  @Column({ type: 'int', nullable: true })
  deliveryLeadTimeDays: number

  // Spécifications et conformité
  @Column({ type: 'json', nullable: true })
  productSpecifications: {
    [key: string]: any
  }

  @Column({ type: 'json', nullable: true })
  certifications: string[] // Certifications proposées

  @Column({ type: 'json', nullable: true })
  qualityGuarantees: string[]

  @Column({ type: 'varchar', length: 100, nullable: true })
  warranty: string // Durée et conditions de garantie

  // Options et alternatives
  @Column({ type: 'json', nullable: true })
  alternatives: {
    description: string
    unitPrice: number
    specifications: any
    advantages: string[]
  }[]

  @Column({ type: 'json', nullable: true })
  addOnServices: {
    service: string
    price: number
    description: string
  }[]

  // Scoring et évaluation
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  competitivenessScore: number // Score de compétitivité (0-100)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  qualityScore: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  deliveryScore: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallScore: number

  // Historique et négociation
  @Column({ type: 'json', nullable: true })
  negotiationHistory: {
    timestamp: Date
    action: string
    previousPrice?: number
    newPrice?: number
    comment?: string
    userId?: string
  }[]

  @Column({ type: 'text', nullable: true })
  supplierNotes: string

  @Column({ type: 'text', nullable: true })
  internalNotes: string

  @Column({ type: 'json', nullable: true })
  attachments: {
    name: string
    url: string
    type: string
    size: number
  }[]

  // Contact et soumission
  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPerson: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactEmail: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string

  @Column({ type: 'timestamp' })
  submittedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | undefined

  @Column({ type: 'text', nullable: true })
  rejectionReason: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Méthodes utilitaires
  static create(data: Partial<SupplierQuote>): SupplierQuote {
    const quote = new SupplierQuote()
    Object.assign(quote, data)
    
    // Générer un numéro de devis automatique
    if (!quote.quoteNumber) {
      quote.quoteNumber = `QUO-${Date.now()}`
    }

    // Calculer la date d'expiration
    if (!quote.expiryDate && quote.validityDays) {
      quote.expiryDate = new Date()
      quote.expiryDate.setDate(quote.expiryDate.getDate() + quote.validityDays)
    }

    return quote
  }

  updateStatus(newStatus: QuoteStatus, userId?: string, reason?: string): void {
    this.status = newStatus
    this.reviewedAt = new Date()
    this.reviewedBy = userId
    
    if (newStatus === QuoteStatus.REJECTED && reason) {
      this.rejectionReason = reason
    }
  }

  addNegotiationEntry(action: string, previousPrice?: number, newPrice?: number, comment?: string, userId?: string): void {
    if (!this.negotiationHistory) this.negotiationHistory = []
    
    this.negotiationHistory.push({
      timestamp: new Date(),
      action,
      previousPrice,
      newPrice,
      comment,
      userId
    })
  }

  calculateScores(competitorQuotes: SupplierQuote[]): void {
    if (competitorQuotes.length === 0) {
      this.competitivenessScore = 100
      return
    }

    // Score de compétitivité basé sur le prix
    const prices = competitorQuotes.map(q => q.totalPrice).concat(this.totalPrice)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    if (maxPrice === minPrice) {
      this.competitivenessScore = 100
    } else {
      // Plus le prix est proche du minimum, meilleur est le score
      this.competitivenessScore = ((maxPrice - this.totalPrice) / (maxPrice - minPrice)) * 100
    }

    // Score de livraison (plus tôt = mieux)
    const deliveryDates = competitorQuotes.map(q => q.proposedDeliveryDate.getTime()).concat(this.proposedDeliveryDate.getTime())
    const earliestDelivery = Math.min(...deliveryDates)
    const latestDelivery = Math.max(...deliveryDates)
    
    if (latestDelivery === earliestDelivery) {
      this.deliveryScore = 100
    } else {
      this.deliveryScore = ((latestDelivery - this.proposedDeliveryDate.getTime()) / (latestDelivery - earliestDelivery)) * 100
    }

    // Score de qualité basé sur les certifications et garanties
    const certificationCount = this.certifications ? this.certifications.length : 0
    const guaranteeCount = this.qualityGuarantees ? this.qualityGuarantees.length : 0
    this.qualityScore = Math.min(100, (certificationCount * 20) + (guaranteeCount * 15) + 40)

    // Score global pondéré
    this.overallScore = (
      this.competitivenessScore * 0.4 + 
      this.qualityScore * 0.35 + 
      this.deliveryScore * 0.25
    )
  }

  isExpired(): boolean {
    return new Date() > this.expiryDate
  }

  getDaysUntilExpiry(): number {
    const now = new Date()
    const diffTime = this.expiryDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  canBeNegotiated(): boolean {
    return this.status === QuoteStatus.SUBMITTED && !this.isExpired()
  }

  getDiscount(originalPrice: number): number {
    if (originalPrice <= 0) return 0
    return ((originalPrice - this.totalPrice) / originalPrice) * 100
  }

  updatePrice(newUnitPrice: number, userId?: string, comment?: string): void {
    const previousPrice = this.totalPrice
    this.unitPrice = newUnitPrice
    this.totalPrice = newUnitPrice * (this.pool?.totalQuantity || 1)
    
    this.addNegotiationEntry('price_update', previousPrice, this.totalPrice, comment, userId)
  }

  extendValidity(additionalDays: number): void {
    this.validityDays += additionalDays
    this.expiryDate = new Date()
    this.expiryDate.setDate(this.expiryDate.getDate() + this.validityDays)
  }

  getDeliveryDelayDays(targetDate: Date): number {
    const deliveryTime = this.proposedDeliveryDate.getTime()
    const targetTime = targetDate.getTime()
    const diffTime = deliveryTime - targetTime
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}