// apps/web/src/stores/auth.store.ts
import { create } from 'zustand'
import { createStoreWithPersist } from '@/lib/store-utils'
import type { User } from '@erp/types'

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
          // TODO: Implémenter authService.login
          const mockResponse = {
            user: { id: '1', email, nom: 'Test User' } as User,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          }
          
          set({
            user: mockResponse.user,
            tokens: {
              accessToken: mockResponse.accessToken,
              refreshToken: mockResponse.refreshToken,
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
        try {
          // TODO: Implémenter authService.logout
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
        // TODO: Implémenter authService.refreshToken
      },

      checkAuth: async () => {
        // TODO: Implémenter authService.getMe
      },

      updateUser: (userData) => {
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...userData }
          }
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