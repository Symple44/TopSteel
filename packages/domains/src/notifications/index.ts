// Exports pour le module de notifications

export * from './service'
// Re-exports pour compatibilité
export { NotificationDatabaseService } from './service'
export type {
  CreateNotificationFromTemplateRequest,
  CreateNotificationRequest,
  Notification,
  NotificationAction,
  NotificationCategory,
  NotificationFilters,
  NotificationListResponse,
  NotificationMetadata,
  NotificationPriority,
  NotificationService,
  NotificationSettings,
  NotificationStats,
  NotificationTemplate,
  NotificationType,
  RecipientType,
  UpdateNotificationRequest,
} from './types'
export * from './types'
