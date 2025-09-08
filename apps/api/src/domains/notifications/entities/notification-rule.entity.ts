import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import { NotificationAction } from './notification-action.entity';
// import { NotificationCondition } from './notification-condition.entity';
// import { NotificationExecution } from './notification-execution.entity';

/**
 * Rule types
 */
export enum RuleType {
  EVENT = 'EVENT', // Triggered by system events
  THRESHOLD = 'THRESHOLD', // Triggered by value thresholds
  SCHEDULE = 'SCHEDULE', // Triggered by schedule
  CONDITION = 'CONDITION', // Triggered by complex conditions
  ALERT = 'ALERT', // System alerts
  WORKFLOW = 'WORKFLOW', // Workflow-based rules
}

/**
 * Rule status
 */
export enum RuleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TESTING = 'TESTING',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Rule priority
 */
export enum RulePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Rule category
 */
export enum RuleCategory {
  INVENTORY = 'INVENTORY',
  ORDERS = 'ORDERS',
  PRODUCTION = 'PRODUCTION',
  FINANCE = 'FINANCE',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  CUSTOM = 'CUSTOM',
}

/**
 * Notification rule entity
 */
@Entity('notification_rules')
@Index(['code'], { unique: true })
@Index(['type', 'status'])
@Index(['category'])
@Index(['priority'])
@Index(['societeId'])
export class NotificationRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: RuleType,
    default: RuleType.EVENT,
  })
  type!: RuleType

  @Column({
    type: 'enum',
    enum: RuleStatus,
    default: RuleStatus.INACTIVE,
  })
  status!: RuleStatus

  @Column({
    type: 'enum',
    enum: RulePriority,
    default: RulePriority.MEDIUM,
  })
  priority!: RulePriority

  @Column({
    type: 'enum',
    enum: RuleCategory,
    default: RuleCategory.CUSTOM,
  })
  category!: RuleCategory

  @Column({ type: 'uuid', nullable: true })
  societeId?: string // null = global rule

  @Column({ type: 'uuid', nullable: true })
  siteId?: string // null = all sites

  @Column({ type: 'varchar', length: 255, nullable: true })
  eventName?: string // For EVENT type rules

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceType?: string // e.g., 'article', 'order', 'user'

  @Column({ type: 'jsonb', nullable: true })
  eventFilters?: {
    properties?: Record<string, unknown>
    metadata?: Record<string, unknown>
    excludePatterns?: string[]
    includePatterns?: string[]
  }

  @Column({ type: 'jsonb', nullable: true })
  schedule?: {
    cron?: string // Cron expression
    timezone?: string
    startDate?: string
    endDate?: string
    excludeDates?: string[]
    includeDates?: string[]
  }

  @Column({ type: 'jsonb', nullable: true })
  threshold?: {
    metric: string
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between'
    value: number | string
    value2?: number | string // For 'between' operator
    unit?: string
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count'
    window?: number // Time window in minutes
  }

  @Column({ type: 'jsonb', default: {} })
  recipientRules!: {
    users?: string[] // User IDs
    roles?: string[] // Role codes
    emails?: string[] // Direct email addresses
    groups?: string[] // Group IDs
    dynamicRecipients?: {
      source: 'owner' | 'manager' | 'assignee' | 'watcher' | 'custom'
      field?: string
      query?: string
    }
    excludeUsers?: string[]
    excludeRoles?: string[]
  }

  @Column({ type: 'jsonb', default: {} })
  deliverySettings!: {
    channels: ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[]
    emailTemplate?: string
    smsTemplate?: string
    pushTemplate?: string
    inAppTemplate?: string
    webhookUrl?: string
    webhookMethod?: 'GET' | 'POST' | 'PUT'
    webhookHeaders?: Record<string, string>
    retry?: {
      enabled: boolean
      maxAttempts: number
      backoffSeconds: number
    }
    batch?: {
      enabled: boolean
      size: number
      delaySeconds: number
    }
    rateLimit?: {
      maxPerMinute?: number
      maxPerHour?: number
      maxPerDay?: number
    }
  }

  @Column({ type: 'jsonb', default: {} })
  cooldown?: {
    enabled: boolean
    minutes: number
    perUser?: boolean
    perResource?: boolean
    key?: string // Custom cooldown key
  }

  @Column({ type: 'jsonb', default: {} })
  escalation?: {
    enabled: boolean
    levels: Array<{
      delayMinutes: number
      recipients: {
        users?: string[]
        roles?: string[]
        emails?: string[]
      }
      channels: string[]
      condition?: string // JavaScript expression
    }>
  }

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @Column({ type: 'boolean', default: true })
  allowUserOverride!: boolean

  @Column({ type: 'boolean', default: false })
  requireAcknowledgment!: boolean

  @Column({ type: 'integer', default: 0 })
  executionCount!: number

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastExecutedAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextExecutionAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  activatedAt?: Date

  @Column({ type: 'timestamp with time zone', nullable: true })
  suspendedAt?: Date

  @Column({ type: 'varchar', length: 500, nullable: true })
  suspendedReason?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  // Relations
  @OneToMany('NotificationCondition', 'rule', { lazy: true })
  conditions!: unknown[]

  @OneToMany('NotificationAction', 'rule', { lazy: true })
  actions!: unknown[]

  @OneToMany('NotificationExecution', 'rule', { lazy: true })
  executions!: unknown[]

  // Utility methods

  /**
   * Check if rule is active
   */
  isActive(): boolean {
    return this.status === RuleStatus.ACTIVE
  }

  /**
   * Check if rule applies to a société
   */
  appliesTo(societeId: string, siteId?: string): boolean {
    // Global rule applies to all
    if (!this.societeId) {
      return true
    }

    // Check société match
    if (this.societeId !== societeId) {
      return false
    }

    // Check site match if specified
    if (this.siteId && siteId && this.siteId !== siteId) {
      return false
    }

    return true
  }

  /**
   * Check if rule matches event
   */
  matchesEvent(eventName: string, eventData?: any): boolean {
    if (this.type !== RuleType.EVENT) {
      return false
    }

    if (this.eventName !== eventName) {
      return false
    }

    // Check event filters
    if (this.eventFilters) {
      // Check property filters
      if (this.eventFilters.properties) {
        for (const [key, value] of Object.entries(this.eventFilters.properties)) {
          if (eventData?.[key] !== value) {
            return false
          }
        }
      }

      // Check exclude patterns
      if (this.eventFilters.excludePatterns?.length) {
        const eventStr = JSON.stringify(eventData)
        for (const pattern of this.eventFilters.excludePatterns) {
          if (new RegExp(pattern).test(eventStr)) {
            return false
          }
        }
      }

      // Check include patterns
      if (this.eventFilters.includePatterns?.length) {
        const eventStr = JSON.stringify(eventData)
        let hasMatch = false
        for (const pattern of this.eventFilters.includePatterns) {
          if (new RegExp(pattern).test(eventStr)) {
            hasMatch = true
            break
          }
        }
        if (!hasMatch) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Check if threshold is met
   */
  checkThreshold(value: number | string): boolean {
    if (this.type !== RuleType.THRESHOLD || !this.threshold) {
      return false
    }

    const threshold = this.threshold
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    const thresholdValue =
      typeof threshold.value === 'string' ? parseFloat(threshold.value) : threshold.value

    switch (threshold.operator) {
      case 'gt':
        return numValue > thresholdValue
      case 'gte':
        return numValue >= thresholdValue
      case 'lt':
        return numValue < thresholdValue
      case 'lte':
        return numValue <= thresholdValue
      case 'eq':
        return numValue === thresholdValue
      case 'neq':
        return numValue !== thresholdValue
      case 'between': {
        const value2 =
          typeof threshold.value2 === 'string' ? parseFloat(threshold.value2) : threshold.value2
        return value2 !== undefined && numValue >= thresholdValue && numValue <= value2
      }
      default:
        return false
    }
  }

  /**
   * Check if rule is in cooldown
   */
  isInCooldown(lastExecutionTime?: Date, _key?: string): boolean {
    if (!this.cooldown?.enabled || !lastExecutionTime) {
      return false
    }

    const now = new Date()
    const cooldownEnd = new Date(lastExecutionTime)
    cooldownEnd.setMinutes(cooldownEnd.getMinutes() + this.cooldown.minutes)

    return now < cooldownEnd
  }

  /**
   * Get priority weight
   */
  getPriorityWeight(): number {
    const weights = {
      [RulePriority.LOW]: 1,
      [RulePriority.MEDIUM]: 2,
      [RulePriority.HIGH]: 3,
      [RulePriority.CRITICAL]: 4,
    }
    return weights[this.priority] || 1
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      type: this.type,
      status: this.status,
      priority: this.priority,
      category: this.category,
      societeId: this.societeId,
      siteId: this.siteId,
      eventName: this.eventName,
      resourceType: this.resourceType,
      eventFilters: this.eventFilters,
      schedule: this.schedule,
      threshold: this.threshold,
      recipientRules: this.recipientRules,
      deliverySettings: this.deliverySettings,
      cooldown: this.cooldown,
      escalation: this.escalation,
      allowUserOverride: this.allowUserOverride,
      requireAcknowledgment: this.requireAcknowledgment,
      executionCount: this.executionCount,
      lastExecutedAt: this.lastExecutedAt,
      nextExecutionAt: this.nextExecutionAt,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
