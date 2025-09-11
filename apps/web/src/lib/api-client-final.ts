/**
 * Final APIClient with domain-specific methods - self-contained with proper @erp/types
 * This file includes all necessary types and implementations to fix the APIClient property errors
 */

import type { RequestConfig } from './api-client'
import { APIClientEnhanced } from './api-client-enhanced'

// Extended RequestConfig for HTTP methods with params support
interface HTTPRequestConfig extends RequestConfig {
  params?: Record<string, unknown>
  responseType?: 'json' | 'blob' | 'text'
}

// Import proper types from @erp/types instead of redefining them
import type {
  Article,
  ArticleFilters,
  Contact,
  CreateArticleDto,
  CreateContactDto,
  CreateMaterialDto,
  CreatePartnerAddressDto,
  CreatePartnerDto,
  CreatePartnerGroupDto,
  CreatePartnerSiteDto,
  Material,
  MaterialFilters,
  Partner,
  PartnerAddress,
  PartnerGroup,
  PartnerSite,
  UpdateArticleDto,
  UpdateContactDto,
  UpdateMaterialDto,
  UpdatePartnerAddressDto,
  UpdatePartnerDto,
  UpdatePartnerGroupDto,
  UpdatePartnerSiteDto,
} from '@erp/types'

// Import PaginatedResponse from existing types
import type { PaginatedResponse } from '@/types/api-types'

// ========================= TYPE DEFINITIONS =========================

// Search parameters
interface SearchParams {
  query?: string
  type?: string
  status?: string
  category?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  fields?: string[]
  [key: string]: unknown
}

// Export params
interface ExportParams {
  format: 'csv' | 'excel' | 'pdf'
  fields?: string[]
  filters?: SearchParams
  [key: string]: unknown
}

// File upload response
interface UploadResponse {
  id: string
  filename: string
  mimetype: string
  size: number
  url: string
}

// Bulk operation response
interface BulkOperationResponse {
  success: boolean
  processed: number
  errors: Array<{
    item: string
    error: string
  }>
}

// Analysis/Reports interfaces
interface PartnerAnalytics {
  totalClients: number
  totalFournisseurs: number
  nouveauxCeMois: number
  chiffreAffaireMoyen: number
  topClients: Array<{ partner: Partner; ca: number }>
  repartitionGeographique: Array<{ region: string; count: number }>
}

// Note: Material and Article types are now imported from @erp/types

// ========================= API INTERFACE DEFINITIONS =========================

interface PartnersAPI {
  // CRUD Operations
  createPartner(data: CreatePartnerDto): Promise<Partner>
  getPartner(id: string): Promise<Partner | null>
  getPartnerComplete(id: string): Promise<Partner | null>
  updatePartner(id: string, data: UpdatePartnerDto): Promise<Partner>
  deletePartner(id: string): Promise<void>

  // List operations
  getPartners(params?: SearchParams): Promise<PaginatedResponse<Partner>>
  searchPartners(params: SearchParams): Promise<PaginatedResponse<Partner>>
  getPartnersAutocomplete(query: string): Promise<Array<{ id: string; label: string }>>

  // Specific filters
  getClients(): Promise<Partner[]>
  getFournisseurs(): Promise<Partner[]>
  getProspects(): Promise<Partner[]>
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
  importPartners(file: File): Promise<BulkOperationResponse>
  exportPartners(params: ExportParams): Promise<Blob>

  // Analytics
  getPartnerAnalytics(): Promise<PartnerAnalytics>
  getStatistics(): Promise<PartnerAnalytics>
}

interface MaterialsAPI {
  getMaterials(params?: SearchParams): Promise<PaginatedResponse<Material>>
  getMaterial(id: string): Promise<Material | null>
  createMaterial(data: CreateMaterialDto): Promise<Material>
  updateMaterial(id: string, data: UpdateMaterialDto): Promise<Material>
  deleteMaterial(id: string): Promise<void>
  searchMaterials(query: string): Promise<Material[]>
  getMaterialsByCategory(category: string): Promise<Material[]>
  updateStock(id: string, quantity: number): Promise<Material>
  getMaterialsLowStock(): Promise<Material[]>
  getMaterialAutocomplete(query: string): Promise<Array<{ id: string; label: string }>>
}

