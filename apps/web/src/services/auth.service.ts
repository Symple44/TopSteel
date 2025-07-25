/**
 * 🔐 SERVICE AUTHENTIFICATION - TopSteel ERP
 * Service pour gérer l'authentification et les tokens
 * Fichier: apps/web/src/services/auth.service.ts
 */

import { apiClient } from '@/lib/api-client'
import { formatError } from '@/lib/error-handler'
import type { User } from '@erp/domains/core'
import { type UserRole, UserStatut } from '@erp/domains/core'

// ===== INTERFACES =====
interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
  requiresCompanySelection?: boolean
  societe?: CompanyInfo
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

interface CompanyInfo {
  id: string
  nom: string
  code: string
  status: string
  plan: string
}

interface UserCompany {
  id: string
  nom: string
  code: string
  role: string
  isDefault: boolean
  permissions: string[]
  sites: any[]
}

interface CompanyLoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
  societe: CompanyInfo
  permissions: string[]
}

// Type pour la réponse API avec structure data
interface ApiResponse<T> {
  data: T
  message?: string
  status?: string
}

// ===== INTERFACES API =====
interface APIUser {
  id: string | number
  email: string
  nom: string
  prenom: string
  role: UserRole
  isActive?: boolean
  permissions?: string[]
  telephone?: string
  avatarUrl?: string
  avatar?: string
  preferences?: Record<string, unknown>
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
}

// ===== HELPERS =====
/**
 * Helper pour transformer les données user backend -> frontend
 */
const transformUserFromAPI = (apiUser: unknown): User => {
  const user = apiUser as APIUser
  return {
    id: user.id.toString(),
    email: user.email,
    profile: {
      nom: user.nom || '',
      prenom: user.prenom || '',
      telephone: user.telephone,
      avatar: user.avatar,
    },
    role: user.role as UserRole,
    permissions: user.permissions ?? [],
    statut: UserStatut.ACTIF,
    competences: [],
    preferences: {
      theme: 'light',
      langue: 'fr',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      dashboard: {
        widgets: [],
        layout: 'grid',
      },
    },
    security: {
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      failedLoginAttempts: 0,
      isLocked: false,
      twoFactorEnabled: false,
    },
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
  } satisfies User
}

// ===== SERVICE PRINCIPAL =====
export const authService = {
  /**
   * ✅ Connexion utilisateur
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
        login: email,
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
      throw formatError(error)
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
      throw formatError(error)
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
      throw formatError(error)
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
      throw formatError(error)
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
      throw formatError(error)
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
      throw formatError(error)
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
      throw formatError(error)
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

  /**
   * ✅ Récupérer les sociétés disponibles pour l'utilisateur
   */
  async getUserCompanies(): Promise<UserCompany[]> {
    try {
      const companies = await apiClient.get<UserCompany[]>('/auth/societes')
      return companies || []
    } catch (error) {
      console.error('Erreur lors de la récupération des sociétés:', error)
      throw formatError(error)
    }
  },

  /**
   * ✅ Se connecter à une société spécifique
   */
  async loginToCompany(societeId: string): Promise<CompanyLoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CompanyLoginResponse>>(
        `/auth/login-societe/${societeId}`
      )
      
      const responseData = response.data
      const { user, accessToken, refreshToken, expiresIn, societe, permissions } = responseData
      
      return {
        user: transformUserFromAPI(user),
        accessToken,
        refreshToken,
        expiresIn,
        societe,
        permissions,
      }
    } catch (error) {
      console.error('Erreur lors de la connexion à la société:', error)
      throw formatError(error)
    }
  },

  /**
   * ✅ Définir une société par défaut
   */
  async setDefaultCompany(societeId: string): Promise<void> {
    try {
      await apiClient.post(`/auth/societe-default/${societeId}`)
    } catch (error) {
      console.error('Erreur lors de la définition de la société par défaut:', error)
      throw formatError(error)
    }
  },

  /**
   * ✅ Obtenir la société actuelle
   */
  async getCurrentCompany(): Promise<CompanyInfo | null> {
    try {
      const response = await apiClient.get<ApiResponse<{ societe: CompanyInfo }>>('/auth/current-societe')
      return response.data.data?.societe || null
    } catch (error) {
      console.error('Erreur lors de la récupération de la société actuelle:', error)
      return null
    }
  },
}

// ===== TYPES EXPORTÉS =====
export type { LoginResponse, RefreshTokenResponse, RegisterData, UserCompany, CompanyInfo, CompanyLoginResponse }
