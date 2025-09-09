/**
 * Simple API Client Implementation with domain-specific methods
 * This extends the base APIClient with typed domain APIs
 */

import type {
  Contact,
  CreateContactDto,
  CreatePartnerAddressDto,
  CreatePartnerDto,
  CreatePartnerGroupDto,
  CreatePartnerSiteDto,
  Material,
  MaterialFilters,
  MaterialStatistics,
  Partner,
  PartnerAddress,
  PartnerFilters,
  PartnerGroup,
  PartnerSite,
  PartnerStatistics,
  UpdateContactDto,
  UpdatePartnerAddressDto,
  UpdatePartnerDto,
  UpdatePartnerGroupDto,
  UpdatePartnerSiteDto,
} from '@erp/types'
import type {
  BatchOperationResponse,
  FileUploadResponse,
  PaginatedResponse,
} from '@/types/api-types'
import { APIClientEnhanced } from './api-client-enhanced'
import type {
  ArticlesAPI,
  FilesAPI,
  IAPIClient,
  MaterialsAPI,
  NotificationsAPI,
  PartnersAPI,
  ProjectsAPI,
  ReportsAPI,
  SearchAPI,
  SettingsAPI,
  UsersAPI,
} from './api-client-types-simple'

/**
 * Partners API implementation
 */
class PartnersAPIImpl implements PartnersAPI {
  constructor(private client: APIClientEnhanced) {}

