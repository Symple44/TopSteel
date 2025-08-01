/**
 * 🔔 NOTIFICATIONS - DOMAINE CROSS-CUTTING
 * Exports pour les notifications transversales
 */

// ===== ENTITÉS ET TYPES =====
export type {
  Notification,
  NotificationAction,
  NotificationDelivery,
  NotificationFilters,
  NotificationMetadata,
  NotificationPreferences,
  NotificationStats,
} from './domain/entities'

// ===== ENUMS =====
export {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from './domain/entities'
