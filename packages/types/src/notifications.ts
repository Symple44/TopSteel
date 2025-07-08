// packages/types/src/notifications.ts
import type { BaseEntity } from './common'
import type { User } from './user'

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationCategory {
  SYSTEM = 'system',
  STOCK = 'stock',
  PROJET = 'projet',
  PRODUCTION = 'production',
  MAINTENANCE = 'maintenance',
  QUALITE = 'qualite',
  FACTURATION = 'facturation',
}

export enum NotificationStatut {
  ACTIVE = 'active',
  TRAITEE = 'traitee',
  IGNOREE = 'ignoree',
}

export interface Notification extends BaseEntity {
  userId?: string
  user?: User
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  persistent: boolean
  actionUrl?: string
  actionLabel?: string
  expiresAt?: Date
  metadata?: {
    entityType?: string
    entityId?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  }
}

export interface NotificationTemplate extends BaseEntity {
  name: string
  category: NotificationCategory
  titleTemplate: string
  messageTemplate: string
  type: NotificationType
  persistent: boolean
  expiresInMinutes?: number
  conditions?: {
    roles?: string[]
    permissions?: string[]
  }
}

export interface NotificationRule extends BaseEntity {
  name: string
  description: string
  trigger: {
    event: string
    conditions: Record<string, any>
  }
  templateId: string
  template: NotificationTemplate
  recipients: {
    type: 'role' | 'user' | 'all'
    values: string[]
  }
  channels: ('websocket' | 'email' | 'sms')[]
  active: boolean
}

export interface NotificationSettings {
  enableSound: boolean
  enableToast: boolean
  enableBrowser: boolean
  enableEmail: boolean
  enableSMS: boolean
  categories: Record<NotificationCategory, boolean>
}

// Requests
export interface CreateNotificationRequest {
  userId?: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  data?: Record<string, any>
  persistent?: boolean
  actionUrl?: string
  actionLabel?: string
  expiresAt?: Date
}

export interface NotificationFilters {
  type?: NotificationType[]
  category?: NotificationCategory[]
  read?: boolean
  persistent?: boolean
  dateDebut?: Date
  dateFin?: Date
}
