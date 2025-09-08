import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role?: string
  permissions?: string[]
  societeId?: string
  societeName?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginAttempt {
  timestamp: number
  success: boolean
  email: string
  user?: User
}

export interface SessionInfo {
  user: User
  expiresAt: number
  lastActivity: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  refreshToken: string | null
  lastUpdate: number
  lastActivity: number
  sessionExpiry: number | null
  error: string | null
  permissions: string[]
  loginAttempts: LoginAttempt[]
}

interface AuthActions {
  setUser: (user: User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  setLoading: (loading: boolean) => void
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setError: (error: string | null) => void
  setAuth: (auth: { user: User; token: string; refreshToken?: string }) => void
  setPermissions: (permissions: string[]) => void
  updateActivity: () => void
  clearError: () => void
  isSessionValid: () => boolean
  reset: () => void
  logout: () => Promise<void>
  login: (credentials: LoginCredentials) => Promise<void>
  refreshTokens: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      refreshToken: null,
      permissions: [],
      lastUpdate: Date.now(),
      lastActivity: Date.now(),
      sessionExpiry: null,
      error: null,
      loginAttempts: [],

      // Actions
      setUser: (user) =>
        set((_state) => ({
          user,
          permissions: user?.permissions ?? [],
          lastUpdate: Date.now(),
        })),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated, lastUpdate: Date.now() }),
      setLoading: (isLoading) => set({ isLoading }),
      setToken: (token) => set({ token, lastUpdate: Date.now() }),
      setRefreshToken: (refreshToken) => set({ refreshToken, lastUpdate: Date.now() }),
      setPermissions: (permissions) => set({ permissions, lastUpdate: Date.now() }),
      setAuth: (auth) =>
        set({
          user: auth.user,
          token: auth.token,
          refreshToken: auth.refreshToken ?? null,
          permissions: auth.user.permissions ?? [],
          isAuthenticated: true,
          lastUpdate: Date.now(),
        }),
      setError: (error) => set({ error }),
      updateActivity: () => set({ lastActivity: Date.now() }),
      clearError: () => set({ error: null }),
      isSessionValid: () => {
        const state = get()
        const now = Date.now()
        if (state.sessionExpiry && now > state.sessionExpiry) {
          return false
        }
        return state.isAuthenticated && !!state.token
      },
      reset: () =>
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          permissions: [],
          isLoading: false,
          lastActivity: Date.now(),
          sessionExpiry: null,
          error: null,
          lastUpdate: Date.now(),
          loginAttempts: [],
        }),
      logout: async () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          localStorage.removeItem('refresh-token')
        }

        set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          permissions: [],
          isLoading: false,
          lastActivity: Date.now(),
          sessionExpiry: null,
          error: null,
          lastUpdate: Date.now(),
        })
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })

          const attempt: LoginAttempt = {
            timestamp: Date.now(),
            email: credentials.email,
            success: false,
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.message || 'Login failed'

            set((state) => ({
              error: errorMessage,
              isLoading: false,
              loginAttempts: [...state.loginAttempts, attempt],
            }))
            return
          }

          const data = await response.json()

          // Store tokens in localStorage if rememberMe is true
          if (credentials.rememberMe && typeof window !== 'undefined') {
            localStorage.setItem('auth-token', data.token)
            if (data.refreshToken) {
              localStorage.setItem('refresh-token', data.refreshToken)
            }
          }

          const sessionExpiry = data.expiresIn ? Date.now() + data.expiresIn * 1000 : null

          attempt.success = true
          attempt.user = data.user

          set((state) => ({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken || null,
            permissions: data.user.permissions || [],
            isAuthenticated: true,
            isLoading: false,
            sessionExpiry,
            error: null,
            lastUpdate: Date.now(),
            lastActivity: Date.now(),
            loginAttempts: [...state.loginAttempts, attempt],
          }))
        } catch (error: unknown) {
          const attempt: LoginAttempt = {
            timestamp: Date.now(),
            email: credentials.email,
            success: false,
          }

          set((state) => ({
            error: error.message || 'Network error',
            isLoading: false,
            loginAttempts: [...state.loginAttempts, attempt],
          }))
        }
      },

      refreshTokens: async () => {
        const state = get()
        if (!state.refreshToken) {
          await get().logout()
          return
        }

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: state.refreshToken }),
          })

          if (!response.ok) {
            await get().logout()
            return
          }

          const data = await response.json()

          // Update tokens in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', data.token)
            if (data.refreshToken) {
              localStorage.setItem('refresh-token', data.refreshToken)
            }
          }

          const sessionExpiry = data.expiresIn ? Date.now() + data.expiresIn * 1000 : null

          set({
            token: data.token,
            refreshToken: data.refreshToken || state.refreshToken,
            sessionExpiry,
            lastUpdate: Date.now(),
          })
        } catch (_error) {
          await get().logout()
        }
      },

      hasPermission: (permission: string) => {
        const state = get()
        return state.permissions.includes(permission)
      },

      hasAnyPermission: (permissions: string[]) => {
        const state = get()
        return permissions.some((permission) => state.permissions.includes(permission))
      },

      hasAllPermissions: (permissions: string[]) => {
        const state = get()
        return permissions.every((permission) => state.permissions.includes(permission))
      },
    }),
    {
      name: 'topsteel-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
        permissions: state.permissions,
        lastActivity: state.lastActivity,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
)

// Derived selectors for the missing exports
export const useAuthCanAccess = (permission?: string) => {
  return useAuthStore((state) => {
    if (!state.user || !permission) return false
    return state.user.permissions?.includes(permission) ?? false
  })
}

export const useAuthError = () => useAuthStore((state) => state.error)
export const useAuthIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthPermissions = () => useAuthStore((state) => state.user?.permissions ?? [])
export const useAuthRole = () => useAuthStore((state) => state.user?.role)
export const useAuthSessionTimeLeft = () => {
  return useAuthStore((state) => {
    // Mock implementation - in real app this would calculate based on token expiry
    return state.isAuthenticated ? 3600000 : 0 // 1 hour in ms
  })
}
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAuthUserDisplayName = () => {
  return useAuthStore((state) => {
    const user = state.user
    return user ? `${user?.prenom} ${user?.nom}` : ''
  })
}
