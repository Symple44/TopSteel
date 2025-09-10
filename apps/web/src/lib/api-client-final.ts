/**
 * Final APIClient with domain-specific methods - self-contained
 * This file includes all necessary types and implementations to fix the APIClient property errors
 */

import { APIClientEnhanced } from './api-client-enhanced'

// ========================= TYPE DEFINITIONS =========================

// Basic types needed for the APIs (extracted from @erp/types)
interface BaseEntity extends Record<string, unknown> {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

interface Partner extends BaseEntity {
  code: string
  type: string
  denomination: string
  denominationCommerciale?: string
  category: string
  status: string
  email?: string
  telephone?: string
  adresse?: string
  ville?: string
  pays?: string
}

interface Contact extends BaseEntity {
  partnerId: string
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  role: string
  status: string
}

interface PartnerSite extends BaseEntity {
  partnerId: string
  code: string
  nom: string
  type: string
  status: string
  adresse?: string
  ville?: string
}

interface PartnerAddress extends BaseEntity {
  partnerId: string
  libelle: string
  type: string
  ligne1: string
  codePostal: string
  ville: string
  status: string
}

interface PartnerGroup extends BaseEntity {
  code: string
  name: string
  description?: string
  type: string
  status: string
}

interface Material extends BaseEntity {
  code: string
  designation: string
  description?: string
  type?: string
  category?: string
  unit?: string
  price?: number
  stock?: number
  minStock?: number
}

interface Article extends BaseEntity {
  code: string
  designation: string
  description?: string
  category?: string
  stock?: number
}

// DTO Types
interface CreatePartnerDto {
  code?: string
  type: string
  denomination: string
  category: string
  status?: string
  email?: string
  telephone?: string
  [key: string]: any
}

interface UpdatePartnerDto extends Partial<CreatePartnerDto> {}

interface CreateContactDto {
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  role: string
  status?: string
  [key: string]: any
}

interface UpdateContactDto extends Partial<CreateContactDto> {}

interface CreatePartnerSiteDto {
  code: string
  nom: string
  type: string
  adresse?: string
  ville?: string
  [key: string]: any
}

interface UpdatePartnerSiteDto extends Partial<CreatePartnerSiteDto> {
  status?: string
}

interface CreatePartnerAddressDto {
  libelle: string
  type: string
  ligne1: string
  codePostal: string
  ville: string
  [key: string]: any
}

interface UpdatePartnerAddressDto extends Partial<CreatePartnerAddressDto> {
  status?: string
}

interface CreatePartnerGroupDto {
  code: string
  name: string
  description?: string
  type: string
  [key: string]: any
}

interface UpdatePartnerGroupDto extends Partial<CreatePartnerGroupDto> {
  status?: string
}

// Filter Types
interface PartnerFilters {
  type?: string[]
  status?: string[]
  category?: string[]
  denomination?: string
  ville?: string
  page?: number
  limit?: number
  [key: string]: any
}

interface MaterialFilters {
  type?: string
  category?: string
  search?: string
  page?: number
  pageSize?: number
  [key: string]: any
}

// Statistics Types
interface PartnerStatistics {
  totalPartenaires: number
  totalClients: number
  totalFournisseurs: number
  totalProspects: number
  partenairesActifs: number
  partenairesInactifs: number
  partenairesSuspendus: number
  repartitionParCategorie: Record<string, number>
  repartitionParGroupe: Record<string, number>
  top10ClientsAnciennete: Array<{
    code: string
    denomination: string
    anciennete: number
  }>
}

interface MaterialStatistics {
  totalMaterials: number
  totalStock: number
  lowStockItems: number
  [key: string]: number
}

// Response Types
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
  id?: string
}

interface BatchOperationResponse<T = any> {
  successful: T[]
  failed: Array<{
    item: T
    error: string
  }>
  totalProcessed: number
  successCount: number
  failureCount: number
}

// ========================= API INTERFACES =========================

interface PartnersAPI {
  // Basic CRUD
  getPartners(filters?: PartnerFilters): Promise<PaginatedResponse<Partner>>
  getPartner(id: string): Promise<Partner>
  getPartnerComplete(id: string): Promise<Partner>
  createPartner(data: CreatePartnerDto): Promise<Partner>
  updatePartner(id: string, data: UpdatePartnerDto): Promise<Partner>
  deletePartner(id: string): Promise<void>

  // Statistics and analytics
  getStatistics(): Promise<PartnerStatistics>
  getPartnerGroups(): Promise<PartnerGroup[]>
  getClientsActifs(): Promise<Partner[]>
  getFournisseursActifs(): Promise<Partner[]>

