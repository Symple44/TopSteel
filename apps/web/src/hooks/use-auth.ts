/**
 * Authentication Hooks Module
 *
 * This module provides a clean and simple interface for authentication in the frontend.
 * It re-exports the main authentication hook and types, and provides specialized
 * convenience hooks for common authentication use cases.
 *
 * @module hooks/use-auth
 */

// Re-export types for compatibility
export type { AuthContextType, AuthState, AuthTokens, Company, User } from '../lib/auth'

/**
 * Main authentication hook that provides access to the complete authentication context.
 *
 * This hook must be used within an AuthProvider component. It provides access to:
 * - Current user information
 * - Authentication state (loading, authenticated, etc.)
 * - Company selection state
 * - Authentication methods (login, logout, selectCompany, etc.)
 *
 * @returns {AuthContextType} Authentication context containing:
 *   - user: Current authenticated user or null
 *   - company: Currently selected company or null
 *   - isAuthenticated: Whether user is authenticated
 *   - isLoading: Whether authentication is being checked
 *   - requiresCompanySelection: Whether user needs to select a company
 *   - login: Function to authenticate user
 *   - logout: Function to sign out
 *   - selectCompany: Function to select a company
 *   - and more authentication utilities
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function ProfileComponent() {
 *   const { user, company, isAuthenticated, logout } = useAuth()
 *
 *   if (!isAuthenticated) {
 *     return <LoginPrompt />
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.name}</h1>
 *       <p>Company: {company?.name}</p>
 *       <button onClick={logout}>Sign Out</button>
 *     </div>
 *   )
 * }
 * ```
 */
export { useAuth } from '../lib/auth'

// Convenience hooks for specific use cases
import { useAuth } from '../lib/auth'

/**
 * Convenience hook to retrieve only the current authenticated user.
 *
 * Use this hook when you only need access to user information and don't need
 * the full authentication context. This provides a cleaner API for components
 * that only display or use user data.
 *
 * @returns {User | null} Current authenticated user or null if not authenticated
 *
 * @example
 * ```tsx
 * function UserAvatar() {
 *   const user = useCurrentUser()
 *
 *   if (!user) return null
 *
 *   return (
 *     <img
 *       src={user.avatar}
 *       alt={user.name}
 *       title={user.email}
 *     />
 *   )
 * }
 * ```
 */
export const useCurrentUser = () => {
  const { user } = useAuth()
  return user
}

/**
 * Convenience hook to check if the user is currently authenticated.
 *
 * Use this hook when you only need to know the authentication status
 * without accessing user data. Useful for conditional rendering based
 * on authentication state.
 *
 * @returns {boolean} True if user is authenticated, false otherwise
 *
 * @example
 * ```tsx
 * function ProtectedContent() {
 *   const isAuthenticated = useIsAuthenticated()
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" />
 *   }
 *
 *   return <div>Protected content here</div>
 * }
 * ```
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Convenience hook to retrieve the currently selected company.
 *
 * Use this hook when you need access to company information without
 * the full authentication context. The company represents the current
 * organizational context for the user's session.
 *
 * @returns {Company | null} Currently selected company or null if none selected
 *
 * @example
 * ```tsx
 * function CompanySelector() {
 *   const company = useCurrentCompany()
 *
 *   return (
 *     <div>
 *       <h2>Current Company</h2>
 *       {company ? (
 *         <p>{company.name} (ID: {company.id})</p>
 *       ) : (
 *         <p>No company selected</p>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export const useCurrentCompany = () => {
  const { company } = useAuth()
  return company
}

/**
 * Convenience hook to check if authentication is currently loading.
 *
 * Use this hook to display loading states while authentication status
 * is being determined (e.g., on initial page load or after a page refresh).
 * This helps prevent flickering between authenticated and unauthenticated states.
 *
 * @returns {boolean} True if authentication check is in progress, false otherwise
 *
 * @example
 * ```tsx
 * function AppLayout() {
 *   const isLoading = useAuthLoading()
 *   const isAuthenticated = useIsAuthenticated()
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />
 *   }
 *
 *   return isAuthenticated ? <Dashboard /> : <LoginPage />
 * }
 * ```
 */
export const useAuthLoading = () => {
  const { isLoading } = useAuth()
  return isLoading
}

/**
 * Convenience hook to check if user needs to select a company.
 *
 * Use this hook to determine if the company selection step is required
 * in the authentication flow. This is common in multi-tenant applications
 * where users can belong to multiple companies.
 *
 * @returns {boolean} True if company selection is required, false otherwise
 *
 * @example
 * ```tsx
 * function AuthFlow() {
 *   const requiresCompanySelection = useRequiresCompanySelection()
 *   const isAuthenticated = useIsAuthenticated()
 *
 *   if (!isAuthenticated) {
 *     return <LoginPage />
 *   }
 *
 *   if (requiresCompanySelection) {
 *     return <CompanySelectionPage />
 *   }
 *
 *   return <Dashboard />
 * }
 * ```
 */
export const useRequiresCompanySelection = () => {
  const { requiresCompanySelection } = useAuth()
  return requiresCompanySelection
}
