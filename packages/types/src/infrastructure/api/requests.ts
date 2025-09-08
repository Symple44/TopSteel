/**
 * 📤 API REQUESTS - TopSteel ERP
 * Types pour les requêtes API
 */

/**
 * Paramètres de pagination
 */
export type PaginationParams = {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Requête de base avec pagination optionnelle
 */
export interface BaseRequest {
  pagination?: PaginationParams
}

/**
 * Paramètres de tri
 */
export interface SortParams {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

/**
 * Requête avec tri
 */
export interface SortableRequest extends BaseRequest {
  sort?: SortParams
}

/**
 * Requête avec recherche textuelle
 */
export interface SearchableRequest extends BaseRequest {
  search?: string
  searchFields?: string[]
}

/**
 * Requête complète avec pagination, tri et recherche
 */
export interface ListRequest extends SortableRequest, SearchableRequest {
  filters?: Record<string, unknown>
}
