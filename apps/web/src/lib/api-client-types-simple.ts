/**
 * Simplified APIClient interface for immediate fixes
 * This provides type-safe domain API methods without complex imports
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
} from '../types/api-types'

// Basic entity types for APIs that may not be fully defined yet
interface BasicUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

interface BasicProject {
  id: string
  name: string
  status: string
}

interface BasicNotification {
  id: string
  title: string
  message: string
  read: boolean
}

interface BasicArticle {
  id: string
  code: string
  designation: string
  stock?: number
}

// Partners API interface
export interface PartnersAPI {
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

// Materials API interface
export interface MaterialsAPI {
  getMaterials(filters?: MaterialFilters): Promise<PaginatedResponse<Material>>
  getMaterial(id: string): Promise<Material>
  createMaterial(data: Partial<Material>): Promise<Material>
  updateMaterial(id: string, data: Partial<Material>): Promise<Material>
  deleteMaterial(id: string): Promise<void>
  getMaterialStatistics(): Promise<MaterialStatistics>

  // Stock management
  adjustStock(id: string, quantity: number, reason: string): Promise<Material>
  transferStock(fromId: string, toId: string, quantity: number): Promise<void>

  // Import/Export
  exportMaterials(
    format: 'CSV' | 'EXCEL' | 'PDF',
    filters?: Record<string, unknown>
  ): Promise<FileUploadResponse>
  importMaterials(data: FormData): Promise<BatchOperationResponse<Material>>
}

// Articles API interface
export interface ArticlesAPI {
  getArticles(filters?: unknown): Promise<PaginatedResponse<BasicArticle>>
  getArticle(id: string): Promise<BasicArticle>
  createArticle(data: Partial<BasicArticle>): Promise<BasicArticle>
  updateArticle(id: string, data: Partial<BasicArticle>): Promise<BasicArticle>
  deleteArticle(id: string): Promise<void>

  // Stock operations
  adjustStock(
    id: string,
    adjustment: {
      quantity: number
      type: 'IN' | 'OUT' | 'ADJUSTMENT'
      reason: string
      location?: string
    }
  ): Promise<BasicArticle>
}

// Users API interface
export interface UsersAPI {
  getUsers(filters?: unknown): Promise<PaginatedResponse<BasicUser>>
  getUser(id: string): Promise<BasicUser>
  createUser(data: Partial<BasicUser>): Promise<BasicUser>
  updateUser(id: string, data: Partial<BasicUser>): Promise<BasicUser>
  deleteUser(id: string): Promise<void>
  getCurrentUser(): Promise<BasicUser>
}

// Projects API interface
export interface ProjectsAPI {
  getProjects(filters?: unknown): Promise<PaginatedResponse<BasicProject>>
  getProject(id: string): Promise<BasicProject>
  createProject(data: Partial<BasicProject>): Promise<BasicProject>
  updateProject(id: string, data: Partial<BasicProject>): Promise<BasicProject>
  deleteProject(id: string): Promise<void>
}

// Notifications API interface
export interface NotificationsAPI {
  getNotifications(filters?: unknown): Promise<PaginatedResponse<BasicNotification>>
  getNotification(id: string): Promise<BasicNotification>
  createNotification(data: Partial<BasicNotification>): Promise<BasicNotification>
  markAsRead(id: string): Promise<BasicNotification>
  markAllAsRead(): Promise<void>
  deleteNotification(id: string): Promise<void>
}

// Search API interface
export interface SearchAPI {
  globalSearch(
    query: string,
    options?: {
      types?: string[]
      limit?: number
      offset?: number
    }
  ): Promise<{
    results: Array<{
      type: string
      id: string
      title: string
      description?: string
      url?: string
      score?: number
    }>
    total: number
    took: number
  }>

  searchSuggestions(query: string): Promise<string[]>
  reindexAll(): Promise<{ success: boolean; message: string }>
}

// Files API interface
export interface FilesAPI {
  uploadFile(
    file: File | FormData,
    options?: {
      folder?: string
      maxSize?: number
      allowedTypes?: string[]
    }
  ): Promise<FileUploadResponse>

  uploadMultiple(files: File[] | FormData): Promise<FileUploadResponse[]>
  deleteFile(id: string): Promise<void>
  getFile(id: string): Promise<Blob>
  getFileInfo(id: string): Promise<FileUploadResponse>
}

// Settings API interface
export interface SettingsAPI {
  getSettings(category?: string): Promise<Record<string, unknown>>
  updateSetting(key: string, value: any): Promise<void>
  updateSettings(settings: Record<string, unknown>): Promise<void>
  resetSettings(category?: string): Promise<void>
}

// Reports API interface
export interface ReportsAPI {
  generateReport(
    type: string,
    params?: Record<string, unknown>
  ): Promise<{
    id: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    downloadUrl?: string
  }>

  getReportStatus(id: string): Promise<{
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    progress?: number
    downloadUrl?: string
    error?: string
  }>

  downloadReport(id: string): Promise<Blob>
  listReports(): Promise<
    Array<{
      id: string
      type: string
      created: string
      status: string
    }>
  >
}

// Main API Client interface that combines all domain APIs
export interface IAPIClient {
  // Domain-specific APIs
  partners: PartnersAPI
  materials: MaterialsAPI
  articles: ArticlesAPI
  users: UsersAPI
  projects: ProjectsAPI
  notifications: NotificationsAPI
  search: SearchAPI
  files: FilesAPI
  settings: SettingsAPI
  reports: ReportsAPI

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
