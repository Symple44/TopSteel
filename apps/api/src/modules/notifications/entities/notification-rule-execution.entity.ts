import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'
import { NotificationRule } from './notification-rule.entity'
import { Notifications } from './notifications.entity'

export enum ExecutionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum ExecutionResult {
  NOTIFICATION_CREATED = 'notification_created',
  CONDITIONS_NOT_MET = 'conditions_not_met',
  RULE_INACTIVE = 'rule_inactive',
  TEMPLATE_ERROR = 'template_error',
  RECIPIENT_ERROR = 'recipient_error',
  SYSTEM_ERROR = 'system_error',
}

@Entity('notification_rule_executions')
export class NotificationRuleExecution extends BaseAuditEntity {
  @Column({ type: 'uuid' })
  @Index()
  ruleId!: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  notificationId?: string

  @Column({ type: 'enum', enum: ExecutionStatus })
  @Index()
  status!: ExecutionStatus

  @Column({ type: 'enum', enum: ExecutionResult })
  result!: ExecutionResult

  @Column({ type: 'jsonb' })
  eventData!: Record<string, any>

  @Column({ type: 'jsonb', nullable: true })
  conditionResults?: Record<string, any>

  @Column({ type: 'jsonb', nullable: true })
  templateVariables?: Record<string, any>

  @Column({ type: 'text', nullable: true })
  errorMessage?: string

  @Column({ type: 'jsonb', nullable: true })
  errorDetails?: Record<string, any>

  @Column({ type: 'integer', default: 0 })
  executionTimeMs!: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  executedAt!: Date

  @ManyToOne(() => NotificationRule, rule => rule.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ruleId' })
  rule!: NotificationRule

  @ManyToOne(() => Notifications, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'notificationId' })
  notification?: Notifications

  // Méthodes utilitaires
  static createSuccess(
    ruleId: string,
    notificationId: string,
    eventData: Record<string, any>,
    templateVariables: Record<string, any>,
    executionTimeMs: number
  ): NotificationRuleExecution {
    const execution = new NotificationRuleExecution()
    execution.ruleId = ruleId
    execution.notificationId = notificationId
    execution.status = ExecutionStatus.SUCCESS
    execution.result = ExecutionResult.NOTIFICATION_CREATED
    execution.eventData = eventData
    execution.templateVariables = templateVariables
    execution.executionTimeMs = executionTimeMs
    execution.executedAt = new Date()
    return execution
  }

  static createFailed(
    ruleId: string,
    eventData: Record<string, any>,
    result: ExecutionResult,
    errorMessage: string,
    errorDetails?: Record<string, any>,
    executionTimeMs: number = 0
  ): NotificationRuleExecution {
    const execution = new NotificationRuleExecution()
    execution.ruleId = ruleId
    execution.status = ExecutionStatus.FAILED
    execution.result = result
    execution.eventData = eventData
    execution.errorMessage = errorMessage
    execution.errorDetails = errorDetails
    execution.executionTimeMs = executionTimeMs
    execution.executedAt = new Date()
    return execution
  }

  static createSkipped(
    ruleId: string,
    eventData: Record<string, any>,
    result: ExecutionResult,
    conditionResults: Record<string, any>,
    executionTimeMs: number = 0
  ): NotificationRuleExecution {
    const execution = new NotificationRuleExecution()
    execution.ruleId = ruleId
    execution.status = ExecutionStatus.SKIPPED
    execution.result = result
    execution.eventData = eventData
    execution.conditionResults = conditionResults
    execution.executionTimeMs = executionTimeMs
    execution.executedAt = new Date()
    return execution
  }

  isSuccess(): boolean {
    return this.status === ExecutionStatus.SUCCESS
  }

  isFailed(): boolean {
    return this.status === ExecutionStatus.FAILED
  }

  isSkipped(): boolean {
    return this.status === ExecutionStatus.SKIPPED
  }
}