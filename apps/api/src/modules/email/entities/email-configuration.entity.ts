import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('email_configurations')
export class EmailConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'provider', length: 20 })
  provider: 'google' | 'microsoft' | 'smtp'

  @Column({ name: 'name', length: 100 })
  name: string

  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled: boolean

  @Column({ name: 'default_from', length: 255 })
  defaultFrom: string

  @Column({ name: 'default_from_name', length: 100, nullable: true })
  defaultFromName: string | null

  @Column({ name: 'oauth2_config', type: 'jsonb', nullable: true })
  oauth2Config: string | null

  @Column({ name: 'smtp_config', type: 'jsonb', nullable: true })
  smtpConfig: string | null

  @Column({ name: 'rate_limit_config', type: 'jsonb', nullable: true })
  rateLimitConfig: string | null

  @Column({ name: 'retry_config', type: 'jsonb', nullable: true })
  retryConfig: string | null

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean

  @Column({ name: 'priority', type: 'int', default: 0 })
  priority: number

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'environment', length: 20, default: 'production' })
  environment: 'development' | 'staging' | 'production'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null

  @Column({ name: 'last_connection_test', type: 'timestamp', nullable: true })
  lastConnectionTest: Date | null

  @Column({ name: 'connection_status', length: 20, default: 'unknown' })
  connectionStatus: 'connected' | 'error' | 'unknown'

  @Column({ name: 'connection_error', type: 'text', nullable: true })
  connectionError: string | null

  @Column({ name: 'daily_quota', type: 'int', nullable: true })
  dailyQuota: number | null

  @Column({ name: 'daily_sent', type: 'int', default: 0 })
  dailySent: number

  @Column({ name: 'last_quota_reset', type: 'date', nullable: true })
  lastQuotaReset: Date | null

  @Column({ name: 'webhook_url', length: 500, nullable: true })
  webhookUrl: string | null

  @Column({ name: 'webhook_events', type: 'jsonb', nullable: true })
  webhookEvents: string[] | null
}