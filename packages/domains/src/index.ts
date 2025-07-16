/**
 * 🏗️ PACKAGES DOMAINS - EXPORTS PUBLICS
 * Architecture modulaire par domaines métiers - TopSteel ERP
 */

// ===== DOMAINES PRINCIPAUX =====
export * from './core'
export * from './sales'
export * from './production'
export * from './cross-cutting'
export * from './search'
export * from './image'

// ===== RE-EXPORTS ESSENTIELS =====

// Core types
export type {
  Client,
  ClientType,
  ClientStatut,
  ClientPriorite,
  User,
  UserRole,
  UserStatut,
  Competence,
  Organization,
  Departement,
  Site,
} from './core'

// Sales types
export type {
  Quote,
  QuoteStatut,
  QuoteType,
  QuoteItem,
} from './sales'

// Production types
export type {
  OrdreFabrication,
  Operation,
  ControleQualite,
  MaterialOrder,
  ProductionStats,
} from './production'

export {
  OrdreStatut,
  OrdrePriorite,
  StatutProduction,
  TypeOperation,
  OperationStatut,
  PrioriteProduction,
  QualiteStatut,
  MaterialStatus,
} from './production'

// Cross-cutting types
export type {
  Notification,
  NotificationStats,
  NotificationPreferences,
  NotificationFilters,
} from './cross-cutting'

export {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
} from './cross-cutting'

// ===== SERVICES MÉTIER =====
export { ClientBusinessService } from './core/client/domain/services'