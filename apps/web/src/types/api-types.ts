/**
 * Types for API responses and requests
 * These types ensure type safety across all API interactions
 */

// Base API Response structure
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string | ApiError
  success: boolean
  message?: string
  statusCode?: number
  timestamp?: string
}

// API Error structure
export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: Record<string, unknown>
  stack?: string
  path?: string
  timestamp?: string
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// API Request options
export interface ApiRequestOptions {
  headers?: Record<string, string>
  params?: Record<string, unknown>
  signal?: AbortSignal
  timeout?: number
  retry?: number
  retryDelay?: number
}

// File upload response
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
  id?: string
}

// Batch operation response
export interface BatchOperationResponse<T = unknown> {
  successful: T[]
  failed: Array<{
    item: T
    error: string
  }>
  totalProcessed: number
  successCount: number
  failureCount: number
}

// Export all types
export type { ApiResponse as default }
