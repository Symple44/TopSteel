/**
 * 🔔 NOTIFICATIONS - DOMAINE CROSS-CUTTING
 * Exports pour les notifications transversales
 */

// ===== ENTITÉS ET TYPES =====
export type {
  Notification,
  NotificationStats,
  NotificationPreferences,
  NotificationFilters,
  NotificationAction,
  NotificationMetadata,
  NotificationDelivery,
} from './domain/entities'

// ===== ENUMS =====
export {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
} from './domain/entities'