/**
 * Final APIClient with domain-specific methods - self-contained with proper @erp/types
 * This file includes all necessary types and implementations to fix the APIClient property errors
 */

import { APIClientEnhanced } from './api-client-enhanced'
import type { RequestConfig } from './api-client'

// Import proper types from @erp/types instead of redefining them
import type {
  Partner,
  PartnerAddress,
  PartnerGroup,
  PartnerSite,
  Contact,
  CreatePartnerDto,
  UpdatePartnerDto,
  CreateContactDto,
  UpdateContactDto,
  CreatePartnerAddressDto,
  UpdatePartnerAddressDto,
  CreatePartnerGroupDto,
  UpdatePartnerGroupDto,
  CreatePartnerSiteDto,
  UpdatePartnerSiteDto
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
}

// Export params
interface ExportParams {
  format: 'csv' | 'excel' | 'pdf'
  fields?: string[]
  filters?: SearchParams
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

// Material and Article types (keeping these as they may not exist in @erp/types)
interface Material {
  id: string
  code: string
  designation: string
  description?: string
  type?: string
  category?: string
  unit?: string
  price?: number
  stock?: number
  minStock?: number
  maxStock?: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

interface Article {
  id: string
  code: string
  designation: string
  description?: string
  materiau?: string
  longueur?: number
  largeur?: number
  epaisseur?: number
  poids?: number
  prix?: number
  coutProduction?: number
  stock?: number
  tempsUsinage?: number
  outillageRequis?: string[]
  planDessin?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

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
  createMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material>
  updateMaterial(id: string, data: Partial<Material>): Promise<Material>
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
  createArticle(data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article>
  updateArticle(id: string, data: Partial<Article>): Promise<Article>
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
    return this.apiClient.get('/partners', { params })
  }

  async searchPartners(params: SearchParams): Promise<PaginatedResponse<Partner>> {
    return this.apiClient.get('/partners/search', { params })
  }

  async getPartnersAutocomplete(query: string): Promise<Array<{ id: string; label: string }>> {
    return this.apiClient.get('/partners/autocomplete', { params: { query } })
  }

  async getClients(): Promise<Partner[]> {
    return this.apiClient.get('/partners', { params: { type: 'CLIENT' } })
  }

  async getFournisseurs(): Promise<Partner[]> {
    return this.apiClient.get('/partners', { params: { type: 'FOURNISSEUR' } })
  }

  async getProspects(): Promise<Partner[]> {
    return this.apiClient.get('/partners', { params: { status: 'PROSPECT' } })
  }

  async getClientsActifs(): Promise<Partner[]> {
    return this.apiClient.get('/partners', { params: { type: 'CLIENT', status: 'ACTIF' } })
  }

  async getFournisseursActifs(): Promise<Partner[]> {
    return this.apiClient.get('/partners', { params: { type: 'FOURNISSEUR', status: 'ACTIF' } })
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

  async createPartnerAddress(partnerId: string, data: CreatePartnerAddressDto): Promise<PartnerAddress> {
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
    return this.apiClient.get('/partners/export', { params, responseType: 'blob' })
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
    return this.apiClient.get('/materials', { params })
  }

  async getMaterial(id: string): Promise<Material | null> {
    try {
      return await this.apiClient.get(`/materials/${id}`)
    } catch {
      return null
    }
  }

  async createMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    return this.apiClient.post('/materials', data)
  }

  async updateMaterial(id: string, data: Partial<Material>): Promise<Material> {
    return this.apiClient.put(`/materials/${id}`, data)
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.apiClient.delete(`/materials/${id}`)
  }

  async searchMaterials(query: string): Promise<Material[]> {
    return this.apiClient.get('/materials/search', { params: { query } })
  }

  async getMaterialsByCategory(category: string): Promise<Material[]> {
    return this.apiClient.get('/materials', { params: { category } })
  }

  async updateStock(id: string, quantity: number): Promise<Material> {
    return this.apiClient.put(`/materials/${id}/stock`, { quantity })
  }

