import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { SupplierQuote } from './supplier-quote.entity'
import { ProductCategory } from './purchase-request.entity'

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  BLACKLISTED = 'BLACKLISTED'
}

export enum SupplierTier {
  PREFERRED = 'PREFERRED',    // Fournisseur préféré
  APPROVED = 'APPROVED',      // Fournisseur approuvé
  TRIAL = 'TRIAL',           // En période d'essai
  STANDARD = 'STANDARD'       // Standard
}

@Entity('procurement_suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Informations de base
  @Column({ type: 'varchar', length: 100 })
  supplierCode: string // Code fournisseur unique

  @Column({ type: 'varchar', length: 200 })
  companyName: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  tradeName: string // Nom commercial si différent

  @Column({ type: 'varchar', length: 50, nullable: true })
  vatNumber: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  siretNumber: string

  @Column({ 
    type: 'enum', 
    enum: SupplierStatus,
    default: SupplierStatus.PENDING 
  })
  status: SupplierStatus

  @Column({ 
    type: 'enum', 
    enum: SupplierTier,
    default: SupplierTier.STANDARD 
  })
  tier: SupplierTier

  // Coordonnées
  @Column({ type: 'varchar', length: 255 })
  address: string

  @Column({ type: 'varchar', length: 100 })
  city: string

  @Column({ type: 'varchar', length: 20 })
  postalCode: string

  @Column({ type: 'varchar', length: 100 })
  country: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  region: string // Région géographique

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  website: string

  // Contacts
  @Column({ type: 'json', nullable: true })
  contacts: {
    role: string // 'sales', 'technical', 'finance', etc.
    name: string
    email: string
    phone?: string
    isPrimary: boolean
  }[]

  // Capacités et spécialités
  @Column({ type: 'json' })
  categories: ProductCategory[] // Catégories de produits

  @Column({ type: 'json', nullable: true })
  specialties: string[] // Spécialités techniques

  @Column({ type: 'json', nullable: true })
  certifications: string[] // ISO, OHSAS, etc.

  @Column({ type: 'json', nullable: true })
  qualityStandards: string[]

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualTurnover: number // Chiffre d'affaires annuel

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string

  @Column({ type: 'int', nullable: true })
  employeeCount: number

  // Conditions commerciales
  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentTerms: string // "30 jours fin de mois"

  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryTerms: string // "Franco de port"

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minimumOrderValue: number

  @Column({ type: 'int', nullable: true })
  standardLeadTimeDays: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  volumeDiscountThreshold: number // Seuil pour remise volume (%)

  @Column({ type: 'boolean', default: false })
  acceptsPoolPurchases: boolean // Accepte les achats groupés

  // Performance et évaluation
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overallRating: number // Note globale (0-100)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  qualityRating: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  deliveryRating: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  priceRating: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  serviceRating: number

  @Column({ type: 'int', default: 0 })
  totalQuotes: number

  @Column({ type: 'int', default: 0 })
  wonQuotes: number

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalOrderValue: number // Valeur totale des commandes

  @Column({ type: 'int', default: 0 })
  totalOrders: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  onTimeDeliveryRate: number // % de livraisons à temps

  // Scoring et recommandation
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskScore: number // Score de risque (0-100, plus bas = moins risqué)

  @Column({ type: 'json', nullable: true })
  riskFactors: string[] // Facteurs de risque identifiés

  @Column({ type: 'boolean', default: false })
  isRecommended: boolean // Recommandé par le système

  @Column({ type: 'int', default: 0 })
  recommendationScore: number // Score de recommandation

  // Relations
  @OneToMany(() => SupplierQuote, quote => quote.supplier)
  quotes: SupplierQuote[]

  // Informations complémentaires
  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'json', nullable: true })
  bankDetails: {
    bankName: string
    accountNumber: string
    iban?: string
    swift?: string
  }

  @Column({ type: 'json', nullable: true })
  documents: {
    type: string // 'insurance', 'kbis', 'certificate', etc.
    name: string
    url: string
    expiryDate?: Date
  }[]

  @Column({ type: 'date', nullable: true })
  lastAuditDate: Date

  @Column({ type: 'date', nullable: true })
  nextAuditDate: Date

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'json', nullable: true })
  tags: string[]

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Méthodes utilitaires
  static create(data: Partial<Supplier>): Supplier {
    const supplier = new Supplier()
    Object.assign(supplier, data)
    
    // Générer un code fournisseur automatique
    if (!supplier.supplierCode) {
      supplier.supplierCode = `SUP-${Date.now()}`
    }

    return supplier
  }

  updateStatus(newStatus: SupplierStatus): void {
    this.status = newStatus
  }

  addQuoteStats(isWon: boolean, orderValue?: number): void {
    this.totalQuotes++
    if (isWon) {
      this.wonQuotes++
      if (orderValue) {
        this.totalOrders++
        this.totalOrderValue += orderValue
      }
    }
  }

  updateRatings(quality: number, delivery: number, price: number, service: number): void {
    this.qualityRating = quality
    this.deliveryRating = delivery
    this.priceRating = price
    this.serviceRating = service
    
    // Calculer la note globale pondérée
    this.overallRating = (
      quality * 0.3 + 
      delivery * 0.25 + 
      price * 0.25 + 
      service * 0.2
    )
  }

  getWinRate(): number {
    return this.totalQuotes > 0 ? (this.wonQuotes / this.totalQuotes) * 100 : 0
  }

  getAverageOrderValue(): number {
    return this.totalOrders > 0 ? this.totalOrderValue / this.totalOrders : 0
  }

  addTag(tag: string): void {
    if (!this.tags) this.tags = []
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
    }
  }

  removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag)
    }
  }

  isPreferred(): boolean {
    return this.tier === SupplierTier.PREFERRED
  }

  canQuote(category: ProductCategory): boolean {
    return this.status === SupplierStatus.ACTIVE && 
           this.categories.includes(category) &&
           this.acceptsPoolPurchases
  }

  calculateRecommendationScore(): void {
    let score = 0
    
    // Basé sur la performance
    score += this.overallRating * 0.4
    
    // Basé sur l'expérience (nombre de commandes)
    const experienceScore = Math.min(100, this.totalOrders * 2)
    score += experienceScore * 0.2
    
    // Basé sur le taux de réussite
    score += this.getWinRate() * 0.2
    
    // Basé sur la ponctualité
    score += this.onTimeDeliveryRate * 0.2
    
    this.recommendationScore = Math.round(score)
    this.isRecommended = score >= 70
  }

  isEligibleForPool(category: ProductCategory, minOrderValue?: number): boolean {
    if (!this.canQuote(category)) return false
    
    if (minOrderValue && this.minimumOrderValue && minOrderValue < this.minimumOrderValue) {
      return false
    }
    
    return true
  }

  getPrimaryContact(): any {
    if (!this.contacts || this.contacts.length === 0) return null
    return this.contacts.find(c => c.isPrimary) || this.contacts[0]
  }

  hasValidCertification(requiredCerts: string[]): boolean {
    if (!this.certifications || !requiredCerts) return true
    return requiredCerts.some(cert => this.certifications.includes(cert))
  }

  needsAudit(): boolean {
    if (!this.nextAuditDate) return true
    return new Date() >= this.nextAuditDate
  }
}