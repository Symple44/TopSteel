// apps/web/src/services/auth.service.ts
import { apiClient } from '@/lib/api-client'
import { ErrorHandler } from '@/lib/error-handler'
import type { User, UserRole } from '@erp/types'

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface RegisterData {
  email: string
  password: string
  nom: string
  prenom: string
  entreprise?: string
}

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// ✅ Helper pour transformer les données user backend -> frontend
const transformUserFromAPI = (apiUser: any): User => ({
  id: apiUser.id.toString(),
  email: apiUser.email,
  nom: apiUser.nom,
  prenom: apiUser.prenom,
  role: apiUser.role as UserRole,
  isActive: apiUser.isActive ?? true,
  permissions: apiUser.permissions ?? [],
  telephone: apiUser.telephone,
  avatar: apiUser.avatar,
  lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin) : undefined,
  createdAt: new Date(apiUser.createdAt),
  updatedAt: new Date(apiUser.updatedAt),
} satisfies User)

export const authService = {
  /**
   * ✅ Connexion utilisateur
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password
      })

      const { user, accessToken, refreshToken, expiresIn } = response.data

      return {
        user: transformUserFromAPI(user),
        accessToken,
        refreshToken,
        expiresIn
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Inscription utilisateur
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        nom: data.nom,
        prenom: data.prenom,
        ...(data.entreprise && { entreprise: data.entreprise })
      })

      const { user, accessToken, refreshToken, expiresIn } = response.data

      return {
        user: transformUserFromAPI(user),
        accessToken,
        refreshToken,
        expiresIn
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Déconnexion utilisateur
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {
        refreshToken
      })
    } catch (error) {
      // ⚠️ Ne pas faire échouer la déconnexion si l'API est injoignable
      console.warn('Erreur lors de la déconnexion (ignorée):', error)
    }
  },

  /**
   * ✅ Rafraîchissement des tokens
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      })

      return response.data
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Récupération du profil utilisateur
   */
  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<any>('/auth/profile')
      
      return transformUserFromAPI(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Changement de mot de passe
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword
      })
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Réinitialisation de mot de passe
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', {
        email
      })
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Confirmation de réinitialisation de mot de passe
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      })
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error)
      throw ErrorHandler.formatError(error)
    }
  }
}