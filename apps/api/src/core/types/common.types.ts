/**
 * Common type definitions used across the API
 */

// Authentication types
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  company?: string
}

export interface ForgotPasswordRequest {
  email: string
}

// User management types
export interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  role: string
  isActive?: boolean
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  isActive?: boolean
}

// System configuration types
export interface SystemConfig {
  maintenanceMode?: boolean
  maxFileUploadSize?: number
  allowedFileTypes?: string[]
  [key: string]: unknown
}

// File upload types
export interface FileData {
  filename: string
  mimetype: string
  size: number
  buffer: Buffer
}

// Search types
export interface SearchQuery {
  query: string
  filters?: Record<string, unknown>
  page?: number
  limit?: number
}

export interface ComplexSearchQuery extends SearchQuery {
  aggregations?: Record<string, unknown>
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>
  highlight?: string[]
}

// Query builder types
export interface QueryData {
  sql?: string
  parameters?: Record<string, unknown>
  table?: string
  columns?: string[]
  conditions?: Array<{
    field: string
    operator: string
    value: unknown
  }>
}

// Marketplace types
export interface OrderData {
  productId: string
  quantity: number
  customOptions?: Record<string, unknown>
}

export interface PaymentData {
  amount: number
  currency: string
  paymentMethodId: string
  metadata?: Record<string, unknown>
}

// Webhook types
export interface StripeWebhookPayload {
  id: string
  object: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}

export interface MarketplaceWebhookPayload {
  event: string
  timestamp: number
  data: Record<string, unknown>
}

// Generic API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error handling types
export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}
