/**
 * 🔐 STORE AUTHENTIFICATION - TopSteel ERP
 * Gestion robuste de l'authentification et des sessions utilisateur
 * Fichier: apps/web/src/stores/auth.store.ts
 */
import { StoreUtils, type BaseStoreState } from '@/lib/store-utils'
import React from 'react'

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

  // ===== ACTIONS =====
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  checkSession: () => boolean
  setUser: (user: User | null) => void
  setSession: (session: SessionInfo | null) => void
  clearAuthData: () => void
  
  // Actions de base
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

// ===== ÉTAT INITIAL =====
const initialAuthState: Omit<AuthState, 'login' | 'logout' | 'refreshToken' | 'checkSession' | 'setUser' | 'setSession' | 'clearAuthData' | 'setLoading' | 'setError' | 'clearError' | 'reset'> = {
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

// ===== API SIMULÉE (À REMPLACER PAR VOTRE API) =====
const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; session: SessionInfo }> {
    // Simulation d'appel API avec délai
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Simulation d'échec pour certains emails
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
      expiresAt: Date.now() + (credentials.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000), // 7 jours ou 24h
      issuedAt: Date.now()
    }
    
    return { user: mockUser, session: mockSession }
  },
  
  async refreshToken(refreshToken: string): Promise<SessionInfo> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (!refreshToken) {
      throw new Error('Refresh token manquant')
    }
    
    return {
      token: 'new_mock_jwt_token_' + Math.random().toString(36),
      refreshToken: refreshToken, // Garde le même refresh token
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24h
      issuedAt: Date.now()
    }
  },
  
  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    // Ici vous pourriez invalider le token côté serveur
  }
}