  // Advanced operations
  duplicatePartner(id: string, newCode: string): Promise<Partner>
  convertProspect(id: string): Promise<Partner>
  suspendPartner(id: string, raison: string): Promise<Partner>
  mergePartners(principalId: string, secondaireId: string): Promise<Partner>
  assignPartnerToGroup(partnerId: string, groupId: string): Promise<Partner>

  // Related entities
  getPartnerContacts(partnerId: string): Promise<Contact[]>
  createContact(partnerId: string, data: CreateContactDto): Promise<Contact>
  updateContact(id: string, data: UpdateContactDto): Promise<Contact>
  deleteContact(id: string): Promise<void>

  getPartnerSites(partnerId: string): Promise<PartnerSite[]>
  createPartnerSite(partnerId: string, data: CreatePartnerSiteDto): Promise<PartnerSite>
  updatePartnerSite(id: string, data: UpdatePartnerSiteDto): Promise<PartnerSite>
  deletePartnerSite(id: string): Promise<void>

  getPartnerAddresses(partnerId: string): Promise<PartnerAddress[]>
  createPartnerAddress(partnerId: string, data: CreatePartnerAddressDto): Promise<PartnerAddress>
  updatePartnerAddress(id: string, data: UpdatePartnerAddressDto): Promise<PartnerAddress>
  deletePartnerAddress(id: string): Promise<void>

  createPartnerGroup(data: CreatePartnerGroupDto): Promise<PartnerGroup>
  updatePartnerGroup(id: string, data: UpdatePartnerGroupDto): Promise<PartnerGroup>
  deletePartnerGroup(id: string): Promise<void>

  // Import/Export
  exportPartners(
    format: 'CSV' | 'EXCEL' | 'PDF',
    filters?: Record<string, unknown>
  ): Promise<{
    url: string
    filename: string
  }>
  importPartners(
    data: Record<string, unknown>[],
    options?: {
      skipErrors?: boolean
      dryRun?: boolean
    }
  ): Promise<{
    imported: number
    errors: number
    details: unknown[]
  }>
}

interface MaterialsAPI {
  getMaterials(filters?: MaterialFilters): Promise<PaginatedResponse<Material>>
  getMaterial(id: string): Promise<Material>
  createMaterial(data: Partial<Material>): Promise<Material>
  updateMaterial(id: string, data: Partial<Material>): Promise<Material>
  deleteMaterial(id: string): Promise<void>
  getMaterialStatistics(): Promise<MaterialStatistics>

  adjustStock(id: string, quantity: number, reason: string): Promise<Material>
  transferStock(fromId: string, toId: string, quantity: number): Promise<void>

  exportMaterials(
    format: 'CSV' | 'EXCEL' | 'PDF',
    filters?: Record<string, unknown>
  ): Promise<FileUploadResponse>
  importMaterials(data: FormData): Promise<BatchOperationResponse<Material>>
}

interface ArticlesAPI {
  getArticles(filters?: unknown): Promise<PaginatedResponse<Article>>
  getArticle(id: string): Promise<Article>
  createArticle(data: Partial<Article>): Promise<Article>
  updateArticle(id: string, data: Partial<Article>): Promise<Article>
  deleteArticle(id: string): Promise<void>

  adjustStock(
    id: string,
    adjustment: {
      quantity: number
      type: 'IN' | 'OUT' | 'ADJUSTMENT'
      reason: string
      location?: string
    }
  ): Promise<Article>
}

// Basic interfaces for other APIs
interface UsersAPI {
  getUsers(filters?: unknown): Promise<PaginatedResponse<unknown>>
  getUser(id: string): Promise<unknown>
  createUser(data: unknown): Promise<unknown>
  updateUser(id: string, data: any): Promise<unknown>
  deleteUser(id: string): Promise<void>
  getCurrentUser(): Promise<unknown>
}

interface ProjectsAPI {
  getProjects(filters?: unknown): Promise<PaginatedResponse<unknown>>
  getProject(id: string): Promise<unknown>
  createProject(data: unknown): Promise<unknown>
  updateProject(id: string, data: any): Promise<unknown>
  deleteProject(id: string): Promise<void>
}

interface NotificationsAPI {
  getNotifications(filters?: unknown): Promise<PaginatedResponse<unknown>>
  getNotification(id: string): Promise<unknown>
  createNotification(data: unknown): Promise<unknown>
  markAsRead(id: string): Promise<unknown>
  markAllAsRead(): Promise<void>
  deleteNotification(id: string): Promise<void>
}

