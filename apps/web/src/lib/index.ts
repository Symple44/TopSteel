// Main API clients and utilities

// Type utilities
export type { WebAppConfig } from '@/types'
export {
  APIError,
  type APIErrorDetails,
  type APIMetrics,
  apiClient,
  type RequestConfig,
} from './api-client'
export { apiClientEnhanced, useApiClient } from './api-client-enhanced'
export { apiClientFinal, type IAPIClientFinal } from './api-client-final'
export { type APIClientInterface, apiClient as apiClientInstance } from './api-client-instance'

// Response handlers
export {
  extractData,
  extractError,
  // handleApiError, // Not exported from api-response-handler
  handleApiResponse,
} from './api-response-handler'
export {
  deleteTyped,
  ensureDataProperty,
  extractOrDefault,
  fetchTyped,
  hasDataProperty,
  postTyped,
  putTyped,
} from './api-typed'
// Authentication (explicit exports to avoid conflicts)
export type {
  Company,
  User,
} from './auth/auth-types'
export * from './auth/cookie-auth'
export type { AuthenticatedUser } from './auth/jwt-utils'
export { RBACService } from './auth/rbac-service'
export type {
  AccessContext,
  AccessPolicy,
  ExtendedUser,
  UserSocieteRole,
} from './auth/rbac-types'
export { cache } from './cache'
// Security and CSRF
export { csrfManager } from './csrf'
// generateCSRFToken, validateCSRFToken not exported from csrf module
// Data table utilities
export { datatableUtils } from './datatable-utils'
export { errorHandler } from './error-handler'

// Internationalization
export * from './i18n'

// Monitoring and metrics
export { businessMetrics } from './monitoring/business-metrics'
export { initSentry } from './monitoring/sentry'
// Performance and optimization
export { PerformanceMonitor } from './performance-monitor'
// React Query setup
export { queryClient, ReactQueryProvider } from './react-query'
export { encodeForHTML, sanitizeInput, validateUserInput } from './security-utils'
// Server-side utilities
export { serverStorage } from './server-storage'
// Services
export { uiPreferencesService } from './services/ui-preferences.service'
export { uiPreferencesClientService } from './services/ui-preferences-client.service'
export { default as ssrUtils } from './ssr-utils'
// Templates
export { predefinedTemplates } from './templates/predefined-templates'
// UI Components (re-export from complete file)
export * from './ui-components-complete'
// Utilities
export { cn, debounce, formatDate, throttle } from './utils'
