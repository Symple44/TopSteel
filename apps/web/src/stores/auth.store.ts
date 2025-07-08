/**
 * 🔐 STORE AUTHENTIFICATION - TopSteel ERP
 * Gestion robuste de l'authentification et des sessions utilisateur
 * Version corrigée avec import correct depuis @erp/types
 * Fichier: apps/web/src/stores/auth.store.ts
 */

import type { BaseStoreActions, BaseStoreState, InitialState, StoreCreator } from '@erp/types' // ✅ IMPORT CORRECT depuis @erp/types au lieu de @/lib/store-utils
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ===== INTERFACES LOCALES =====

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  permissions: string[]
  avatar?: string
  lastLogin?: number
  preferences?: {
    theme?: 'light' | 'dark' | 'auto'
    language?: string
    notifications?: boolean
  }
}

export interface SessionInfo {
  token: string
  refreshToken: string
  expiresAt: number
  issuedAt: number
  ipAddress?: string
  userAgent?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginAttempt {
  timestamp: number
  email: string
  ip?: string
  userAgent?: string
  success: boolean
  failureReason?: string
}

// ===== ÉTAT DU STORE =====

export interface AuthState extends BaseStoreState {
  // État utilisateur et session
  user: User | null
  session: SessionInfo | null
  isAuthenticated: boolean

  // Validation de session
  isSessionValid: boolean
  tokenRefreshInProgress: boolean
  sessionTimeLeft: number

  // Sécurité et monitoring
  loginHistory: LoginAttempt[]
  failedAttempts: number
  isLocked: boolean
  lockoutEndTime: number | null

  // État UI
  showWelcome: boolean
  lastActivity: number
}

// ===== ACTIONS DU STORE =====

export interface AuthActions extends BaseStoreActions {
  // Actions principales
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>

  // Gestion de session
  checkSession: () => boolean
  extendSession: () => void

  // Gestion utilisateur
  setUser: (user: User | null) => void

  // Actions de sécurité
  recordLoginAttempt: (attempt: Omit<LoginAttempt, 'timestamp'>) => void
  clearFailedAttempts: () => void

  // Utilitaires
  clearAuthData: () => void
  updateActivity: () => void
  dismissWelcome: () => void
}

export type AuthStore = AuthState & AuthActions

// ===== CONFIGURATION =====
const AUTH_CONFIG = {
  sessionTimeout: 8 * 60 * 60 * 1000, // 8 heures
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
} as const

// ===== ÉTAT INITIAL =====
const initialAuthState: InitialState<AuthState> = {
  // État de base (BaseStoreState)
  loading: false,
  error: null,
  lastUpdate: 0,

  // Utilisateur et session
  user: null,
  session: null,
  isAuthenticated: false,
  isSessionValid: false,
  tokenRefreshInProgress: false,
  sessionTimeLeft: 0,

  // Sécurité
  loginHistory: [],
  failedAttempts: 0,
  isLocked: false,
  lockoutEndTime: null,

  // État UI
  showWelcome: false,
  lastActivity: Date.now(),
}

// ===== SERVICE D'AUTHENTIFICATION SIMULÉ =====
class AuthService {
  private static readonly MOCK_USERS = [
    {
      email: 'admin@topsteel.fr',
      password: 'admin123',
      user: {
        id: 'usr_001',
        nom: 'Admin',
        prenom: 'System',
        email: 'admin@topsteel.fr',
        role: 'admin' as const,
        permissions: ['*'],
        preferences: { theme: 'dark' as const, notifications: true },
      },
    },
    {
      email: 'manager@topsteel.fr',
      password: 'manager123',
      user: {
        id: 'usr_002',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'manager@topsteel.fr',
        role: 'manager' as const,
        permissions: ['projets:read', 'projets:write', 'stocks:read'],
        preferences: { theme: 'light' as const, notifications: true },
      },
    },
  ]

  static async login(credentials: LoginCredentials): Promise<{ user: User; session: SessionInfo }> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const mockUser = AuthService.MOCK_USERS.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    )

    if (!mockUser) {
      throw new Error('Identifiants invalides')
    }

