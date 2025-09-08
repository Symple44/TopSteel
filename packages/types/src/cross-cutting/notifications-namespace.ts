/**
 * 📬 Notifications Namespace - TopSteel ERP
 * Types and interfaces for the notification system
 */

export namespace Notifications {
  /**
   * Notification priority levels
   */
  export enum Priority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
  }

  /**
   * Notification types
   */
  export enum Type {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
    SYSTEM = 'system',
  }

  /**
   * Notification categories
   */
  export enum Category {
    SYSTEM = 'system',
    USER = 'user',
    ORDER = 'order',
    INVENTORY = 'inventory',
    PRODUCTION = 'production',
    QUALITY = 'quality',
    MAINTENANCE = 'maintenance',
    ALERT = 'alert',
  }

  /**
   * Main notification interface
   */
  export interface Notification {
    id: string
    type: Type
    category: Category
    title: string
    message: string
    priority: Priority
    source?: string
    entityType?: string
    entityId?: string
    data?: Record<string, unknown>
    recipientType?: 'user' | 'role' | 'group' | 'all'
    recipientId?: string
    actionUrl?: string
    actionLabel?: string
    actionType?: 'link' | 'button' | 'modal'
    expiresAt?: Date | null
    createdAt: Date
    updatedAt?: Date
    readAt?: Date | null
    isRead: boolean
  }

  /**
   * Notification filters for queries
   */
  export interface NotificationFilters {
    type?: Type | Type[]
    category?: Category | Category[]
    priority?: Priority | Priority[]
    isRead?: boolean
    recipientId?: string
    recipientType?: string
    entityType?: string
    entityId?: string
    source?: string
    dateFrom?: Date
    dateTo?: Date
    search?: string
    page?: number
    limit?: number
    sortBy?: 'createdAt' | 'priority' | 'type' | 'category'
    sortOrder?: 'asc' | 'desc'
  }

  /**
   * Notification condition for rules
   */
  export interface NotificationCondition {
    field: string
    operator:
      | 'equals'
      | 'notEquals'
      | 'contains'
      | 'notContains'
      | 'greaterThan'
      | 'lessThan'
      | 'in'
      | 'notIn'
    value: unknown
    logic?: 'AND' | 'OR'
  }

  /**
   * Notification rule configuration
   */
  export interface NotificationRule {
    id: string
    name: string
    description?: string
    enabled: boolean
    triggerType: 'event' | 'schedule' | 'condition'
    triggerEvent?: string
    triggerSchedule?: string
    conditions?: NotificationCondition[]
    notificationType: Type
    priority: Priority
    category: Category
    template: {
      title: string
      message: string
      actionUrl?: string
      actionLabel?: string
    }
    recipients: {
      type: 'user' | 'role' | 'group' | 'all'
      ids?: string[]
    }
    createdAt: Date
    updatedAt?: Date
  }

  /**
   * Notification settings
   */
  export interface NotificationSettings {
    email: {
      enabled: boolean
      types: Type[]
      priorities: Priority[]
    }
    push: {
      enabled: boolean
      types: Type[]
      priorities: Priority[]
    }
    inApp: {
      enabled: boolean
      playSound: boolean
      showDesktop: boolean
    }
    quiet: {
      enabled: boolean
      startTime: string
      endTime: string
      days: number[]
    }
  }

  /**
   * Notification statistics
   */
  export interface NotificationStats {
    total: number
    unread: number
    byType: Record<Type, number>
    byCategory: Record<Category, number>
    byPriority: Record<Priority, number>
    recentCount: number
  }
}
