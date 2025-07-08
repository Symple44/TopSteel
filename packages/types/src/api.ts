// packages/types/src/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
export interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, unknown>
}
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
export interface PaginationMetaDto {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationResultDto<T> {
  data: T[]
  meta: PaginationMetaDto
}
export interface FilterParams {
  search?: string
  status?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: string | number | boolean | undefined
}
