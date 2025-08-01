/**
 * 🏢 DOMAINE CLIENT - EXPORTS PUBLICS
 * Point d'entrée pour le domaine client
 */

export type {
  CommandResult,
  // Commands & Queries
  CreateClientCommand,
  IClientCommandHandler,
  UpdateClientCommand,
} from './application/commands'
// ===== APPLICATION LAYER =====
export * from './application/commands'
export type {
  GetClientsQuery,
  IClientQueryHandler,
  QueryResult,
} from './application/queries'
export * from './application/queries'
// ===== RE-EXPORTS UTILES =====
export type {
  // Entités principales
  Client,
  ClientAddress,
  ClientContact,
  ClientPriorite,
  ClientStats,
  ClientStatut,
  // Value Objects & Enums
  ClientType,
  ClientWithProjects,
} from './domain/entities'
// ===== DOMAIN LAYER =====
export * from './domain/entities'

export type {
  ClientFilters,
  ClientSortOptions,
  // Repository
  IClientRepository,
  PaginatedClients,
} from './domain/repositories'
export * from './domain/repositories'
export * from './domain/services'
