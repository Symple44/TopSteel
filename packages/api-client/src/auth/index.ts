/**
 * 🔐 API AUTH - AUTHENTIFICATION
 * Client API complet pour la gestion de l'authentification
 */

import type { AxiosInstance } from 'axios'

/**
 * Types pour l'authentification
 */
export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  user: AuthUser
  expires_in: number
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  societeId?: string
  role?: string
}

export interface RegisterResponse {
  user: AuthUser
  message: string
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  roles?: string[]
  societeId?: string
  permissions?: string[]
  avatar?: string
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  resetToken?: string // Only in dev mode
}

export interface ResetPasswordRequest {
  token: string
  password: string
  passwordConfirmation: string
}

export interface ResetPasswordResponse {
  message: string
  success: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

export interface ChangePasswordResponse {
  message: string
  success: boolean
}

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailResponse {
  message: string
  success: boolean
}

export interface Enable2FAResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface Verify2FARequest {
  code: string
  secret?: string
}

export interface Verify2FAResponse {
  success: boolean
  message: string
}

export interface RevokeSessionRequest {
  sessionId?: string
  allSessions?: boolean
}

export interface RevokeSessionResponse {
  message: string
  revokedCount: number
}

/**
 * Client API pour l'authentification
 */
export class AuthApiClient {
  constructor(private readonly api: AxiosInstance) {}

  /**
   * Connexion utilisateur
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/login', data)
    
    // Stocker le token si fourni
    if (response.data.access_token) {
      this.setAccessToken(response.data.access_token)
    }
    
    if (response.data.refresh_token) {
      this.setRefreshToken(response.data.refresh_token)
    }
    
    return response.data
  }

  /**
   * Inscription utilisateur
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.api.post<RegisterResponse>('/auth/register', data)
    return response.data
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout')
    } finally {
      // Nettoyer les tokens locaux même si l'API échoue
      this.clearTokens()
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(data?: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const refreshToken = data?.refresh_token || this.getRefreshToken()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await this.api.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    
    // Mettre à jour les tokens
    if (response.data.access_token) {
      this.setAccessToken(response.data.access_token)
    }
    
    if (response.data.refresh_token) {
      this.setRefreshToken(response.data.refresh_token)
    }
    
    return response.data
  }

  /**
   * Récupérer l'utilisateur courant
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await this.api.get<AuthUser>('/auth/me')
    return response.data
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    const response = await this.api.patch<AuthUser>('/auth/profile', data)
    return response.data
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await this.api.post<ForgotPasswordResponse>('/auth/forgot-password', data)
    return response.data
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await this.api.post<ResetPasswordResponse>('/auth/reset-password', data)
    return response.data
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await this.api.post<ChangePasswordResponse>('/auth/change-password', data)
    return response.data
  }

  /**
   * Vérifier l'email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await this.api.post<VerifyEmailResponse>('/auth/verify-email', data)
    return response.data
  }

  /**
   * Renvoyer l'email de vérification
   */
  async resendVerificationEmail(): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/auth/resend-verification')
    return response.data
  }

  /**
   * Activer l'authentification à deux facteurs
   */
  async enable2FA(): Promise<Enable2FAResponse> {
    const response = await this.api.post<Enable2FAResponse>('/auth/2fa/enable')
    return response.data
  }

  /**
   * Vérifier le code 2FA
   */
  async verify2FA(data: Verify2FARequest): Promise<Verify2FAResponse> {
    const response = await this.api.post<Verify2FAResponse>('/auth/2fa/verify', data)
    return response.data
  }

  /**
   * Désactiver l'authentification à deux facteurs
   */
  async disable2FA(code: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/auth/2fa/disable', { code })
    return response.data
  }

  /**
   * Récupérer les sessions actives
   */
  async getActiveSessions(): Promise<Array<{
    id: string
    userAgent: string
    ip: string
    lastActivity: Date
    current: boolean
  }>> {
    const response = await this.api.get('/auth/sessions')
    return response.data
  }

  /**
   * Révoquer une ou toutes les sessions
   */
  async revokeSessions(data: RevokeSessionRequest): Promise<RevokeSessionResponse> {
    const response = await this.api.post<RevokeSessionResponse>('/auth/sessions/revoke', data)
    return response.data
  }

  /**
   * Valider un token
   */
  async validateToken(token?: string): Promise<boolean> {
    try {
      const response = await this.api.post('/auth/validate', {
        token: token || this.getAccessToken(),
      })
      return response.data.valid === true
    } catch {
      return false
    }
  }

  /**
   * Méthodes utilitaires pour gérer les tokens localement
   */
  private setAccessToken(token: string): void {
    // Les tokens sont maintenant gérés par cookies HttpOnly
    // Cette méthode est conservée pour la compatibilité
  }

  private setRefreshToken(token: string): void {
    // Les tokens sont maintenant gérés par cookies HttpOnly
    // Cette méthode est conservée pour la compatibilité
  }

  private getAccessToken(): string | null {
    // Les tokens sont maintenant récupérés depuis les cookies HttpOnly
    // via les en-têtes de requête
    return null
  }

  private getRefreshToken(): string | null {
    // Les tokens sont maintenant récupérés depuis les cookies HttpOnly
    // via les en-têtes de requête
    return null
  }

  private clearTokens(): void {
    // Les tokens sont maintenant effacés via l'API logout
    // qui supprime les cookies HttpOnly
  }

  /**
   * Intercepteur pour ajouter automatiquement le token aux requêtes
   */
  setupInterceptors(): void {
    // Intercepteur de requête pour ajouter le token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken()
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Intercepteur de réponse pour gérer l'expiration du token
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await this.refreshToken()
            const token = this.getAccessToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return this.api(originalRequest)
          } catch (refreshError) {
            // Rediriger vers la page de connexion
            this.clearTokens()
            // La redirection sera gérée par le frontend lors de la réception de l'erreur 401
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }
}