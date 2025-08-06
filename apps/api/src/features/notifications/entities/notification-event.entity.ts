import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../core/common/base/base.entity'
import { TriggerType } from './notification-rule.entity'

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('notification_events')
export class NotificationEvent extends BaseAuditEntity {
  @Column({ type: 'enum', enum: TriggerType })
  @Index()
  type!: TriggerType

  @Column({ length: 100 })
  @Index()
  event!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  source?: string

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.PENDING })
  @Index()
  status!: EventStatus

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  occurredAt!: Date

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date

  @Column({ type: 'integer', default: 0 })
  rulesTriggered!: number

  @Column({ type: 'integer', default: 0 })
  notificationsCreated!: number

  @Column({ type: 'text', nullable: true })
  processingError?: string

  @Column({ type: 'jsonb', nullable: true })
  processingDetails?: Record<string, unknown>

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  entityType?: string

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index()
  entityId?: string

  // Méthodes utilitaires
  static create(
    type: TriggerType,
    event: string,
    data: Record<string, unknown>,
    source?: string,
    userId?: string,
    entityType?: string,
    entityId?: string
  ): NotificationEvent {
    const notificationEvent = new NotificationEvent()
    notificationEvent.type = type
    notificationEvent.event = event
    notificationEvent.data = data
    notificationEvent.source = source
    notificationEvent.userId = userId
    notificationEvent.entityType = entityType
    notificationEvent.entityId = entityId
    notificationEvent.status = EventStatus.PENDING
    notificationEvent.occurredAt = new Date()
    notificationEvent.rulesTriggered = 0
    notificationEvent.notificationsCreated = 0
    return notificationEvent
  }

  markAsProcessing(): void {
    this.status = EventStatus.PROCESSING
  }

  markAsProcessed(rulesTriggered: number, notificationsCreated: number): void {
    this.status = EventStatus.PROCESSED
    this.processedAt = new Date()
    this.rulesTriggered = rulesTriggered
    this.notificationsCreated = notificationsCreated
  }

  markAsFailed(error: string, details?: Record<string, unknown>): void {
    this.status = EventStatus.FAILED
    this.processedAt = new Date()
    this.processingError = error
    this.processingDetails = details
  }

  isPending(): boolean {
    return this.status === EventStatus.PENDING
  }

  isProcessing(): boolean {
    return this.status === EventStatus.PROCESSING
  }

  isProcessed(): boolean {
    return this.status === EventStatus.PROCESSED
  }

  isFailed(): boolean {
    return this.status === EventStatus.FAILED
  }

  getEventKey(): string {
    return `${this.type}:${this.event}`
  }
}
