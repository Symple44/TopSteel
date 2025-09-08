import * as mathjs from 'mathjs'
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
import type {
  ConditionConfig,
  ConditionEvaluationContext,
  ExpressionEvaluationScope,
  NotificationConditionJson,
  NotificationRuleLazy,
} from '../types/notification-condition.types'
// import { NotificationRule } from './notification-rule.entity';

/**
 * Condition types
 */
export enum ConditionType {
  FIELD = 'FIELD', // Field comparison
  EXPRESSION = 'EXPRESSION', // JavaScript expression
  QUERY = 'QUERY', // Database query
  API = 'API', // External API call
  AGGREGATE = 'AGGREGATE', // Aggregation condition
  TIME = 'TIME', // Time-based condition
  COUNT = 'COUNT', // Count-based condition
}

/**
 * Condition operators
 */
export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  BETWEEN = 'BETWEEN',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  MATCHES = 'MATCHES',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
}

/**
 * Notification condition entity
 */
@Entity('notification_conditions')
@Index(['ruleId'])
@Index(['type'])
export class NotificationCondition {
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
    enum: ConditionType,
    default: ConditionType.FIELD,
  })
  type!: ConditionType

  @Column({ type: 'integer', default: 0 })
  orderIndex!: number

  @Column({ type: 'varchar', length: 10, default: 'AND' })
  logicalOperator!: 'AND' | 'OR' | 'NOT'

  // Field condition
  @Column({ type: 'varchar', length: 255, nullable: true })
  fieldPath?: string

  @Column({
    type: 'enum',
    enum: ConditionOperator,
    nullable: true,
  })
  operator?: ConditionOperator

  @Column({ type: 'jsonb', nullable: true })
  value?: unknown

  @Column({ type: 'jsonb', nullable: true })
  value2?: unknown // For BETWEEN operator

  // Expression condition
  @Column({ type: 'text', nullable: true })
  expression?: string // JavaScript expression

  // Query condition
  @Column({ type: 'text', nullable: true })
  query?: string // SQL or other query

  @Column({ type: 'varchar', length: 50, nullable: true })
  queryType?: 'sql' | 'mongodb' | 'elasticsearch'

  // API condition
  @Column({ type: 'varchar', length: 500, nullable: true })
  apiUrl?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  apiMethod?: 'GET' | 'POST'

  @Column({ type: 'jsonb', nullable: true })
  apiHeaders?: Record<string, string>

  @Column({ type: 'jsonb', nullable: true })
  apiBody?: Record<string, unknown>

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiResponsePath?: string // JSON path to extract value

  // Aggregate condition
  @Column({ type: 'varchar', length: 50, nullable: true })
  aggregateFunction?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct'

  @Column({ type: 'varchar', length: 255, nullable: true })
  aggregateField?: string

  @Column({ type: 'jsonb', nullable: true })
  aggregateFilters?: Record<string, unknown>

  @Column({ type: 'integer', nullable: true })
  aggregateWindow?: number // Time window in minutes

  // Time condition
  @Column({ type: 'varchar', length: 50, nullable: true })
  timeUnit?: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'

  @Column({ type: 'integer', nullable: true })
  timeValue?: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  timeReference?: 'now' | 'event_time' | 'field_value'

  // Count condition
  @Column({ type: 'varchar', length: 255, nullable: true })
  countEntity?: string

  @Column({ type: 'jsonb', nullable: true })
  countFilters?: Record<string, unknown>

  @Column({ type: 'integer', nullable: true })
  countWindow?: number // Time window in minutes

  // Nested conditions
  @Column({ type: 'uuid', nullable: true })
  parentConditionId?: string

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'integer', default: 0 })
  evaluationCount!: number

  @Column({ type: 'integer', default: 0 })
  trueCount!: number

  @Column({ type: 'integer', default: 0 })
  falseCount!: number

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastEvaluatedAt?: Date

  @Column({ type: 'boolean', nullable: true })
  lastResult?: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne('NotificationRule', 'conditions', { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'rule_id' })
  rule!: NotificationRuleLazy

  // Utility methods

  /**
   * Evaluate field condition
   */
  evaluateField(data: ConditionEvaluationContext): boolean {
    if (this.type !== ConditionType.FIELD || !this.fieldPath || !this.operator) {
      return false
    }

    // Extract field value from data
    const fieldValue = this.getNestedValue(data, this.fieldPath)

    return this.compareValues(fieldValue, this.value, this.operator, this.value2)
  }

  /**
   * Evaluate expression condition
   */
  evaluateExpression(context: ConditionEvaluationContext): boolean {
    if (this.type !== ConditionType.EXPRESSION || !this.expression) {
      return false
    }

    try {
      // Use mathjs for safe expression evaluation
      // Create a safe scope with limited access
      const scope: ExpressionEvaluationScope = {
        ...context,
        // Add safe utility functions
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        round: Math.round,
        floor: Math.floor,
        ceil: Math.ceil,
        now: Date.now(),
        // Boolean helpers
        true: true,
        false: false,
      }

      // Evaluate the expression safely
      const result = mathjs.evaluate(this.expression, scope)
      return result === true
    } catch (_error) {
      return false
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(
    fieldValue: unknown,
    compareValue: unknown,
    operator: ConditionOperator,
    compareValue2?: unknown
  ): boolean {
    switch (operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === compareValue

      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== compareValue

      case ConditionOperator.GREATER_THAN:
        return (fieldValue as number) > (compareValue as number)

      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return (fieldValue as number) >= (compareValue as number)

      case ConditionOperator.LESS_THAN:
        return (fieldValue as number) < (compareValue as number)

      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return (fieldValue as number) <= (compareValue as number)

      case ConditionOperator.BETWEEN:
        return (
          (fieldValue as number) >= (compareValue as number) &&
          (fieldValue as number) <= (compareValue2 as number)
        )

      case ConditionOperator.IN:
        return Array.isArray(compareValue) && compareValue.includes(fieldValue)

      case ConditionOperator.NOT_IN:
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue)

      case ConditionOperator.CONTAINS:
        return String(fieldValue).includes(String(compareValue))

      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(compareValue))

      case ConditionOperator.STARTS_WITH:
        return String(fieldValue).startsWith(String(compareValue))

      case ConditionOperator.ENDS_WITH:
        return String(fieldValue).endsWith(String(compareValue))

      case ConditionOperator.MATCHES:
        return new RegExp(String(compareValue)).test(String(fieldValue))

      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined

      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined

      case ConditionOperator.IS_EMPTY:
        return (
          fieldValue === null ||
          fieldValue === undefined ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0) ||
          (typeof fieldValue === 'object' &&
            fieldValue !== null &&
            Object.keys(fieldValue).length === 0)
        )

      case ConditionOperator.IS_NOT_EMPTY:
        return !(
          fieldValue === null ||
          fieldValue === undefined ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0) ||
          (typeof fieldValue === 'object' &&
            fieldValue !== null &&
            Object.keys(fieldValue).length === 0)
        )

      default:
        return false
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: ConditionEvaluationContext, path: string): unknown {
    const keys = path.split('.')
    let value: unknown = obj

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined
      }

      // Handle array notation like items[0]
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
      if (arrayMatch) {
        const arrayKey = arrayMatch[1]
        const index = parseInt(arrayMatch[2], 10)
        const objAsRecord = value as Record<string, unknown>
        const arrayValue = objAsRecord[arrayKey] as unknown[]
        value = arrayValue?.[index]
      } else {
        const objAsRecord = value as Record<string, unknown>
        value = objAsRecord[key]
      }
    }

    return value
  }

  /**
   * Update evaluation statistics
   */
  updateStatistics(result: boolean): void {
    this.evaluationCount++
    if (result) {
      this.trueCount++
    } else {
      this.falseCount++
    }
    this.lastEvaluatedAt = new Date()
    this.lastResult = result
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.evaluationCount === 0) {
      return 0
    }
    return (this.trueCount / this.evaluationCount) * 100
  }

  /**
   * Format for API response
   */
  toJSON(): NotificationConditionJson {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      orderIndex: this.orderIndex,
      logicalOperator: this.logicalOperator,
      config: this.getConfig(),
      statistics: {
        evaluationCount: this.evaluationCount,
        trueCount: this.trueCount,
        falseCount: this.falseCount,
        successRate: this.getSuccessRate(),
        lastEvaluatedAt: this.lastEvaluatedAt,
        lastResult: this.lastResult,
      },
      isActive: this.isActive,
      metadata: this.metadata,
    }
  }

  /**
   * Get condition configuration
   */
  private getConfig(): ConditionConfig {
    const config: Record<string, unknown> = {}

    switch (this.type) {
      case ConditionType.FIELD:
        config.fieldPath = this.fieldPath
        config.operator = this.operator
        config.value = this.value
        if (this.value2 !== undefined) {
          config.value2 = this.value2
        }
        break

      case ConditionType.EXPRESSION:
        config.expression = this.expression
        break

      case ConditionType.QUERY:
        config.query = this.query
        config.queryType = this.queryType
        break

      case ConditionType.API:
        config.apiUrl = this.apiUrl
        config.apiMethod = this.apiMethod
        config.apiHeaders = this.apiHeaders
        config.apiBody = this.apiBody
        config.apiResponsePath = this.apiResponsePath
        break

      case ConditionType.AGGREGATE:
        config.aggregateFunction = this.aggregateFunction
        config.aggregateField = this.aggregateField
        config.aggregateFilters = this.aggregateFilters
        config.aggregateWindow = this.aggregateWindow
        break

      case ConditionType.TIME:
        config.timeUnit = this.timeUnit
        config.timeValue = this.timeValue
        config.timeReference = this.timeReference
        break

      case ConditionType.COUNT:
        config.countEntity = this.countEntity
        config.countFilters = this.countFilters
        config.countWindow = this.countWindow
        break
    }

    return config as ConditionConfig
  }
}
