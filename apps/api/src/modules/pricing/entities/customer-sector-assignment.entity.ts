import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm'
import { TenantEntity } from '../../../core/database/entities/base/multi-tenant.entity'
import { SectorType } from './sector-coefficient.entity'

@Entity('customer_sector_assignments')
@Index(['customerId'])
export class CustomerSectorAssignment extends TenantEntity {
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
    sourceDocument?: string // Document source (devis, commande, etc.)
    validationCriteria?: string[] // Critères de validation utilisés
  }

  // Métadonnées du secteur client
  @Column({ type: 'jsonb', default: {} })
  sectorMetadata!: {
    companySize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise'
    mainActivity?: string
    subSectors?: string[] // Sous-secteurs d'activité
    certifications?: string[] // Certifications sectorielles (QUALIBAT, RGE, etc.)
    specializations?: string[] // Spécialisations
    geographicZones?: string[] // Zones géographiques d'intervention
    yearlyVolume?: number // Volume d'affaires annuel estimé
    preferredSuppliers?: string[] // Fournisseurs préférés
    paymentTerms?: string // Conditions de paiement habituelles

    // Spécifique BTP
    btpInfo?: {
      siretBtp?: string
      qualibatNumber?: string
      rgeQualification?: boolean
      cnetp?: boolean // Caisse nationale des entrepreneurs de travaux publics
      worksTypes?: string[] // Types de travaux (maçonnerie, charpente, etc.)
      certifications?: string[] // QUALIBAT, QUALIFELEC, etc.
      insurance?: {
        decennale?: boolean
        responsabiliteCivile?: boolean
        validUntil?: Date
      }
    }
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    notes?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high' | 'critical'
    relationshipManager?: string // Gestionnaire de compte
    lastReview?: Date
    nextReview?: Date
    reviewFrequency?: number // Mois entre les révisions
    alerts?: Array<{
      type: 'contract_expiry' | 'volume_decrease' | 'payment_delay' | 'other'
      message: string
      severity: 'info' | 'warning' | 'error'
      createdAt: Date
    }>
  }

  // Relations
  // @ManyToOne(() => Client, client => client.sectorAssignments)
  // @JoinColumn({ name: 'customerId' })
  // customer!: Client

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
    this.metadata.reviewFrequency = months
  }

  updateLastReview(): void {
    if (!this.metadata) this.metadata = {}
    this.metadata.lastReview = new Date()
  }

  addAlert(
    type: 'contract_expiry' | 'volume_decrease' | 'payment_delay' | 'other',
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): void {
    if (!this.metadata) this.metadata = {}
    if (!this.metadata.alerts) this.metadata.alerts = []

    this.metadata.alerts.push({
      type,
      message,
      severity,
      createdAt: new Date(),
    })
  }

  getActiveAlerts(): Array<{ type: string; message: string; severity: string; createdAt: Date }> {
    return this.metadata?.alerts || []
  }

  isBTPSector(): boolean {
    return this.sector === SectorType.BTP
  }

  getBTPInfo() {
    return this.sectorMetadata?.btpInfo
  }

  hasValidBTPInsurance(): boolean {
    if (!this.isBTPSector()) return true

    const btpInfo = this.getBTPInfo()
    if (!btpInfo?.insurance) return false

    const now = new Date()
    return (
      btpInfo.insurance.decennale === true &&
      btpInfo.insurance.responsabiliteCivile === true &&
      (!btpInfo.insurance.validUntil || btpInfo.insurance.validUntil > now)
    )
  }
}
