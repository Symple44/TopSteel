import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role?: string
  permissions?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginAttempt {
  timestamp: number
  success: boolean
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
  lastUpdate: number
  error: string | null
}

interface AuthActions {
  setUser: (user: User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  setLoading: (loading: boolean) => void
  setToken: (token: string | null) => void
  setError: (error: string | null) => void
  reset: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      lastUpdate: Date.now(),
      error: null,

      // Actions
      setUser: (user) => set({ user, lastUpdate: Date.now() }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated, lastUpdate: Date.now() }),
      setLoading: (isLoading) => set({ isLoading }),
      setToken: (token) => set({ token, lastUpdate: Date.now() }),
      setError: (error) => set({ error }),
      reset: () =>
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          isLoading: false,
          error: null,
          lastUpdate: Date.now(),
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          isLoading: false,
          error: null,
          lastUpdate: Date.now(),
        }),
    }),
    {
      name: 'topsteel-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
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
    return user ? `${user.prenom} ${user.nom}` : ''
  })
}
