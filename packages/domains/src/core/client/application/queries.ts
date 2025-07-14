/**
 * 🔍 REQUÊTES - DOMAINE CLIENT
 * Cas d'usage pour la lecture de données (CQRS)
 */

import type { Client, ClientStats, ClientWithProjects } from '../domain/entities'
import type { ClientFilters, ClientSortOptions, PaginatedClients } from '../domain/repositories'
import type { PaginationOptions } from '../../base'

// ===== REQUÊTES =====

export interface GetClientsQuery {
  readonly filters?: ClientFilters
  readonly sort?: ClientSortOptions
  readonly pagination?: PaginationOptions
}

export interface GetClientByIdQuery {
  readonly id: string
  readonly includeProjects?: boolean
}

export interface SearchClientsQuery {
  readonly searchTerm: string
  readonly filters?: ClientFilters
  readonly limit?: number
}

export interface GetClientStatsQuery {
  readonly filters?: ClientFilters
  readonly dateRange?: {
    start: Date
    end: Date
  }
}

export interface GetTopClientsQuery {
  readonly criterium: 'chiffreAffaire' | 'nombreProjets' | 'recentActivity'
  readonly limit?: number
  readonly timeframe?: 'month' | 'quarter' | 'year' | 'all'
}

// ===== RÉSULTATS =====

export interface QueryResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly meta?: {
    executionTime?: number
    fromCache?: boolean
  }
}

// ===== HANDLERS =====

export interface IClientQueryHandler {
  getClients(query: GetClientsQuery): Promise<QueryResult<PaginatedClients>>
  
  getClientById(query: GetClientByIdQuery): Promise<QueryResult<Client | ClientWithProjects>>
  
  searchClients(query: SearchClientsQuery): Promise<QueryResult<Client[]>>
  
  getClientStats(query: GetClientStatsQuery): Promise<QueryResult<ClientStats>>
  
  getTopClients(query: GetTopClientsQuery): Promise<QueryResult<Client[]>>
  
  validateClientEmail(email: string, excludeId?: string): Promise<QueryResult<boolean>>
  
  validateClientSiret(siret: string, excludeId?: string): Promise<QueryResult<boolean>>
}