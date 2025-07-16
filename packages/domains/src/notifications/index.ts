// Exports pour le module de notifications
export * from './types'
export * from './service'

// Re-exports pour compatibilité
export { NotificationDatabaseService } from './service'
export type { 
  Notification,
  NotificationSettings,
  NotificationTemplate,
  NotificationStats,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationFilters,
  NotificationListResponse,
  CreateNotificationFromTemplateRequest,
  NotificationService,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
  RecipientType,
  NotificationAction,
  NotificationMetadata
} from './types'