interface ArticlesAPI {
  getArticles(params?: SearchParams): Promise<PaginatedResponse<Article>>
  getArticle(id: string): Promise<Article | null>
  createArticle(data: CreateArticleDto): Promise<Article>
  updateArticle(id: string, data: UpdateArticleDto): Promise<Article>
  deleteArticle(id: string): Promise<void>
  searchArticles(query: string): Promise<Article[]>
  getArticlesByMaterial(materiau: string): Promise<Article[]>
  duplicateArticle(id: string, newCode: string): Promise<Article>
  calculateProductionCost(id: string): Promise<{ cost: number; details: Record<string, number> }>
  generateDrawing(id: string): Promise<string>
  getArticleAutocomplete(query: string): Promise<Array<{ id: string; label: string }>>
}

// Basic interfaces for other APIs
interface UsersAPI {
  getUsers(): Promise<unknown[]>
  getUser(id: string): Promise<unknown | null>
  createUser(data: unknown): Promise<unknown>
  updateUser(id: string, data: unknown): Promise<unknown>
  deleteUser(id: string): Promise<void>
}

interface ProjectsAPI {
  getProjects(): Promise<unknown[]>
  getProject(id: string): Promise<unknown | null>
  createProject(data: unknown): Promise<unknown>
  updateProject(id: string, data: unknown): Promise<unknown>
  deleteProject(id: string): Promise<void>
}

interface NotificationsAPI {
  getNotifications(): Promise<unknown[]>
  markAsRead(id: string): Promise<void>
  markAllAsRead(): Promise<void>
  deleteNotification(id: string): Promise<void>
  createNotification(data: unknown): Promise<unknown>
}

// ========================= API IMPLEMENTATIONS =========================

class PartnersAPIImpl implements PartnersAPI {
  constructor(private apiClient: APIClientEnhanced) {}

  // Implementation methods remain the same...
  async createPartner(data: CreatePartnerDto): Promise<Partner> {
    return this.apiClient.post('/partners', data)
  }

  async getPartner(id: string): Promise<Partner | null> {
    try {
      return await this.apiClient.get(`/partners/${id}`)
    } catch {
      return null
    }
  }

  async getPartnerComplete(id: string): Promise<Partner | null> {
    try {
      return await this.apiClient.get(`/partners/${id}/complete`)
    } catch {
      return null
    }
  }

  async updatePartner(id: string, data: UpdatePartnerDto): Promise<Partner> {
    return this.apiClient.put(`/partners/${id}`, data)
  }

  async deletePartner(id: string): Promise<void> {
    await this.apiClient.delete(`/partners/${id}`)
  }

  async getPartners(params?: SearchParams): Promise<PaginatedResponse<Partner>> {
    const config: HTTPRequestConfig = params ? { params } : {}
    return this.apiClient.get('/partners', config)
  }

  async searchPartners(params: SearchParams): Promise<PaginatedResponse<Partner>> {
    const config: HTTPRequestConfig = { params }
    return this.apiClient.get('/partners/search', config)
  }

  async getPartnersAutocomplete(query: string): Promise<Array<{ id: string; label: string }>> {
    const config: HTTPRequestConfig = { params: { query } }
    return this.apiClient.get('/partners/autocomplete', config)
  }

  async getClients(): Promise<Partner[]> {
    const config: HTTPRequestConfig = { params: { type: 'CLIENT' } }
    return this.apiClient.get('/partners', config)
  }

  async getFournisseurs(): Promise<Partner[]> {
    const config: HTTPRequestConfig = { params: { type: 'FOURNISSEUR' } }
    return this.apiClient.get('/partners', config)
  }

  async getProspects(): Promise<Partner[]> {
    const config: HTTPRequestConfig = { params: { status: 'PROSPECT' } }
    return this.apiClient.get('/partners', config)
  }

  async getClientsActifs(): Promise<Partner[]> {
    const config: HTTPRequestConfig = { params: { type: 'CLIENT', status: 'ACTIF' } }
    return this.apiClient.get('/partners', config)
  }

  async getFournisseursActifs(): Promise<Partner[]> {
    const config: HTTPRequestConfig = { params: { type: 'FOURNISSEUR', status: 'ACTIF' } }
    return this.apiClient.get('/partners', config)
  }

