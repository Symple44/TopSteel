/**
 * 🏗️ PACKAGES DOMAINS - EXPORTS PUBLICS
 * Architecture modulaire par domaines métiers - TopSteel ERP
 */

// ===== DOMAINES PRINCIPAUX =====
export * from './core'
export * from './cross-cutting'
// Export conditionnel pour les images (côté serveur uniquement)
export type * from './image/types'
// Re-export notifications with proper naming to avoid conflicts
export * as Notifications from './notifications'
export * from './production'
export * from './sales'
export * from './search'

// ===== RE-EXPORTS ESSENTIELS =====

// Core types
export type {
  Client,
  ClientPriorite,
  ClientStatut,
  ClientType,
  Competence,
  Departement,
  FacturationFilters,
  OperationFilters,
  Organization,
  Projet,
  ProjetFilters,
  Site,
  User,
  UserRole,
  UserStatut,
} from './core'
// ===== SERVICES MÉTIER =====
export { ClientBusinessService } from './core/client/domain/services'
// Cross-cutting types
export type {
  Notification,
  NotificationFilters,
  NotificationPreferences,
  NotificationStats,
} from './cross-cutting'
export {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from './cross-cutting'
// Production types
export type {
  ControleQualite,
  MaterialOrder,
  Operation,
  OrdreFabrication,
  ProductionFilters,
  ProductionStats,
} from './production'
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
// Sales types
export type {
  Quote,
  QuoteItem,
  QuoteStatut,
  QuoteType,
} from './sales'
