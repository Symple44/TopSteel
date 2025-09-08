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
  NORMAL = 'NORMAL',
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
  // Propriétés principales (français)
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
  metadata?: Record<string, unknown>
  expiresAt?: Date

  // Propriétés additionnelles (anglais)
  title?: string // Alias pour titre
  read?: boolean // Alias pour lu
  readAt?: Date // Alias pour luAt
  recipientId?: string // Alias pour destinataireId
  actions?: NotificationAction[] // Actions disponibles
  source?: string // Source de la notification
  entity_type?: string // Type d'entité associée
  entity_id?: string // ID de l'entité associée
  recipient_type?: string // Type de destinataire
  action_type?: string // Type d'action
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
  metadata?: Record<string, unknown>
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

/**
 * DTO pour créer une notification
 */
export interface CreateNotificationDto {
  type: NotificationType
  title: string
  message: string
  data?: unknown
  userId?: string
  projetId?: string
}

/**
 * DTO pour mettre à jour une notification
 */
export interface UpdateNotificationDto extends Partial<CreateNotificationDto> {
  id: string
}

/**
 * Trigger d'événement pour les règles
 */
export interface EventTrigger {
  type: 'user' | 'stock' | 'email' | 'project' | 'production' | 'system'
  event: string
  source?: string
}

/**
 * Configuration de notification pour les règles
 */
export interface NotificationConfig {
  type: string
  recipients?: string[]
  template?: string
  variables?: Record<string, unknown>
  titleTemplate?: string
  messageTemplate?: string
  actionUrl?: string
  actionLabel?: string
  category?: string
  priority?: string
}

/**
 * Condition pour les règles de notification
 */
export interface NotificationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: unknown
}

/**
 * Action pour les règles de notification
 */
export interface NotificationAction {
  type: string
  config?: Record<string, unknown>
}

/**
 * Règle de notification
 */
export interface NotificationRule {
  id: string
  name: string
  description?: string
  type?: 'email' | 'sms' | 'push' | 'in-app'
  conditions?: NotificationCondition[]
  actions?: NotificationAction[]
  enabled?: boolean
  isActive?: boolean
  trigger?: EventTrigger
  notification?: NotificationConfig
  createdAt?: Date
  updatedAt?: Date
  lastTriggered?: string
  triggerCount?: number
}
