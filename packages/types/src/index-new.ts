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
export type { OrdreFabrication as ProductionOrderType } from './domains/production'

// Alias pour compatibilité avec l'ancienne structure
export { ClientType as ClientTypeEnum, ClientStatus as ClientStatut, ClientPriority as ClientPriorite } from './domains/client'
export { ProjetStatut, ProjetType, ProjetPriorite } from './domains/project'
export { OrdreStatut as StatutProduction, OrdrePriorite as PrioriteProduction } from './domains/production'

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