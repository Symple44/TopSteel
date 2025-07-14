/**
 * 🏢 DOMAINE CLIENT - EXPORTS PUBLICS
 * Point d'entrée pour le domaine client
 */

// ===== DOMAIN LAYER =====
export * from './domain/entities'
export * from './domain/services'
export * from './domain/repositories'

// ===== APPLICATION LAYER =====
export * from './application/commands'
export * from './application/queries'

// ===== RE-EXPORTS UTILES =====
export type {
  // Entités principales
  Client,
  ClientContact,
  ClientAddress,
  ClientStats,
  ClientWithProjects,
  
  // Value Objects & Enums
  ClientType,
  ClientStatut,
  ClientPriorite,
} from './domain/entities'

export type {
  // Repository
  IClientRepository,
  ClientFilters,
  ClientSortOptions,
  PaginatedClients,
} from './domain/repositories'

export type {
  // Commands & Queries
  CreateClientCommand,
  UpdateClientCommand,
  IClientCommandHandler,
  CommandResult,
} from './application/commands'

export type {
  GetClientsQuery,
  IClientQueryHandler,
  QueryResult,
} from './application/queries'