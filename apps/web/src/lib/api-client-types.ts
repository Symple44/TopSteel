/**
 * Comprehensive TypeScript interfaces for APIClient
 * This file defines all the domain-specific API method interfaces
 */

import type {
  Article,
  ArticleFilters,
  Contact,
  CreateArticleDto,
  CreateContactDto,
  CreateMaterialDto,
  CreateNotificationDto,
  CreatePartnerAddressDto,
  CreatePartnerDto,
  CreatePartnerGroupDto,
  CreatePartnerSiteDto,
  CreateProjectDto,
  CreateUserDto,
  Material,
  MaterialFilters,
  MaterialStatistics,
  NotificationFilters,
  Partner,
  PartnerAddress,
  PartnerFilters,
  PartnerGroup,
  PartnerSite,
  PartnerStatistics,
  Project,
  ProjectFilters,
  UpdateArticleDto,
  UpdateContactDto,
  UpdateMaterialDto,
  UpdatePartnerAddressDto,
  UpdatePartnerDto,
  UpdatePartnerGroupDto,
  UpdatePartnerSiteDto,
  UpdateProjectDto,
  UpdateUserDto,
  User,
  UserFilters,
} from '@erp/types'
import type {
  BatchOperationResponse,
  FileUploadResponse,
  PaginatedResponse,
} from '@/types/api-types'
import type { ClientNotification } from '@/types/notifications'

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
  createMaterial(data: CreateMaterialDto): Promise<Material>
  updateMaterial(id: string, data: UpdateMaterialDto): Promise<Material>
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
  getArticles(filters?: ArticleFilters): Promise<PaginatedResponse<Article>>
  getArticle(id: string): Promise<Article>
  createArticle(data: CreateArticleDto): Promise<Article>
  updateArticle(id: string, data: UpdateArticleDto): Promise<Article>
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
  ): Promise<Article>
}

// Users API interface
export interface UsersAPI {
  getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>>
  getUser(id: string): Promise<User>
  createUser(data: CreateUserDto): Promise<User>
  updateUser(id: string, data: UpdateUserDto): Promise<User>
  deleteUser(id: string): Promise<void>
  getCurrentUser(): Promise<User>

  // Role and permission management
  assignRole(userId: string, roleId: string): Promise<User>
  removeRole(userId: string, roleId: string): Promise<User>
  updatePermissions(userId: string, permissions: string[]): Promise<User>
}

// Projects API interface
export interface ProjectsAPI {
  getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>>
  getProject(id: string): Promise<Project>
  createProject(data: CreateProjectDto): Promise<Project>
  updateProject(id: string, data: UpdateProjectDto): Promise<Project>
  deleteProject(id: string): Promise<void>

  // Project status management
  updateStatus(id: string, status: string, comment?: string): Promise<Project>
  assignUser(projectId: string, userId: string, role?: string): Promise<Project>
  removeUser(projectId: string, userId: string): Promise<Project>
}

// Notifications API interface
export interface NotificationsAPI {
  getNotifications(filters?: NotificationFilters): Promise<PaginatedResponse<ClientNotification>>
  getNotification(id: string): Promise<ClientNotification>
  createNotification(data: CreateNotificationDto): Promise<ClientNotification>
  markAsRead(id: string): Promise<ClientNotification>
  markAllAsRead(): Promise<void>
  deleteNotification(id: string): Promise<void>

  // Notification preferences
  getPreferences(): Promise<Record<string, boolean>>
  updatePreferences(preferences: Record<string, boolean>): Promise<void>
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

  // User preferences
  getUserPreferences(): Promise<Record<string, unknown>>
  updateUserPreference(key: string, value: any): Promise<void>
  resetUserPreferences(): Promise<void>
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

// Export alias for the main client interface
export type { IAPIClient as APIClientInterface }
