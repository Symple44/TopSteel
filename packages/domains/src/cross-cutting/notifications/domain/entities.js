/**
 * 🔔 ENTITÉS MÉTIER - DOMAINE NOTIFICATIONS
 * Logique métier pure pour les notifications
 */
// ===== ENUMS MÉTIER =====
export var NotificationType
;((NotificationType) => {
  NotificationType['INFO'] = 'INFO'
  NotificationType['SUCCESS'] = 'SUCCESS'
  NotificationType['WARNING'] = 'WARNING'
  NotificationType['ERROR'] = 'ERROR'
  NotificationType['REMINDER'] = 'REMINDER'
  NotificationType['SYSTEM'] = 'SYSTEM'
})(NotificationType || (NotificationType = {}))
export var NotificationPriority
;((NotificationPriority) => {
  NotificationPriority['LOW'] = 'LOW'
  NotificationPriority['NORMAL'] = 'NORMAL'
  NotificationPriority['HIGH'] = 'HIGH'
  NotificationPriority['URGENT'] = 'URGENT'
})(NotificationPriority || (NotificationPriority = {}))
export var NotificationChannel
;((NotificationChannel) => {
  NotificationChannel['IN_APP'] = 'IN_APP'
  NotificationChannel['EMAIL'] = 'EMAIL'
  NotificationChannel['SMS'] = 'SMS'
  NotificationChannel['PUSH'] = 'PUSH'
  NotificationChannel['WEBHOOK'] = 'WEBHOOK'
})(NotificationChannel || (NotificationChannel = {}))
export var NotificationStatus
;((NotificationStatus) => {
  NotificationStatus['PENDING'] = 'PENDING'
  NotificationStatus['SENT'] = 'SENT'
  NotificationStatus['DELIVERED'] = 'DELIVERED'
  NotificationStatus['READ'] = 'READ'
  NotificationStatus['FAILED'] = 'FAILED'
  NotificationStatus['DISMISSED'] = 'DISMISSED'
})(NotificationStatus || (NotificationStatus = {}))
//# sourceMappingURL=entities.js.map
