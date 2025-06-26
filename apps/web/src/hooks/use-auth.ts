import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth.service'
import type { User, AuthTokens } from '@/types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await authService.login(email, password)
          const tokens = {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresIn: response.expiresIn
          }
          
          set({
            user: response.user,
            tokens,
            isAuthenticated: true,
          })
        } catch (error) {
          throw error
        }
      },

      logout: () => {
        authService.logout().catch(console.error)
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        })
      },

      refreshToken: async () => {
        const { tokens } = get()
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available')
        }

        try {
          const response = await authService.refreshToken(tokens.refreshToken)
          const newTokens = {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresIn: response.expiresIn
          }
          
          set({ tokens: newTokens })
        } catch (error) {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          })
          throw error
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        tokens: state.tokens, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

export const useAuth = () => useAuthStore()
