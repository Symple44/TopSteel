import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { PurchasePool } from './purchase-pool.entity'
import { PoolParticipant } from './pool-participant.entity'

export enum RequestStatus {
  DRAFT = 'DRAFT',
  SEEKING_POOL = 'SEEKING_POOL',
  IN_POOL = 'IN_POOL',
  NEGOTIATING = 'NEGOTIATING',
  QUOTED = 'QUOTED',
  ORDERED = 'ORDERED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ProductCategory {
  RAW_MATERIALS = 'RAW_MATERIALS',
  EQUIPMENT = 'EQUIPMENT',
  SERVICES = 'SERVICES',
  MAINTENANCE = 'MAINTENANCE',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  UTILITIES = 'UTILITIES'
}

@Entity('procurement_purchase_requests')
export class PurchaseRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Informations de base
  @Column({ type: 'varchar', length: 100 })
  requestNumber: string // Numéro unique de demande

  @Column({ type: 'varchar', length: 255 })
  title: string // Titre descriptif de la demande

  @Column({ type: 'text' })
  description: string // Description détaillée

  @Column({ 
    type: 'enum', 
    enum: ProductCategory 
  })
  category: ProductCategory

  @Column({ 
    type: 'enum', 
    enum: RequestStatus,
    default: RequestStatus.DRAFT 
  })
  status: RequestStatus

  @Column({ 
    type: 'enum', 
    enum: Priority,
    default: Priority.MEDIUM 
  })
  priority: Priority

  // Quantités et spécifications
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number

  @Column({ type: 'varchar', length: 50 })
  unit: string // kg, pièces, m², etc.

  @Column({ type: 'json', nullable: true })
  specifications: {
    [key: string]: any // Spécifications techniques flexibles
  }

  @Column({ type: 'json', nullable: true })
  qualityRequirements: string[] // Normes, certifications requises

  // Budget et timing
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedBudget: number

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  maxBudget: number

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string

  @Column({ type: 'date' })
  desiredDeliveryDate: Date

  @Column({ type: 'date', nullable: true })
  maxDeliveryDate: Date

  @Column({ type: 'varchar', length: 255 })
  deliveryAddress: string

  // Informations du demandeur
  @Column({ type: 'uuid' })
  requestedBy: string // ID utilisateur

  @Column({ type: 'varchar', length: 100 })
  requestedByName: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  costCenter: string

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string // ID utilisateur

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date

  // Liaison avec les pools
  @ManyToOne(() => PurchasePool, pool => pool.requests, { nullable: true })
  @JoinColumn({ name: 'pool_id' })
  pool: PurchasePool

  @Column({ name: 'pool_id', nullable: true })
  poolId: string

  @OneToMany(() => PoolParticipant, participant => participant.request)
  participations: PoolParticipant[]

  // Matching et compatibilité
  @Column({ type: 'json', nullable: true })
  matchingCriteria: {
    flexibleQuantity?: boolean // Accepte variations de quantité
    flexibleDelivery?: boolean  // Accepte délais plus longs
    flexibleSpecs?: boolean     // Accepte spécifications alternatives
    maxDistanceSupplier?: number // Distance max fournisseur (km)
  }

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  poolCompatibilityScore: number // Score de compatibilité avec pools (0-100)

  // Économies potentielles
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  individualPrice: number // Prix obtenu individuellement

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  poolPrice: number // Prix obtenu via pool

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  savingsAmount: number // Économies réalisées

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  savingsPercentage: number // % d'économies

  // Attachments et documents
  @Column({ type: 'json', nullable: true })
  attachments: {
    name: string
    url: string
    type: string
    size: number
  }[]

  // Historique et suivi
  @Column({ type: 'json', nullable: true })
  statusHistory: {
    status: RequestStatus
    timestamp: Date
    comment?: string
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
  static create(data: Partial<PurchaseRequest>): PurchaseRequest {
    const request = new PurchaseRequest()
    Object.assign(request, data)
    
    // Générer un numéro de demande automatique
    if (!request.requestNumber) {
      request.requestNumber = `REQ-${Date.now()}`
    }

    return request
  }

  updateStatus(newStatus: RequestStatus, userId?: string, comment?: string): void {
    if (!this.statusHistory) this.statusHistory = []
    
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      comment,
      userId
    })
    
    this.status = newStatus
  }

  calculateSavings(individualPrice: number, poolPrice: number): void {
    this.individualPrice = individualPrice
    this.poolPrice = poolPrice
    this.savingsAmount = individualPrice - poolPrice
    this.savingsPercentage = (this.savingsAmount / individualPrice) * 100
  }

  addTag(tag: string): void {
    if (!this.tags) this.tags = []
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
    }
  }

  canJoinPool(pool: PurchasePool): boolean {
    // Vérifier si la demande peut rejoindre un pool
    if (this.status !== RequestStatus.SEEKING_POOL) return false
    if (this.category !== pool.category) return false
    if (this.desiredDeliveryDate > pool.targetDeliveryDate) return false
    
    return true
  }

  isUrgent(): boolean {
    if (this.priority === Priority.URGENT) return true
    
    const daysUntilDelivery = Math.ceil(
      (this.desiredDeliveryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return daysUntilDelivery <= 7
  }

  getEstimatedSavings(poolDiscount: number = 0.15): number {
    if (!this.estimatedBudget) return 0
    return this.estimatedBudget * poolDiscount
  }

  getTotalValue(): number {
    return this.poolPrice || this.individualPrice || this.estimatedBudget || 0
  }

  isExpired(): boolean {
    return this.maxDeliveryDate ? new Date() > this.maxDeliveryDate : false
  }
}