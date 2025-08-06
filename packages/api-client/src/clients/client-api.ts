/**
 * 🏢 API CLIENT - DOMAINE CLIENTS
 * Gestion des appels API pour les clients
 */

// Temporary local types until @erp/domains dependency is resolved
interface Client {
  id: string
  nom: string
  email: string
  type: string
  statut: string
  priorite: string
  createdAt: Date
  updatedAt: Date
}

interface ClientStats {
  total: number
  actifs: number
  prospects: number
  chiffreAffaires: number
}

interface ClientWithProjects extends Client {
  projets: unknown[]
  stats: ClientStats
}

interface ClientFilters {
  type?: string[]
  statut?: string[]
  priorite?: string[]
  search?: string
}

interface ClientSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

interface PaginatedClients {
  items: Client[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface CreateClientCommand {
  nom: string
  email: string
  type: string
  adresse?: unknown
  contact?: unknown
}

interface UpdateClientCommand extends Partial<CreateClientCommand> {
  id: string
}

interface PaginationOptions {
  page: number
  limit: number
}

interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: Record<string, string[]>
}

import { BaseApiClient } from '../core/base-api-client'
import type { RequestOptions } from '../core/http-client'

export class ClientApiClient extends BaseApiClient {
  private readonly endpoint = '/clients'

  // ===== LECTURE =====

  async getClients(
    filters?: ClientFilters,
    sort?: ClientSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedClients> {
    const params = this.buildQueryParams({
      ...filters,
      sortField: sort?.field,
      sortDirection: sort?.direction,
      page: pagination?.page,
      limit: pagination?.limit,
    })

    return this.http.getWithPagination<Client>(this.endpoint, params)
  }

  async getClientById(id: string): Promise<Client | null> {
    try {
      const response = await this.http.get<Client>(`${this.endpoint}/${this.normalizeId(id)}`)
      return response.data
    } catch (error: unknown) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null
      }
      throw error
    }
  }

  async getClientWithProjects(id: string): Promise<ClientWithProjects | null> {
    try {
      const response = await this.http.get<ClientWithProjects>(
        `${this.endpoint}/${this.normalizeId(id)}/with-projects`
      )
      return response.data
    } catch (error: unknown) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null
      }
      throw error
    }
  }

  async searchClients(query: string, filters?: ClientFilters): Promise<Client[]> {
    const params = this.buildQueryParams({
      q: query,
      ...filters,
    })

    const response = await this.http.get<Client[]>(`${this.endpoint}/search`, {
      params,
    } as RequestOptions)
    return response.data
  }

  async getClientStats(filters?: ClientFilters): Promise<ClientStats> {
    const params = this.buildQueryParams(filters || {})
    const response = await this.http.get<ClientStats>(`${this.endpoint}/stats`, {
      params,
    } as RequestOptions)
    return response.data
  }

  // ===== ÉCRITURE =====

  async createClient(command: CreateClientCommand): Promise<OperationResult<Client>> {
    return this.http.executeOperation(async () => {
      return this.http.post<Client>(this.endpoint, command)
    })
  }

  async updateClient(id: string, command: UpdateClientCommand): Promise<OperationResult<Client>> {
    return this.http.executeOperation(async () => {
      return this.http.put<Client>(`${this.endpoint}/${this.normalizeId(id)}`, command)
    })
  }

  async deleteClient(id: string): Promise<OperationResult<boolean>> {
    return this.http.executeOperation(async () => {
      await this.http.delete(`${this.endpoint}/${this.normalizeId(id)}`)
      return { data: true } as { data: boolean }
    })
  }

  // ===== VALIDATION =====

  async validateClientEmail(email: string, excludeId?: string): Promise<boolean> {
    const params = this.buildQueryParams({
      email,
      excludeId,
    })

    const response = await this.http.get<{ exists: boolean }>(`${this.endpoint}/validate/email`, {
      params,
    } as RequestOptions)
    return !response.data.exists
  }

  async validateClientSiret(siret: string, excludeId?: string): Promise<boolean> {
    const params = this.buildQueryParams({
      siret,
      excludeId,
    })

    const response = await this.http.get<{ exists: boolean }>(`${this.endpoint}/validate/siret`, {
      params,
    } as RequestOptions)
    return !response.data.exists
  }

  async canDeleteClient(id: string): Promise<boolean> {
    const response = await this.http.get<{ canDelete: boolean }>(
      `${this.endpoint}/${this.normalizeId(id)}/can-delete`
    )
    return response.data.canDelete
  }

  // ===== ACTIONS MÉTIER =====

  async archiveClient(id: string): Promise<OperationResult<Client>> {
    return this.http.executeOperation(async () => {
      return this.http.patch<Client>(`${this.endpoint}/${this.normalizeId(id)}/archive`)
    })
  }

  async reactivateClient(id: string): Promise<OperationResult<Client>> {
    return this.http.executeOperation(async () => {
      return this.http.patch<Client>(`${this.endpoint}/${this.normalizeId(id)}/reactivate`)
    })
  }

  async upgradeClientPriority(id: string): Promise<OperationResult<Client>> {
    return this.http.executeOperation(async () => {
      return this.http.patch<Client>(`${this.endpoint}/${this.normalizeId(id)}/upgrade-priority`)
    })
  }
}
