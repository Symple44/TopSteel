import type { NotificationRule } from '@prisma/client'

/**
 * Rule execution context shared between services
 */
export interface RuleExecutionContext {
  rule: NotificationRule & {
    conditions?: any[]
    actions?: any[]
    code?: string
    status?: string
    type?: string
    eventName?: string
    schedule?: {
      cron?: string
      timezone?: string
    }
    cooldown?: {
      enabled?: boolean
      minutes?: number
      key?: string
      perUser?: boolean
      perResource?: boolean
    }
    escalation?: {
      enabled?: boolean
      levels?: Array<{
        condition?: string
        delayMinutes: number
        recipients: {
          users?: string[]
          emails?: string[]
        }
        channels?: string[]
      }>
    }
    executionCount?: number
    lastExecutedAt?: Date
    nextExecutionAt?: Date
    createdAt?: Date
  }
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
