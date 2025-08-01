// Types pour le système de notifications

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type NotificationCategory =
  | 'system'
  | 'stock'
  | 'projet'
  | 'production'
  | 'maintenance'
  | 'qualite'
  | 'facturation'
  | 'sauvegarde'
  | 'utilisateur'

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type RecipientType = 'all' | 'role' | 'user' | 'group'

export interface NotificationAction {
  url: string
  label: string
  type: 'primary' | 'secondary'
}

export interface NotificationMetadata {
  source?: string
  category: NotificationCategory
  entityType?: string
  entityId?: string
  userId?: string
  [key: string]: any
}

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  priority: NotificationPriority

  // Métadonnées
  source?: string
  entityType?: string
  entityId?: string
  data?: Record<string, any>
  metadata?: NotificationMetadata

  // Destinataires
  recipientType: RecipientType
  recipientId?: string

  // Actions
  actionUrl?: string
  actionLabel?: string
  actionType?: 'primary' | 'secondary'
  actions?: NotificationAction[]

  // Gestion temporelle
  createdAt: string
  expiresAt?: string

  // Paramètres d'affichage
  persistent: boolean
  autoRead: boolean

  // État de lecture
  isRead?: boolean
  readAt?: string
}

export interface NotificationRead {
  id: string
  notificationId: string
  userId: string
  readAt: string
}

export interface NotificationSettings {
  id: string
  userId: string

  // Paramètres généraux
  enableSound: boolean
  enableToast: boolean
  enableBrowser: boolean
  enableEmail: boolean

  // Paramètres par catégorie
  categories: Record<NotificationCategory, boolean>

  // Paramètres par priorité
  priorities: Record<string, boolean>

  // Paramètres d'horaires
  schedules: {
    workingHours: {
      enabled: boolean
      start: string
      end: string
    }
    weekdays: {
      enabled: boolean
      days: number[]
    }
  }

  createdAt: string
  updatedAt: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  category: NotificationCategory

  // Templates avec variables
  titleTemplate: string
  messageTemplate: string

  priority: NotificationPriority
  persistent: boolean
  actionUrlTemplate?: string
  actionLabel?: string

  // Métadonnées
  variables?: Record<string, string>
  description?: string

  createdAt: string
  updatedAt: string
}

export interface NotificationStats {
  userId: string
  totalNotifications: number
  unreadCount: number
  systemCount: number
  stockCount: number
  projetCount: number
  productionCount: number
  maintenanceCount: number
  qualiteCount: number
  facturationCount: number
  sauvegardeCount: number
  utilisateurCount: number
  urgentUnreadCount: number
}

// Types pour les requêtes API
export interface CreateNotificationRequest {
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  priority?: NotificationPriority

  // Métadonnées optionnelles
  source?: string
  entityType?: string
  entityId?: string
  data?: Record<string, any>

  // Destinataires
  recipientType?: RecipientType
  recipientId?: string

  // Actions
  actionUrl?: string
  actionLabel?: string
  actionType?: 'primary' | 'secondary'

  // Gestion temporelle
  expiresAt?: string

  // Paramètres d'affichage
  persistent?: boolean
  autoRead?: boolean
}

export interface UpdateNotificationRequest {
  title?: string
  message?: string
  priority?: NotificationPriority
  actionUrl?: string
  actionLabel?: string
  expiresAt?: string
  persistent?: boolean
}

export interface NotificationFilters {
  category?: NotificationCategory[]
  type?: NotificationType[]
  priority?: NotificationPriority[]
  unreadOnly?: boolean
  recipientType?: RecipientType
  recipientId?: string
  source?: string
  entityType?: string
  entityId?: string
  fromDate?: string
  toDate?: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  hasMore: boolean
}

// Types pour les templates
export interface CreateNotificationFromTemplateRequest {
  templateName: string
  variables: Record<string, any>
  recipientType: RecipientType
  recipientId?: string
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'datetime' | 'array' | 'object'
  required: boolean
  description?: string
  defaultValue?: any
}

// Types pour les événements temps réel
export interface NotificationEvent {
  type: 'new_notification' | 'notification_read' | 'notification_deleted' | 'settings_updated'
  userId: string
  data: any
}

// Types pour les paramètres de connexion WebSocket
export interface WebSocketConnectionOptions {
  userId: string
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
}

// Types pour les erreurs
export interface NotificationError {
  code: string
  message: string
  details?: Record<string, any>
}

// Types pour les services
export interface NotificationService {
  // CRUD notifications
  createNotification(request: CreateNotificationRequest): Promise<Notification>
  getNotifications(
    filters?: NotificationFilters,
    userId?: string
  ): Promise<NotificationListResponse>
  getNotificationById(id: string): Promise<Notification>
  updateNotification(id: string, request: UpdateNotificationRequest): Promise<Notification>
  deleteNotification(id: string): Promise<void>

  // Gestion des lectures
  markAsRead(notificationId: string, userId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>

  // Paramètres utilisateur
  getUserSettings(userId: string): Promise<NotificationSettings>
  updateUserSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings>

  // Templates
  createNotificationFromTemplate(
    request: CreateNotificationFromTemplateRequest
  ): Promise<Notification>
  getTemplates(): Promise<NotificationTemplate[]>

  // Statistiques
  getUserStats(userId: string): Promise<NotificationStats>

  // Nettoyage
  cleanExpiredNotifications(): Promise<number>
}

// Types pour les hooks React
export interface UseNotificationsOptions {
  userId?: string
  filters?: NotificationFilters
  enableRealTime?: boolean
  pollInterval?: number
}

export interface UseNotificationsResult {
  notifications: Notification[]
  isLoading: boolean
  error: NotificationError | null
  unreadCount: number
  hasMore: boolean
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
}