  async duplicatePartner(id: string, newCode: string): Promise<Partner> {
    return this.apiClient.post(`/partners/${id}/duplicate`, { newCode })
  }

  async convertProspect(id: string): Promise<Partner> {
    return this.apiClient.post(`/partners/${id}/convert`)
  }

  async suspendPartner(id: string, raison: string): Promise<Partner> {
    return this.apiClient.post(`/partners/${id}/suspend`, { raison })
  }

  async mergePartners(principalId: string, secondaireId: string): Promise<Partner> {
    return this.apiClient.post('/partners/merge', { principalId, secondaireId })
  }

  async assignPartnerToGroup(partnerId: string, groupId: string): Promise<Partner> {
    return this.apiClient.post(`/partners/${partnerId}/group`, { groupId })
  }

  // Related entities
  async getPartnerContacts(partnerId: string): Promise<Contact[]> {
    return this.apiClient.get(`/partners/${partnerId}/contacts`)
  }

  async createContact(partnerId: string, data: CreateContactDto): Promise<Contact> {
    return this.apiClient.post(`/partners/${partnerId}/contacts`, data)
  }

  async updateContact(id: string, data: UpdateContactDto): Promise<Contact> {
    return this.apiClient.put(`/contacts/${id}`, data)
  }

  async deleteContact(id: string): Promise<void> {
    await this.apiClient.delete(`/contacts/${id}`)
  }

  async getPartnerSites(partnerId: string): Promise<PartnerSite[]> {
    return this.apiClient.get(`/partners/${partnerId}/sites`)
  }

  async createPartnerSite(partnerId: string, data: CreatePartnerSiteDto): Promise<PartnerSite> {
    return this.apiClient.post(`/partners/${partnerId}/sites`, data)
  }

  async updatePartnerSite(id: string, data: UpdatePartnerSiteDto): Promise<PartnerSite> {
    return this.apiClient.put(`/partner-sites/${id}`, data)
  }

  async deletePartnerSite(id: string): Promise<void> {
    await this.apiClient.delete(`/partner-sites/${id}`)
  }

  async getPartnerAddresses(partnerId: string): Promise<PartnerAddress[]> {
    return this.apiClient.get(`/partners/${partnerId}/addresses`)
  }

  async createPartnerAddress(
    partnerId: string,
    data: CreatePartnerAddressDto
  ): Promise<PartnerAddress> {
    return this.apiClient.post(`/partners/${partnerId}/addresses`, data)
  }

  async updatePartnerAddress(id: string, data: UpdatePartnerAddressDto): Promise<PartnerAddress> {
    return this.apiClient.put(`/partner-addresses/${id}`, data)
  }

  async deletePartnerAddress(id: string): Promise<void> {
    await this.apiClient.delete(`/partner-addresses/${id}`)
  }

  async createPartnerGroup(data: CreatePartnerGroupDto): Promise<PartnerGroup> {
    return this.apiClient.post('/partner-groups', data)
  }

  async updatePartnerGroup(id: string, data: UpdatePartnerGroupDto): Promise<PartnerGroup> {
    return this.apiClient.put(`/partner-groups/${id}`, data)
  }

  async deletePartnerGroup(id: string): Promise<void> {
    await this.apiClient.delete(`/partner-groups/${id}`)
  }

  async importPartners(file: File): Promise<BulkOperationResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return this.apiClient.post('/partners/import', formData)
  }

  async exportPartners(params: ExportParams): Promise<Blob> {
    const config: HTTPRequestConfig = { params, responseType: 'blob' }
    return this.apiClient.get('/partners/export', config)
  }

  async getPartnerAnalytics(): Promise<PartnerAnalytics> {
    return this.apiClient.get('/partners/analytics')
  }

  async getStatistics(): Promise<PartnerAnalytics> {
    return this.apiClient.get('/partners/statistics')
  }
}

// Other API implementations (MaterialsAPI, ArticlesAPI, etc.)
class MaterialsAPIImpl implements MaterialsAPI {
  constructor(private apiClient: APIClientEnhanced) {}

