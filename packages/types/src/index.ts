/**
 * 📦 MODULAR TYPES INDEX - TopSteel ERP
 * Point d'entrée modulaire pour tous les types du projet
 */

// ===== CORE FOUNDATION =====
export * from './core'

// ===== BUSINESS DOMAINS =====
export * from './domains'

// ===== INFRASTRUCTURE LAYER =====
export * from './infrastructure'

// ===== CROSS-CUTTING CONCERNS =====
export * from './cross-cutting'

// ===== BACKWARD COMPATIBILITY =====
// Re-export des types principaux pour compatibilité
export type { Client } from './domains/client'
export type { Projet as ProjectType } from './domains/project'

// Re-export des types de production avec compatibilité complète
export type { OrdreFabrication, Operation, ControleQualite } from './domains/production'
export type { OrdreFabrication as ProductionOrderType } from './domains/production'

// Re-export des types de notifications avec compatibilité
export type {
  Notification as NotificationBase,
  NotificationTemplate,
  NotificationPreferences,
  SendNotificationRequest,
  NotificationStats,
} from './cross-cutting/notifications'

// Alias de notification avec propriétés anglaises pour compatibilité
export interface Notification {
  id: string
  title: string
  message: string
  type: string
  category: string
  priority?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
  userId?: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  expiresAt?: Date
}

// Alias pour compatibilité avec l'ancienne structure
export {
  ClientType as ClientTypeEnum,
  ClientStatus as ClientStatut,
  ClientPriority as ClientPriorite,
} from './domains/client'
export { ProjetStatut, ProjetType, ProjetPriorite } from './domains/project'
export {
  OrdreStatut,
  OrdrePriorite,
  OperationStatut,
  TypeOperation,
  QualiteStatut,
  OrdreStatut as StatutProduction,
  OrdrePriorite as PrioriteProduction,
} from './domains/production'
export {
  NotificationCategory,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from './cross-cutting/notifications'

// ===== GLOBAL UTILITY TYPES =====
// Ces types restent globaux car utilisés partout

/**
 * Types pour les événements
 */
export type EventHandler<T = any> = (event: T) => void | Promise<void>

export type EventSubscription = {
  unsubscribe: () => void
}

/**
 * Types pour la validation
 */
export type ValidationRule<T = any> = {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: T) => boolean | string
}

export type ValidationSchema<T = Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export type ValidationResult = {
  valid: boolean
  errors: Record<string, string[]>
}

/**
 * Types pour les métriques
 */
export type MetricValue = number | string | boolean
export type MetricTags = Record<string, string>

export type Metric = {
  name: string
  value: MetricValue
  tags?: MetricTags
  timestamp?: Date
}

/**
 * Types pour la configuration
 */
export type ConfigValue = string | number | boolean | object | null

export type ConfigSchema = Record<
  string,
  {
    type: 'string' | 'number' | 'boolean' | 'object'
    required?: boolean
    default?: ConfigValue
    description?: string
  }
>

// ===== STORES EXPORTS (DEPUIS INFRASTRUCTURE) =====
// Export explicite des types de store utility nécessaires
export type {
  BaseStoreActions,
  BaseStoreState,
  InitialState,
  StoreConfig,
  StoreCreator,
  AppStore,
  AppState,
  AppStoreActions,
  ProjetStore,
  ProjetState,
  ProjetStoreActions,
} from './infrastructure/stores'

// Export des types store-entities depuis infrastructure
export type {
  StoreMetrics,
  StoreProjet,
  StoreProjetStats,
  StoreSyncState,
  StoreUser,
  StoreClient,
  StoreNotification,
} from './infrastructure/stores'

// Export explicite des filtres depuis leurs domaines respectifs
export type { ProjetFilters } from './domains/project'
export type {
  StockFilters,
  MouvementFilters,
  StockFilters as ProductionFilters,
} from './domains/stock'

// Export des types utilisateur legacy (maintenant depuis domains/user)
export type { User, UserRole } from './domains/user'

// Export des types facturation legacy (maintenant depuis domains/billing)
export type { FacturationFilters, DevisStatut, FactureStatut } from './domains/billing'

// Export du type FilterState pour les stores (depuis infrastructure)
export type {
  FilterState,
  MetricsState,
  ProjetStats,
  SessionState,
  UIState,
} from './infrastructure/stores'
