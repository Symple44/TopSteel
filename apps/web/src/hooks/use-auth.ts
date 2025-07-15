import { useCallback, useEffect, useState } from 'react'

// Types harmonisés
interface User {
  id: string
  nom: string
  email: string
  role: string
  prenom?: string
  avatar?: string
  permissions?: string[]
}

interface Tokens {
  accessToken: string
  refreshToken: string
  expiresIn?: number
  tokenType?: string
}

interface AuthState {
  user: User | null
  tokens: Tokens | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Données mock pour le développement
const mockUser: User = {
  id: '1',
  nom: 'Dubois',
  prenom: 'Jean',
  email: 'jean.dubois@topsteel.com',
  role: 'admin',
  avatar: '/images/avatars/default.png',
  permissions: ['read', 'write', 'admin'],
}

const mockTokens: Tokens = {
  accessToken: `mock-access-token-${Date.now()}`,
  refreshToken: `mock-refresh-token-${Date.now()}`,
  expiresIn: 3600,
  tokenType: 'Bearer',
}

// Stockage local sécurisé
const AUTH_STORAGE_KEY = 'topsteel-auth'
const TOKEN_STORAGE_KEY = 'topsteel-tokens'

// Utilitaires de stockage avec gestion d'erreur
const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(key)

      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: unknown) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  },
}

export const useAuth = () => {
  // État principal
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // ✅ Validation des tokens - fonction stable avec useCallback
  const validateTokens = useCallback(async (tokens: Tokens): Promise<boolean> => {
    // En mode développement, toujours valide
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${tokens.tokenType || 'Bearer'} ${tokens.accessToken}`,
        },
      })

      return response.ok
    } catch (error) {
      console.warn('Token validation failed:', error)

      return false
    }
  }, [])

  // ✅ Fonction de login - stable avec useCallback
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      // En développement, utiliser les données mock
      if (process.env.NODE_ENV === 'development') {
        await new Promise((resolve) => setTimeout(resolve, 500)) // Simulation

        const userData = { ...mockUser, email }
        const tokenData = mockTokens

        storage.set(AUTH_STORAGE_KEY, userData)
        storage.set(TOKEN_STORAGE_KEY, tokenData)

        setAuthState({
          user: userData,
          tokens: tokenData,
          isLoading: false,
          isAuthenticated: true,
        })

        return
      }

      // Production - appel API réel
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`)
      }

      const { user, accessToken, refreshToken, expiresIn } = await response.json()
      const tokens: Tokens = { accessToken, refreshToken, expiresIn, tokenType: 'Bearer' }

      storage.set(AUTH_STORAGE_KEY, user)
      storage.set(TOKEN_STORAGE_KEY, tokens)

      setAuthState({
        user,
        tokens,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  // ✅ Fonction de logout - stable avec useCallback
  const logout = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      // Appel API pour invalider les tokens côté serveur
      if (authState.tokens?.accessToken && process.env.NODE_ENV === 'production') {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `${authState.tokens.tokenType} ${authState.tokens.accessToken}`,
          },
        })
      }
    } catch (error) {
      console.warn('Logout API error:', error)
    } finally {
      // Nettoyer le stockage local
      storage.remove(AUTH_STORAGE_KEY)
      storage.remove(TOKEN_STORAGE_KEY)

      setAuthState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [authState.tokens])

  // ✅ Mise à jour utilisateur - stable avec useCallback
  const setUser = useCallback((user: User | null) => {
    if (user) {
      storage.set(AUTH_STORAGE_KEY, user)
      setAuthState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
      }))
    } else {
      storage.remove(AUTH_STORAGE_KEY)
      setAuthState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
      }))
    }
  }, [])

  // ✅ Rafraîchir les tokens - stable avec useCallback
  const refreshTokens = useCallback(async (): Promise<void> => {
    if (!authState.tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: authState.tokens.refreshToken,
        }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const { accessToken, refreshToken, expiresIn } = await response.json()
      const newTokens: Tokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      }

      storage.set(TOKEN_STORAGE_KEY, newTokens)

      setAuthState((prev) => ({
        ...prev,
        tokens: newTokens,
      }))
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
      throw error
    }
  }, [authState.tokens, logout])

  // ✅ Initialisation depuis le stockage local - TOUTES LES DÉPENDANCES INCLUSES
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Vérifier si la session a été nettoyée au démarrage
        const sessionInitialized = typeof window !== 'undefined' && 
                                  sessionStorage.getItem('topsteel-session-initialized')
        
        if (sessionInitialized) {
          // Si la session est initialisée, ne pas charger depuis localStorage
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tokens: null,
          }))
          return
        }
        
        const storedUser = storage.get(AUTH_STORAGE_KEY)
        const storedTokens = storage.get(TOKEN_STORAGE_KEY)

        if (storedUser && storedTokens) {
          // Vérifier la validité des tokens
          const isTokenValid = await validateTokens(storedTokens)

          if (isTokenValid) {
            setAuthState({
              user: storedUser,
              tokens: storedTokens,
              isLoading: false,
              isAuthenticated: true,
            })
          } else {
            // Tokens invalides, nettoyer le stockage
            await logout()
          }
        } else {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tokens: null,
          }))
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          user: null,
          tokens: null,
        }))
      }
    }

    initializeAuth()
  }, [validateTokens, logout]) // ✅ TOUTES LES DÉPENDANCES INCLUSES

  // ✅ Auto-refresh des tokens
  useEffect(() => {
    if (!authState.tokens?.accessToken || !authState.isAuthenticated) {
      return
    }

    const refreshInterval = setInterval(
      async () => {
        try {
          await refreshTokens()
        } catch (error) {
          console.error('Auto refresh failed:', error)
          clearInterval(refreshInterval)
        }
      },
      50 * 60 * 1000
    ) // 50 minutes

    return () => clearInterval(refreshInterval)
  }, [authState.tokens?.accessToken, authState.isAuthenticated, refreshTokens])

  return {
    user: authState.user,
    tokens: authState.tokens,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    setUser,
    refreshTokens,
    validateTokens,
  }
}

// ✅ EXPORTS SUPPLÉMENTAIRES POUR COMPATIBILITÉ
export const useCurrentUser = () => {
  const { user } = useAuth()

  return user
}

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()

  return isAuthenticated
}
