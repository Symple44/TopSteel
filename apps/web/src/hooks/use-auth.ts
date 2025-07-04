// apps/web/src/hooks/use-auth.ts - Hook d'authentification harmonisé avec tokens
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
  permissions: ['read', 'write', 'admin']
}

const mockTokens: Tokens = {
  accessToken: 'mock-access-token-' + Date.now(),
  refreshToken: 'mock-refresh-token-' + Date.now(),
  expiresIn: 3600,
  tokenType: 'Bearer'
}

// Stockage local sécurisé
const AUTH_STORAGE_KEY = 'topsteel-auth'
const TOKEN_STORAGE_KEY = 'topsteel-tokens'

// Utilitaires de stockage
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
  set: (key: string, value: any) => {
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
  }
}

export const useAuth = () => {
  // État principal
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false
  })

  // Initialisation depuis le stockage local
  useEffect(() => {
    const initializeAuth = async () => {
      try {
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
              isAuthenticated: true
            })
          } else {
            // Tokens invalides, nettoyer le stockage
            await logout()
          }
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }))
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }))
      }
    }

    initializeAuth()
  }, [])

  // Validation des tokens
  const validateTokens = async (tokens: Tokens): Promise<boolean> => {
    // En mode développement, toujours valide
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    try {
      // TODO: Implémenter la validation côté serveur
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `${tokens.tokenType} ${tokens.accessToken}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Connexion
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      // Simulation pour le développement
      if (process.env.NODE_ENV === 'development') {
        // Simuler délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const user = { ...mockUser, email }
        const tokens = mockTokens

        // Stocker dans localStorage
        storage.set(AUTH_STORAGE_KEY, user)
        storage.set(TOKEN_STORAGE_KEY, tokens)

        setAuthState({
          user,
          tokens,
          isLoading: false,
          isAuthenticated: true
        })
        return
      }

      // Production: appel API réel
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const { user, accessToken, refreshToken, expiresIn } = await response.json()
      const tokens: Tokens = { accessToken, refreshToken, expiresIn, tokenType: 'Bearer' }

      // Stocker dans localStorage
      storage.set(AUTH_STORAGE_KEY, user)
      storage.set(TOKEN_STORAGE_KEY, tokens)

      setAuthState({
        user,
        tokens,
        isLoading: false,
        isAuthenticated: true
      })
    } catch (error) {
      console.error('Login error:', error)
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }))
      throw error
    }
  }, [])

  // Déconnexion
  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      // Appel API pour invalider les tokens côté serveur
      if (authState.tokens?.accessToken && process.env.NODE_ENV === 'production') {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `${authState.tokens.tokenType} ${authState.tokens.accessToken}`
          }
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
        isAuthenticated: false
      })
    }
  }, [authState.tokens])

  // Mise à jour utilisateur
  const setUser = useCallback((user: User | null) => {
    if (user) {
      storage.set(AUTH_STORAGE_KEY, user)
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: true
      }))
    } else {
      storage.remove(AUTH_STORAGE_KEY)
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false
      }))
    }
  }, [])

  // Rafraîchir les tokens
  const refreshTokens = useCallback(async (): Promise<void> => {
    if (!authState.tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: authState.tokens.refreshToken
        })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const { accessToken, refreshToken, expiresIn } = await response.json()
      const newTokens: Tokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer'
      }

      storage.set(TOKEN_STORAGE_KEY, newTokens)

      setAuthState(prev => ({
        ...prev,
        tokens: newTokens
      }))
    } catch (error) {
      console.error('Token refresh error:', error)
      await logout()
      throw error
    }
  }, [authState.tokens, logout])

  // Mise à jour des tokens
  const setTokens = useCallback((tokens: Tokens | null) => {
    if (tokens) {
      storage.set(TOKEN_STORAGE_KEY, tokens)
      setAuthState(prev => ({
        ...prev,
        tokens
      }))
    } else {
      storage.remove(TOKEN_STORAGE_KEY)
      setAuthState(prev => ({
        ...prev,
        tokens: null
      }))
    }
  }, [])

  // Vérifier les permissions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!authState.user?.permissions) return false
    return authState.user.permissions.includes(permission) || authState.user.role === 'admin'
  }, [authState.user])

  // Vérifier le rôle
  const hasRole = useCallback((role: string): boolean => {
    return authState.user?.role === role
  }, [authState.user])

  return {
    // État
    user: authState.user,
    tokens: authState.tokens,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    
    // Actions
    login,
    logout,
    setUser,
    setTokens,
    refreshTokens,
    
    // Utilitaires
    hasPermission,
    hasRole,
  }
}

// Hook pour obtenir l'utilisateur actuel
export const useCurrentUser = () => {
  const { user } = useAuth()
  return user
}

// Hook pour vérifier l'authentification
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

// Hook pour les permissions
export const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuth()
  
  return {
    hasPermission,
    hasRole,
    permissions: user?.permissions || [],
    role: user?.role
  }
}

// Hook pour les tokens
export const useTokens = () => {
  const { tokens, refreshTokens, setTokens } = useAuth()
  
  return {
    tokens,
    refreshTokens,
    setTokens,
    isExpired: tokens ? Date.now() > (tokens.expiresIn || 0) * 1000 : true
  }
}