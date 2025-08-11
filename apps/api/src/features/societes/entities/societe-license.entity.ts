import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Societe } from './societe.entity'

export enum LicenseType {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

@Entity('societe_licenses')
@Index(['societeId', 'status'])
@Index(['expiresAt'])
export class SocieteLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  societeId: string

  @OneToOne(() => Societe, (societe) => societe.license, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'societeId' })
  societe: Societe

  @Column({
    type: 'enum',
    enum: LicenseType,
    default: LicenseType.BASIC,
  })
  type: LicenseType

  @Column({
    type: 'enum',
    enum: LicenseStatus,
    default: LicenseStatus.PENDING,
  })
  status: LicenseStatus

  @Column({ type: 'int', default: 5 })
  maxUsers: number

  @Column({ type: 'int', default: 0 })
  currentUsers: number

  @Column({ type: 'int', nullable: true })
  maxSites?: number

  @Column({ type: 'int', default: 0 })
  currentSites: number

  @Column({ type: 'int', nullable: true })
  maxStorageGB?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStorageGB: number

  @Column({ type: 'boolean', default: true })
  allowConcurrentSessions: boolean

  @Column({ type: 'int', nullable: true })
  maxConcurrentSessions?: number

  @Column({ type: 'jsonb', nullable: true })
  features: {
    marketplace?: boolean
    advancedReporting?: boolean
    apiAccess?: boolean
    customIntegrations?: boolean
    multiCurrency?: boolean
    advancedWorkflows?: boolean
    [key: string]: boolean | undefined
  }

  @Column({ type: 'jsonb', nullable: true })
  restrictions: {
    maxTransactionsPerMonth?: number
    maxProductsPerCatalog?: number
    maxProjectsPerMonth?: number
    maxInvoicesPerMonth?: number
    [key: string]: number | undefined
  }

  @Column({ type: 'timestamp', nullable: true })
  validFrom?: Date

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  lastCheckAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  lastNotificationAt?: Date

  @Column({ type: 'int', default: 0 })
  violationCount: number

  @Column({ type: 'jsonb', nullable: true })
  violationHistory: Array<{
    date: Date
    type: string
    details: string
    resolved: boolean
  }>

  @Column({ type: 'varchar', length: 500, nullable: true })
  licenseKey?: string

  @Column({ type: 'jsonb', nullable: true })
  billing: {
    plan?: string
    amount?: number
    currency?: string
    frequency?: 'monthly' | 'yearly' | 'one-time'
    lastPayment?: Date
    nextPayment?: Date
  }

  @Column({ type: 'text', nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  // Méthodes utilitaires
  isValid(): boolean {
    if (this.status !== LicenseStatus.ACTIVE) return false
    if (this.expiresAt && this.expiresAt < new Date()) return false
    if (this.validFrom && this.validFrom > new Date()) return false
    return true
  }

  hasAvailableUserSlots(): boolean {
    return this.currentUsers < this.maxUsers
  }

  hasAvailableSiteSlots(): boolean {
    if (!this.maxSites) return true
    return this.currentSites < this.maxSites
  }

  isStorageExceeded(): boolean {
    if (!this.maxStorageGB) return false
    return this.currentStorageGB > this.maxStorageGB
  }

  getDaysUntilExpiration(): number | null {
    if (!this.expiresAt) return null
    const now = new Date()
    const diff = this.expiresAt.getTime() - now.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  getUserUtilizationPercent(): number {
    if (this.maxUsers === 0) return 0
    return Math.round((this.currentUsers / this.maxUsers) * 100)
  }

  needsRenewalNotification(): boolean {
    if (!this.expiresAt) return false
    const daysLeft = this.getDaysUntilExpiration()
    if (!daysLeft) return false
    
    // Notifier 30, 15, 7, 3, 1 jours avant expiration
    const notificationDays = [30, 15, 7, 3, 1]
    return notificationDays.includes(daysLeft)
  }
}