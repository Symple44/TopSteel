import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
// import { License } from './license.entity';

/**
 * Feature categories
 */
export enum FeatureCategory {
  CORE = 'CORE',
  INVENTORY = 'INVENTORY',
  PRODUCTION = 'PRODUCTION',
  SALES = 'SALES',
  FINANCE = 'FINANCE',
  REPORTING = 'REPORTING',
  INTEGRATION = 'INTEGRATION',
  CUSTOMIZATION = 'CUSTOMIZATION',
  SECURITY = 'SECURITY',
  SUPPORT = 'SUPPORT',
}

/**
 * License feature entity
 */
@Entity('license_features')
@Unique(['licenseId', 'featureCode'])
@Index(['licenseId'])
@Index(['featureCode'])
@Index(['category'])
export class LicenseFeature {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  licenseId!: string

  @Column({ type: 'varchar', length: 100 })
  featureCode!: string

  @Column({ type: 'varchar', length: 255 })
  featureName!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: FeatureCategory,
    default: FeatureCategory.CORE,
  })
  category!: FeatureCategory

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean

  @Column({ type: 'integer', nullable: true })
  limit?: number // null = unlimited

  @Column({ type: 'integer', default: 0 })
  used!: number

  @Column({ type: 'timestamp with time zone', nullable: true })
  enabledAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  disabledAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date

  @Column({ type: 'jsonb', default: {} })
  configuration!: Record<string, unknown>

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne('License', 'features', { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'license_id' })
  license!: any

  // Utility methods

  /**
   * Check if feature is available
   */
  isAvailable(): boolean {
    if (!this.isEnabled) {
      return false
    }

    if (this.expiresAt && new Date() > this.expiresAt) {
      return false
    }

    if (this.limit !== undefined && this.used >= this.limit) {
      return false
    }

    return true
  }

  /**
   * Check if feature has reached its limit
   */
  hasReachedLimit(): boolean {
    return this.limit !== undefined && this.used >= this.limit
  }

  /**
   * Get remaining usage
   */
  getRemainingUsage(): number | undefined {
    if (this.limit === undefined) {
      return undefined
    }

    return Math.max(0, this.limit - this.used)
  }

  /**
   * Get usage percentage
   */
  getUsagePercentage(): number | undefined {
    if (this.limit === undefined || this.limit === 0) {
      return undefined
    }

    return Math.min(100, (this.used / this.limit) * 100)
  }

  /**
   * Increment usage
   */
  incrementUsage(amount: number = 1): boolean {
    if (this.limit !== undefined && this.used + amount > this.limit) {
      return false
    }

    this.used += amount
    return true
  }

  /**
   * Decrement usage
   */
  decrementUsage(amount: number = 1): boolean {
    if (this.used - amount < 0) {
      return false
    }

    this.used -= amount
    return true
  }

  /**
   * Reset usage
   */
  resetUsage(): void {
    this.used = 0
  }

  /**
   * Enable feature
   */
  enable(): void {
    this.isEnabled = true
    this.enabledAt = new Date()
    this.disabledAt = undefined
  }

  /**
   * Disable feature
   */
  disable(): void {
    this.isEnabled = false
    this.disabledAt = new Date()
  }

  /**
   * Get configuration value
   */
  getConfig<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.configuration?.[key]
    return (value !== undefined ? value : defaultValue) as T | undefined
  }

  /**
   * Set configuration value
   */
  setConfig(key: string, value: any): void {
    if (!this.configuration) {
      this.configuration = {}
    }
    this.configuration[key] = value
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.featureCode,
      name: this.featureName,
      description: this.description,
      category: this.category,
      enabled: this.isEnabled,
      available: this.isAvailable(),
      limit: this.limit,
      used: this.used,
      remaining: this.getRemainingUsage(),
      usagePercentage: this.getUsagePercentage(),
      expiresAt: this.expiresAt,
      configuration: this.configuration,
      metadata: this.metadata,
    }
  }
}

/**
 * Standard feature codes
 */
export const STANDARD_FEATURES = {
  // Core features
  MULTI_USER: 'MULTI_USER',
  MULTI_SITE: 'MULTI_SITE',
  MULTI_LANGUAGE: 'MULTI_LANGUAGE',
  AUDIT_TRAIL: 'AUDIT_TRAIL',

  // Inventory features
  INVENTORY_MANAGEMENT: 'INVENTORY_MANAGEMENT',
  STOCK_MOVEMENTS: 'STOCK_MOVEMENTS',
  BARCODE_SCANNING: 'BARCODE_SCANNING',
  BATCH_TRACKING: 'BATCH_TRACKING',

  // Production features
  PRODUCTION_PLANNING: 'PRODUCTION_PLANNING',
  WORK_ORDERS: 'WORK_ORDERS',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  MACHINE_MONITORING: 'MACHINE_MONITORING',

  // Sales features
  QUOTATIONS: 'QUOTATIONS',
  ORDERS_MANAGEMENT: 'ORDERS_MANAGEMENT',
  INVOICING: 'INVOICING',
  PRICING_RULES: 'PRICING_RULES',
  DISCOUNTS: 'DISCOUNTS',

  // Finance features
  ACCOUNTING: 'ACCOUNTING',
  PAYMENT_TRACKING: 'PAYMENT_TRACKING',
  BUDGET_MANAGEMENT: 'BUDGET_MANAGEMENT',
  FINANCIAL_REPORTS: 'FINANCIAL_REPORTS',

  // Reporting features
  CUSTOM_REPORTS: 'CUSTOM_REPORTS',
  DASHBOARDS: 'DASHBOARDS',
  DATA_EXPORT: 'DATA_EXPORT',
  SCHEDULED_REPORTS: 'SCHEDULED_REPORTS',

  // Integration features
  API_ACCESS: 'API_ACCESS',
  WEBHOOK_INTEGRATION: 'WEBHOOK_INTEGRATION',
  THIRD_PARTY_SYNC: 'THIRD_PARTY_SYNC',
  EDI_SUPPORT: 'EDI_SUPPORT',

  // Customization features
  CUSTOM_FIELDS: 'CUSTOM_FIELDS',
  CUSTOM_WORKFLOWS: 'CUSTOM_WORKFLOWS',
  CUSTOM_MODULES: 'CUSTOM_MODULES',
  WHITE_LABEL: 'WHITE_LABEL',

  // Security features
  TWO_FACTOR_AUTH: 'TWO_FACTOR_AUTH',
  SSO_INTEGRATION: 'SSO_INTEGRATION',
  IP_RESTRICTION: 'IP_RESTRICTION',
  DATA_ENCRYPTION: 'DATA_ENCRYPTION',

  // Support features
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',
  PHONE_SUPPORT: 'PHONE_SUPPORT',
  DEDICATED_ACCOUNT: 'DEDICATED_ACCOUNT',
  TRAINING_SESSIONS: 'TRAINING_SESSIONS',
}
