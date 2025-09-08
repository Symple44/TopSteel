import * as crypto from 'node:crypto'
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import { LicenseActivation } from './license-activation.entity';
// import { LicenseFeature } from './license-feature.entity';
// import { LicenseUsage } from './license-usage.entity';

/**
 * License types
 */
export enum LicenseType {
  TRIAL = 'TRIAL',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

/**
 * License status
 */
export enum LicenseStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/**
 * Billing cycle
 */
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
  PERPETUAL = 'PERPETUAL',
}

/**
 * License entity
 */
@Entity('licenses')
@Index(['licenseKey'], { unique: true }) // Unique license key lookup
@Index(['societeId']) // Licenses by organization
@Index(['status']) // License status filtering
@Index(['expiresAt']) // License expiration tracking
@Index(['type']) // License type filtering
@Index(['societeId', 'status']) // Active licenses by organization
@Index(['status', 'expiresAt']) // Expiring licenses monitoring
@Index(['customerEmail']) // Customer license lookup
@Index(['billingCycle', 'nextRenewalAt']) // Billing cycle management
@Index(['activatedAt']) // License activation tracking
@Index(['suspendedAt']) // License suspension tracking
@Index(['createdBy']) // License creation audit
export class License {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index({ unique: true }) // Unique index for license key lookups
  licenseKey!: string

  @Column({ type: 'uuid' })
  @Index() // Index for organization-based queries
  societeId!: string

  @Column({ type: 'varchar', length: 255 })
  @Index() // Index for customer name searches
  customerName!: string

  @Column({ type: 'varchar', length: 255 })
  @Index() // Index for customer email lookups
  customerEmail!: string

  @Column({
    type: 'enum',
    enum: LicenseType,
    default: LicenseType.BASIC,
  })
  @Index() // Index for license type filtering
  type!: LicenseType

