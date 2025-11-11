/**
 * Export centralisé de tous les types du domaine API
 * Facilite l'import des types dans les services et contrôleurs
 */

// Auth & Security
export * from './auth/webauthn.types'
// Entités
export * from './entities/societe.types'
export * from './entities/user.types'

// Notifications
export * from './notifications/notification.types'
// Query Builder
export * from './query-builder/query-builder.types'

// Types communs réutilisables
export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'ASC' | 'DESC'
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: Record<string, unknown>
}

export interface FilterParams {
  search?: string
  status?: string
  startDate?: Date | string
  endDate?: Date | string
  [key: string]: unknown
}

export interface BulkOperationResult {
  total: number
  successful: number
  failed: number
  errors?: Array<{
    id: string
    error: string
  }>
}

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

export interface RequestContext {
  userId: string
  societeId?: string
  siteId?: string
  permissions: string[]
  ipAddress?: string
  userAgent?: string
}
