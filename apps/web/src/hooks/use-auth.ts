import { authService } from '@/services/auth.service'
import type { AuthTokens, User } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
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
      },

      // ✅ CORRECTION: Ordre des opérations pour logout
      logout: async () => {
        try {
          // 1. D'abord appeler l'API logout AVEC le token valide
          await authService.logout()
        } catch (error) {
          // Si l'API logout échoue, on continue quand même (logout local)
          console.warn('Logout API failed, proceeding with local logout:', error)
        } finally {
          // 2. Puis clear le state local dans tous les cas
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          })
        }
      },

      refreshToken: async () => {
        const { tokens } = get()
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await authService.refreshToken(tokens.refreshToken)
        const newTokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn
        }
        
        set({ tokens: newTokens })
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