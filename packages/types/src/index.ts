/**
 * 📦 INDEX TYPES CENTRALISÉS - TopSteel ERP
 * Point d'entrée principal pour tous les types du projet
 * Fichier: packages/types/src/index.ts
 */

// ===== TYPES DE BASE =====
export * from './api'
export * from './auth'
export * from './common'
export * from './forms'
export * from './user'

// ===== TYPES MÉTIER =====
export * from './admin'
export * from './client'
export * from './facturation'
export * from './guards'
export * from './notifications'
export * from './production'
export * from './projet'
export * from './stocks'

// ===== TYPES UI ET COMPOSANTS =====
export * from './components'
export * from './ui'

// ===== TYPES STORES (NOUVEAU) =====
export * from './store-entities'
export * from './stores'

// ===== EXPORTS EXPLICITES POUR COMPATIBILITÉ =====

// Types API
export type { PaginationMetaDto, PaginationResultDto } from './api'

// Types facturation
export { DevisStatut, FactureStatut, PaiementMethode } from './facturation'

// Types notifications
export { NotificationCategory, NotificationType } from './notifications'

// Types projet
export { ProjetPriorite, ProjetStatut, ProjetType } from './projet'
export type { Projet as ProjectType } from './projet'

// Types stocks
export { ChuteQualite, ChuteStatut, MouvementType } from './stocks'

// Types utilisateur
export type { User as UserType } from './user'

// Types production (aliases)
export {
  OrdrePriorite as PrioriteProduction,
  OrdreStatut as StatutProduction
} from './production'

// ===== TYPES TECHNIQUES GLOBAUX =====

/**
 * Types utilitaires de base
 */
export type ID = string
export type Timestamp = Date
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

/**
 * Types pour les états asynchrones
 */
export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Types pour les réponses API
 */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Types pour la pagination
 */
export type PaginationParams = {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Types pour les filtres
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in'

export type FilterCondition<T = any> = {
  field: string
  operator: FilterOperator
  value: T
}

export type FilterGroup = {
  operator: 'and' | 'or'
  conditions: (FilterCondition | FilterGroup)[]
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
 * Types pour les événements
 */
export type EventHandler<T = any> = (event: T) => void | Promise<void>

export type EventSubscription = {
  unsubscribe: () => void
}

/**
 * Types pour les permissions
 */
export type Permission = string

export type PermissionCheck = {
  resource: string
  action: string
  context?: Record<string, any>
}

/**
 * Types pour l'audit
 */
export type AuditLogEntry = {
  id: string
  timestamp: Date
  userId: string
  action: string
  resource: string
  resourceId?: string
  changes?: Record<string, { old: any; new: any }>
  metadata?: Record<string, any>
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

export type ConfigSchema = Record<string, {
  type: 'string' | 'number' | 'boolean' | 'object'
  required?: boolean
  default?: ConfigValue
  description?: string
}>

// ===== TYPES UTILITAIRES AVANCÉS =====

/**
 * Rend toutes les propriétés optionnelles de manière récursive
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Rend toutes les propriétés requises de manière récursive
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * Extrait les clés dont les valeurs correspondent au type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

/**
 * Construit un type avec les propriétés de T sauf celles de K
 */
export type Except<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Merge de deux types
 */
export type Merge<T, U> = Except<T, Extract<keyof T, keyof U>> & U

/**
 * Type avec ID obligatoire
 */
export type WithId<T> = T & { id: string }

/**
 * Type sans ID
 */
export type WithoutId<T> = Omit<T, 'id'>

/**
 * Type pour les timestamps
 */
export type WithTimestamps<T> = T & {
  createdAt: Date
  updatedAt: Date
}

/**
 * Type pour les entités "soft delete"
 */
export type WithSoftDelete<T> = T & {
  deletedAt?: Date | null
  isDeleted?: boolean
}

/**
 * Type pour les entités avec métadonnées
 */
export type WithMetadata<T> = T & {
  metadata?: Record<string, any>
}