/**
 * 🏗️ DOMAINE CORE - EXPORTS PUBLICS
 * Entités centrales de l'ERP TopSteel
 */
export * from './base'
export * from './client'
export * from './common-filters'
export * from './organization'
export * from './project'
export * from './user'
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
export type { Client, ClientPriorite, ClientStatut, ClientType } from './client'
export type { FacturationFilters, OperationFilters } from './common-filters'
export type { Departement, DepartementType, Organization, Site, SiteType } from './organization'
export type {
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
export { ProjetPriorite, ProjetStatut, ProjetType } from './project'
export type { Competence, User, UserRole, UserStatut } from './user'
//# sourceMappingURL=index.d.ts.map
