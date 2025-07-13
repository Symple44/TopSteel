/**
 * 🔔 NOTIFICATIONS - TopSteel ERP
 * Types pour le système de notifications
 */

import type { BaseEntity } from '../core'

/**
 * Types de notifications
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Catégories de notifications
 */
export enum NotificationCategory {
  SYSTEME = 'systeme',
  PROJET = 'projet',
  PRODUCTION = 'production',
  CLIENT = 'client',
  FACTURATION = 'facturation',
  STOCK = 'stock',
  UTILISATEUR = 'utilisateur',
}

/**
 * Priorités de notification
 */
export enum NotificationPriority {
  BASSE = 'basse',
  NORMALE = 'normale',
  HAUTE = 'haute',
  CRITIQUE = 'critique',
}

/**
 * Canaux de notification
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
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
  lue: boolean
  dateLecture?: Date
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  expiresAt?: Date
}

/**
 * Template de notification
 */
export interface NotificationTemplate {
  id: string
  nom: string
  category: NotificationCategory
  type: NotificationType
  priority: NotificationPriority
  channels: NotificationChannel[]
  titreTemplate: string
  messageTemplate: string
  variables: string[]
  actif: boolean
}

/**
 * Préférences de notification utilisateur
 */
export interface NotificationPreferences {
  userId: string
  categories: Record<NotificationCategory, {
    enabled: boolean
    channels: NotificationChannel[]
    priority: NotificationPriority
  }>
  quietHours?: {
    enabled: boolean
    start: string // HH:mm
    end: string   // HH:mm
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
  lues: number
  nonLues: number
  parType: Record<NotificationType, number>
  parCategory: Record<NotificationCategory, number>
  parChannel: Record<NotificationChannel, number>
  tauxLecture: number
}