  async getPartners(filters?: PartnerFilters): Promise<PaginatedResponse<Partner>> {
    const params = new URLSearchParams()
    if (filters?.type && Array.isArray(filters.type)) {
      filters.type.forEach((t) => {
        params.append('type', t)
      })
    }
    if (filters?.status && Array.isArray(filters.status)) {
      filters.status.forEach((s) => {
        params.append('status', s)
      })
    }
    if (filters?.denomination) params.append('denomination', filters.denomination)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/partners?${queryString}` : '/partners'
    return this.client.get<PaginatedResponse<Partner>>(endpoint)
  }

  async getPartner(id: string): Promise<Partner> {
    return this.client.get<Partner>(`/partners/${id}`)
  }

  async getPartnerComplete(id: string): Promise<Partner> {
    return this.client.get<Partner>(`/partners/${id}/complete`)
  }

  async createPartner(data: CreatePartnerDto): Promise<Partner> {
    return this.client.post<Partner>('/partners', data)
  }

  async updatePartner(id: string, data: UpdatePartnerDto): Promise<Partner> {
    return this.client.put<Partner>(`/partners/${id}`, data)
  }

  async deletePartner(id: string): Promise<void> {
    return this.client.delete<void>(`/partners/${id}`)
  }

  async getStatistics(): Promise<PartnerStatistics> {
    return this.client.get<PartnerStatistics>('/partners/statistics')
  }

  async getPartnerGroups(): Promise<PartnerGroup[]> {
    return this.client.get<PartnerGroup[]>('/partners/groups')
  }

  async getClientsActifs(): Promise<Partner[]> {
    return this.client.get<Partner[]>('/partners/clients-actifs')
  }

  async getFournisseursActifs(): Promise<Partner[]> {
    return this.client.get<Partner[]>('/partners/fournisseurs-actifs')
  }

  async duplicatePartner(id: string, newCode: string): Promise<Partner> {
    return this.client.post<Partner>(`/partners/${id}/duplicate`, { newCode })
  }

  async convertProspect(id: string): Promise<Partner> {
    return this.client.patch<Partner>(`/partners/${id}/convert-prospect`)
  }

  async suspendPartner(id: string, raison: string): Promise<Partner> {
    return this.client.patch<Partner>(`/partners/${id}/suspend`, { raison })
  }

  async mergePartners(principalId: string, secondaireId: string): Promise<Partner> {
    return this.client.post<Partner>('/partners/merge', { principalId, secondaireId })
  }

  async assignPartnerToGroup(partnerId: string, groupId: string): Promise<Partner> {
    return this.client.patch<Partner>(`/partners/${partnerId}/assign-group`, { groupId })
  }

  // Related entities
  async getPartnerContacts(partnerId: string): Promise<Contact[]> {
    return this.client.get<Contact[]>(`/partners/${partnerId}/contacts`)
  }

  async createContact(partnerId: string, data: CreateContactDto): Promise<Contact> {
    return this.client.post<Contact>(`/partners/${partnerId}/contacts`, data)
  }

  async updateContact(id: string, data: UpdateContactDto): Promise<Contact> {
    return this.client.put<Contact>(`/contacts/${id}`, data)
  }

  async deleteContact(id: string): Promise<void> {
    return this.client.delete<void>(`/contacts/${id}`)
  }

  async getPartnerSites(partnerId: string): Promise<PartnerSite[]> {
    return this.client.get<PartnerSite[]>(`/partners/${partnerId}/sites`)
  }

  async createPartnerSite(partnerId: string, data: CreatePartnerSiteDto): Promise<PartnerSite> {
    return this.client.post<PartnerSite>(`/partners/${partnerId}/sites`, data)
  }

  async updatePartnerSite(id: string, data: UpdatePartnerSiteDto): Promise<PartnerSite> {
    return this.client.put<PartnerSite>(`/partner-sites/${id}`, data)
  }

  async deletePartnerSite(id: string): Promise<void> {
    return this.client.delete<void>(`/partner-sites/${id}`)
  }

  async getPartnerAddresses(partnerId: string): Promise<PartnerAddress[]> {
    return this.client.get<PartnerAddress[]>(`/partners/${partnerId}/addresses`)
  }

  async createPartnerAddress(
    partnerId: string,
    data: CreatePartnerAddressDto
  ): Promise<PartnerAddress> {
    return this.client.post<PartnerAddress>(`/partners/${partnerId}/addresses`, data)
  }

  async updatePartnerAddress(id: string, data: UpdatePartnerAddressDto): Promise<PartnerAddress> {
    return this.client.put<PartnerAddress>(`/partner-addresses/${id}`, data)
  }

  async deletePartnerAddress(id: string): Promise<void> {
    return this.client.delete<void>(`/partner-addresses/${id}`)
  }

  async createPartnerGroup(data: CreatePartnerGroupDto): Promise<PartnerGroup> {
    return this.client.post<PartnerGroup>('/partner-groups', data)
  }

  async updatePartnerGroup(id: string, data: UpdatePartnerGroupDto): Promise<PartnerGroup> {
    return this.client.put<PartnerGroup>(`/partner-groups/${id}`, data)
  }

  async deletePartnerGroup(id: string): Promise<void> {
    return this.client.delete<void>(`/partner-groups/${id}`)
  }

  async exportPartners(
    format: 'CSV' | 'EXCEL' | 'PDF',
    filters?: Record<string, unknown>
  ): Promise<{
    url: string
    filename: string
  }> {
    return this.client.post<{ url: string; filename: string }>('/partners/export', {
      format,
      filters,
    })
  }

  async importPartners(
    data: Record<string, unknown>[],
    options?: {
      skipErrors?: boolean
      dryRun?: boolean
    }
  ): Promise<{
    imported: number
    errors: number
    details: unknown[]
  }> {
    return this.client.post<{ imported: number; errors: number; details: unknown[] }>(
      '/partners/import',
      {
        data,
        options,
      }
    )
  }
}

/**
 * Materials API implementation
 */
class MaterialsAPIImpl implements MaterialsAPI {
  constructor(private client: APIClientEnhanced) {}

  async getMaterials(filters?: MaterialFilters): Promise<PaginatedResponse<Material>> {
    const params = new URLSearchParams()
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        filters.type.forEach((type) => {
          params.append('type', type)
        })
      } else {
        params.append('type', filters.type)
      }
    }
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if ((filters as unknown)?.pageSize)
      params.append('pageSize', (filters as unknown).pageSize.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/materials?${queryString}` : '/materials'
    return this.client.get<PaginatedResponse<Material>>(endpoint)
  }

  async getMaterial(id: string): Promise<Material> {
    return this.client.get<Material>(`/materials/${id}`)
  }

  async createMaterial(data: Partial<Material>): Promise<Material> {
    return this.client.post<Material>('/materials', data)
  }

  async updateMaterial(id: string, data: Partial<Material>): Promise<Material> {
    return this.client.put<Material>(`/materials/${id}`, data)
  }

  async deleteMaterial(id: string): Promise<void> {
    return this.client.delete<void>(`/materials/${id}`)
  }

  async getMaterialStatistics(): Promise<MaterialStatistics> {
    return this.client.get<MaterialStatistics>('/materials/statistics')
  }

