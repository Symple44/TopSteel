import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { PurchaseRequest, ProductCategory } from './purchase-request.entity'
import { SupplierQuote } from './supplier-quote.entity'
import { PoolParticipant } from './pool-participant.entity'

export enum PoolStatus {
  FORMING = 'FORMING',        // En cours de formation
  READY = 'READY',           // Prêt pour négociation
  NEGOTIATING = 'NEGOTIATING', // En négociation avec fournisseurs
  QUOTED = 'QUOTED',         // Devis reçus
  AWARDED = 'AWARDED',       // Fournisseur sélectionné
  ORDERING = 'ORDERING',     // Commandes en cours
  DELIVERED = 'DELIVERED',   // Livré
  CLOSED = 'CLOSED',         // Fermé
  CANCELLED = 'CANCELLED'    // Annulé
}

export enum PoolType {
  OPEN = 'OPEN',           // Ouvert à tous
  INVITATION = 'INVITATION', // Sur invitation seulement
  PRIVATE = 'PRIVATE'      // Privé (même organisation)
}

@Entity('procurement_purchase_pools')
export class PurchasePool {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Informations de base
  @Column({ type: 'varchar', length: 100 })
  poolNumber: string // Numéro unique du pool

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ 
    type: 'enum', 
    enum: ProductCategory 
  })
  category: ProductCategory

  @Column({ 
    type: 'enum', 
    enum: PoolStatus,
    default: PoolStatus.FORMING 
  })
  status: PoolStatus

  @Column({ 
    type: 'enum', 
    enum: PoolType,
    default: PoolType.OPEN 
  })
  poolType: PoolType

  // Créateur et gestionnaire
  @Column({ type: 'uuid' })
  createdBy: string

  @Column({ type: 'varchar', length: 100 })
  createdByName: string

  @Column({ type: 'uuid', nullable: true })
  managedBy: string // Gestionnaire actuel du pool

  // Contraintes du pool
  @Column({ type: 'int', default: 2 })
  minParticipants: number

  @Column({ type: 'int', default: 20 })
  maxParticipants: number

  @Column({ type: 'date' })
  formationDeadline: Date // Date limite pour rejoindre le pool

  @Column({ type: 'date' })
  targetDeliveryDate: Date // Date de livraison souhaitée

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date // Date de livraison réelle

  // Spécifications communes
  @Column({ type: 'json', nullable: true })
  commonSpecifications: {
    [key: string]: any
  }

  @Column({ type: 'json', nullable: true })
  qualityRequirements: string[]

  @Column({ type: 'varchar', length: 255, nullable: true })
  preferredDeliveryLocation: string

  // Quantités et budget
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  totalQuantity: number

  @Column({ type: 'varchar', length: 50 })
  unit: string

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalBudget: number // Budget total estimé

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  finalPrice: number // Prix final négocié

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string

  // Négociation et fournisseur
  @Column({ type: 'uuid', nullable: true })
  selectedSupplierId: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  selectedSupplierName: string

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  negotiatedDiscount: number // % de remise négociée

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalSavings: number // Économies totales réalisées

  // Statistiques
  @Column({ type: 'int', default: 0 })
  currentParticipants: number

  @Column({ type: 'int', default: 0 })
  quotesReceived: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageSavings: number // % moyen d'économies pour les participants

  // Configuration
  @Column({ type: 'boolean', default: true })
  allowPartialQuantities: boolean // Permet quantités partielles

  @Column({ type: 'boolean', default: false })
  requireApproval: boolean // Nécessite approbation pour rejoindre

  @Column({ type: 'boolean', default: true })
  automaticNegotiation: boolean // Négocie automatiquement avec fournisseurs

  // Relations
  @OneToMany(() => PurchaseRequest, request => request.pool)
  requests: PurchaseRequest[]

  @OneToMany(() => SupplierQuote, quote => quote.pool)
  quotes: SupplierQuote[]

  @OneToMany(() => PoolParticipant, participant => participant.pool)
  participants: PoolParticipant[]

  // Historique et suivi
  @Column({ type: 'json', nullable: true })
  statusHistory: {
    status: PoolStatus
    timestamp: Date
    comment?: string
    userId?: string
  }[]

  @Column({ type: 'json', nullable: true })
  negotiationLog: {
    timestamp: Date
    action: string
    details: any
    userId?: string
  }[]

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
  static create(data: Partial<PurchasePool>): PurchasePool {
    const pool = new PurchasePool()
    Object.assign(pool, data)
    
    // Générer un numéro de pool automatique
    if (!pool.poolNumber) {
      pool.poolNumber = `POOL-${Date.now()}`
    }

    return pool
  }

  updateStatus(newStatus: PoolStatus, userId?: string, comment?: string): void {
    if (!this.statusHistory) this.statusHistory = []
    
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      comment,
      userId
    })
    
    this.status = newStatus
  }

  addNegotiationLog(action: string, details: any, userId?: string): void {
    if (!this.negotiationLog) this.negotiationLog = []
    
    this.negotiationLog.push({
      timestamp: new Date(),
      action,
      details,
      userId
    })
  }

  canAcceptNewParticipants(): boolean {
    return (
      this.status === PoolStatus.FORMING &&
      this.currentParticipants < this.maxParticipants &&
      new Date() < this.formationDeadline
    )
  }

  isReadyForNegotiation(): boolean {
    return (
      this.currentParticipants >= this.minParticipants &&
      this.status === PoolStatus.FORMING &&
      new Date() >= this.formationDeadline
    )
  }

  updateTotals(): void {
    // Cette méthode sera appelée quand des demandes sont ajoutées/supprimées
    if (this.requests) {
      this.totalQuantity = this.requests.reduce((sum, req) => sum + req.quantity, 0)
      this.totalBudget = this.requests.reduce((sum, req) => sum + (req.estimatedBudget || 0), 0)
    }
  }

  calculateSavings(): void {
    if (this.finalPrice && this.totalBudget) {
      this.totalSavings = this.totalBudget - this.finalPrice
      this.averageSavings = (this.totalSavings / this.totalBudget) * 100
    }
  }

  selectSupplier(supplierId: string, supplierName: string, finalPrice: number): void {
    this.selectedSupplierId = supplierId
    this.selectedSupplierName = supplierName
    this.finalPrice = finalPrice
    this.updateStatus(PoolStatus.AWARDED)
    this.calculateSavings()
  }

  addTag(tag: string): void {
    if (!this.tags) this.tags = []
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
    }
  }

  getDaysUntilFormationDeadline(): number {
    const now = new Date()
    const deadline = this.formationDeadline
    const diffTime = deadline.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  getFormationProgress(): number {
    return (this.currentParticipants / this.maxParticipants) * 100
  }

  isExpired(): boolean {
    return new Date() > this.formationDeadline && this.status === PoolStatus.FORMING
  }

  getEstimatedSavings(discountRate: number = 0.15): number {
    return this.totalBudget * discountRate
  }
}