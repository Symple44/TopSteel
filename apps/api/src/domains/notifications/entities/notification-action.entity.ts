import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import { NotificationRule } from './notification-rule.entity';

/**
 * Action types
 */
export enum ActionType {
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  UPDATE_FIELD = 'UPDATE_FIELD',
  EXECUTE_FUNCTION = 'EXECUTE_FUNCTION',
  CALL_API = 'CALL_API',
  CREATE_TASK = 'CREATE_TASK',
  TRIGGER_WORKFLOW = 'TRIGGER_WORKFLOW',
  LOG_EVENT = 'LOG_EVENT',
  SEND_REPORT = 'SEND_REPORT',
  ESCALATE = 'ESCALATE',
  CUSTOM = 'CUSTOM',
}

/**
 * Notification action entity
 */
@Entity('notification_actions')
@Index(['ruleId'])
@Index(['type'])
export class NotificationAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  ruleId!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: ActionType,
    default: ActionType.SEND_NOTIFICATION,
  })
  type!: ActionType

  @Column({ type: 'integer', default: 0 })
  orderIndex!: number

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'boolean', default: false })
  stopOnError!: boolean

  @Column({ type: 'integer', nullable: true })
  delaySeconds?: number

  // Send notification action
  @Column({ type: 'jsonb', nullable: true })
  notificationConfig?: {
    templateId?: string
    title?: string
    body?: string
    data?: Record<string, unknown>
    channels?: ('email' | 'sms' | 'push' | 'in_app')[]
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    ttl?: number // Time to live in seconds
    groupKey?: string // For grouping notifications
    actions?: Array<{
      id: string
      label: string
      url?: string
      action?: string
    }>
  }

  // Update field action
  @Column({ type: 'jsonb', nullable: true })
  updateFieldConfig?: {
    entity: string
    fieldPath: string
    value: any
    operation?: 'set' | 'increment' | 'decrement' | 'append' | 'prepend'
    condition?: string // JavaScript expression
  }

  // Execute function action
  @Column({ type: 'jsonb', nullable: true })
  functionConfig?: {
    name: string
    module?: string
    parameters?: Record<string, unknown>
    async?: boolean
    timeout?: number
  }

  // Call API action
  @Column({ type: 'jsonb', nullable: true })
  apiConfig?: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    headers?: Record<string, string>
    body?: any
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'api_key'
      credentials?: Record<string, string>
    }
    retryOnError?: boolean
    maxRetries?: number
    timeoutSeconds?: number
  }

  // Create task action
  @Column({ type: 'jsonb', nullable: true })
  taskConfig?: {
    title: string
    description?: string
    assignTo?: string // User ID or role
    dueDate?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    tags?: string[]
    metadata?: Record<string, unknown>
  }

  // Trigger workflow action
  @Column({ type: 'jsonb', nullable: true })
  workflowConfig?: {
    workflowId: string
    parameters?: Record<string, unknown>
    waitForCompletion?: boolean
    timeoutSeconds?: number
  }

  // Log event action
  @Column({ type: 'jsonb', nullable: true })
  logConfig?: {
    level: 'debug' | 'info' | 'warn' | 'error'
    message: string
    category?: string
    metadata?: Record<string, unknown>
    destination?: 'console' | 'file' | 'database' | 'external'
  }

  // Send report action
  @Column({ type: 'jsonb', nullable: true })
  reportConfig?: {
    reportId: string
    format: 'pdf' | 'excel' | 'csv' | 'html'
    parameters?: Record<string, unknown>
    recipients?: string[]
    schedule?: string // Cron expression
  }

  // Custom action
  @Column({ type: 'jsonb', nullable: true })
  customConfig?: Record<string, unknown>

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @Column({ type: 'integer', default: 0 })
  executionCount!: number

  @Column({ type: 'integer', default: 0 })
  successCount!: number

  @Column({ type: 'integer', default: 0 })
  errorCount!: number

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastExecutedAt?: Date

  @Column({ type: 'boolean', nullable: true })
  lastExecutionSuccess?: boolean

  @Column({ type: 'text', nullable: true })
  lastExecutionError?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne('NotificationRule', 'actions', { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'rule_id' })
  rule!: any

  // Utility methods

  /**
   * Get action configuration
   */
  getConfig(): any {
    switch (this.type) {
      case ActionType.SEND_NOTIFICATION:
        return this.notificationConfig
      case ActionType.UPDATE_FIELD:
        return this.updateFieldConfig
      case ActionType.EXECUTE_FUNCTION:
        return this.functionConfig
      case ActionType.CALL_API:
        return this.apiConfig
      case ActionType.CREATE_TASK:
        return this.taskConfig
      case ActionType.TRIGGER_WORKFLOW:
        return this.workflowConfig
      case ActionType.LOG_EVENT:
        return this.logConfig
      case ActionType.SEND_REPORT:
        return this.reportConfig
      case ActionType.CUSTOM:
        return this.customConfig
      default:
        return null
    }
  }

  /**
   * Update execution statistics
   */
  updateStatistics(success: boolean, error?: string): void {
    this.executionCount++
    if (success) {
      this.successCount++
      this.lastExecutionSuccess = true
      this.lastExecutionError = undefined
    } else {
      this.errorCount++
      this.lastExecutionSuccess = false
      this.lastExecutionError = error || 'Unknown error'
    }
    this.lastExecutedAt = new Date()
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.executionCount === 0) {
      return 0
    }
    return (this.successCount / this.executionCount) * 100
  }

  /**
   * Check if action should be executed
   */
  shouldExecute(): boolean {
    return this.isActive
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      orderIndex: this.orderIndex,
      isActive: this.isActive,
      stopOnError: this.stopOnError,
      delaySeconds: this.delaySeconds,
      config: this.getConfig(),
      statistics: {
        executionCount: this.executionCount,
        successCount: this.successCount,
        errorCount: this.errorCount,
        successRate: this.getSuccessRate(),
        lastExecutedAt: this.lastExecutedAt,
        lastExecutionSuccess: this.lastExecutionSuccess,
        lastExecutionError: this.lastExecutionError,
      },
      metadata: this.metadata,
    }
  }
}
