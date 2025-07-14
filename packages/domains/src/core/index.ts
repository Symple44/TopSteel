/**
 * 🏗️ DOMAINE CORE - EXPORTS PUBLICS
 * Entités centrales de l'ERP TopSteel
 */

// ===== TYPES DE BASE =====
export * from './base'

// ===== SOUS-DOMAINES CORE =====
export * from './client'
export * from './user'
export * from './organization'
export * from './project'

// ===== RE-EXPORTS PRINCIPAUX =====

// Base types
export type {
  BaseEntity,
  ID,
  Timestamp,
  PaginationOptions,
  PaginatedResponse,
  OperationResult,
  BaseFilters,
  SortOptions,
} from './base'

export type {
  // Client
  Client,
  ClientType,
  ClientStatut,
  ClientPriorite,
} from './client'

export type {
  // User
  User,
  UserRole,
  UserStatut,
  Competence,
} from './user'

export type {
  // Organization
  Organization,
  Departement,
  Site,
  DepartementType,
  SiteType,
} from './organization'

export type {
  // Project
  Projet,
  ProjetStats,
  ProjetWithDetails,
  ProjetContact,
  ProjetAdresse,
  ProjetDelais,
  ProjetMontants,
  ProjetDocuments,
  ProjetFilters,
  ProjetSortOptions,
} from './project'

export {
  // Project enums
  ProjetStatut,
  ProjetType,
  ProjetPriorite,
} from './project'