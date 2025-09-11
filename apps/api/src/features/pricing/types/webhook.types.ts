/**
 * Types communs pour les webhooks
 * Séparés pour éviter les dépendances circulaires
 */

export enum WebhookEventType {
  PRICE_CHANGED = 'price.changed',
  RULE_CREATED = 'rule.created',
  RULE_UPDATED = 'rule.updated',
  RULE_DELETED = 'rule.deleted',
  RULE_APPLIED = 'rule.applied',
  THRESHOLD_EXCEEDED = 'threshold.exceeded',
  ML_SUGGESTION = 'ml.suggestion',
  COMPETITIVE_ALERT = 'competitive.alert',
}

export interface WebhookSubscription {
  id: string
  societeId: string
  url: string
  secret: string
  events: WebhookEventType[]
  isActive: boolean
  filters?: {
    minPriceChange?: number
    articleIds?: string[]
    ruleIds?: string[]
    channels?: string[]
  }
  retryPolicy: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
  metadata?: {
    description?: string
    createdBy?: string
    lastTriggered?: Date
    totalCalls?: number
    successRate?: number
  }
}

export interface WebhookEvent {
  id: string
  type: WebhookEventType
  societeId: string
  timestamp: Date
  data: Record<string, unknown>
  metadata?: {
    articleId?: string
    ruleId?: string
    userId?: string
    channel?: string
    previousValue?: number
    newValue?: number
    changePercent?: number
  }
}

export interface WebhookDelivery {
  id: string
  subscriptionId: string
  eventId: string
  url: string
  status: 'pending' | 'success' | 'failed'
  attempts: number
  lastAttempt?: Date
  response?: {
    statusCode: number
    body?: string
    error?: string
  }
}

export interface WebhookRetryPolicy {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
}

export interface WebhookFilters {
  minPriceChange?: number
  articleIds?: string[]
  ruleIds?: string[]
  channels?: string[]
}

export interface WebhookMetadata {
  description?: string
  createdBy?: string
  lastTriggered?: Date
  totalCalls?: number
  successRate?: number
}
