/**
 * 👥 CLIENT REQUESTS - TopSteel ERP
 * Types de requêtes pour le domaine client
 */

import type { WithoutId, DeepPartial } from '../../core'
import type { ListRequest } from '../../infrastructure/api'
import type { Client, ClientFilters } from './entities'

/**
 * Requête de création d'un client
 */
export type CreateClientRequest = WithoutId<Client>

/**
 * Requête de mise à jour d'un client
 */
export type UpdateClientRequest = DeepPartial<WithoutId<Client>>

/**
 * Requête de liste des clients avec filtres
 */
export interface ListClientsRequest extends ListRequest {
  filters?: ClientFilters
}

/**
 * Requête de recherche de clients
 */
export interface SearchClientsRequest {
  query: string
  filters?: Partial<ClientFilters>
  limit?: number
}

/**
 * Requête pour obtenir les statistiques client
 */
export interface ClientStatsRequest {
  dateDebut?: Date
  dateFin?: Date
  groupBy?: 'type' | 'statut' | 'commercial' | 'month'
}