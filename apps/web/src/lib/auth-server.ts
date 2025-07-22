/**
 * Service d'authentification côté serveur
 * Utilise les routes API Next.js internes pour éviter les problèmes de baseURL
 */

import type { User } from '@erp/domains/core'

const INTERNAL_API_BASE = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000'

export const serverAuthService = {
  /**
   * Valider un token côté serveur
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${INTERNAL_API_BASE}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      return response.ok
    } catch (error) {
      console.error('Server token validation error:', error)
      return false
    }
  },

  /**
   * Récupérer le profil utilisateur côté serveur
   */
  async getProfile(token: string): Promise<User> {
    try {
      const response = await fetch(`${INTERNAL_API_BASE}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.status}`)
      }

      const result = await response.json()
      const { user } = result.data || result

      return {
        id: user.id.toString(),
        email: user.email,
        profile: {
          nom: user.nom || '',
          prenom: user.prenom || '',
          telephone: user.telephone,
          avatar: user.avatar,
        },
        role: user.role,
        permissions: user.permissions ?? [],
        statut: 'ACTIF' as const,
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
      }
    } catch (error) {
      console.error('Server profile fetch error:', error)
      throw error
    }
  },
}