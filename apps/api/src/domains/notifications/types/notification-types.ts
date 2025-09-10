import type { NotificationRule } from '../entities/notification-rule.entity'

/**
 * Rule execution context shared between services
 */
export interface RuleExecutionContext {
  rule: NotificationRule
  triggerType: string
  triggerSource: string
  triggerData?: Record<string, unknown>
  societeId?: string
  siteId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

/**
 * Rule execution result
 */
export interface RuleExecutionResult {
  executionId: string
  ruleId: string
  status: string
  conditionsPassed: boolean
  actionsExecuted: number
  recipientsNotified: number
  errors: string[]
  duration: number
}
