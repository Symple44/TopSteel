/**
 * Types étendus pour les notifications côté client
 * Ces types étendent les types de base du domaine pour ajouter les propriétés nécessaires côté client
 */

import type { Notifications } from '@erp/types'

// Utilisons directement le type Notifications.Notification et l'étendons
export interface NotificationExtended extends Notifications.Notification {
  // Étendre avec les propriétés nécessaires pour le client
  metadata?: {
    source?: string
    category?: string
    entityType?: string
    entityId?: string
    userId?: string
    [key: string]: unknown
  }
  actions?: Array<{
    url: string
    label: string
    type: 'primary' | 'secondary'
  }>
}

// Type alias pour plus de clarté
export type ClientNotification = NotificationExtended

// Types pour le provider de notifications
export type NotificationProviderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface NotificationProviderSettings {
  enableToast: boolean
  enableSound: boolean
  enableVibration: boolean
  enableBrowser: boolean
  enableEmail: boolean
  categories: {
    system: boolean
    production: boolean
    commercial: boolean
    admin: boolean
  }
  priority: Record<NotificationProviderPriority, boolean>
}

export interface NotificationsState {
  notifications: ClientNotification[]
  unreadCount: number
  connected: boolean
  settings: NotificationProviderSettings
  loading: boolean
  error: string | null
}

export interface NotificationsContextType {
  state: NotificationsState
  actions: {
    markAsRead: (notificationId: string) => void
    markAllAsRead: () => void
    deleteNotification: (notificationId: string) => void
    deleteAll: () => void
    updateSettings: (settings: Partial<NotificationProviderSettings>) => void
    refreshNotifications: () => Promise<void>
  }
}
