/**
 * 🔌 INTERFACES REPOSITORY - DOMAINE CLIENT
 * Contrats pour l'accès aux données (Domain Driven Design)
 */

import type { Client, ClientStats, ClientWithProjects } from './entities'
import type { PaginationOptions } from '../../base'

// ===== FILTRES ET CRITÈRES =====

export interface ClientFilters {
  readonly nom?: string
  readonly type?: string[]
  readonly statut?: string[]
  readonly priorite?: string[]
  readonly ville?: string
  readonly source?: string
  readonly chiffreAffaireMin?: number
  readonly chiffreAffaireMax?: number
  readonly dateCreationMin?: Date
  readonly dateCreationMax?: Date
}

export interface ClientSortOptions {
  readonly field: 'nom' | 'type' | 'statut' | 'priorite' | 'chiffreAffaire' | 'createdAt'
  readonly direction: 'asc' | 'desc'
}


// ===== RÉSULTATS PAGINÉS =====

export interface PaginatedClients {
  readonly items: Client[]
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly totalPages: number
}

// ===== INTERFACE REPOSITORY =====

export interface IClientRepository {
  // Lecture
  findAll(
    filters?: ClientFilters,
    sort?: ClientSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedClients>
  
  findById(id: string): Promise<Client | null>
  
  findByEmail(email: string): Promise<Client | null>
  
  findBySiret(siret: string): Promise<Client | null>
  
  findWithProjects(id: string): Promise<ClientWithProjects | null>
  
  // Écriture
  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>
  
  update(id: string, updates: Partial<Client>): Promise<Client>
  
  delete(id: string): Promise<boolean>
  
  // Statistiques
  getStats(filters?: ClientFilters): Promise<ClientStats>
  
  // Recherche avancée
  search(query: string, filters?: ClientFilters): Promise<Client[]>
  
  // Validation métier
  exists(email: string, excludeId?: string): Promise<boolean>
  
  canDelete(id: string): Promise<boolean>
}