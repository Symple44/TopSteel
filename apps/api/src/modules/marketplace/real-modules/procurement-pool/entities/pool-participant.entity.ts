import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { PurchasePool } from './purchase-pool.entity'
import { PurchaseRequest } from './purchase-request.entity'

export enum ParticipationStatus {
  PENDING = 'PENDING',       // En attente d'approbation
  ACTIVE = 'ACTIVE',         // Participant actif
  COMMITTED = 'COMMITTED',   // Engagé dans le pool
  WITHDRAWN = 'WITHDRAWN',   // Retiré du pool
  EXCLUDED = 'EXCLUDED'      // Exclu du pool
}

@Entity('procurement_pool_participants')
export class PoolParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Relations
  @ManyToOne(() => PurchasePool, pool => pool.participants)
  @JoinColumn({ name: 'pool_id' })
  pool: PurchasePool

  @Column({ name: 'pool_id' })
  poolId: string

  @ManyToOne(() => PurchaseRequest, request => request.participations)
  @JoinColumn({ name: 'request_id' })
  request: PurchaseRequest

  @Column({ name: 'request_id' })
  requestId: string

  // Informations du participant
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 100 })
  userName: string

  @Column({ type: 'varchar', length: 100 })
  company: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string

  @Column({ 
    type: 'enum', 
    enum: ParticipationStatus,
    default: ParticipationStatus.PENDING 
  })
  status: ParticipationStatus

  // Engagement et conditions
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  committedQuantity: number

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  maxBudget: number

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  reservedBudget: number // Budget réservé pour ce pool

  @Column({ type: 'boolean', default: false })
  acceptsPartialDelivery: boolean

  @Column({ type: 'boolean', default: false })
  acceptsAlternativeSpecs: boolean

  @Column({ type: 'int', nullable: true })
  maxDeliveryDelayDays: number // Retard acceptable en jours

  // Préférences et contraintes
  @Column({ type: 'json', nullable: true })
  preferredSuppliers: string[] // IDs des fournisseurs préférés

  @Column({ type: 'json', nullable: true })
  excludedSuppliers: string[] // IDs des fournisseurs à exclure

  @Column({ type: 'json', nullable: true })
  additionalRequirements: string[]

  @Column({ type: 'varchar', length: 255, nullable: true })
  deliveryAddress: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialInstructions: string

  // Approbation et validation
  @Column({ type: 'uuid', nullable: true })
  approvedBy: string // ID de celui qui approuve la participation

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date

  @Column({ type: 'text', nullable: true })
  approvalNotes: string | undefined

  @Column({ type: 'boolean', default: false })
  requiresInternalApproval: boolean

  // Résultats et allocation
  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  allocatedQuantity: number // Quantité finalement allouée

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  finalPrice: number // Prix final par unité

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCost: number // Coût total pour ce participant

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  savingsAmount: number // Économies réalisées

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  savingsPercentage: number

  // Suivi de commande
  @Column({ type: 'varchar', length: 100, nullable: true })
  orderNumber: string // Numéro de commande généré

  @Column({ type: 'timestamp', nullable: true })
  orderDate: Date

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date

  @Column({ type: 'boolean', default: false })
  delivered: boolean

  @Column({ type: 'boolean', default: false })
  invoiced: boolean

  @Column({ type: 'boolean', default: false })
  paid: boolean

  // Évaluation et feedback
  @Column({ type: 'int', nullable: true })
  satisfactionRating: number // 1-5

  @Column({ type: 'text', nullable: true })
  feedback: string

  @Column({ type: 'boolean', default: true })
  wouldParticipateAgain: boolean

  // Historique
  @Column({ type: 'json', nullable: true })
  statusHistory: {
    status: ParticipationStatus
    timestamp: Date
    comment?: string
    userId?: string
  }[]

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Méthodes utilitaires
  static create(data: Partial<PoolParticipant>): PoolParticipant {
    const participant = new PoolParticipant()
    Object.assign(participant, data)
    return participant
  }

  updateStatus(newStatus: ParticipationStatus, userId?: string, comment?: string): void {
    if (!this.statusHistory) this.statusHistory = []
    
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      comment,
      userId
    })
    
    this.status = newStatus
  }

  approve(approvedBy: string, notes?: string): void {
    this.status = ParticipationStatus.ACTIVE
    this.approvedBy = approvedBy
    this.approvedAt = new Date()
    this.approvalNotes = notes
  }

  commit(): void {
    if (this.status === ParticipationStatus.ACTIVE) {
      this.status = ParticipationStatus.COMMITTED
    }
  }

  withdraw(reason?: string): void {
    this.updateStatus(ParticipationStatus.WITHDRAWN, undefined, reason)
  }

  allocateQuantity(quantity: number, unitPrice: number): void {
    this.allocatedQuantity = quantity
    this.finalPrice = unitPrice
    this.totalCost = quantity * unitPrice
    
    // Calculer les économies si on a un budget de référence
    if (this.maxBudget) {
      const originalTotal = (this.maxBudget / this.committedQuantity) * quantity
      this.savingsAmount = originalTotal - this.totalCost
      this.savingsPercentage = (this.savingsAmount / originalTotal) * 100
    }
  }

  generateOrderNumber(): string {
    if (!this.orderNumber) {
      this.orderNumber = `ORD-${this.poolId.substring(0, 8)}-${Date.now()}`
      this.orderDate = new Date()
    }
    return this.orderNumber
  }

  markAsDelivered(deliveryDate?: Date): void {
    this.delivered = true
    this.actualDeliveryDate = deliveryDate || new Date()
  }

  markAsInvoiced(): void {
    this.invoiced = true
  }

  markAsPaid(): void {
    this.paid = true
  }

  addFeedback(rating: number, feedback: string, wouldParticipateAgain: boolean = true): void {
    this.satisfactionRating = Math.max(1, Math.min(5, rating))
    this.feedback = feedback
    this.wouldParticipateAgain = wouldParticipateAgain
  }

  getParticipationDurationDays(): number {
    const endDate = this.actualDeliveryDate || new Date()
    const startDate = this.createdAt
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  isEligibleForPool(pool: PurchasePool): boolean {
    // Vérifier les critères d'éligibilité
    if (pool.status !== 'FORMING') return false
    if (pool.currentParticipants >= pool.maxParticipants) return false
    if (new Date() > pool.formationDeadline) return false
    
    return true
  }

  getDeliveryDelayDays(): number {
    if (!this.actualDeliveryDate || !this.expectedDeliveryDate) return 0
    
    const actualTime = this.actualDeliveryDate.getTime()
    const expectedTime = this.expectedDeliveryDate.getTime()
    const diffTime = actualTime - expectedTime
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  getCompletionRate(): number {
    if (!this.allocatedQuantity || !this.committedQuantity) return 0
    return (this.allocatedQuantity / this.committedQuantity) * 100
  }

  canWithdraw(): boolean {
    return [ParticipationStatus.PENDING, ParticipationStatus.ACTIVE].includes(this.status)
  }

  isCompleted(): boolean {
    return this.delivered && this.invoiced && this.paid
  }
}