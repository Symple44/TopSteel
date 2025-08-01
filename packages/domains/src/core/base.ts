/**
 * 🏗️ TYPES DE BASE - DOMAINE CORE
 * Types fondamentaux partagés entre tous les domaines
 */

// ===== ENTITÉ DE BASE =====

export interface BaseEntity {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ===== TYPES UTILITAIRES =====

export type ID = string
export type Timestamp = Date

// ===== PAGINATION =====

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

// ===== RÉSULTATS D'OPÉRATIONS =====

export interface OperationResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly validationErrors?: Record<string, string[]>
}

// ===== FILTRES GÉNÉRIQUES =====

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