  async getMaterials(params?: SearchParams): Promise<PaginatedResponse<Material>> {
    const config: HTTPRequestConfig = params ? { params } : {}
    return this.apiClient.get('/materials', config)
  }

  async getMaterial(id: string): Promise<Material | null> {
    try {
      return await this.apiClient.get(`/materials/${id}`)
    } catch {
      return null
    }
  }

  async createMaterial(data: CreateMaterialDto): Promise<Material> {
    return this.apiClient.post('/materials', data)
  }

  async updateMaterial(id: string, data: UpdateMaterialDto): Promise<Material> {
    return this.apiClient.put(`/materials/${id}`, data)
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.apiClient.delete(`/materials/${id}`)
  }

  async searchMaterials(query: string): Promise<Material[]> {
    const config: HTTPRequestConfig = { params: { query } }
    return this.apiClient.get('/materials/search', config)
  }

  async getMaterialsByCategory(category: string): Promise<Material[]> {
    const config: HTTPRequestConfig = { params: { category } }
    return this.apiClient.get('/materials', config)
  }

  async updateStock(id: string, quantity: number): Promise<Material> {
    return this.apiClient.put(`/materials/${id}/stock`, { quantity })
  }

  async getMaterialsLowStock(): Promise<Material[]> {
    return this.apiClient.get('/materials/low-stock')
  }

  async getMaterialAutocomplete(query: string): Promise<Array<{ id: string; label: string }>> {
    const config: HTTPRequestConfig = { params: { query } }
    return this.apiClient.get('/materials/autocomplete', config)
  }
}

class ArticlesAPIImpl implements ArticlesAPI {
  constructor(private apiClient: APIClientEnhanced) {}

  async getArticles(params?: SearchParams): Promise<PaginatedResponse<Article>> {
    const config: HTTPRequestConfig = params ? { params } : {}
    return this.apiClient.get('/articles', config)
  }

  async getArticle(id: string): Promise<Article | null> {
    try {
      return await this.apiClient.get(`/articles/${id}`)
    } catch {
      return null
    }
  }

  async createArticle(data: CreateArticleDto): Promise<Article> {
    return this.apiClient.post('/articles', data)
  }

  async updateArticle(id: string, data: UpdateArticleDto): Promise<Article> {
    return this.apiClient.put(`/articles/${id}`, data)
  }

  async deleteArticle(id: string): Promise<void> {
    await this.apiClient.delete(`/articles/${id}`)
  }

  async searchArticles(query: string): Promise<Article[]> {
    const config: HTTPRequestConfig = { params: { query } }
    return this.apiClient.get('/articles/search', config)
  }

  async getArticlesByMaterial(materiau: string): Promise<Article[]> {
    const config: HTTPRequestConfig = { params: { materiau } }
    return this.apiClient.get('/articles', config)
  }

  async duplicateArticle(id: string, newCode: string): Promise<Article> {
    return this.apiClient.post(`/articles/${id}/duplicate`, { newCode })
  }

  async calculateProductionCost(
    id: string
  ): Promise<{ cost: number; details: Record<string, number> }> {
    return this.apiClient.get(`/articles/${id}/production-cost`)
  }

  async generateDrawing(id: string): Promise<string> {
    const response: { url: string } = await this.apiClient.get(`/articles/${id}/drawing`)
    return response.url
  }

  async getArticleAutocomplete(query: string): Promise<Array<{ id: string; label: string }>> {
    const config: HTTPRequestConfig = { params: { query } }
    return this.apiClient.get('/articles/autocomplete', config)
  }
}

// ========================= MAIN API CLIENT =========================

export interface IAPIClientFinal {
  partners: PartnersAPI
  materials: MaterialsAPI
  articles: ArticlesAPI
  users: UsersAPI
  projects: ProjectsAPI
  notifications: NotificationsAPI

  // Health check
  health(): Promise<{ status: string; timestamp: string }>

  // Authentication
  authenticate(token: string): void

  // HTTP Methods
  get<T>(endpoint: string, config?: HTTPRequestConfig): Promise<T>
  post<T>(endpoint: string, data?: unknown, config?: HTTPRequestConfig): Promise<T>
  put<T>(endpoint: string, data?: unknown, config?: HTTPRequestConfig): Promise<T>
  patch<T>(endpoint: string, data?: unknown, config?: HTTPRequestConfig): Promise<T>
  delete<T>(endpoint: string, config?: HTTPRequestConfig): Promise<T>
}