    const session: SessionInfo = {
      token: `jwt_${Date.now()}_${Math.random().toString(36)}`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36)}`,
      expiresAt:
        Date.now() +
        (credentials.rememberMe ? 30 * 24 * 60 * 60 * 1000 : AUTH_CONFIG.sessionTimeout),
      issuedAt: Date.now(),
      ipAddress: '127.0.0.1',
      userAgent: navigator?.userAgent,
    }

    return {
      user: { ...mockUser.user, lastLogin: Date.now() },
      session,
    }
  }

  static async refreshToken(refreshToken: string): Promise<SessionInfo> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!refreshToken.startsWith('refresh_')) {
      throw new Error('Refresh token invalide')
    }

    return {
      token: `jwt_${Date.now()}_${Math.random().toString(36)}`,
      refreshToken,
      expiresAt: Date.now() + AUTH_CONFIG.sessionTimeout,
      issuedAt: Date.now(),
    }
  }

  static async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}

// ===== UTILITAIRES =====
class AuthUtils {
  static isSessionExpired(session: SessionInfo | null): boolean {
    if (!session) return true

    return Date.now() >= session.expiresAt
  }

  static shouldRefreshToken(session: SessionInfo | null): boolean {
    if (!session) return false
    const timeLeft = session.expiresAt - Date.now()

    return timeLeft <= AUTH_CONFIG.tokenRefreshThreshold && timeLeft > 0
  }

  static calculateSessionTimeLeft(session: SessionInfo | null): number {
    if (!session) return 0

    return Math.max(0, session.expiresAt - Date.now())
  }

  static isAccountLocked(state: Pick<AuthState, 'isLocked' | 'lockoutEndTime'>): boolean {
    if (!state.isLocked || !state.lockoutEndTime) return false

    return Date.now() < state.lockoutEndTime
  }
}

// ===== ACTIONS ASYNC =====
const createAuthActions: StoreCreator<AuthState, AuthActions> = (set, get) => ({
  login: async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Phase de démarrage
      set((state) => {
        state.loading = true
        state.error = null
      })

      const state = get()

      if (AuthUtils.isAccountLocked(state)) {
        const timeLeft = Math.ceil((state.lockoutEndTime! - Date.now()) / 1000 / 60)

        throw new Error(`Compte verrouillé. Réessayez dans ${timeLeft} minutes.`)
      }

      try {
        const { user, session } = await AuthService.login(credentials)

        set((state) => {
          state.user = user
          state.session = session
          state.isAuthenticated = true
          state.isSessionValid = true
          state.sessionTimeLeft = AuthUtils.calculateSessionTimeLeft(session)
          state.showWelcome = true
          state.failedAttempts = 0
          state.isLocked = false
          state.lockoutEndTime = null
          state.lastActivity = Date.now()
          state.loading = false
        })

        get().recordLoginAttempt({
          email: credentials.email,
          success: true,
        })

        return true
      } catch (error) {
        get().recordLoginAttempt({
          email: credentials.email,
          success: false,
          failureReason: error instanceof Error ? error.message : 'Erreur inconnue',
        })

        set((state) => {
          state.failedAttempts += 1

          if (state.failedAttempts >= AUTH_CONFIG.maxFailedAttempts) {
            state.isLocked = true
            state.lockoutEndTime = Date.now() + AUTH_CONFIG.lockoutDuration
          }
        })

        throw error
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      set((state) => {
        state.loading = false
        state.error = errorObj.message
        state.lastUpdate = Date.now()
      })

      return false
    }
  },

  logout: async (): Promise<void> => {
    try {
      set((state) => {
        state.loading = true
        state.error = null
      })

      const state = get()

      if (state.session) {
        await AuthService.logout()
      }

      set((state) => {
        Object.assign(state, {
          ...initialAuthState,
          lastUpdate: Date.now(),
          loading: false,
        })
      })
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      set((state) => {
        state.loading = false
        state.error = errorObj.message
      })
    }
  },

  refreshToken: async (): Promise<boolean> => {
    try {
      set((state) => {
        state.tokenRefreshInProgress = true
        state.error = null
      })

      const state = get()

      if (!state.session?.refreshToken) {
        throw new Error('Aucun refresh token disponible')
      }

      const newSession = await AuthService.refreshToken(state.session.refreshToken)

      set((state) => {
        state.session = newSession
        state.sessionTimeLeft = AuthUtils.calculateSessionTimeLeft(newSession)
        state.lastActivity = Date.now()
        state.tokenRefreshInProgress = false
      })

      return true
    } catch (error) {
      set((state) => {
        state.tokenRefreshInProgress = false
        state.user = null
        state.session = null
        state.isAuthenticated = false
        state.isSessionValid = false
        state.error = error instanceof Error ? error.message : String(error)
      })

      return false
    }
  },

  checkSession: () => {
    const state = get()
    const isValid = !AuthUtils.isSessionExpired(state.session) && !!state.user

    set((state) => {
      state.isSessionValid = isValid
      state.isAuthenticated = isValid
      state.sessionTimeLeft = AuthUtils.calculateSessionTimeLeft(state.session)

      if (!isValid) {
        state.user = null
        state.session = null
      }
      state.lastUpdate = Date.now()
    })

    return isValid
  },

  extendSession: () => {
    set((state) => {
      if (state.session) {
        state.session.expiresAt = Date.now() + AUTH_CONFIG.sessionTimeout
        state.sessionTimeLeft = AuthUtils.calculateSessionTimeLeft(state.session)
      }
      state.lastActivity = Date.now()
      state.lastUpdate = Date.now()
    })
  },

  setUser: (user) => {
    set((state) => {
      state.user = user
      state.isAuthenticated = !!user
      state.lastUpdate = Date.now()
    })
  },

  recordLoginAttempt: (attempt) => {
    set((state) => {
      const loginAttempt: LoginAttempt = {
        ...attempt,
        timestamp: Date.now(),
      }

      state.loginHistory.unshift(loginAttempt)

      if (state.loginHistory.length > 50) {
        state.loginHistory = state.loginHistory.slice(0, 50)
      }
      state.lastUpdate = Date.now()
    })
  },

  clearFailedAttempts: () => {
    set((state) => {
      state.failedAttempts = 0
      state.isLocked = false
      state.lockoutEndTime = null
      state.lastUpdate = Date.now()
    })
  },

  clearAuthData: () => {
    set((state) => {
      Object.assign(state, {
        ...initialAuthState,
        lastUpdate: Date.now(),
      })
    })
  },

  updateActivity: () => {
    set((state) => {
      state.lastActivity = Date.now()
      state.lastUpdate = Date.now()
    })
  },

  dismissWelcome: () => {
    set((state) => {
      state.showWelcome = false
      state.lastUpdate = Date.now()
    })
  },

  // Actions de base (BaseStoreActions)
  setLoading: (loading: boolean) => {
    set((state) => {
      state.loading = loading
      state.lastUpdate = Date.now()
    })
  },

  setError: (error: string | null) => {
    set((state) => {
      state.error = error
      state.loading = false
      state.lastUpdate = Date.now()
    })
  },

  clearError: () => {
    set((state) => {
      state.error = null
      state.lastUpdate = Date.now()
    })
  },

  reset: () => {
    set((state) => {
      Object.assign(state, {
        ...initialAuthState,
        loading: false,
        error: null,
        lastUpdate: Date.now(),
      })
    })
  },
})

// ===== CRÉATION DU STORE =====
export const useAuthStore = create<AuthStore>()(
  immer(
    devtools(
      (set, get) => ({
        ...initialAuthState,
        ...createAuthActions(set, get),
      }),
      { name: 'auth-store' }
    )
  )
)

// ===== HOOKS SÉLECTEURS =====
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAuthIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore((state) => state.loading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useAuthUserDisplayName = () =>
  useAuthStore((state) => (state.user ? `${state.user.prenom} ${state.user.nom}` : null))
export const useAuthSessionTimeLeft = () => useAuthStore((state) => state.sessionTimeLeft)
export const useAuthPermissions = () => useAuthStore((state) => state.user?.permissions || [])
export const useAuthRole = () => useAuthStore((state) => state.user?.role)
export const useAuthCanAccess = (permission: string) =>
  useAuthStore((state) => {
    if (!state.user) return false

    return state.user.permissions.includes('*') || state.user.permissions.includes(permission)
  })

// ===== SESSION AUTO-REFRESH =====
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useAuthStore.getState()

    if (state.isAuthenticated) {
      state.checkSession()

      if (AuthUtils.shouldRefreshToken(state.session) && !state.tokenRefreshInProgress) {
        state.refreshToken().catch((error) => {
          console.error('Erreur lors du refresh automatique:', error)
        })
      }
    }
  }, 60000) // Toutes les minutes

  // Écouter l'activité utilisateur avec throttle manuel

  let lastActivityUpdate = 0
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

  const handleActivity = () => {
    const now = Date.now()

    if (now - lastActivityUpdate >= 30000) {
      // Max 1 fois par 30 secondes
      lastActivityUpdate = now
      const state = useAuthStore.getState()

      if (state.isAuthenticated) {
        state.updateActivity()
      }
    }
  }

  activityEvents.forEach((event) => {
    document.addEventListener(event, handleActivity, true)
  })
}
