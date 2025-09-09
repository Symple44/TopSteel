/**
 * Types pour le système de notifications
 * Créé pour résoudre les erreurs TypeScript dans notification-rules-engine.service.ts
 */

export interface NotificationRule {
  id: string
  name: string
  description?: string
  entityType: NotificationEntityType
  eventType: NotificationEventType
  conditions: NotificationCondition[]
  actions: NotificationAction[]
  isActive: boolean
  priority: number
  metadata?: Record<string, unknown>
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
}

export type NotificationEntityType =
  | 'USER'
  | 'SOCIETE'
  | 'COMMANDE'
  | 'FACTURE'
  | 'DEVIS'
  | 'ARTICLE'
  | 'STOCK'
  | 'PROJET'
  | 'TACHE'

export type NotificationEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGED'
  | 'THRESHOLD_EXCEEDED'
  | 'DEADLINE_APPROACHING'
  | 'APPROVAL_REQUIRED'
  | 'PAYMENT_RECEIVED'
  | 'STOCK_LOW'

export interface NotificationCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: unknown
  logicalOperator?: 'AND' | 'OR'
  groupId?: string
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_OR_EQUAL'
  | 'LESS_OR_EQUAL'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'IN'
  | 'NOT_IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL'

export interface NotificationAction {
  id: string
  type: NotificationActionType
  config: NotificationActionConfig
  delay?: number // Délai en secondes
  retryPolicy?: {
    maxRetries: number
    retryDelay: number
  }
}

export type NotificationActionType =
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'WEBHOOK'
  | 'DATABASE'
  | 'SLACK'
  | 'TEAMS'
  | 'API_CALL'

export interface NotificationActionConfig {
  // Pour EMAIL
  to?: string[]
  cc?: string[]
  bcc?: string[]
  subject?: string
  template?: string

  // Pour SMS
  phoneNumbers?: string[]

  // Pour WEBHOOK/API_CALL
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown

  // Pour SLACK/TEAMS
  channel?: string
  webhookUrl?: string

  // Commun
  message?: string
  variables?: Record<string, unknown>
}

export interface NotificationExecution {
  id: string
  ruleId: string
  entityId: string
  entityType: NotificationEntityType
  eventType: NotificationEventType
  executedAt: Date | string
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING'
  attempts: number
  error?: string
  context?: Record<string, unknown>
  results?: NotificationActionResult[]
}

export interface NotificationActionResult {
  actionId: string
  actionType: NotificationActionType
  status: 'SUCCESS' | 'FAILED'
  executedAt: Date | string
  response?: unknown
  error?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'EMAIL' | 'SMS' | 'PUSH'
  subject?: string
  content: string
  variables: string[]
  metadata?: Record<string, unknown>
  createdAt: Date | string
  updatedAt: Date | string
}

export interface NotificationSubscription {
  id: string
  userId: string
  entityType?: NotificationEntityType
  eventTypes: NotificationEventType[]
  channels: NotificationChannel[]
  isActive: boolean
  filters?: Record<string, unknown>
  createdAt: Date | string
  updatedAt: Date | string
}

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'

export interface NotificationLog {
  id: string
  userId?: string
  type: NotificationActionType
  status: 'SENT' | 'FAILED' | 'PENDING'
  recipient: string
  subject?: string
  content?: string
  error?: string
  metadata?: Record<string, unknown>
  sentAt?: Date | string
  createdAt: Date | string
}
