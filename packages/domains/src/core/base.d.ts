/**
 * 🏗️ TYPES DE BASE - DOMAINE CORE
 * Types fondamentaux partagés entre tous les domaines
 */
export interface BaseEntity {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date
}
export type ID = string
export type Timestamp = Date
export interface PaginationOptions {
  readonly page: number
  readonly limit: number
}
export interface PaginatedResponse<T> {
  readonly items: T[]
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly totalPages: number
}
export interface OperationResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly validationErrors?: Record<string, string[]>
}
export interface BaseFilters {
  readonly search?: string
  readonly createdAtFrom?: Date
  readonly createdAtTo?: Date
  readonly updatedAtFrom?: Date
  readonly updatedAtTo?: Date
}
export interface SortOptions {
  readonly field: string
  readonly direction: 'asc' | 'desc'
}
//# sourceMappingURL=base.d.ts.map
