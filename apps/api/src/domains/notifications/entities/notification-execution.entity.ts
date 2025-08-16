import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { NotificationRule } from './notification-rule.entity'

/**
 * Execution status
 */
export enum ExecutionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL', // Some actions succeeded, some failed
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
}

/**
 * Notification execution entity
 */
@Entity('notification_executions')
@Index(['ruleId', 'executedAt'])
@Index(['status'])
@Index(['executedAt'])
export class NotificationExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  ruleId!: string

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status!: ExecutionStatus

  @Column({ type: 'timestamp with time zone' })
  executedAt!: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date

  @Column({ type: 'integer', nullable: true })
  durationMs?: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  triggerType?: string // 'event', 'schedule', 'manual', 'api'

  @Column({ type: 'varchar', length: 255, nullable: true })
  triggerSource?: string // Event name, cron expression, user ID, etc.

  @Column({ type: 'jsonb', nullable: true })
  triggerData?: any // Event data or context

  @Column({ type: 'jsonb', nullable: true })
  conditionResults?: Array<{
    conditionId: string
    name: string
    result: boolean
    evaluationTime: number
    error?: string
  }>

  @Column({ type: 'boolean', nullable: true })
  conditionsPassed?: boolean

  @Column({ type: 'jsonb', nullable: true })
  actionResults?: Array<{
    actionId: string
    name: string
    type: string
    success: boolean
    executionTime: number
    result?: any
    error?: string
  }>

  @Column({ type: 'integer', default: 0 })
  totalActions!: number

  @Column({ type: 'integer', default: 0 })
  successfulActions!: number

  @Column({ type: 'integer', default: 0 })
  failedActions!: number

  @Column({ type: 'jsonb', nullable: true })
  recipients?: Array<{
    type: 'user' | 'email' | 'role' | 'group'
    id?: string
    email?: string
    name?: string
    channel?: string
    delivered?: boolean
    deliveredAt?: string
    error?: string
  }>

  @Column({ type: 'integer', default: 0 })
  totalRecipients!: number

  @Column({ type: 'integer', default: 0 })
  deliveredCount!: number

  @Column({ type: 'integer', default: 0 })
  failedDeliveries!: number

  @Column({ type: 'jsonb', nullable: true })
  notificationsSent?: Array<{
    id: string
    channel: string
    recipient: string
    sentAt: string
    status: string
    messageId?: string
  }>

  @Column({ type: 'text', nullable: true })
  errorMessage?: string

  @Column({ type: 'jsonb', nullable: true })
  errorDetails?: any

  @Column({ type: 'jsonb', nullable: true })
  escalations?: Array<{
    level: number
    triggeredAt: string
    recipients: string[]
    reason: string
  }>

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>

  @Column({ type: 'boolean', default: false })
  acknowledged!: boolean

  @Column({ type: 'uuid', nullable: true })
  acknowledgedBy?: string

  @Column({ type: 'timestamp with time zone', nullable: true })
  acknowledgedAt?: Date

  @Column({ type: 'text', nullable: true })
  acknowledgmentNote?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // Relations
  @ManyToOne(() => NotificationRule, rule => rule.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rule_id' })
  rule!: NotificationRule

  // Utility methods

  /**
   * Check if execution was successful
   */
  isSuccessful(): boolean {
    return this.status === ExecutionStatus.COMPLETED && this.failedActions === 0
  }

  /**
   * Check if execution had any failures
   */
  hasFailures(): boolean {
    return this.failedActions > 0 || this.status === ExecutionStatus.FAILED
  }

  /**
   * Check if execution is still running
   */
  isRunning(): boolean {
    return this.status === ExecutionStatus.PENDING || this.status === ExecutionStatus.PROCESSING
  }

  /**
   * Calculate execution duration
   */
  calculateDuration(): number | null {
    if (!this.completedAt) {
      return null
    }
    return this.completedAt.getTime() - this.executedAt.getTime()
  }

  /**
   * Get success rate for actions
   */
  getActionSuccessRate(): number {
    if (this.totalActions === 0) {
      return 0
    }
    return (this.successfulActions / this.totalActions) * 100
  }

  /**
   * Get delivery success rate
   */
  getDeliverySuccessRate(): number {
    if (this.totalRecipients === 0) {
      return 0
    }
    return (this.deliveredCount / this.totalRecipients) * 100
  }

  /**
   * Mark as completed
   */
  markCompleted(status: ExecutionStatus = ExecutionStatus.COMPLETED): void {
    this.status = status
    this.completedAt = new Date()
    this.durationMs = this.calculateDuration()
  }

  /**
   * Add condition result
   */
  addConditionResult(result: {
    conditionId: string
    name: string
    result: boolean
    evaluationTime: number
    error?: string
  }): void {
    if (!this.conditionResults) {
      this.conditionResults = []
    }
    this.conditionResults.push(result)
  }

  /**
   * Add action result
   */
  addActionResult(result: {
    actionId: string
    name: string
    type: string
    success: boolean
    executionTime: number
    result?: any
    error?: string
  }): void {
    if (!this.actionResults) {
      this.actionResults = []
    }
    this.actionResults.push(result)
    
    this.totalActions++
    if (result.success) {
      this.successfulActions++
    } else {
      this.failedActions++
    }
  }

  /**
   * Add recipient
   */
  addRecipient(recipient: {
    type: 'user' | 'email' | 'role' | 'group'
    id?: string
    email?: string
    name?: string
    channel?: string
  }): void {
    if (!this.recipients) {
      this.recipients = []
    }
    this.recipients.push({
      ...recipient,
      delivered: false,
    })
    this.totalRecipients++
  }

  /**
   * Mark recipient as delivered
   */
  markRecipientDelivered(
    recipientId: string,
    channel: string,
    messageId?: string
  ): void {
    if (!this.recipients) return

    const recipient = this.recipients.find(r => 
      r.id === recipientId || r.email === recipientId
    )
    
    if (recipient) {
      recipient.delivered = true
      recipient.deliveredAt = new Date().toISOString()
      recipient.channel = channel
      this.deliveredCount++

      if (!this.notificationsSent) {
        this.notificationsSent = []
      }
      this.notificationsSent.push({
        id: crypto.randomUUID(),
        channel,
        recipient: recipientId,
        sentAt: new Date().toISOString(),
        status: 'delivered',
        messageId,
      })
    }
  }

  /**
   * Mark recipient as failed
   */
  markRecipientFailed(recipientId: string, error: string): void {
    if (!this.recipients) return

    const recipient = this.recipients.find(r => 
      r.id === recipientId || r.email === recipientId
    )
    
    if (recipient) {
      recipient.delivered = false
      recipient.error = error
      this.failedDeliveries++
    }
  }

  /**
   * Add escalation
   */
  addEscalation(escalation: {
    level: number
    recipients: string[]
    reason: string
  }): void {
    if (!this.escalations) {
      this.escalations = []
    }
    this.escalations.push({
      ...escalation,
      triggeredAt: new Date().toISOString(),
    })
  }

  /**
   * Acknowledge execution
   */
  acknowledge(userId: string, note?: string): void {
    this.acknowledged = true
    this.acknowledgedBy = userId
    this.acknowledgedAt = new Date()
    this.acknowledgmentNote = note
  }

  /**
   * Get execution summary
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      ruleId: this.ruleId,
      status: this.status,
      executedAt: this.executedAt,
      completedAt: this.completedAt,
      duration: this.durationMs || this.calculateDuration(),
      trigger: {
        type: this.triggerType,
        source: this.triggerSource,
      },
      conditions: {
        passed: this.conditionsPassed,
        total: this.conditionResults?.length || 0,
        results: this.conditionResults,
      },
      actions: {
        total: this.totalActions,
        successful: this.successfulActions,
        failed: this.failedActions,
        successRate: this.getActionSuccessRate(),
        results: this.actionResults,
      },
      delivery: {
        totalRecipients: this.totalRecipients,
        delivered: this.deliveredCount,
        failed: this.failedDeliveries,
        successRate: this.getDeliverySuccessRate(),
      },
      escalations: this.escalations?.length || 0,
      acknowledged: this.acknowledged,
      error: this.errorMessage,
    }
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, any> {
    return {
      ...this.getSummary(),
      triggerData: this.triggerData,
      recipients: this.recipients,
      notificationsSent: this.notificationsSent,
      errorDetails: this.errorDetails,
      escalations: this.escalations,
      metadata: this.metadata,
      acknowledgment: this.acknowledged ? {
        by: this.acknowledgedBy,
        at: this.acknowledgedAt,
        note: this.acknowledgmentNote,
      } : null,
      createdAt: this.createdAt,
    }
  }
}