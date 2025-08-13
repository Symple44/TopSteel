// Types spécifiques à l'authentification
export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role?: string
  permissions?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Aliases for compatibility
  firstName?: string
  lastName?: string
}

export interface Company {
  id: string
  nom: string
  name: string
  code: string
  status: string
  plan: string
  isActive: boolean
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
  methods?: string[]
  backupCodes?: number
}

export interface AuthState {
  // État de chargement
  isLoading: boolean

  // État d'authentification
  isAuthenticated: boolean
  user: User | null
  tokens: AuthTokens | null

  // État MFA
  mfa: MFAState

  // État société
  company: Company | null
  requiresCompanySelection: boolean

  // État d'hydratation SSR
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

  // Actions utilitaires
  refreshAuth: () => Promise<void>
  validateTokens: (tokens: AuthTokens) => Promise<boolean>
}

// Types pour les réponses API
export interface LoginResponse {
  user?: User
  tokens?: AuthTokens
  requiresMFA?: boolean
  mfa?: MFAState
}

export interface MFAVerificationResponse {
  user: User
  tokens: AuthTokens
}

export interface CompanySelectionResponse {
  user: User
  tokens: AuthTokens
  company: Company
}

// Types pour le stockage
export interface StoredSession {
  user: User | null
  tokens: AuthTokens | null
  company: Company | null
}

// Types pour la configuration
export interface AuthConfig {
  apiBaseUrl: string
  tokenStorageKey: string
  rememberMeStorageKey: string
  broadcastChannelName: string
}

// Types pour les événements de synchronisation multi-onglets
export interface AuthBroadcastEvent {
  type: 'USER_LOGIN' | 'USER_LOGOUT' | 'COMPANY_CHANGED' | 'TOKEN_REFRESH'
  tabId: string
  data: any
}
