/**
 * 🔌 INTERFACES REPOSITORY - DOMAINE CLIENT
 * Contrats pour l'accès aux données (Domain Driven Design)
 */
import type { PaginationOptions } from '../../base'
import type { Client, ClientStats, ClientWithProjects } from './entities'
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
export interface PaginatedClients {
  readonly items: Client[]
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly totalPages: number
}
export interface IClientRepository {
  findAll(
    filters?: ClientFilters,
    sort?: ClientSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedClients>
  findById(id: string): Promise<Client | null>
  findByEmail(email: string): Promise<Client | null>
  findBySiret(siret: string): Promise<Client | null>
  findWithProjects(id: string): Promise<ClientWithProjects | null>
  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>
  update(id: string, updates: Partial<Client>): Promise<Client>
  delete(id: string): Promise<boolean>
  getStats(filters?: ClientFilters): Promise<ClientStats>
  search(query: string, filters?: ClientFilters): Promise<Client[]>
  exists(email: string, excludeId?: string): Promise<boolean>
  canDelete(id: string): Promise<boolean>
}
//# sourceMappingURL=repositories.d.ts.map