  @Column({
    type: 'enum',
    enum: LicenseStatus,
    default: LicenseStatus.PENDING,
  })
  @Index() // Index for license status filtering
  status!: LicenseStatus

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.ANNUAL,
  })
  @Index() // Index for billing cycle queries
  billingCycle!: BillingCycle

  @Column({ type: 'timestamp with time zone' })
  @Index() // Index for license start date filtering
  startsAt!: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index() // Index for license expiration tracking
  expiresAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastRenewalAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index() // Index for renewal scheduling
  nextRenewalAt?: Date

  @Column({ type: 'integer', default: 1 })
  maxUsers!: number

  @Column({ type: 'integer', default: 1 })
  maxSites!: number

  @Column({ type: 'integer', default: -1 })
  maxTransactions!: number // -1 = unlimited

  @Column({ type: 'integer', default: -1 })
  maxStorage!: number // in GB, -1 = unlimited

  @Column({ type: 'integer', default: 1 })
  maxApiCalls!: number // per day, -1 = unlimited

  @Column({ type: 'boolean', default: false })
  allowCustomModules!: boolean

  @Column({ type: 'boolean', default: false })
  allowApiAccess!: boolean

  @Column({ type: 'boolean', default: false })
  allowWhiteLabel!: boolean

  @Column({ type: 'boolean', default: true })
  autoRenew!: boolean

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency!: string

  @Column({ type: 'jsonb', default: {} })
  @Index() // GIN index for restrictions queries
  restrictions!: {
    ipWhitelist?: string[]
    domainWhitelist?: string[]
    maxConcurrentSessions?: number
    allowedCountries?: string[]
    blockedCountries?: string[]
  }

  @Column({ type: 'jsonb', default: {} })
  @Index() // GIN index for metadata queries
  metadata!: Record<string, unknown>

  @Column({ type: 'text', nullable: true })
  notes?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  signature?: string

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index() // Index for activation tracking
  activatedAt?: Date

  @Column({ type: 'uuid', nullable: true })
  @Index() // Index for activation audit
  activatedBy?: string

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index() // Index for suspension tracking
  suspendedAt?: Date

  @Column({ type: 'varchar', length: 500, nullable: true })
  suspendedReason?: string

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index() // Index for revocation tracking
  revokedAt?: Date

  @Column({ type: 'varchar', length: 500, nullable: true })
  revokedReason?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  @Index() // Index for creation audit
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  @Index() // Index for update audit
  updatedBy?: string

  // Relations
  @OneToMany('LicenseFeature', 'license')
  features!: unknown[]

  @OneToMany('LicenseUsage', 'license')
  usage!: unknown[]

  @OneToMany('LicenseActivation', 'license')
  activations!: unknown[]

  // Hooks
  @BeforeInsert()
  generateLicenseKey() {
    if (!this.licenseKey) {
      this.licenseKey = this.generateKey()
    }
  }

  // Utility methods

  /**
   * Generate a unique license key
   */
  private generateKey(): string {
    const prefix = this.type.substring(0, 3).toUpperCase()
    const random = crypto.randomBytes(16).toString('hex').toUpperCase()
    const formatted = random.match(/.{1,4}/g)?.join('-') || random
    return `${prefix}-${formatted}`
  }

  /**
   * Check if license is valid
   */
  isValid(): boolean {
    if (this.status !== LicenseStatus.ACTIVE) {
      return false
    }

    if (this.expiresAt && new Date() > this.expiresAt) {
      return false
    }

    return true
  }

  /**
   * Check if license is expired
   */
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false
  }

  /**
   * Check if license needs renewal
   */
  needsRenewal(daysBefore: number = 30): boolean {
    if (!this.expiresAt || this.billingCycle === BillingCycle.PERPETUAL) {
      return false
    }

    const renewalDate = new Date(this.expiresAt)
    renewalDate.setDate(renewalDate.getDate() - daysBefore)

    return new Date() >= renewalDate
  }

  /**
   * Get days until expiration
   */
  getDaysUntilExpiration(): number | null {
    if (!this.expiresAt) {
      return null
    }

    const now = new Date()
    const diff = this.expiresAt.getTime() - now.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if feature is enabled
   */
  hasFeature(featureCode: string): boolean {
    return this.features?.some((f) => f.featureCode === featureCode && f.isEnabled) || false
  }

  /**
   * Get feature limit
   */
  getFeatureLimit(featureCode: string): number | null {
    const feature = this.features?.find((f) => f.featureCode === featureCode)
    return feature?.limit ?? null
  }

  /**
   * Check IP restriction
   */
  isIpAllowed(ip: string): boolean {
    if (!this.restrictions.ipWhitelist?.length) {
      return true
    }

    return this.restrictions.ipWhitelist.includes(ip)
  }

  /**
   * Check domain restriction
   */
  isDomainAllowed(domain: string): boolean {
    if (!this.restrictions.domainWhitelist?.length) {
      return true
    }

    return this.restrictions.domainWhitelist.some((allowed) => domain.endsWith(allowed))
  }

  /**
   * Check country restriction
   */
  isCountryAllowed(country: string): boolean {
    if (this.restrictions.blockedCountries?.includes(country)) {
      return false
    }

    if (!this.restrictions.allowedCountries?.length) {
      return true
    }

    return this.restrictions.allowedCountries.includes(country)
  }

  /**
   * Calculate next renewal date
   */
  calculateNextRenewalDate(): Date | null {
    if (!this.expiresAt || this.billingCycle === BillingCycle.PERPETUAL) {
      return null
    }

    const nextDate = new Date(this.expiresAt)

    switch (this.billingCycle) {
      case BillingCycle.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case BillingCycle.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case BillingCycle.SEMI_ANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6)
        break
      case BillingCycle.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    return nextDate
  }

  /**
   * Sign the license
   */
  sign(privateKey: string): void {
    const data = JSON.stringify({
      id: this.id,
      licenseKey: this.licenseKey,
      societeId: this.societeId,
      type: this.type,
      expiresAt: this.expiresAt?.toISOString(),
      features: this.features?.map((f) => ({
        code: f.featureCode,
        enabled: f.isEnabled,
        limit: f.limit,
      })),
    })

    const sign = crypto.createSign('SHA256')
    sign.update(data)
    sign.end()

    this.signature = sign.sign(privateKey, 'hex')
  }

  /**
   * Verify license signature
   */
  verifySignature(publicKey: string): boolean {
    if (!this.signature) {
      return false
    }

    const data = JSON.stringify({
      id: this.id,
      licenseKey: this.licenseKey,
      societeId: this.societeId,
      type: this.type,
      expiresAt: this.expiresAt?.toISOString(),
      features: this.features?.map((f) => ({
        code: f.featureCode,
        enabled: f.isEnabled,
        limit: f.limit,
      })),
    })

    const verify = crypto.createVerify('SHA256')
    verify.update(data)
    verify.end()

    return verify.verify(publicKey, this.signature, 'hex')
  }

  /**
   * Get license summary
   */
  getSummary(): Record<string, unknown> {
    return {
      id: this.id,
      licenseKey: this.licenseKey,
      type: this.type,
      status: this.status,
      customer: {
        name: this.customerName,
        email: this.customerEmail,
        societeId: this.societeId,
      },
      validity: {
        startsAt: this.startsAt,
        expiresAt: this.expiresAt,
        isValid: this.isValid(),
        isExpired: this.isExpired(),
        daysUntilExpiration: this.getDaysUntilExpiration(),
        needsRenewal: this.needsRenewal(),
      },
      limits: {
        maxUsers: this.maxUsers,
        maxSites: this.maxSites,
        maxTransactions: this.maxTransactions,
        maxStorage: this.maxStorage,
        maxApiCalls: this.maxApiCalls,
      },
      permissions: {
        allowCustomModules: this.allowCustomModules,
        allowApiAccess: this.allowApiAccess,
        allowWhiteLabel: this.allowWhiteLabel,
      },
      billing: {
        cycle: this.billingCycle,
        price: this.price,
        currency: this.currency,
        autoRenew: this.autoRenew,
        nextRenewalAt: this.nextRenewalAt,
      },
    }
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getSummary(),
      features: this.features?.map((f) => f.toJSON()),
      restrictions: this.restrictions,
      metadata: this.metadata,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
