/**
 * Type definitions for notification execution
 */

export interface NotificationRule {
  id: string
  name: string
  description?: string
  isActive: boolean
  recipientRules?: {
    emails?: string[]
    userIds?: string[]
    roles?: string[]
    groups?: string[]
  }
  conditions?: NotificationCondition[]
  metadata?: Record<string, unknown>
}

export interface NotificationCondition {
  field: string
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'nin'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
  value: unknown
  logicalOperator?: 'AND' | 'OR'
}

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

// Action configuration types
export interface NotificationConfig {
  template?: string
  subject?: string
  body?: string
  channels: ('email' | 'sms' | 'push' | 'webhook')[]
  priority?: 'low' | 'normal' | 'high' | 'critical'
  metadata?: Record<string, unknown>
}

export interface UpdateFieldConfig {
  entity: string
  fieldPath: string
  value: unknown
  condition?: string
  metadata?: Record<string, unknown>
}

export interface FunctionConfig {
  name: string
  parameters?: Record<string, unknown>
  timeout?: number
  metadata?: Record<string, unknown>
}

export interface ApiConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: Record<string, unknown>
  authentication?: {
    type: 'bearer' | 'basic' | 'apikey'
    credentials?: {
      token?: string
      username?: string
      password?: string
      apiKey?: string
    }
  }
  timeoutSeconds?: number
  retryConfig?: {
    maxRetries: number
    delayMs: number
    backoffMultiplier?: number
  }
  metadata?: Record<string, unknown>
}

export interface TaskConfig {
  title: string
  description?: string
  assignee?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  dueDate?: string
  labels?: string[]
  metadata?: Record<string, unknown>
}

export interface WorkflowConfig {
  workflowId: string
  version?: string
  input?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface LogConfig {
  message: string
  level: 'debug' | 'info' | 'warn' | 'error'
  category?: string
  metadata?: Record<string, unknown>
}

export interface ReportConfig {
  reportId: string
  format: 'pdf' | 'excel' | 'csv' | 'json'
  parameters?: Record<string, unknown>
  recipients?: string[]
  metadata?: Record<string, unknown>
}

export interface CustomConfig {
  handlerName: string
  parameters?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

// Execution result types
export interface ActionExecutionResult {
  success: boolean
  data?: Record<string, unknown>
  error?: string
  metadata?: Record<string, unknown>
}

export interface NotificationActionResult extends ActionExecutionResult {
  recipientsNotified: number
  channels: string[]
}

export interface FieldUpdateResult extends ActionExecutionResult {
  entity: string
  field: string
  value: unknown
  updated: boolean
}

export interface FunctionExecutionResult extends ActionExecutionResult {
  function: string
  executed: boolean
  returnValue?: unknown
}

export interface ApiCallResult extends ActionExecutionResult {
  status: number
  data?: Record<string, unknown>
  responseHeaders?: Record<string, string>
}

export interface TaskCreationResult extends ActionExecutionResult {
  taskId: string
  title: string
  created: boolean
}

export interface WorkflowTriggerResult extends ActionExecutionResult {
  workflowId: string
  triggered: boolean
  executionId?: string
}

export interface LogEventResult extends ActionExecutionResult {
  logged: boolean
  level: string
  timestamp: string
}

export interface ReportSendResult extends ActionExecutionResult {
  reportId: string
  format: string
  sent: boolean
  recipients?: string[]
}

export interface CustomActionResult extends ActionExecutionResult {
  custom: boolean
  config: CustomConfig
}