  async adjustStock(id: string, quantity: number, reason: string): Promise<Material> {
    return this.client.patch<Material>(`/materials/${id}/adjust-stock`, { quantity, reason })
  }

  async transferStock(fromId: string, toId: string, quantity: number): Promise<void> {
    return this.client.post<void>('/materials/transfer-stock', { fromId, toId, quantity })
  }

  async exportMaterials(
    format: 'CSV' | 'EXCEL' | 'PDF',
    filters?: Record<string, unknown>
  ): Promise<FileUploadResponse> {
    return this.client.post<FileUploadResponse>('/materials/export', { format, filters })
  }

  async importMaterials(data: FormData): Promise<BatchOperationResponse<Material>> {
    return this.client.upload<BatchOperationResponse<Material>>('/materials/import', data)
  }
}

/**
 * Simple implementations for other APIs - using basic types
 */
class ArticlesAPIImpl implements ArticlesAPI {
  constructor(private client: APIClientEnhanced) {}

  async getArticles(filters?: unknown): Promise<PaginatedResponse<unknown>> {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/articles?${queryString}` : '/articles'
    return this.client.get<PaginatedResponse<unknown>>(endpoint)
  }

  async getArticle(id: string): Promise<unknown> {
    return this.client.get<unknown>(`/articles/${id}`)
  }

  async createArticle(data: unknown): Promise<unknown> {
    return this.client.post<unknown>('/articles', data)
  }

  async updateArticle(id: string, data: any): Promise<unknown> {
    return this.client.put<unknown>(`/articles/${id}`, data)
  }

  async deleteArticle(id: string): Promise<void> {
    return this.client.delete<void>(`/articles/${id}`)
  }

  async adjustStock(id: string, adjustment: any): Promise<unknown> {
    return this.client.patch<unknown>(`/articles/${id}/adjust-stock`, adjustment)
  }
}

// Basic implementations for remaining APIs
class UsersAPIImpl implements UsersAPI {
  constructor(private client: APIClientEnhanced) {}
  async getUsers(_filters?: unknown): Promise<PaginatedResponse<unknown>> {
    return this.client.get<PaginatedResponse<unknown>>('/users')
  }
  async getUser(id: string): Promise<unknown> {
    return this.client.get<unknown>(`/users/${id}`)
  }
  async createUser(data: unknown): Promise<unknown> {
    return this.client.post<unknown>('/users', data)
  }
  async updateUser(id: string, data: any): Promise<unknown> {
    return this.client.put<unknown>(`/users/${id}`, data)
  }
  async deleteUser(id: string): Promise<void> {
    return this.client.delete<void>(`/users/${id}`)
  }
  async getCurrentUser(): Promise<unknown> {
    return this.client.get<unknown>('/auth/profile')
  }
}

class ProjectsAPIImpl implements ProjectsAPI {
  constructor(private client: APIClientEnhanced) {}
  async getProjects(_filters?: unknown): Promise<PaginatedResponse<unknown>> {
    return this.client.get<PaginatedResponse<unknown>>('/projects')
  }
  async getProject(id: string): Promise<unknown> {
    return this.client.get<unknown>(`/projects/${id}`)
  }
  async createProject(data: unknown): Promise<unknown> {
    return this.client.post<unknown>('/projects', data)
  }
  async updateProject(id: string, data: any): Promise<unknown> {
    return this.client.put<unknown>(`/projects/${id}`, data)
  }
  async deleteProject(id: string): Promise<void> {
    return this.client.delete<void>(`/projects/${id}`)
  }
}

class NotificationsAPIImpl implements NotificationsAPI {
  constructor(private client: APIClientEnhanced) {}
  async getNotifications(_filters?: unknown): Promise<PaginatedResponse<unknown>> {
    return this.client.get<PaginatedResponse<unknown>>('/notifications')
  }
  async getNotification(id: string): Promise<unknown> {
    return this.client.get<unknown>(`/notifications/${id}`)
  }
  async createNotification(data: unknown): Promise<unknown> {
    return this.client.post<unknown>('/notifications', data)
  }
  async markAsRead(id: string): Promise<unknown> {
    return this.client.patch<unknown>(`/notifications/${id}/read`)
  }
  async markAllAsRead(): Promise<void> {
    return this.client.patch<void>('/notifications/read-all')
  }
  async deleteNotification(id: string): Promise<void> {
    return this.client.delete<void>(`/notifications/${id}`)
  }
}

class SearchAPIImpl implements SearchAPI {
  constructor(private client: APIClientEnhanced) {}
  async globalSearch(query: string, options?: any): Promise<unknown> {
    const params = new URLSearchParams({ q: query })
    if (options?.types) params.append('types', options.types.join(','))
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    return this.client.get<unknown>(`/search/global?${params}`)
  }
  async searchSuggestions(query: string): Promise<string[]> {
    return this.client.get<string[]>(`/search/suggestions?q=${query}`)
  }
  async reindexAll(): Promise<{ success: boolean; message: string }> {
    return this.client.post<{ success: boolean; message: string }>('/search/reindex')
  }
}

class FilesAPIImpl implements FilesAPI {
  constructor(private client: APIClientEnhanced) {}
  async uploadFile(file: File | FormData, _options?: any): Promise<FileUploadResponse> {
    const formData = file instanceof FormData ? file : new FormData()
    if (file instanceof File) formData.append('file', file)
    return this.client.upload<FileUploadResponse>('/files/upload', formData)
  }
  async uploadMultiple(files: File[] | FormData): Promise<FileUploadResponse[]> {
    const formData = files instanceof FormData ? files : new FormData()
    if (Array.isArray(files)) {
      files.forEach((file, i) => {
        formData.append(`files[${i}]`, file)
      })
    }
    return this.client.upload<FileUploadResponse[]>('/files/upload-multiple', formData)
  }
  async deleteFile(id: string): Promise<void> {
    return this.client.delete<void>(`/files/${id}`)
  }
  async getFile(id: string): Promise<Blob> {
    return this.client.get<Blob>(`/files/${id}/download`)
  }
  async getFileInfo(id: string): Promise<FileUploadResponse> {
    return this.client.get<FileUploadResponse>(`/files/${id}`)
  }
}

class SettingsAPIImpl implements SettingsAPI {
  constructor(private client: APIClientEnhanced) {}
  async getSettings(category?: string): Promise<Record<string, unknown>> {
    const endpoint = category ? `/settings?category=${category}` : '/settings'
    return this.client.get<Record<string, unknown>>(endpoint)
  }
  async updateSetting(key: string, value: any): Promise<void> {
    return this.client.patch<void>('/settings', { [key]: value })
  }
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    return this.client.put<void>('/settings', settings)
  }
  async resetSettings(category?: string): Promise<void> {
    const endpoint = category ? `/settings/reset?category=${category}` : '/settings/reset'
    return this.client.post<void>(endpoint)
  }
}

class ReportsAPIImpl implements ReportsAPI {
  constructor(private client: APIClientEnhanced) {}
  async generateReport(type: string, params?: Record<string, unknown>): Promise<unknown> {
    return this.client.post<unknown>('/reports/generate', { type, params })
  }
  async getReportStatus(id: string): Promise<unknown> {
    return this.client.get<unknown>(`/reports/${id}/status`)
  }
  async downloadReport(id: string): Promise<Blob> {
    return this.client.get<Blob>(`/reports/${id}/download`)
  }
  async listReports(): Promise<any[]> {
    return this.client.get<any[]>('/reports')
  }
}

/**
 * Enhanced API Client with domain-specific APIs
 */
export class APIClientTyped extends APIClientEnhanced implements IAPIClient {
  public readonly partners: PartnersAPI
  public readonly materials: MaterialsAPI
  public readonly articles: ArticlesAPI
  public readonly users: UsersAPI
  public readonly projects: ProjectsAPI
  public readonly notifications: NotificationsAPI
  public readonly search: SearchAPI
  public readonly files: FilesAPI
  public readonly settings: SettingsAPI
  public readonly reports: ReportsAPI

  constructor(baseURL: string) {
    super(baseURL)

    // Initialize domain-specific APIs
    this.partners = new PartnersAPIImpl(this)
    this.materials = new MaterialsAPIImpl(this)
    this.articles = new ArticlesAPIImpl(this)
    this.users = new UsersAPIImpl(this)
    this.projects = new ProjectsAPIImpl(this)
    this.notifications = new NotificationsAPIImpl(this)
    this.search = new SearchAPIImpl(this)
    this.files = new FilesAPIImpl(this)
    this.settings = new SettingsAPIImpl(this)
    this.reports = new ReportsAPIImpl(this)
  }
}

// Create and export the typed instance
export const apiClientTyped = new APIClientTyped(process.env.NEXT_PUBLIC_API_URL || '/api')
