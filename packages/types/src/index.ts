/**
 * 📦 TYPES CENTRALISÉS - TopSteel ERP  
 * Point d'entrée unique pour tous les types du projet
 * Fichier: packages/types/src/index.ts
 */

// ===== EXPORTS EXISTANTS CONSERVÉS INTACTS =====

// Types de base
export * from './api'
export * from './auth'
export * from './common'
export * from './forms'
export * from './user'

// Types métier
export * from './admin'
export * from './client'
export * from './facturation'
export * from './guards'
export * from './notifications'
export * from './production'
export * from './projet'
export * from './stocks'

// Types stores 
export * from './store'

// Types UI séparés
export * from './ui'

// ===== EXPORTS EXPLICITES POUR COMPATIBILITÉ =====
export type { PaginationMetaDto, PaginationResultDto } from "./api"
export { DevisStatut, FactureStatut, PaiementMethode } from "./facturation"
export { NotificationCategory, NotificationType } from "./notifications"
export { ProjetPriorite, ProjetStatut, ProjetType } from "./projet"
export type { Projet as ProjectType } from "./projet"
export { ChuteQualite, ChuteStatut, MouvementType } from "./stocks"
export type { User as UserType } from "./user"

// ===== TYPES TECHNIQUES DE BASE =====
export type ID = string
export type Timestamp = Date
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

// ===== TYPES PRODUCTION ALIASES =====
export * from './components'
export {
  OrdrePriorite as PrioriteProduction,
  OrdreStatut as StatutProduction
} from './production'

// ===== VERSION ET MÉTADONNÉES =====
export const TYPES_VERSION = '1.0.0'
export const SCHEMA_METADATA = {
  version: TYPES_VERSION,
  lastUpdate: '2025-01-05',
  compatibleWith: ['1.x', '2.x'],
  breaking: false
} as const