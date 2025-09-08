/**
 * Rule execution context shared between services
 */
export interface RuleExecutionContext {
  rule: any // Using any to avoid circular dependency
  triggerType: string
  triggerSource: string
  triggerData?: any
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
