/**
 * Types pour le système d'authentification
 */

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  avatar?: string
  permissions?: string[]
  societeId?: string
  societeCode?: string
  societeName?: string
}

export interface Company {
  id: string
  nom: string
  name?: string // Add name property for compatibility
  code: string
  status: string
  plan: string
  isActive?: boolean // Add isActive property
  role?: string // Add role property for user's role in this company
  isDefault?: boolean // Add isDefault property
  permissions?: string[] // Add permissions property
  sites?: any[] // Add sites property
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  expiresIn?: number
  tokenType?: string
}

export interface MFAState {
  required: boolean
  userId?: string
  email?: string
  availableMethods?: Array<{
    type: string
    isEnabled: boolean
    lastUsed?: Date
  }>
  sessionToken?: string
}

export interface AuthState {
  // État de base
  isLoading: boolean
  isAuthenticated: boolean

  // Données utilisateur
  user: User | null
  tokens: AuthTokens | null

  // Gestion MFA
  mfa: MFAState

  // Gestion société
  company: Company | null
  requiresCompanySelection: boolean

  // État du composant
  mounted: boolean
}

export interface AuthContextType extends AuthState {
  // Actions d'authentification
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>

  // Actions MFA
  verifyMFA: (mfaType: string, code?: string, webauthnResponse?: any) => Promise<void>
  resetMFA: () => void

  // Actions utilisateur
  setUser: (user: User | null) => void
  refreshTokens: () => Promise<void>

  // Actions société
  selectCompany: (company: Company) => Promise<void>

  // Utilitaires
  refreshAuth: () => Promise<void>
  validateTokens: (tokens: AuthTokens) => Promise<boolean>
}
