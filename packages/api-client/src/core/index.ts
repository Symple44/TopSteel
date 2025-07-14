/**
 * 🏗️ CORE - API CLIENT
 * Infrastructure de base pour les appels API
 */

// ===== HTTP CLIENT =====
export { HttpClient } from './http-client'
export type { ApiConfig, AuthToken, ApiError, RequestOptions } from './http-client'

// ===== BASE API CLIENT =====
export { BaseApiClient } from './base-api-client'
export type { ApiClientConfig } from './base-api-client'