// ========================= API IMPLEMENTATIONS =========================

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
    const response = await this.client.get<PartnerStatistics>('/partners/statistics')
    return response as PartnerStatistics
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

class MaterialsAPIImpl implements MaterialsAPI {
  constructor(private client: APIClientEnhanced) {}

  async getMaterials(filters?: MaterialFilters): Promise<PaginatedResponse<Material>> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

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

// Basic implementations for other APIs
class ArticlesAPIImpl implements ArticlesAPI {
  constructor(private client: APIClientEnhanced) {}
  async getArticles(_filters?: unknown): Promise<PaginatedResponse<Article>> {
    return this.client.get<PaginatedResponse<Article>>('/articles')
  }
  async getArticle(id: string): Promise<Article> {
    return this.client.get<Article>(`/articles/${id}`)
  }
  async createArticle(data: unknown): Promise<Article> {
    return this.client.post<Article>('/articles', data)
  }
  async updateArticle(id: string, data: any): Promise<Article> {
    return this.client.put<Article>(`/articles/${id}`, data)
  }
  async deleteArticle(id: string): Promise<void> {
    return this.client.delete<void>(`/articles/${id}`)
  }
  async adjustStock(id: string, adjustment: any): Promise<Article> {
    return this.client.patch<Article>(`/articles/${id}/adjust-stock`, adjustment)
  }
}

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

// ========================= MAIN TYPED API CLIENT =========================

export interface IAPIClientFinal {
  // Domain-specific APIs
  partners: PartnersAPI
  materials: MaterialsAPI
  articles: ArticlesAPI
  users: UsersAPI
  projects: ProjectsAPI
  notifications: NotificationsAPI

  // Generic HTTP methods (from base APIClient)
  get<T>(endpoint: string, config?: any): Promise<T>
  post<T>(endpoint: string, data?: unknown, config?: any): Promise<T>
  put<T>(endpoint: string, data?: unknown, config?: any): Promise<T>
  patch<T>(endpoint: string, data?: unknown, config?: any): Promise<T>
  delete<T>(endpoint: string, config?: any): Promise<T>
  upload<T>(endpoint: string, formData: FormData, config?: any): Promise<T>

  // Utility methods
  request<T>(endpoint: string, config?: any): Promise<T>
  invalidateCache(pattern?: string): void
  getMetrics(): any
  resetMetrics(): void
  createContextKey(domain: string, resource?: string, id?: string | number): string[]

  // Connection management (from enhanced client)
  onConnectionChange?(callback: (isConnected: boolean) => void): () => void
  checkHealth?(): Promise<boolean>
  checkConnection?(): Promise<{ connected: boolean; authenticated: boolean }>
  invalidateAllTokens?(): void
}

export class APIClientFinal extends APIClientEnhanced implements IAPIClientFinal {
  public readonly partners: PartnersAPI
  public readonly materials: MaterialsAPI
  public readonly articles: ArticlesAPI
  public readonly users: UsersAPI
  public readonly projects: ProjectsAPI
  public readonly notifications: NotificationsAPI

  constructor(baseURL: string) {
    super(baseURL)

    // Initialize domain-specific APIs
    this.partners = new PartnersAPIImpl(this)
    this.materials = new MaterialsAPIImpl(this)
    this.articles = new ArticlesAPIImpl(this)
    this.users = new UsersAPIImpl(this)
    this.projects = new ProjectsAPIImpl(this)
    this.notifications = new NotificationsAPIImpl(this)
  }
}

// Create and export the final typed instance
export const apiClientFinal = new APIClientFinal(process.env.NEXT_PUBLIC_API_URL || '/api')

// Export all types for external use
export type {
  Partner,
  Contact,
  PartnerSite,
  PartnerAddress,
  PartnerGroup,
  Material,
  Article,
  CreatePartnerDto,
  UpdatePartnerDto,
  CreateContactDto,
  UpdateContactDto,
  CreatePartnerSiteDto,
  UpdatePartnerSiteDto,
  CreatePartnerAddressDto,
  UpdatePartnerAddressDto,
  CreatePartnerGroupDto,
  UpdatePartnerGroupDto,
  PartnerFilters,
  MaterialFilters,
  PartnerStatistics,
  MaterialStatistics,
  PaginatedResponse,
  PartnersAPI,
  MaterialsAPI,
  ArticlesAPI,
  UsersAPI,
  ProjectsAPI,
  NotificationsAPI,
}
