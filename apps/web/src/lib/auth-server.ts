/**
 * Service d'authentification côté serveur
 * Utilise les routes API Next.js internes pour éviter les problèmes de baseURL
 */

import type { User } from '@erp/domains/core'
import { NextRequest } from 'next/server'
import { callBackendApi, callBackendFromApi } from '@/utils/backend-api'

/**
 * Récupérer le token d'authentification depuis les cookies ou headers
 */
export function getAuthToken(request: NextRequest): string | null {
  // D'abord essayer depuis les headers
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Ensuite essayer depuis les cookies
  const tokenCookie = request.cookies.get('topsteel-tokens')
  if (tokenCookie) {
    try {
      const tokenData = JSON.parse(tokenCookie.value)
      return tokenData.accessToken || null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Faire un appel authentifié vers le backend NestJS depuis une route serveur
 * @deprecated Utiliser callBackendFromApi à la place
 */
export async function fetchBackend(
  endpoint: string, 
  request: NextRequest,
  options: RequestInit = {}
): Promise<Response> {
  // Nettoyer l'endpoint pour callBackendFromApi
  const cleanEndpoint = endpoint.startsWith('/api/v1/') 
    ? endpoint.substring(8) 
    : endpoint.startsWith('/api/') 
      ? endpoint.substring(5)
      : endpoint.startsWith('/') 
        ? endpoint.substring(1)
        : endpoint

  console.log(`[fetchBackend] DEPRECATED: Use callBackendFromApi instead. Endpoint: ${cleanEndpoint}`)

  return callBackendFromApi(request, cleanEndpoint, options)
}

export const serverAuthService = {
  /**
   * Valider un token côté serveur
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await callBackendApi('auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const response = await callBackendApi('auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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