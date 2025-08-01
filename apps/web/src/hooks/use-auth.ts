// Hook d'authentification principal - Interface simple et propre

// Réexport des types pour compatibilité
export type { AuthContextType, AuthState, AuthTokens, Company, User } from '@/lib/auth'
export { useAuth } from '@/lib/auth'

// Hooks de commodité pour des cas d'usage spécifiques
import { useAuth } from '@/lib/auth'

/**
 * Hook pour récupérer uniquement l'utilisateur actuel
 */
export const useCurrentUser = () => {
  const { user } = useAuth()
  return user
}

/**
 * Hook pour vérifier si l'utilisateur est authentifié
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook pour récupérer la société actuelle
 */
export const useCurrentCompany = () => {
  const { company } = useAuth()
  return company
}

/**
 * Hook pour vérifier si l'authentification est en cours de chargement
 */
export const useAuthLoading = () => {
  const { isLoading } = useAuth()
  return isLoading
}

/**
 * Hook pour vérifier si une sélection de société est requise
 */
export const useRequiresCompanySelection = () => {
  const { requiresCompanySelection } = useAuth()
  return requiresCompanySelection
}
