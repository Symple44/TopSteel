import { apiClient } from '@/lib/api-client'
import type { User } from '@/types'

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post('/auth/login', { email, password })
  }

  async logout(): Promise<void> {
    return apiClient.post('/auth/logout')
  }

  async register(data: {
    email: string
    password: string
    nom: string
    prenom: string
    entreprise?: string
  }): Promise<LoginResponse> {
    return apiClient.post('/auth/register', data)
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiClient.post('/auth/refresh', { refreshToken })
  }

  async getMe(): Promise<User> {
    return apiClient.get('/auth/me')
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
  }

  async requestPasswordReset(email: string): Promise<void> {
    return apiClient.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    })
  }

  async verifyEmail(token: string): Promise<void> {
    return apiClient.post('/auth/verify-email', { token })
  }

  async resendVerificationEmail(): Promise<void> {
    return apiClient.post('/auth/resend-verification')
  }
}

export const authService = new AuthService()