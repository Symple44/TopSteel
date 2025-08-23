import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum SubscriptionStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
  PENDING = 'pending',
  BOUNCED = 'bounced'
}

@Entity('newsletter_subscriptions')
@Index(['societeId', 'email'], { unique: true })
export class NewsletterSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  societeId!: string

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  @Index()
  status!: SubscriptionStatus

  @Column({ type: 'jsonb', default: {} })
  preferences!: {
    categories?: string[] // Categories of newsletters to receive
    frequency?: 'daily' | 'weekly' | 'monthly' // How often to receive emails
    language?: string // Language preference
    format?: 'html' | 'text' // Email format preference
  }

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  source?: string // Where did the subscription come from (website, popup, etc.)

  @Column({ type: 'varchar', length: 255, nullable: true })
  confirmationToken?: string

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  unsubscribedAt?: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  unsubscribeToken?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  unsubscribeReason?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    customerType?: string
    tags?: string[]
    customFields?: Record<string, any>
    lastEmailSentAt?: string
    emailsSentCount?: number
    lastOpenedAt?: string
    openCount?: number
    lastClickedAt?: string
    clickCount?: number
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Helper methods
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE && this.confirmedAt !== null
  }

  isConfirmed(): boolean {
    return this.confirmedAt !== null
  }

  canReceiveEmails(): boolean {
    return this.isActive() && this.isConfirmed()
  }

  getDisplayName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`
    }
    if (this.firstName) {
      return this.firstName
    }
    return this.email.split('@')[0]
  }

  generateUnsubscribeToken(): string {
    const crypto = require('crypto')
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex')
    return this.unsubscribeToken
  }

  generateConfirmationToken(): string {
    const crypto = require('crypto')
    this.confirmationToken = crypto.randomBytes(32).toString('hex')
    return this.confirmationToken
  }

  confirm(): void {
    this.status = SubscriptionStatus.ACTIVE
    this.confirmedAt = new Date()
    this.confirmationToken = null
  }

  unsubscribe(reason?: string): void {
    this.status = SubscriptionStatus.UNSUBSCRIBED
    this.unsubscribedAt = new Date()
    this.unsubscribeReason = reason
  }

  updateActivity(type: 'open' | 'click'): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    const now = new Date().toISOString()
    
    if (type === 'open') {
      this.metadata.lastOpenedAt = now
      this.metadata.openCount = (this.metadata.openCount || 0) + 1
    } else if (type === 'click') {
      this.metadata.lastClickedAt = now
      this.metadata.clickCount = (this.metadata.clickCount || 0) + 1
    }
  }

  recordEmailSent(): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.lastEmailSentAt = new Date().toISOString()
    this.metadata.emailsSentCount = (this.metadata.emailsSentCount || 0) + 1
  }
}