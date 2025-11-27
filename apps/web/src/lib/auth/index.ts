/**
 * Module d'authentification centralisé
 * Export de toutes les fonctions et types d'authentification
 */

// Export auth hook and provider
export { useAuth } from './auth-context'
export { AuthProvider } from './auth-provider'

// Export auth types
export type {
  AuthBroadcastEvent,
  AuthConfig,
  AuthContextType,
  AuthState,
  AuthTokens,
  Company,
  CompanySelectionResponse,
  LoginResponse,
  MFAState,
  MFAVerificationResponse,
  StoredSession,
  User,
} from './auth-types'

// Export shared JWT types and functions
export type { AuthenticatedUser, JWTPayload } from './jwt-utils-shared'
export {
  ADMIN_ROLES,
  decodeJWTPayload,
  hasAccessToCompany,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isAdmin,
  payloadToUser,
  requireAuthenticatedUser,
} from './jwt-utils-shared'

// Export client-specific functions
export { extractTokenFromCookies, extractTokenFromRequest, getAuthenticatedUser } from './jwt-utils-client'
