import { Column, Entity, Index, OneToMany } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'
import { NotificationRuleExecution } from './notification-rule-execution.entity'

export enum TriggerType {
  USER = 'user',
  STOCK = 'stock',
  EMAIL = 'email',
  PROJECT = 'project',
  PRODUCTION = 'production',
  SYSTEM = 'system',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  REGEX = 'regex',
}

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
}

export enum LogicOperator {
  AND = 'AND',
  OR = 'OR',
}

export interface RuleCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: string | number | boolean | string[]
  type: FieldType
  logic?: LogicOperator
}

export interface EventTrigger {
  type: TriggerType
  event: string
  source?: string
}

export interface NotificationConfig {
  type: 'info' | 'success' | 'warning' | 'error'
  category: string
  titleTemplate: string
  messageTemplate: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  recipientType: 'all' | 'role' | 'user' | 'group'
  recipientIds?: string[]
  actionUrl?: string
  actionLabel?: string
  actionType?: 'primary' | 'secondary'
  persistent: boolean
  expiresIn?: number // en heures
}

@Entity('notification_rules')
export class NotificationRule extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'jsonb' })
  trigger!: EventTrigger

  @Column({ type: 'jsonb', default: '[]' })
  conditions!: RuleCondition[]

  @Column({ type: 'jsonb' })
  notification!: NotificationConfig

  @Column({ type: 'integer', default: 0 })
  triggerCount!: number

  @Column({ type: 'timestamp', nullable: true })
  lastTriggered?: Date

  @Column({ type: 'timestamp', nullable: true })
  lastModified?: Date

  @Column({ type: 'uuid', nullable: true })
  @Index()
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  modifiedBy?: string

  @OneToMany(() => NotificationRuleExecution, execution => execution.rule)
  executions!: NotificationRuleExecution[]

  // Méthodes utilitaires
  incrementTriggerCount(): void {
    this.triggerCount++
    this.lastTriggered = new Date()
  }

  canExecute(): boolean {
    return this.isActive && !!this.trigger && !!this.notification
  }

  getConditionsSummary(): string {
    if (!this.conditions || this.conditions.length === 0) {
      return 'Aucune condition'
    }

    return this.conditions.map((condition, index) => {
      const logicText = index > 0 ? ` ${condition.logic} ` : ''
      return `${logicText}${condition.field} ${condition.operator} ${condition.value}`
    }).join('')
  }
}