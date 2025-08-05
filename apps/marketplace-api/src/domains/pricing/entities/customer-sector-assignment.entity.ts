import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { SectorType } from './sector-coefficient.entity'

@Entity('marketplace_customer_sector_assignments')
@Index(['societeId', 'customerId'])
export class CustomerSectorAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  societeId!: string

  @Column({ type: 'uuid' })
  @Index()
  customerId!: string

  @Column({ type: 'enum', enum: SectorType })
  @Index()
  sector!: SectorType

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName?: string // Cache du nom client

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerCode?: string // Cache du code client

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'date', nullable: true })
  validFrom?: Date

  @Column({ type: 'date', nullable: true })
  validUntil?: Date

  // Informations sur l'assignation
  @Column({ type: 'jsonb', default: {} })
  assignmentDetails!: {
    assignedBy?: string // Utilisateur qui a fait l'assignation
    reason?: string // Raison de l'assignation
    approvalRequired?: boolean
    approvedBy?: string
    approvedAt?: Date
    automaticAssignment?: boolean // Assignation automatique vs manuelle
    confidence?: number // Niveau de confiance pour assignation auto (0-100)
  }

  // Métadonnées du secteur client
  @Column({ type: 'jsonb', default: {} })
  sectorMetadata!: {
    companySize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise'
    mainActivity?: string
    subSectors?: string[] // Sous-secteurs d'activité
    certifications?: string[] // Certifications sectorielles
    specializations?: string[] // Spécialisations
    geographicZones?: string[] // Zones géographiques d'intervention
    yearlyVolume?: number // Volume d'affaires annuel estimé
    preferredSuppliers?: string[] // Fournisseurs préférés
    paymentTerms?: string // Conditions de paiement habituelles
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    notes?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high' | 'critical'
    relationshipManager?: string // Gestionnaire de compte
    lastReview?: Date
    nextReview?: Date
  }

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Méthodes utilitaires
  isValidAssignment(date: Date = new Date()): boolean {
    if (!this.isActive) return false

    if (this.validFrom && date < this.validFrom) return false
    if (this.validUntil && date > this.validUntil) return false

    return true
  }

  needsApproval(): boolean {
    return this.assignmentDetails.approvalRequired === true && !this.assignmentDetails.approvedBy
  }

  isApproved(): boolean {
    return !this.assignmentDetails.approvalRequired || !!this.assignmentDetails.approvedBy
  }

  approve(approvedBy: string): void {
    this.assignmentDetails.approvedBy = approvedBy
    this.assignmentDetails.approvedAt = new Date()
  }

  scheduleReview(months: number = 12): void {
    if (!this.metadata) this.metadata = {}

    const nextReview = new Date()
    nextReview.setMonth(nextReview.getMonth() + months)
    this.metadata.nextReview = nextReview
  }

  updateLastReview(): void {
    if (!this.metadata) this.metadata = {}
    this.metadata.lastReview = new Date()
  }
}
