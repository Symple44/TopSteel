/**
 * 🏢 DOMAINE CLIENT - EXPORTS PUBLICS
 * Point d'entrée pour le domaine client
 */
export type {
  CommandResult,
  CreateClientCommand,
  IClientCommandHandler,
  UpdateClientCommand,
} from './application/commands'
export * from './application/commands'
export type { GetClientsQuery, IClientQueryHandler, QueryResult } from './application/queries'
export * from './application/queries'
export type {
  Client,
  ClientAddress,
  ClientContact,
  ClientPriorite,
  ClientStats,
  ClientStatut,
  ClientType,
  ClientWithProjects,
} from './domain/entities'
export * from './domain/entities'
export type {
  ClientFilters,
  ClientSortOptions,
  IClientRepository,
  PaginatedClients,
} from './domain/repositories'
export * from './domain/repositories'
export * from './domain/services'
//# sourceMappingURL=index.d.ts.map
