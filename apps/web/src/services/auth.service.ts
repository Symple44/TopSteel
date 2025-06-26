import { apiClient } from '@/lib/api-client'
import type { User, LoginResponse, RefreshTokenResponse } from '@/types'

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password })
    return response.data
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  }

  async register(data: {
    email: string
    password: string
    nom: string
    prenom: string
    entreprise?: string
  }): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data)
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken })
    return response.data
  }

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    })
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token })
  }

  async resendVerificationEmail(): Promise<void> {
    await apiClient.post('/auth/resend-verification')
  }
}

export const authService = new AuthService()
