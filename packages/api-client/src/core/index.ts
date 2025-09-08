/**
 * 🏗️ CORE - API CLIENT
 * Infrastructure de base pour les appels API
 */

// ===== TYPES =====
export type {
  ApiResponse,
  AuthenticatedRequest,
  BaseEntity,
  EntityWithRelations,
  JsonValue,
  PaginatedResponse,
  RequestWithUser,
  SafeObject,
  SafeRecord,
} from '../types/common'
export type { ApiClientConfig } from './base-api-client'
// ===== BASE API CLIENT =====
export { BaseApiClient } from './base-api-client'
export type { ApiConfig, ApiError, AuthToken, RequestOptions } from './http-client'
// ===== HTTP CLIENT =====
export { HttpClient } from './http-client'
