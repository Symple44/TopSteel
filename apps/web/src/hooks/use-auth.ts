import React from 'react'

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

interface MFAState {
  required: boolean
  userId?: string
  email?: string
  availableMethods?: Array<{
    type: string
    isEnabled: boolean
    lastUsed?: Date
  }>
  sessionToken?: string
}

interface AuthState {
  user: User | null
  tokens: Tokens | null
  isLoading: boolean
  isAuthenticated: boolean
  mfa: MFAState
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
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
    mfa: {
      required: false
    }
  })

  // ✅ Validation des tokens - fonction stable avec useCallback
  const validateTokens = React.useCallback(async (tokens: Tokens): Promise<boolean> => {
    try {
      // Vérifier d'abord si le token n'est pas expiré localement
      if (tokens.expiresIn) {
        const tokenAge = Date.now() - (tokens.expiresIn * 1000)
        if (tokenAge > 0) {
          // Token expired locally
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
      // Token validation failed
      return false
    }
  }, [])

  // ✅ Récupération du profil utilisateur
  const fetchUserProfile = React.useCallback(async (tokens: Tokens): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        return userData
      } else {
        // Failed to fetch user profile
        return null
      }
    } catch (error) {
      // Error fetching user profile
      return null
    }
  }, [])

  // ✅ Fonction de login - stable avec useCallback
  const login = React.useCallback(async (identifier: string, password: string, rememberMe: boolean = false): Promise<void> => {
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
      // Login successful
      
      // Vérifier si MFA est requis
      if (responseData.data?.requiresMFA) {
        // MFA Required
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          mfa: {
            required: true,
            userId: responseData.data.userId,
            email: responseData.data.email,
            availableMethods: responseData.data.availableMethods
          }
        }))
        return // Arrêter ici, le login n'est pas terminé
      }
      
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
        mfa: {
          required: false
        }
      })
      
      // Auth state updated successfully
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  // ✅ Fonction de vérification MFA - stable avec useCallback
  const verifyMFA = React.useCallback(async (mfaType: string, code?: string, webauthnResponse?: any): Promise<void> => {
    if (!authState.mfa?.required || !authState.mfa?.userId) {
      throw new Error('MFA not required or no user ID available')
    }

    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      // Appel API pour vérifier le code MFA
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authState.mfa?.userId,
          mfaType,
          code,
          webauthnResponse
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Code MFA invalide')
      }

      const responseData = await response.json()
      
      // Si la vérification réussit, finaliser la connexion
      if (responseData.data.sessionToken) {
        // Obtenir les tokens finaux après MFA
        const loginResponse = await fetch('/api/auth/mfa/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authState.mfa?.userId,
            sessionToken: responseData.data.sessionToken
          }),
        })

        if (!loginResponse.ok) {
          throw new Error('Erreur lors de la finalisation de la connexion')
        }

        const loginData = await loginResponse.json()
        const { user, accessToken, refreshToken, expiresIn } = loginData.data
        const tokens: Tokens = { accessToken, refreshToken, expiresIn, tokenType: 'Bearer' }

        // Stocker dans localStorage et cookies
        storage.set(AUTH_STORAGE_KEY, user)
        storage.set(TOKEN_STORAGE_KEY, tokens)
        cookieUtils.set('accessToken', accessToken, 1)
        cookieUtils.set('refreshToken', refreshToken, 1)

        setAuthState({
          user,
          tokens,
          isLoading: false,
          isAuthenticated: true,
          mfa: {
            required: false
          }
        })
      }
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [authState.mfa?.required, authState.mfa?.userId])

  // ✅ Fonction de réinitialisation MFA - stable avec useCallback
  const resetMFA = React.useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      mfa: {
        required: false
      }
    }))
  }, [])

  // ✅ Fonction de logout - stable avec useCallback
  const logout = React.useCallback(async (): Promise<void> => {
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
        mfa: {
          required: false
        }
      })
    }
  }, [])

  // ✅ Mise à jour utilisateur - stable avec useCallback
  const setUser = React.useCallback((user: User | null) => {
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
  const refreshTokens = React.useCallback(async (): Promise<void> => {
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
        mfa: {
          required: false
        }
      })
      throw error
    }
  }, [])

  // ✅ Initialisation depuis le stockage local - EXÉCUTION UNIQUE
  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = storage.get(AUTH_STORAGE_KEY)
        const storedTokens = storage.get(TOKEN_STORAGE_KEY)
        
        // Vérifier aussi les cookies
        const cookieToken = cookieUtils.get('accessToken')
        const cookieRefreshToken = cookieUtils.get('refreshToken')

        if (storedUser && storedTokens) {
          
          // S'assurer que les cookies sont synchronisés
          if (cookieToken !== storedTokens.accessToken) {
            // Synchronizing cookies with localStorage
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
            mfa: {
              required: false
            }
          })
        } else if (cookieToken && cookieRefreshToken) {
          // Restoring session from cookies
          
          // Si on a des cookies mais pas de localStorage, créer une session et récupérer l'utilisateur
          const tokensFromCookies: Tokens = {
            accessToken: cookieToken,
            refreshToken: cookieRefreshToken,
            tokenType: 'Bearer',
          }
          
          // Récupérer activement le profil utilisateur
          const userProfile = await fetchUserProfile(tokensFromCookies)
          
          if (userProfile) {
            setAuthState({
              user: userProfile, // Profil utilisateur récupéré
              tokens: tokensFromCookies,
              isLoading: false,
              isAuthenticated: true,
              mfa: {
                required: false
              }
            })
          } else {
            // Si on ne peut pas récupérer le profil, nettoyer la session
            // Failed to restore user profile, clearing session
            cookies.remove('topsteel-token')
            cookies.remove('topsteel-refresh-token')
            setAuthState({
              user: null,
              tokens: null,
              isLoading: false,
              isAuthenticated: false,
              mfa: {
                required: false
              }
            })
          }
        } else {
          // No stored auth data found
          setAuthState({
            user: null,
            tokens: null,
            isLoading: false,
            isAuthenticated: false,
            mfa: {
              required: false
            }
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
          mfa: {
            required: false
          }
        })
      }
    }

    initializeAuth()
  }, []) // ✅ EXÉCUTION UNIQUE AU MOUNT

  // ✅ Auto-refresh des tokens
  React.useEffect(() => {
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
  React.useEffect(() => {
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
    mfa: authState.mfa,
    login,
    logout,
    verifyMFA,
    resetMFA,
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