export class APIClientFinal extends APIClientEnhanced implements IAPIClientFinal {
  public readonly partners: PartnersAPI
  public readonly materials: MaterialsAPI
  public readonly articles: ArticlesAPI
  public readonly users: UsersAPI
  public readonly projects: ProjectsAPI
  public readonly notifications: NotificationsAPI

  constructor(baseURL: string, options?: { timeout?: number }) {
    super(baseURL)

    this.partners = new PartnersAPIImpl(this)
    this.materials = new MaterialsAPIImpl(this)
    this.articles = new ArticlesAPIImpl(this)
    this.users = {
      getUsers: () => Promise.resolve([]),
      getUser: () => Promise.resolve(null),
      createUser: () => Promise.resolve({}),
      updateUser: () => Promise.resolve({}),
      deleteUser: () => Promise.resolve(),
    }
    this.projects = {
      getProjects: () => Promise.resolve([]),
      getProject: () => Promise.resolve(null),
      createProject: () => Promise.resolve({}),
      updateProject: () => Promise.resolve({}),
      deleteProject: () => Promise.resolve(),
    }
    this.notifications = {
      getNotifications: () => Promise.resolve([]),
      markAsRead: () => Promise.resolve(),
      markAllAsRead: () => Promise.resolve(),
      deleteNotification: () => Promise.resolve(),
      createNotification: () => Promise.resolve({}),
    }
  }

  // Override HTTP methods to support HTTPRequestConfig
  async get<T>(endpoint: string, config: HTTPRequestConfig = {}): Promise<T> {
    // Convert params to query string if provided
    let finalEndpoint = endpoint
    if (config.params) {
      const queryString = new URLSearchParams(
        Object.entries(config.params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString()
      finalEndpoint = `${endpoint}${queryString ? '?' + queryString : ''}`
    }

    // Remove params from config to avoid conflicts
    const { params, ...restConfig } = config
    return super.get<T>(finalEndpoint, restConfig)
  }

  async post<T>(endpoint: string, data?: unknown, config: HTTPRequestConfig = {}): Promise<T> {
    const { params, ...restConfig } = config
    return super.post<T>(endpoint, data, restConfig)
  }

  async put<T>(endpoint: string, data?: unknown, config: HTTPRequestConfig = {}): Promise<T> {
    const { params, ...restConfig } = config
    return super.put<T>(endpoint, data, restConfig)
  }

  async patch<T>(endpoint: string, data?: unknown, config: HTTPRequestConfig = {}): Promise<T> {
    const { params, ...restConfig } = config
    return super.patch<T>(endpoint, data, restConfig)
  }

  async delete<T>(endpoint: string, config: HTTPRequestConfig = {}): Promise<T> {
    const { params, ...restConfig } = config
    return super.delete<T>(endpoint, restConfig)
  }

  async health(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health')
  }

  authenticate(token: string): void {
    // Store the token in the appropriate storage
    if (typeof window === 'undefined') return

    try {
      const authData = {
        tokens: {
          accessToken: token,
          refreshToken: null,
        },
        timestamp: Date.now(),
      }

      // Store in sessionStorage by default
      sessionStorage?.setItem('topsteel_auth_tokens', JSON.stringify(authData))
    } catch (error) {
      console.error('Failed to store auth token:', error)
    }
  }

  private getAuthTokenOverride(): string | null {
    // Custom token retrieval logic for APIClientFinal
    if (typeof window === 'undefined') return null

    try {
      // Chercher d'abord dans localStorage (remember me)
      let authData = localStorage?.getItem('topsteel_auth_tokens')

      // Si pas dans localStorage, chercher dans sessionStorage
      if (!authData) {
        authData = sessionStorage?.getItem('topsteel_auth_tokens')
      }

      if (!authData) return null

      const sessionData = JSON.parse(authData)
      const accessToken = sessionData?.tokens?.accessToken

      return accessToken || null
    } catch {
      return null
    }
  }
}

export const apiClientFinal = new APIClientFinal(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
)
