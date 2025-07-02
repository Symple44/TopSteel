// packages/types/src/index.ts - Exports corrigés sans conflits
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
export * from './notifications'
export * from './production'  // Export global de production
export * from './projet'
export * from './stocks'

// Types UI séparés
export * from './ui'

// Exports explicites pour les autres enums (pas production)
export type { PaginationMetaDto, PaginationResultDto } from "./api"
export { DevisStatut, FactureStatut, PaiementMethode } from "./facturation"
export { NotificationCategory, NotificationType } from "./notifications"
// Production exports sont gérés par export * from './production'
export { ProjetPriorite, ProjetStatut, ProjetType } from "./projet"
export type { Projet as ProjectType } from "./projet"
export { ChuteQualite, ChuteStatut, MouvementType } from "./stocks"
export type { User as UserType } from "./user"

// Types techniques de base
export type ID = string
export type Timestamp = Date
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }
