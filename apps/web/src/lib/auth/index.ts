/**
 * Module d'authentification centralisé
 * Export de toutes les fonctions et types d'authentification
 */

// Export auth hook and provider
export { useAuth } from './auth-context'
export { AuthProvider } from './auth-provider'
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
