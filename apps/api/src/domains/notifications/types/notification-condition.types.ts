/**
 * Type definitions for notification conditions
 */

export interface ConditionStatistics {
  evaluationCount: number
  trueCount: number
  falseCount: number
  successRate: number
  lastEvaluatedAt?: Date
  lastResult?: boolean
}

export interface FieldConditionConfig {
  fieldPath: string
  operator: string
  value: unknown
  value2?: unknown
}

export interface ExpressionConditionConfig {
  expression: string
}

export interface QueryConditionConfig {
  query: string
  queryType: 'sql' | 'mongodb' | 'elasticsearch'
}

export interface ApiConditionConfig {
  apiUrl: string
  apiMethod: 'GET' | 'POST'
  apiHeaders?: Record<string, string>
  apiBody?: Record<string, unknown>
  apiResponsePath?: string
}

export interface AggregateConditionConfig {
  aggregateFunction: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct'
  aggregateField: string
  aggregateFilters?: Record<string, unknown>
  aggregateWindow?: number
}

export interface TimeConditionConfig {
  timeUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'
  timeValue: number
  timeReference: 'now' | 'event_time' | 'field_value'
}

export interface CountConditionConfig {
  countEntity: string
  countFilters?: Record<string, unknown>
  countWindow?: number
}

export type ConditionConfig =
  | FieldConditionConfig
  | ExpressionConditionConfig
  | QueryConditionConfig
  | ApiConditionConfig
  | AggregateConditionConfig
  | TimeConditionConfig
  | CountConditionConfig

export interface ConditionEvaluationContext {
  [key: string]: unknown
  // Built-in context variables
  triggerData?: Record<string, unknown>
  societeId?: string
  siteId?: string
  userId?: string
  timestamp?: number
  eventType?: string
}

export interface ExpressionEvaluationScope extends ConditionEvaluationContext {
  // Math functions
  abs: (n: number) => number
  min: (...args: number[]) => number
  max: (...args: number[]) => number
  round: (n: number) => number
  floor: (n: number) => number
  ceil: (n: number) => number
  // Time
  now: number
  // Boolean constants
  true: true
  false: false
}

export interface NotificationConditionJson {
  id: string
  name: string
  description?: string
  type: string
  orderIndex: number
  logicalOperator: 'AND' | 'OR' | 'NOT'
  config: ConditionConfig
  statistics: ConditionStatistics
  isActive: boolean
  metadata: Record<string, unknown>
}

export interface NotificationRuleLazy {
  id: string
  name: string
  description?: string
  // Add other properties as needed for the relation
}