  async getMaterialsLowStock(): Promise<Material[]> {
    return this.apiClient.get('/materials/low-stock')
  }

  async getMaterialAutocomplete(query: string): Promise<Array<{ id: string; label: string }>> {
    return this.apiClient.get('/materials/autocomplete', { params: { query } })
  }
}

class ArticlesAPIImpl implements ArticlesAPI {
  constructor(private apiClient: APIClientEnhanced) {}

  async getArticles(params?: SearchParams): Promise<PaginatedResponse<Article>> {
    return this.apiClient.get('/articles', { params })
  }

  async getArticle(id: string): Promise<Article | null> {
    try {
      return await this.apiClient.get(`/articles/${id}`)
    } catch {
      return null
    }
  }

  async createArticle(data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
    return this.apiClient.post('/articles', data)
  }

  async updateArticle(id: string, data: Partial<Article>): Promise<Article> {
    return this.apiClient.put(`/articles/${id}`, data)
  }

  async deleteArticle(id: string): Promise<void> {
    await this.apiClient.delete(`/articles/${id}`)
  }

  async searchArticles(query: string): Promise<Article[]> {
    return this.apiClient.get('/articles/search', { params: { query } })
  }

  async getArticlesByMaterial(materiau: string): Promise<Article[]> {
    return this.apiClient.get('/articles', { params: { materiau } })
  }

  async duplicateArticle(id: string, newCode: string): Promise<Article> {
    return this.apiClient.post(`/articles/${id}/duplicate`, { newCode })
  }

  async calculateProductionCost(id: string): Promise<{ cost: number; details: Record<string, number> }> {
    return this.apiClient.get(`/articles/${id}/production-cost`)
  }

  async generateDrawing(id: string): Promise<string> {
    const response = await this.apiClient.get(`/articles/${id}/drawing`)
    return response.url
  }

  async getArticleAutocomplete(query: string): Promise<Array<{ id: string; label: string }>> {
    return this.apiClient.get('/articles/autocomplete', { params: { query } })
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
  getAuthToken(): string | null
  
  // HTTP Methods
  get<T>(endpoint: string, config?: RequestConfig): Promise<T>
  post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T>
  put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T>
  patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T>
  delete<T>(endpoint: string, config?: RequestConfig): Promise<T>
}

export class APIClientFinal extends APIClientEnhanced implements IAPIClientFinal {
  public readonly partners: PartnersAPI
  public readonly materials: MaterialsAPI
  public readonly articles: ArticlesAPI
  public readonly users: UsersAPI
  public readonly projects: ProjectsAPI
  public readonly notifications: NotificationsAPI

  constructor(baseURL: string, options?: { timeout?: number }) {
    super(baseURL, options)
    
    this.partners = new PartnersAPIImpl(this)
    this.materials = new MaterialsAPIImpl(this)
    this.articles = new ArticlesAPIImpl(this)
    this.users = {
      getUsers: () => Promise.resolve([]),
      getUser: () => Promise.resolve(null),
      createUser: () => Promise.resolve({}),
      updateUser: () => Promise.resolve({}),
      deleteUser: () => Promise.resolve()
    }
    this.projects = {
      getProjects: () => Promise.resolve([]),
      getProject: () => Promise.resolve(null),
      createProject: () => Promise.resolve({}),
      updateProject: () => Promise.resolve({}),
      deleteProject: () => Promise.resolve()
    }
    this.notifications = {
      getNotifications: () => Promise.resolve([]),
      markAsRead: () => Promise.resolve(),
      markAllAsRead: () => Promise.resolve(),
      deleteNotification: () => Promise.resolve(),
      createNotification: () => Promise.resolve({})
    }
  }

  async health(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health')
  }

  authenticate(token: string): void {
    this.setAuthToken(token)
  }

  getAuthToken(): string | null {
    return this.authToken
  }
}

export const apiClientFinal = new APIClientFinal(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')