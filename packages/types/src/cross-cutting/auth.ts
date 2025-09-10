/**
 * 🔐 AUTHENTIFICATION - TopSteel ERP
 * Types pour l'authentification et l'autorisation
 * Fichier: packages/types/src/cross-cutting/auth.ts
 */

/**
 * Type utilisateur pour l'authentification
 * Note: Le type User complet est maintenant dans @erp/domains
 */
export interface AuthUser extends Record<string, unknown> {
  id: string
  email: string
  nom: string
  prenom: string
  role: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterData {
  email: string
  password: string
  nom: string
  prenom: string
  entreprise?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}