// ===== CRÉATION DU STORE =====
export const useAuthStore = StoreUtils.createRobustStore<AuthState>(
  initialAuthState as AuthState,
  (set, get) => {
    const baseActions = StoreUtils.createBaseActions<AuthState>()
    
    // Action de login avec gestion d'erreur automatique
    const login = StoreUtils.createAsyncAction(
      async (credentials: LoginCredentials) => {
        const response = await authAPI.login(credentials)
        return response
      },
      {
        onStart: (state: AuthState) => {
          state.error = null
        },
        onSuccess: (state: AuthState, result) => {
          state.user = result.user
          state.session = result.session
          state.isAuthenticated = true
          state.isSessionValid = true
          
          // Ajouter à l'historique
          state.loginHistory.push({
            timestamp: Date.now(),
            success: true
          })
          
          // Garder seulement les 10 derniers logins
          if (state.loginHistory.length > 10) {
            state.loginHistory = state.loginHistory.slice(-10)
          }
        },
        onError: (state: AuthState, error) => {
          // Ajouter l'échec à l'historique
          state.loginHistory.push({
            timestamp: Date.now(),
            success: false
          })
        }
      }
    )
    
    // Action de refresh token
    const refreshToken = StoreUtils.createAsyncAction(
      async () => {
        const { session } = get()
        if (!session?.refreshToken) {
          throw new Error('Pas de refresh token disponible')
        }
        
        const newSession = await authAPI.refreshToken(session.refreshToken)
        return newSession
      },
      {
        onStart: (state: AuthState) => {
          state.tokenRefreshInProgress = true
        },
        onSuccess: (state: AuthState, result) => {
          state.session = result
          state.isSessionValid = true
          state.tokenRefreshInProgress = false
        },
        onError: (state: AuthState) => {
          // En cas d'erreur de refresh, déconnecter l'utilisateur
          state.user = null
          state.session = null
          state.isAuthenticated = false
          state.isSessionValid = false
          state.tokenRefreshInProgress = false
        }
      }
    )
    
    return {
      ...initialAuthState,
      
      // ===== ACTIONS PRINCIPALES =====
      login: async (credentials: LoginCredentials) => {
        const result = await login(set, get, credentials)
        return !!result
      },
      
      logout: async () => {
        set((state: AuthState) => {
          state.loading = true
        })
        
        try {
          const { session } = get()
          if (session?.token) {
            await authAPI.logout()
          }
        } catch (error) {
          console.warn('Erreur lors de la déconnexion:', error)
        } finally {
          set((state: AuthState) => {
            state.user = null
            state.session = null
            state.isAuthenticated = false
            state.isSessionValid = false
            state.loading = false
            state.error = null
            state.lastUpdate = Date.now()
          })
        }
      },
      
      refreshToken: async () => {
        const result = await refreshToken(set, get)
        return !!result
      },
      
      checkSession: () => {
        const { session } = get()
        if (!session) return false
        
        const isValid = Date.now() < session.expiresAt
        
        set((state: AuthState) => {
          state.isSessionValid = isValid
          if (!isValid) {
            state.isAuthenticated = false
          }
        })
        
        return isValid
      },
      
      // ===== ACTIONS UTILITAIRES =====
      setUser: (user) => set((state: AuthState) => {
        state.user = user
        state.isAuthenticated = !!user
        state.lastUpdate = Date.now()
      }),
      
      setSession: (session) => set((state: AuthState) => {
        state.session = session
        state.isSessionValid = session ? Date.now() < session.expiresAt : false
        state.lastUpdate = Date.now()
      }),
      
      clearAuthData: () => set((state: AuthState) => {
        state.user = null
        state.session = null
        state.isAuthenticated = false
        state.isSessionValid = false
        state.tokenRefreshInProgress = false
        state.error = null
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS DE BASE =====
      setLoading: (loading: boolean) => set(baseActions.setLoading(loading)),
      setError: (error: string | null) => set(baseActions.setError(error)),
      clearError: () => set(baseActions.clearError()),
      reset: () => set((state: AuthState) => {
        Object.assign(state, {
          ...initialAuthState,
          loginHistory: [] // Reset aussi l'historique
        })
      })
      
    } as AuthState
  },
  {
    name: 'auth-store',
    persist: false, // Important: ne pas persister les données d'auth sensibles
    devtools: true,
    immer: true,
    subscriptions: false
  }
)

// ===== SÉLECTEURS HOOKS INDIVIDUELS =====
/**
 * Hook pour récupérer l'utilisateur connecté
 */
export const useAuthUser = () => useAuthStore(state => state.user)

/**
 * Hook pour vérifier si l'utilisateur est connecté
 */
export const useAuthIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)

/**
 * Hook pour l'état de chargement d'authentification
 */
export const useAuthLoading = () => useAuthStore(state => state.loading)

/**
 * Hook pour les erreurs d'authentification
 */
export const useAuthError = () => useAuthStore(state => state.error)

/**
 * Hook pour le nom d'affichage de l'utilisateur
 */
export const useAuthUserDisplayName = () => useAuthStore(state => 
  state.user ? `${state.user.prenom} ${state.user.nom}` : null
)

/**
 * Hook pour le temps restant de session
 */
export const useAuthSessionTimeLeft = () => useAuthStore(state => 
  state.session ? Math.max(0, state.session.expiresAt - Date.now()) : 0
)

/**
 * Hook pour vérifier une permission spécifique
 */
export const useAuthHasPermission = (permission: string) => useAuthStore(state => 
  state.user?.permissions.includes(permission) || false
)

/**
 * Hook pour le statut de session
 */
export const useAuthSessionStatus = () => useAuthStore(state => ({
  isValid: state.isSessionValid,
  isRefreshing: state.tokenRefreshInProgress,
  expiresAt: state.session?.expiresAt || null
}))

// ===== HOOK AUTOMATIQUE DE VÉRIFICATION SESSION =====
export const useSessionCheck = () => {
  const checkSession = useAuthStore(state => state.checkSession)
  const refreshToken = useAuthStore(state => state.refreshToken)
  const isSessionValid = useAuthStore(state => state.isSessionValid)
  const session = useAuthStore(state => state.session)
  
  // Vérifier la session toutes les minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (session && !checkSession()) {
        // Essayer de rafraîchir le token si proche de l'expiration
        const timeLeft = session.expiresAt - Date.now()
        if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) { // Moins de 5 minutes
          refreshToken()
        }
      }
    }, 60000) // Vérifier toutes les minutes
    
    return () => clearInterval(interval)
  }, [session, checkSession, refreshToken])
  
  return { isSessionValid }
}

// ===== TYPES EXPORTÉS =====
export type { AuthState, LoginCredentials, SessionInfo, User }
