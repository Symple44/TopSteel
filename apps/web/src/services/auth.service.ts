/**
 * 🔐 SERVICE AUTHENTIFICATION - TopSteel ERP
 * Service pour gérer l'authentification et les tokens
 * Fichier: apps/web/src/services/auth.service.ts
 */

import { apiClient } from '@/lib/api-client'
import { ErrorHandler } from '@/lib/error-handler'
import type { User, UserRole } from '@erp/types'

// ===== INTERFACES =====
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

// Type pour la réponse API avec structure data
interface ApiResponse<T> {
  data: T
  message?: string
  status?: string
}

// ===== HELPERS =====
/**
 * Helper pour transformer les données user backend -> frontend
 */
const transformUserFromAPI = (apiUser: any): User =>
  ({
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
  }) satisfies User

// ===== SERVICE PRINCIPAL =====
export const authService = {
  /**
   * ✅ Connexion utilisateur
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password,
      })

      // ✅ CORRECTION: Accéder à response.data puis extraire les propriétés
      const responseData = response.data
      const { user, accessToken, refreshToken, expiresIn } = responseData

      return {
        user: transformUserFromAPI(user),
        accessToken,
        refreshToken,
        expiresIn,
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
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', {
        email: data.email,
        password: data.password,
        nom: data.nom,
        prenom: data.prenom,
        ...(data.entreprise && { entreprise: data.entreprise }),
      })

      // ✅ CORRECTION: Même logique corrigée
      const responseData = response.data
      const { user, accessToken, refreshToken, expiresIn } = responseData

      return {
        user: transformUserFromAPI(user),
        accessToken,
        refreshToken,
        expiresIn,
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Rafraîchissement de token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {
        refreshToken,
      })

      // ✅ CORRECTION: Accès à response.data puis extraction
      const responseData = response.data
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = responseData

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Récupération du profil utilisateur
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/profile')

      // ✅ CORRECTION: Accès approprié aux données
      const { user } = response.data

      return transformUserFromAPI(user)
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Alias pour getProfile - Compatibilité avec le code existant
   */
  async getMe(): Promise<User> {
    return this.getProfile()
  },

  /**
   * ✅ Déconnexion utilisateur
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // La déconnexion peut échouer côté serveur mais on continue
      console.warn('Erreur lors de la déconnexion côté serveur:', error)
    }
  },

  /**
   * ✅ Changement de mot de passe
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword,
      })
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Demande de réinitialisation de mot de passe
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email })
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Réinitialisation de mot de passe avec token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      })
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  /**
   * ✅ Vérification de la validité d'un email
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ available: boolean }>>(
        `/auth/check-email?email=${encodeURIComponent(email)}`
      )

      return response.data.available
    } catch (error) {
      console.error("Erreur lors de la vérification de l'email:", error)

      // En cas d'erreur, considérer l'email comme non disponible par sécurité
      return false
    }
  },

  /**
   * ✅ Validation de token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await apiClient.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return true
    } catch (error) {
      return false
    }
  },
}

// ===== TYPES EXPORTÉS =====
export type { LoginResponse, RefreshTokenResponse, RegisterData }
