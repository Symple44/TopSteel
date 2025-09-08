/**
 * 📡 API RESPONSES - TopSteel ERP
 * Types pour les réponses API
 */

/**
 * Réponse API générique
 */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Métadonnées de pagination
 */
export interface PaginationMetaDto {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Résultat paginé
 */
export interface PaginationResultDto<T> {
  data: T[]
  meta: PaginationMetaDto
}

/**
 * Réponse d'erreur structurée
 */
export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
  }
}

/**
 * Réponse de succès simple
 */
export interface SuccessResponse {
  success: true
  message?: string
  timestamp: string
}

/**
 * Status codes HTTP typés
 */
export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 500 // Internal Server Error
