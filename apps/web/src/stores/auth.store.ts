/**
 * 🔐 STORE AUTHENTIFICATION - TopSteel ERP
 * Gestion robuste de l'authentification et des sessions utilisateur
 * Fichier: apps/web/src/stores/auth.store.ts
 */
import { StoreUtils } from '@/lib/store-utils'
import type { BaseStoreActions, BaseStoreState, InitialState, StoreCreator } from '@erp/types'

// ===== INTERFACES =====
interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  permissions: string[]
  avatar?: string
  lastLogin?: number
}

interface SessionInfo {
  token: string
  refreshToken: string
  expiresAt: number
  issuedAt: number
}

interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface AuthState extends BaseStoreState {
  // État utilisateur
  user: User | null
  session: SessionInfo | null
  isAuthenticated: boolean
  
  // État de session
  isSessionValid: boolean
  tokenRefreshInProgress: boolean
  
  // Historique
  loginHistory: Array<{
    timestamp: number
    ip?: string
    userAgent?: string
    success: boolean
  }>
}

interface AuthActions extends BaseStoreActions {
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  checkSession: () => boolean
  setUser: (user: User | null) => void
  setSession: (session: SessionInfo | null) => void
  clearAuthData: () => void
}

type AuthStore = AuthState & AuthActions

// ===== ÉTAT INITIAL =====
const initialAuthState: InitialState<AuthState> = {
  // État de base
  loading: false,
  error: null,
  lastUpdate: 0,
  
  // Utilisateur et session
  user: null,
  session: null,
  isAuthenticated: false,
  isSessionValid: false,
  tokenRefreshInProgress: false,
  
  // Historique
  loginHistory: []
}

// ===== API SIMULÉE =====
const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; session: SessionInfo }> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (credentials.email === 'error@test.com') {
      throw new Error('Identifiants invalides')
    }
    
    const mockUser: User = {
      id: crypto.randomUUID(),
      nom: 'Dupont',
      prenom: 'Jean',
      email: credentials.email,
      role: 'admin',
      permissions: ['projets:read', 'projets:write', 'stocks:read'],
      lastLogin: Date.now()
    }
    
    const mockSession: SessionInfo = {
      token: 'mock_jwt_token_' + Math.random().toString(36),
      refreshToken: 'mock_refresh_token_' + Math.random().toString(36),
      expiresAt: Date.now() + (credentials.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000),
      issuedAt: Date.now()
    }
    
    return { user: mockUser, session: mockSession }
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  },

  async refreshToken(refreshToken: string): Promise<SessionInfo> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      token: 'new_mock_jwt_token_' + Math.random().toString(36),
      refreshToken,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      issuedAt: Date.now()
    }
  }
}

// ===== CRÉATEUR D'ACTIONS =====
const createAuthActions: StoreCreator<AuthState, AuthActions> = (set, get) => {
  const baseActions = StoreUtils.createBaseActions(initialAuthState)

  return {
    ...baseActions,

    login: async (credentials: LoginCredentials) => {
      try {
        set((state) => {
          state.loading = true
          state.error = null
        })

        const { user, session } = await authAPI.login(credentials)

        set((state) => {
          state.user = user
          state.session = session
          state.isAuthenticated = true
          state.isSessionValid = true
          state.loading = false
          state.loginHistory.unshift({
            timestamp: Date.now(),
            success: true
          })
          state.lastUpdate = Date.now()
        })

        return true
      } catch (error) {
        set((state) => {
          state.loading = false
          state.error = error instanceof Error ? error.message : 'Erreur de connexion'
          state.loginHistory.unshift({
            timestamp: Date.now(),
            success: false
          })
          state.lastUpdate = Date.now()
        })
        return false
      }
    },

    logout: async () => {
      try {
        set((state) => {
          state.loading = true
        })

        await authAPI.logout()

        set((state) => {
          state.user = null
          state.session = null
          state.isAuthenticated = false
          state.isSessionValid = false
          state.loading = false
          state.error = null
          state.lastUpdate = Date.now()
        })
      } catch (error) {
        set((state) => {
          state.loading = false
          state.error = 'Erreur lors de la déconnexion'
          state.lastUpdate = Date.now()
        })
      }
    },

    refreshToken: async () => {
      const currentState = get()
      if (!currentState.session?.refreshToken || currentState.tokenRefreshInProgress) {
        return false
      }

      try {
        set((state) => {
          state.tokenRefreshInProgress = true
          state.error = null
        })

        const newSession = await authAPI.refreshToken(currentState.session.refreshToken)

        set((state) => {
          state.session = newSession
          state.isSessionValid = true
          state.tokenRefreshInProgress = false
          state.lastUpdate = Date.now()
        })

        return true
      } catch (error) {
        set((state) => {
          state.session = null
          state.isAuthenticated = false
          state.isSessionValid = false
          state.tokenRefreshInProgress = false
          state.error = 'Session expirée'
          state.lastUpdate = Date.now()
        })
        return false
      }
    },

    checkSession: () => {
      const state = get()
      const isValid = state.session && Date.now() < state.session.expiresAt
      
      set((state) => {
        state.isSessionValid = !!isValid
        state.isAuthenticated = !!isValid && !!state.user
      })

      return !!isValid
    },

    setUser: (user) => set((state) => {
      state.user = user
      state.isAuthenticated = !!user
      state.lastUpdate = Date.now()
    }),

    setSession: (session) => set((state) => {
      state.session = session
      state.isSessionValid = session ? Date.now() < session.expiresAt : false
      state.lastUpdate = Date.now()
    }),

    clearAuthData: () => set((state) => {
      state.user = null
      state.session = null
      state.isAuthenticated = false
      state.isSessionValid = false
      state.tokenRefreshInProgress = false
      state.error = null
      state.lastUpdate = Date.now()
    })
  }
}

// ===== CRÉATION DU STORE =====
export const useAuthStore = StoreUtils.createRobustStore<AuthState, AuthActions>(
  initialAuthState,
  createAuthActions,
  {
    name: 'auth-store',
    persist: false,
    devtools: true,
    immer: true,
    subscriptions: false
  }
)

// ===== HOOKS SÉLECTEURS =====
export const useAuthUser = () => useAuthStore(state => state.user)
export const useAuthIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore(state => state.loading)
export const useAuthError = () => useAuthStore(state => state.error)
export const useAuthUserDisplayName = () => useAuthStore(state => 
  state.user ? `${state.user.prenom} ${state.user.nom}` : null
)
export const useAuthSessionTimeLeft = () => useAuthStore(state => 
  state.session ? Math.max(0, state.session.expiresAt - Date.now()) : 0
)

// ===== EXPORTS =====
export type { AuthActions, AuthState, AuthStore, LoginCredentials, SessionInfo, User }
