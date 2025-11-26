// Main library exports - Socle

// Type utilities
export type { WebAppConfig } from '../types'

// Response handlers
export {
  extractData,
  extractError,
  handleApiResponse,
} from './api-response-handler'

// Authentication
export type { Company, User } from './auth/auth-types'
export * from './auth/cookie-auth'
export type { AuthenticatedUser } from './auth/jwt-utils'
export { RBACService } from './auth/rbac-service'
export type { AccessContext, AccessPolicy, ExtendedUser, UserSocieteRole } from './auth/rbac-types'

// Cache
export { cache } from './cache'

// Security and CSRF
export { csrfManager } from './csrf'

// Data table utilities
export { datatableUtils } from './datatable-utils'
export { errorHandler } from './error-handler'

// Internationalization
export * from './i18n'

// Monitoring and metrics

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

// UI Components
export * from './ui-components-complete'

// Rate Limiting
export {
  authLimiter,
  createRateLimiter,
  getRateLimiterForPath,
  searchLimiter,
  sensitiveLimiter,
  standardLimiter,
  uploadLimiter,
  withRateLimit,
} from './rate-limiter'

// Type Guards (excluant areTokensExpired déjà exporté via cookie-auth)
export {
  hasIsActiveProperty,
  hasProperty,
  hasRoleProperty,
  hasSocieteRoles,
  isApiError,
  isApiSuccess,
  isNonEmptyArray,
  isNonEmptyString,
  isObject,
  isValidAuthTokens,
  isValidCompany,
  isValidDate,
  isValidEmail,
  isValidExtendedUser,
  isValidISODateString,
  isValidNumber,
  isValidUser,
  isValidUUID,
  safeGet,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
} from './type-guards'

// Utilities
export { cn, debounce, formatDate, throttle } from './utils'
