/**
 * 🏗️ PACKAGES DOMAINS - EXPORTS PUBLICS
 * Architecture modulaire par domaines métiers - TopSteel ERP
 */
// ===== DOMAINES PRINCIPAUX =====
export * from './core'
// ===== SERVICES MÉTIER =====
export { ClientBusinessService } from './core/client/domain/services'
export * from './cross-cutting'
export {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from './cross-cutting'
// Re-export notifications with proper naming to avoid conflicts
export * as Notifications from './notifications'
export * from './production'
export {
  MaterialStatus,
  OperationStatut,
  OrdrePriorite,
  OrdreStatut,
  PrioriteProduction,
  QualiteStatut,
  StatutProduction,
  TypeOperation,
} from './production'
export * from './sales'
export * from './search'
//# sourceMappingURL=index.js.map
