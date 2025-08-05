/**
 * Service d'authentification - Logique métier séparée du Context
 */

import type { AuthTokens, Company, MFAState, User } from '@/types/auth'
import { callClientApi } from '@/utils/backend-api'

// Clés de stockage - doivent correspondre à auth-storage.ts
export const STORAGE_KEYS = {
  AUTH: 'topsteel_auth_tokens', // Même clé que tokenStorageKey dans auth-storage.ts
  TOKENS: 'topsteel_auth_tokens',
  COMPANY: 'topsteel-company',
} as const

// Utilitaires de stockage sécurisés
export const storage = {
  get: <T = any>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (_error) {}
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (_error) {}
  },
}

// Utilitaires cookies
export const cookies = {
  set: (name: string, value: string, days = 1): void => {
    if (typeof document === 'undefined') return
    try {
      const date = new Date()
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
      const expires = `expires=${date.toUTCString()}`
      document.cookie = `${name}=${value};${expires};path=/;secure;samesite=lax`
    } catch (_error) {}
  },

  remove: (name: string): void => {
    if (typeof document === 'undefined') return
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
    } catch (_error) {}
  },
}

// Service d'authentification
export class AuthService {
  /**
   * Connexion utilisateur
   */
  static async login(
    identifier: string,
    password: string
  ): Promise<{
    user?: User
    tokens?: AuthTokens
    requiresMFA?: boolean
    mfa?: MFAState
  }> {
    const response = await callClientApi('auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: identifier, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Email ou mot de passe incorrect')
    }

    const responseData = await response.json()

    // Vérifier si MFA est requis
    if (responseData.data?.requiresMFA) {
      return {
        requiresMFA: true,
        mfa: {
          required: true,
          userId: responseData.data.userId,
          email: responseData.data.email,
          availableMethods: responseData.data.availableMethods,
        },
      }
    }

    const { user, accessToken, refreshToken, expiresIn } = responseData.data
    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn,
      expiresAt: Date.now() + expiresIn * 1000,
      tokenType: 'Bearer',
    }

    return { user, tokens }
  }

  /**
   * Vérification MFA
   */
  static async verifyMFA(
    userId: string,
    mfaType: string,
    code?: string,
    webauthnResponse?: any
  ): Promise<{
    user: User
    tokens: AuthTokens
  }> {
    const response = await callClientApi('auth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, mfaType, code, webauthnResponse }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Code MFA invalide')
    }

    const responseData = await response.json()

    if (responseData.data.sessionToken) {
      // Finaliser la connexion après MFA
      const loginResponse = await callClientApi('auth/mfa/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionToken: responseData.data.sessionToken,
        }),
      })

      if (!loginResponse.ok) {
        throw new Error('Erreur lors de la finalisation de la connexion')
      }

      const loginData = await loginResponse.json()
      const { user, accessToken, refreshToken, expiresIn } = loginData.data
      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
        tokenType: 'Bearer',
      }

      return { user, tokens }
    }

    throw new Error('Réponse MFA invalide')
  }

  /**
   * Sélection d'une société
   */
  static async selectCompany(
    companyId: string,
    accessToken: string
  ): Promise<{
    user: User
    tokens: AuthTokens
    company: Company
  }> {
    const response = await callClientApi(`auth/login-societe/${companyId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la connexion à la société')
    }

    const responseData = await response.json()
    const { user, tokens: responseTokens } = responseData.data
    const { accessToken: newAccessToken, refreshToken, expiresIn } = responseTokens
    const company = user.societe

    const tokens: AuthTokens = {
      accessToken: newAccessToken,
      refreshToken,
      expiresIn,
      expiresAt: Date.now() + (expiresIn || 24 * 60 * 60) * 1000, // Use backend expiresIn or default to 24h
      tokenType: 'Bearer',
    }

    return { user, tokens, company }
  }

  /**
   * Rafraîchissement des tokens
   */
  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const response = await callClientApi('auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const responseData = await response.json()
    const { accessToken, refreshToken: newRefreshToken, expiresIn } = responseData.data

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      expiresAt: Date.now() + expiresIn * 1000,
      tokenType: 'Bearer',
    }
  }

  /**
   * Validation des tokens
   */
  static async validateTokens(tokens: AuthTokens): Promise<boolean> {
    try {
      // Vérifier d'abord l'expiration locale
      if (tokens.expiresAt) {
        const now = Date.now()
        const buffer = 5 * 60 * 1000 // 5 minutes buffer
        if (now >= tokens.expiresAt - buffer) return false
      }

      const response = await callClientApi('auth/verify', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Déconnexion
   */
  static async logout(accessToken?: string): Promise<void> {
    try {
      if (accessToken) {
        await callClientApi('auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      }
    } catch (_error) {}
  }

  /**
   * Sauvegarder la session complète
   */
  static saveSession(
    user: User,
    tokens: AuthTokens,
    company?: Company | null,
    rememberMe = false
  ): void {
    // Sauvegarder en localStorage
    storage.set(STORAGE_KEYS.AUTH, user)
    storage.set(STORAGE_KEYS.TOKENS, tokens)
    if (company) {
      storage.set(STORAGE_KEYS.COMPANY, company)
    }

    // Sauvegarder en cookies pour les API routes
    const days = rememberMe ? 30 : 1
    cookies.set('accessToken', tokens.accessToken, days)
    cookies.set('refreshToken', tokens.refreshToken, days)
  }

  /**
   * Nettoyer la session
   */
  static clearSession(): void {
    storage.remove(STORAGE_KEYS.AUTH)
    storage.remove(STORAGE_KEYS.TOKENS)
    storage.remove(STORAGE_KEYS.COMPANY)
    cookies.remove('accessToken')
    cookies.remove('refreshToken')
  }

  /**
   * Récupérer la session stockée
   */
  static getStoredSession(): {
    user: User | null
    tokens: AuthTokens | null
    company: Company | null
  } {
    return {
      user: storage.get<User>(STORAGE_KEYS.AUTH),
      tokens: storage.get<AuthTokens>(STORAGE_KEYS.TOKENS),
      company: storage.get<Company>(STORAGE_KEYS.COMPANY),
    }
  }

  /**
   * Récupérer les sociétés de l'utilisateur
   */
  async getUserCompanies(): Promise<Company[]> {
    try {
      // Utiliser authStorage pour récupérer la session (comme fait par auth-provider)
      const { authStorage } = await import('@/lib/auth/auth-storage')
      const session = authStorage.getStoredSession()

      if (!session?.tokens?.accessToken) {
        return []
      }

      const tokens = session.tokens

      const response = await callClientApi('auth/societes', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      // L'API backend retourne {data: [...], statusCode: 200, message: "Success"}
      return data.data || data // Si data.data existe, l'utiliser, sinon utiliser data directement
    } catch (_error) {
      return []
    }
  }

  /**
   * Définir la société par défaut
   */
  async setDefaultCompany(companyId: string): Promise<boolean> {
    try {
      const response = await callClientApi('auth/user/default-company', {
        method: 'POST',
        body: JSON.stringify({ companyId }),
      })
      const data = await response.json()
      return data.success
    } catch (_error) {
      return false
    }
  }
}

// Export a default instance
export const authService = new AuthService()
