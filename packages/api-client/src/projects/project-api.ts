/**
 * 🏗️ API PROJETS - DOMAINE PROJETS
 * Gestion des appels API pour les projets
 */

import { BaseApiClient } from '../core/base-api-client'
import type { RequestOptions } from '../core/http-client'
import type { 
  Projet, 
  ProjetFilters
} from '@erp/domains'

import { 
  ProjetStatut,
  ProjetType,
  ProjetPriorite 
} from '@erp/domains'

export interface ProjetStats {
  total: number
  enCours: number
  termines: number
  enRetard: number
  montantTotal: number
}

export interface ProjetWithDetails extends Projet {
  client?: any
  responsable?: any
  commercial?: any
  equipe?: any[]
}

export interface ProjetSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginatedProjets {
  items: Projet[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateProjetCommand {
  nom: string
  description?: string
  clientId: string
  responsableId: string
  commercialId?: string
  statut?: ProjetStatut
  type?: ProjetType
  priorite?: ProjetPriorite
  delais?: {
    dateDebut: Date
    dateFin: Date
  }
  adresseLivraison?: any
  contact?: any
}

export interface UpdateProjetCommand extends Partial<CreateProjetCommand> {
  id: string
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: Record<string, string[]>
}

export class ProjectApiClient extends BaseApiClient {
  private readonly endpoint = '/projects'

  // ===== LECTURE =====

  async getProjets(
    filters?: ProjetFilters,
    sort?: ProjetSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedProjets> {
    const params = this.buildQueryParams({
      ...filters,
      sortField: sort?.field,
      sortDirection: sort?.direction,
      page: pagination?.page,
      limit: pagination?.limit,
    })

    return this.http.getWithPagination<Projet>(this.endpoint, params)
  }

  async getProjetById(id: string): Promise<Projet | null> {
    try {
      const response = await this.http.get<Projet>(`${this.endpoint}/${this.normalizeId(id)}`)
      return response.data
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  async getProjetWithDetails(id: string): Promise<ProjetWithDetails | null> {
    try {
      const response = await this.http.get<ProjetWithDetails>(
        `${this.endpoint}/${this.normalizeId(id)}/details`
      )
      return response.data
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  async searchProjets(query: string, filters?: ProjetFilters): Promise<Projet[]> {
    const params = this.buildQueryParams({
      q: query,
      ...filters,
    })

    const response = await this.http.get<Projet[]>(`${this.endpoint}/search`, { params } as RequestOptions)
    return response.data
  }

  async getProjetStats(filters?: ProjetFilters): Promise<ProjetStats> {
    const params = this.buildQueryParams(filters || {})
    const response = await this.http.get<ProjetStats>(`${this.endpoint}/stats`, { params } as RequestOptions)
    return response.data
  }

  // ===== ÉCRITURE =====

  async createProjet(command: CreateProjetCommand): Promise<OperationResult<Projet>> {
    return this.http.executeOperation(async () => {
      return this.http.post<Projet>(this.endpoint, command)
    })
  }

  async updateProjet(id: string, command: UpdateProjetCommand): Promise<OperationResult<Projet>> {
    return this.http.executeOperation(async () => {
      return this.http.put<Projet>(`${this.endpoint}/${this.normalizeId(id)}`, command)
    })
  }

  async deleteProjet(id: string): Promise<OperationResult<boolean>> {
    return this.http.executeOperation(async () => {
      await this.http.delete(`${this.endpoint}/${this.normalizeId(id)}`)
      return { data: true } as any
    })
  }

  // ===== VALIDATION =====

  async validateProjetReference(reference: string, excludeId?: string): Promise<boolean> {
    const params = this.buildQueryParams({
      reference,
      excludeId,
    })

    const response = await this.http.get<{ exists: boolean }>(
      `${this.endpoint}/validate/reference`,
      { params } as RequestOptions
    )
    return !response.data.exists
  }

  async canDeleteProjet(id: string): Promise<boolean> {
    const response = await this.http.get<{ canDelete: boolean }>(
      `${this.endpoint}/${this.normalizeId(id)}/can-delete`
    )
    return response.data.canDelete
  }

  // ===== ACTIONS MÉTIER =====

  async archiveProjet(id: string): Promise<OperationResult<Projet>> {
    return this.http.executeOperation(async () => {
      return this.http.patch<Projet>(`${this.endpoint}/${this.normalizeId(id)}/archive`)
    })
  }

  async changeProjetStatus(id: string, newStatus: ProjetStatut): Promise<OperationResult<Projet>> {
    return this.http.executeOperation(async () => {
      return this.http.patch<Projet>(`${this.endpoint}/${this.normalizeId(id)}/status`, { statut: newStatus })
    })
  }

  async assignResponsable(id: string, responsableId: string): Promise<OperationResult<Projet>> {
    return this.http.executeOperation(async () => {
      return this.http.patch<Projet>(`${this.endpoint}/${this.normalizeId(id)}/assign-responsable`, { responsableId })
    })
  }

  async updateProjetProgress(id: string, progress: number): Promise<OperationResult<Projet>> {
    return this.http.executeOperation(async () => {
      return this.http.patch<Projet>(`${this.endpoint}/${this.normalizeId(id)}/progress`, { avancement: progress })
    })
  }

  async duplicateProjet(id: string): Promise<OperationResult<Projet>> {
    return this.http.executeOperation(async () => {
      return this.http.post<Projet>(`${this.endpoint}/${this.normalizeId(id)}/duplicate`)
    })
  }
}