/**
 * 🔔 NOTIFICATIONS - TopSteel ERP
 * Types pour le système de notifications
 */

import type { BaseEntity } from '../core'

/**
 * Types de notifications
 */
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
}

/**
 * Catégories de notifications
 */
export enum NotificationCategory {
  PROJET = 'PROJET',
  PRODUCTION = 'PRODUCTION',
  FACTURATION = 'FACTURATION',
  STOCK = 'STOCK',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
}

/**
 * Priorités de notification
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Canaux de notification
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
}

/**
 * Interface notification principale
 */
export interface Notification extends BaseEntity {
  titre: string
  message: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  channels: NotificationChannel[]
  destinataireId: string
  lu: boolean
  luAt?: Date
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  expiresAt?: Date
}

/**
 * Template de notification
 */
export interface NotificationTemplate extends BaseEntity {
  nom: string
  description?: string
  titre: string
  message: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  channels: NotificationChannel[]
  variables: string[]
  active: boolean
}

/**
 * Préférences de notification utilisateur
 */
export interface NotificationPreferences {
  userId: string
  channels: Record<NotificationChannel, boolean>
  categories: Record<NotificationCategory, boolean>
  quietHours?: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
  }
  frequency?: {
    digest: 'none' | 'daily' | 'weekly'
    immediate: boolean
  }
}

/**
 * Requête d'envoi de notification
 */
export interface SendNotificationRequest {
  templateId?: string
  titre: string
  message: string
  type: NotificationType
  category: NotificationCategory
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  destinataireIds: string[]
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  scheduleAt?: Date
  expiresAt?: Date
}

/**
 * Statistiques de notifications
 */
export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byCategory: Record<NotificationCategory, number>
  byChannel: Record<NotificationChannel, number>
}

/**
 * Filtre pour les notifications
 */
export interface NotificationFilters {
  type?: NotificationType[]
  category?: NotificationCategory[]
  priority?: NotificationPriority[]
  lu?: boolean
  dateDebut?: Date
  dateFin?: Date
  search?: string
}
