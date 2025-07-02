// apps/web/src/services/auth.service.ts
import type { User } from '@erp/types'

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

interface RegisterData {
  email: string
  password: string
  nom: string
  prenom: string
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    // TODO: Remplacer par un vrai appel API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: '1',
            email,
            nom: 'Test User',
            prenom: 'John',
            role: 'admin',
          } as User,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        })
      }, 1000)
    })
  },

  async register(data: RegisterData): Promise<void> {
    // TODO: Implémenter
    return Promise.resolve()
  },

  async logout(refreshToken: string): Promise<void> {
    // TODO: Implémenter
    return Promise.resolve()
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // TODO: Implémenter
    return {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }
  },

  async getMe(): Promise<User> {
    // TODO: Implémenter
    return {
      id: '1',
      email: 'test@test.com',
      nom: 'Test User',
      prenom: 'John',
      role: 'admin',
    } as User
  },
}