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

export type {
  AuthenticatedUser,
  JWTPayload,
} from './jwt-utils-client'
// Export depuis jwt-utils-client pour les Client Components
export {
  decodeJWTPayload,
  extractTokenFromCookies,
  extractTokenFromRequest,
  getAuthenticatedUser,
  hasAccessToCompany,
  hasPermission,
  isAdmin,
  requireAuthenticatedUser,
} from './jwt-utils-client'
