// apps/web/src/stores/auth.store.ts 
import { createStoreWithPersist } from '@/lib/store-utils'
import { authService } from '@/services/auth.service'
import type { User } from '@erp/types'
import { create } from 'zustand'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  clearAuth: () => void
  clearError: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  createStoreWithPersist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login(email, password)
          
          set({
            user: response.user,
            tokens: {
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            },
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur de connexion',
            isLoading: false 
          })
          throw error
        }
      },

      logout: async () => {
        const { tokens } = get()
        try {
          if (tokens?.refreshToken) {
            await authService.logout(tokens.refreshToken)
          }
        } catch (error) {
          // ⚠️ On continue même si logout API échoue
          console.warn('Erreur logout API (ignorée):', error)
        } finally {
          get().clearAuth()
        }
      },

      refreshToken: async () => {
        const { tokens } = get()
        if (!tokens?.refreshToken) {
          get().clearAuth()
          return
        }
        
        try {
          const response = await authService.refreshToken(tokens.refreshToken)
          
          set((state) => ({
            ...state,
            tokens: {
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            }
          }))
        } catch (error) {
          console.error('Erreur refresh token:', error)
          get().clearAuth()
        }
      },

      checkAuth: async () => {
        const { tokens } = get()
        if (!tokens?.accessToken) {
          get().clearAuth()
          return
        }

        try {
          const user = await authService.getMe()
          
          set({
            user,
            isAuthenticated: true,
          })
        } catch (error) {
          console.error('Erreur checkAuth:', error)
          get().clearAuth()
        }
      },

      updateUser: (userData) => {
        set((state) => {
          if (state.user) {
            return {
              ...state,
              user: { ...state.user, ...userData }
            }
          }
          return state
        })
      },

      clearAuth: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      clearError: () => set({ error: null }),
    }),
    'auth',
    ['tokens']
  )
)