/**
 * 🔔 ENTITÉS MÉTIER - DOMAINE NOTIFICATIONS
 * Logique métier pure pour les notifications
 */

import type { BaseEntity } from '../../../core/base'

// ===== ENUMS MÉTIER =====

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  REMINDER = 'REMINDER',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  DISMISSED = 'DISMISSED',
}

// ===== VALUE OBJECTS =====

export interface NotificationAction {
  readonly id: string
  readonly label: string
  readonly url?: string
  readonly handler?: string
  readonly style?: 'primary' | 'secondary' | 'danger'
}

export interface NotificationMetadata {
  readonly entityType?: string
  readonly entityId?: string
  readonly relatedEntities?: Record<string, string>
  readonly source?: string
  readonly category?: string
  readonly tags?: string[]
}

export interface NotificationDelivery {
  readonly channel: NotificationChannel
  readonly status: NotificationStatus
  readonly sentAt?: Date
  readonly deliveredAt?: Date
  readonly readAt?: Date
  readonly failureReason?: string
  readonly retryCount?: number
}

// ===== ENTITÉ PRINCIPALE =====

export interface Notification extends BaseEntity {
  // Identification
  readonly title: string
  readonly message: string
  readonly type: NotificationType
  readonly priority: NotificationPriority

  // Destinataire
  readonly userId: string
  readonly userEmail?: string
  readonly userPhone?: string

  // Contenu
  readonly content?: {
    html?: string
    data?: Record<string, unknown>
    attachments?: string[]
  }

  // Actions
  readonly actions?: NotificationAction[]
  readonly autoActions?: {
    markReadAfter?: number // minutes
    dismissAfter?: number // minutes
    retryFailedAfter?: number // minutes
  }

  // Livraison
  readonly channels: NotificationChannel[]
  readonly delivery: NotificationDelivery[]
  readonly scheduledFor?: Date
  readonly expiresAt?: Date

  // Métadonnées
  readonly metadata: NotificationMetadata
  readonly template?: string
  readonly locale?: string

  // État
  readonly isRead: boolean
  readonly isDismissed: boolean
  readonly readAt?: Date
  readonly dismissedAt?: Date

  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy?: string
}

// ===== AGRÉGATS =====

export interface NotificationStats {
  readonly total: number
  readonly unread: number
  readonly byType: Record<NotificationType, number>
  readonly byPriority: Record<NotificationPriority, number>
  readonly byChannel: Record<NotificationChannel, number>
  readonly byStatus: Record<NotificationStatus, number>
  readonly deliveryRate: number
  readonly readRate: number
}

export interface NotificationPreferences {
  readonly userId: string
  readonly channels: {
    [K in NotificationType]: NotificationChannel[]
  }
  readonly quietHours?: {
    start: string // HH:mm
    end: string // HH:mm
    timezone: string
  }
  readonly categories: Record<string, boolean>
  readonly frequency: {
    digest?: 'immediate' | 'hourly' | 'daily' | 'weekly'
    reminders?: boolean
    marketing?: boolean
  }
}

// ===== FILTRES =====

export interface NotificationFilters {
  readonly userId?: string
  readonly type?: NotificationType[]
  readonly priority?: NotificationPriority[]
  readonly channel?: NotificationChannel[]
  readonly status?: NotificationStatus[]
  readonly isRead?: boolean
  readonly isDismissed?: boolean
  readonly createdAfter?: Date
  readonly createdBefore?: Date
  readonly entityType?: string
  readonly entityId?: string
  readonly category?: string
  readonly tags?: string[]
}
