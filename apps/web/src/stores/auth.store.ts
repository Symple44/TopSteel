// apps/web/src/stores/auth.store.ts - SANS PERSIST (FIX HYDRATATION)
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface User {
  id: string
  nom: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Simulation login
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const mockUser: User = {
            id: '1',
            nom: 'Utilisateur Test',
            email: email,
            role: 'admin'
          }
          
          set({ 
            user: mockUser,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      setUser: (user) => {
        set({ 
          user,
          isAuthenticated: !!user
        })
      },
    }),
    { name: 'auth-store' }
  )
)
