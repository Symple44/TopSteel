// Temporary stub file to resolve module imports
// TODO: Properly migrate or create these entities

export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum ExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum ExecutionResult {
  RULE_INACTIVE = 'RULE_INACTIVE',
  CONDITIONS_NOT_MET = 'CONDITIONS_NOT_MET',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum TriggerType {
  STOCK = 'STOCK',
  USER = 'USER',
  PROJECT = 'PROJECT',
  PRODUCTION = 'PRODUCTION',
  EMAIL = 'EMAIL',
  SYSTEM = 'SYSTEM',
}

export type NotificationCategory = string
export type NotificationPriority = string
export type NotificationType = string
export type RecipientType = string

// Stub entities - need proper implementation
export class NotificationEvent {
  id!: string
  type!: TriggerType
  event!: string
  data!: Record<string, unknown>
  status!: EventStatus

  static create(
    type: TriggerType,
    event: string,
    data: Record<string, unknown>,
    source?: string,
    userId?: string,
    entityType?: string,
    entityId?: string
  ): NotificationEvent {
    const notificationEvent = new NotificationEvent()
    notificationEvent.type = type
    notificationEvent.event = event
    notificationEvent.data = data
    notificationEvent.status = EventStatus.PENDING
    return notificationEvent
  }

  getEventKey(): string {
    return `${this.type}:${this.event}`
  }

  markAsProcessing(): void {
    this.status = EventStatus.PROCESSING
  }

  markAsProcessed(rulesTriggered: number, notificationsCreated: number): void {
    this.status = EventStatus.PROCESSED
  }

  markAsFailed(error: string, details?: any): void {
    this.status = EventStatus.FAILED
  }
}

export class NotificationRule {
  id!: string
  name!: string
  trigger!: any
  conditions!: any[]
  notification!: any
  isActive?: boolean
  lastModified?: Date

  canExecute(): boolean {
    return this.isActive !== false
  }

  incrementTriggerCount(): void {
    // stub
  }
}

export class NotificationRuleExecution {
  id!: string
  ruleId!: string
  status!: ExecutionStatus
  executedAt?: Date

  static createSkipped(
    ruleId: string,
    eventData: Record<string, unknown>,
    result: ExecutionResult,
    details: Record<string, unknown>,
    executionTime: number
  ): NotificationRuleExecution {
    const execution = new NotificationRuleExecution()
    execution.ruleId = ruleId
    execution.status = ExecutionStatus.SKIPPED
    return execution
  }

  static createSuccess(
    ruleId: string,
    notificationId: string,
    eventData: Record<string, unknown>,
    templateVariables: Record<string, unknown>,
    executionTime: number
  ): NotificationRuleExecution {
    const execution = new NotificationRuleExecution()
    execution.ruleId = ruleId
    execution.status = ExecutionStatus.SUCCESS
    return execution
  }

  static createFailed(
    ruleId: string,
    eventData: Record<string, unknown>,
    result: ExecutionResult,
    error: string,
    details: Record<string, unknown>,
    executionTime: number
  ): NotificationRuleExecution {
    const execution = new NotificationRuleExecution()
    execution.ruleId = ruleId
    execution.status = ExecutionStatus.FAILED
    return execution
  }
}

export class Notifications {
  id!: string
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  REGEX = 'REGEX',
}
