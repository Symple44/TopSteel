import { useCallback, useEffect, useState } from 'react'

// Types harmonisés
interface UserProfile {
  acronyme?: string
  prenom?: string
  nom?: string
  telephone?: string
  poste?: string
  departement?: string
  adresse?: string
  ville?: string
  codePostal?: string
  pays?: string
}

interface User {
  id: string
  nom: string
  email: string
  role: string
  prenom?: string
  avatar?: string
  permissions?: string[]
  profile?: UserProfile
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

// Utilitaires de gestion des cookies
const cookieUtils = {
  set: (name: string, value: string, days?: number) => {
    if (typeof document === 'undefined') return
    try {
      let expires = ''
      if (days) {
        const date = new Date()
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
        expires = '; expires=' + date.toUTCString()
      }
      document.cookie = `${name}=${value}${expires}; path=/; secure; samesite=lax`
    } catch (error) {
      console.warn('Failed to set cookie:', error)
    }
  },
  get: (name: string) => {
    if (typeof document === 'undefined') return null
    try {
      const nameEQ = name + '='
      const ca = document.cookie.split(';')
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
      }
      return null
    } catch {
      return null
    }
  },
  remove: (name: string) => {
    if (typeof document === 'undefined') return
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    } catch (error) {
      console.warn('Failed to remove cookie:', error)
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
    try {
      // Vérifier d'abord si le token n'est pas expiré localement
      if (tokens.expiresIn) {
        const tokenAge = Date.now() - (tokens.expiresIn * 1000)
        if (tokenAge > 0) {
          console.warn('Token expired locally')
          return false
        }
      }

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
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
  const login = useCallback(async (identifier: string, password: string, rememberMe: boolean = false): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      // Appel API réel
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Email ou mot de passe incorrect')
      }

      const responseData = await response.json()
      console.log('🔐 API Response:', responseData)
      
      const { user, accessToken, refreshToken, expiresIn } = responseData.data
      const tokens: Tokens = { accessToken, refreshToken, expiresIn, tokenType: 'Bearer' }

      // Stocker dans localStorage et cookies
      storage.set(AUTH_STORAGE_KEY, user)
      storage.set(TOKEN_STORAGE_KEY, tokens)
      
      // Stocker le token dans les cookies pour les API routes
      const expirationDays = rememberMe ? 30 : 1 // 30 jours si "Se souvenir", sinon 1 jour
      cookieUtils.set('accessToken', accessToken, expirationDays)
      cookieUtils.set('refreshToken', refreshToken, expirationDays)

      setAuthState({
        user,
        tokens,
        isLoading: false,
        isAuthenticated: true,
      })
      
      console.log('🔐 Auth state updated:', { user, isAuthenticated: true })
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
      const currentTokens = authState.tokens
      if (currentTokens?.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `${currentTokens.tokenType || 'Bearer'} ${currentTokens.accessToken}`,
          },
        })
      }
    } catch (error) {
      console.warn('Logout API error:', error)
    } finally {
      // Nettoyer le stockage local et les cookies
      storage.remove(AUTH_STORAGE_KEY)
      storage.remove(TOKEN_STORAGE_KEY)
      cookieUtils.remove('accessToken')
      cookieUtils.remove('refreshToken')

      setAuthState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [])

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
    const currentTokens = authState.tokens
    if (!currentTokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      // Appel API réel
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: currentTokens.refreshToken,
        }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const responseData = await response.json()
      const { accessToken, refreshToken, expiresIn } = responseData.data
      const newTokens: Tokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      }

      // Mettre à jour localStorage et cookies
      storage.set(TOKEN_STORAGE_KEY, newTokens)
      cookieUtils.set('accessToken', accessToken, 1) // 1 jour par défaut
      cookieUtils.set('refreshToken', refreshToken, 1)

      setAuthState((prev) => ({
        ...prev,
        tokens: newTokens,
      }))
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Nettoyer le stockage local et cookies
      storage.remove(AUTH_STORAGE_KEY)
      storage.remove(TOKEN_STORAGE_KEY)
      cookieUtils.remove('accessToken')
      cookieUtils.remove('refreshToken')
      setAuthState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
      })
      throw error
    }
  }, [])

  // ✅ Initialisation depuis le stockage local - EXÉCUTION UNIQUE
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = storage.get(AUTH_STORAGE_KEY)
        const storedTokens = storage.get(TOKEN_STORAGE_KEY)
        
        // Vérifier aussi les cookies
        const cookieToken = cookieUtils.get('accessToken')
        const cookieRefreshToken = cookieUtils.get('refreshToken')

        if (storedUser && storedTokens) {
          console.log('🔐 Found stored auth data, restoring session...')
          
          // S'assurer que les cookies sont synchronisés
          if (cookieToken !== storedTokens.accessToken) {
            console.log('🔐 Synchronizing cookies with localStorage...')
            cookieUtils.set('accessToken', storedTokens.accessToken, 1)
            if (storedTokens.refreshToken) {
              cookieUtils.set('refreshToken', storedTokens.refreshToken, 1)
            }
          }
          
          setAuthState({
            user: storedUser,
            tokens: storedTokens,
            isLoading: false,
            isAuthenticated: true,
          })
        } else if (cookieToken && cookieRefreshToken) {
          console.log('🔐 Found cookies, restoring minimal session...')
          
          // Si on a des cookies mais pas de localStorage, créer une session minimale
          const tokensFromCookies: Tokens = {
            accessToken: cookieToken,
            refreshToken: cookieRefreshToken,
            tokenType: 'Bearer',
          }
          
          setAuthState({
            user: null, // L'utilisateur sera récupéré au prochain appel API
            tokens: tokensFromCookies,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          console.log('🔐 No stored auth data found')
          setAuthState({
            user: null,
            tokens: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // En cas d'erreur, nettoyer le stockage et considérer comme non authentifié
        storage.remove(AUTH_STORAGE_KEY)
        storage.remove(TOKEN_STORAGE_KEY)
        cookieUtils.remove('accessToken')
        cookieUtils.remove('refreshToken')
        setAuthState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initializeAuth()
  }, []) // ✅ EXÉCUTION UNIQUE AU MOUNT

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

  // ✅ Écouter les mises à jour du profil utilisateur
  useEffect(() => {
    const handleProfileUpdate = () => {
      const storedUser = storage.get(AUTH_STORAGE_KEY)
      if (storedUser) {
        setAuthState(prev => ({
          ...prev,
          user: storedUser,
        }))
      }
    }

    window.addEventListener('user-profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate)
  }, [])

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
