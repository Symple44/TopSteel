/**
 * 🏗️ DOMAINE CORE - EXPORTS PUBLICS
 * Entités centrales de l'ERP TopSteel
 */

// ===== TYPES DE BASE =====
export * from './base'

// ===== SOUS-DOMAINES CORE =====
export * from './client'
export * from './common-filters'
export * from './organization'
export * from './project'
export * from './user'

// ===== RE-EXPORTS PRINCIPAUX =====

// Base types
export type {
  BaseEntity,
  BaseFilters,
  ID,
  OperationResult,
  PaginatedResponse,
  PaginationOptions,
  SortOptions,
  Timestamp,
} from './base'

export type {
  // Client
  Client,
  ClientPriorite,
  ClientStatut,
  ClientType,
} from './client'
export type {
  // Common filters
  FacturationFilters,
  OperationFilters,
} from './common-filters'
export type {
  Departement,
  DepartementType,
  // Organization
  Organization,
  Site,
  SiteType,
} from './organization'
export type {
  // Project
  Projet,
  ProjetAdresse,
  ProjetContact,
  ProjetDelais,
  ProjetDocuments,
  ProjetFilters,
  ProjetMontants,
  ProjetSortOptions,
  ProjetStats,
  ProjetWithDetails,
} from './project'
export {
  ProjetPriorite,
  // Project enums
  ProjetStatut,
  ProjetType,
} from './project'
export type {
  Competence,
  // User
  User,
  UserRole,
  UserStatut,
} from './user'
