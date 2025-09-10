import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { License } from './license.entity'

/**
 * Usage metric types
 */
export enum UsageMetricType {
  USERS = 'USERS',
  TRANSACTIONS = 'TRANSACTIONS',
  STORAGE = 'STORAGE',
  API_CALLS = 'API_CALLS',
  MODULES = 'MODULES',
  SITES = 'SITES',
  DOCUMENTS = 'DOCUMENTS',
  EMAILS = 'EMAILS',
  SMS = 'SMS',
  CUSTOM = 'CUSTOM',
}

/**
 * License usage tracking entity
 */
@Entity('license_usage')
@Index(['licenseId', 'recordedAt'])
@Index(['licenseId', 'metricType'])
@Index(['recordedAt'])
export class LicenseUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  licenseId!: string

  @Column({
    type: 'enum',
    enum: UsageMetricType,
  })
  metricType!: UsageMetricType

  @Column({ type: 'varchar', length: 100, nullable: true })
  metricName?: string

  @Column({ type: 'integer' })
  value!: number

  @Column({ type: 'integer', nullable: true })
  limit?: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number

  @Column({ type: 'timestamp with time zone' })
  recordedAt!: Date

  @Column({ type: 'date' })
  date!: string

  @Column({ type: 'integer', nullable: true })
  hour?: number

  @Column({ type: 'integer', nullable: true })
  week?: number

  @Column({ type: 'integer', nullable: true })
  month?: number

  @Column({ type: 'integer', nullable: true })
  year?: number

  @Column({ type: 'jsonb', default: {} })
  breakdown?: {
    byUser?: Record<string, number>
    bySite?: Record<string, number>
    byModule?: Record<string, number>
    byAction?: Record<string, number>
    custom?: Record<string, unknown>
  }

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // Relations
  @ManyToOne('License', 'usage', { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'license_id' })
  license!: License

  // Utility methods

  /**
   * Check if usage exceeds limit
   */
  exceedsLimit(): boolean {
    return this.limit !== null && this.limit !== undefined && this.value > this.limit
  }

  /**
   * Get usage status
   */
  getStatus(): 'normal' | 'warning' | 'critical' {
    if (!this.limit) {
      return 'normal'
    }

    const percentage = (this.value / this.limit) * 100

    if (percentage >= 95) {
      return 'critical'
    } else if (percentage >= 80) {
      return 'warning'
    }

    return 'normal'
  }

  /**
   * Calculate percentage if not set
   */
  calculatePercentage(): number | null {
    if (!this.limit || this.limit === 0) {
      return null
    }

    return Math.min(100, (this.value / this.limit) * 100)
  }

  /**
   * Get top consumers from breakdown
   */
  getTopConsumers(
    type: 'byUser' | 'bySite' | 'byModule' | 'byAction',
    limit: number = 5
  ): Array<{ key: string; value: number }> {
    const breakdown = this.breakdown?.[type]
    if (!breakdown) {
      return []
    }

    return Object.entries(breakdown)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
  }

  /**
   * Format for time series data
   */
  toTimeSeriesPoint(): { x: Date; y: number; metadata?: Record<string, unknown> } {
    return {
      x: this.recordedAt,
      y: this.value,
      metadata: {
        limit: this.limit,
        percentage: this.percentage || this.calculatePercentage(),
        status: this.getStatus(),
        exceeds: this.exceedsLimit(),
      },
    }
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      metricType: this.metricType,
      metricName: this.metricName,
      value: this.value,
      limit: this.limit,
      percentage: this.percentage || this.calculatePercentage(),
      status: this.getStatus(),
      exceedsLimit: this.exceedsLimit(),
      recordedAt: this.recordedAt,
      date: this.date,
      breakdown: this.breakdown,
      metadata: this.metadata,
    }
  }
}

/**
 * Usage aggregation periods
 */
export enum AggregationPeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

/**
 * Usage alert thresholds
 */
export interface UsageAlertThreshold {
  metricType: UsageMetricType
  threshold: number // percentage
  alertLevel: 'warning' | 'critical'
  notificationChannels: ('email' | 'sms' | 'webhook')[]
  cooldownMinutes: number
}
