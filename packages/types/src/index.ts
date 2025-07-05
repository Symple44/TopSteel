// packages/types/src/index.ts - Version ultra-sûre
// Exports existants conservés intacts

// Types
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

// Types UI séparés
export * from './ui'

// Exports explicites pour compatibilité
export type { PaginationMetaDto, PaginationResultDto } from "./api"
export { DevisStatut, FactureStatut, PaiementMethode } from "./facturation"
export { NotificationCategory, NotificationType } from "./notifications"
export { ProjetPriorite, ProjetStatut, ProjetType } from "./projet"
export type { Projet as ProjectType } from "./projet"
export { ChuteQualite, ChuteStatut, MouvementType } from "./stocks"
export type { User as UserType } from "./user"

// Types techniques de base
export type ID = string
export type Timestamp = Date
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

// Types production aliases
export * from './components'
export {
  OrdrePriorite as PrioriteProduction,
  OrdreStatut as StatutProduction
} from './production'
