/**
 * 🏗️ PACKAGES DOMAINS - EXPORTS PUBLICS
 * Architecture modulaire par domaines métiers - TopSteel ERP
 */

// ===== DOMAINES PRINCIPAUX =====
export * from './core'
export * from './cross-cutting'
// Export du service ImageElasticsearchService
export { ImageElasticsearchService, imageElasticsearchService } from './image/elasticsearch-service'
// Export conditionnel pour les images (côté serveur uniquement)
export type * from './image/types'
// ⚠️ SERVER-ONLY: ImageService requires Node.js (Sharp dependency)
export { ImageService } from './image/service'
// Re-export notifications with proper naming to avoid conflicts
export * as Notifications from './notifications'
export * from './production'
export * from './sales'
export * from './search'
// Export direct des services Elasticsearch pour faciliter l'import
export { ElasticsearchClient, elasticsearchClient } from './search/elasticsearch-client'
export { ElasticsearchMigrationService, migrationService } from './search/migration-service'

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

// Core enums
export {
  ProjetPriorite,
  ProjetStatut,
  ProjetType,
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
