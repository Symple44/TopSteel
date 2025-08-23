import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

/**
 * Utilitaires JWT pour Server Components uniquement
 * Pour les Client Components, utiliser jwt-utils-client.ts
 */

/**
 * Interface pour le payload JWT
 */
export interface JWTPayload {
  sub: string
  email: string
  role: string
  roles?: string[]
  permissions?: string[]
  exp: number
  iat: number
  societeId?: string
  societeCodes?: string[]
}

/**
 * Interface pour l'utilisateur authentifié
 */
export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  roles?: string[]
  permissions?: string[]
  societeId?: string
  societeCodes?: string[]
}

/**
 * Rôles administrateur
 */
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const

/**
 * Extrait le token JWT depuis les cookies ou headers (Server Component)
 */
export async function extractToken(request?: NextRequest): Promise<string | null> {
  try {
    // 1. Vérifier les cookies (prioritaire)
    const cookieStore = await cookies()
    const tokenFromCookie =
      cookieStore.get('token')?.value || cookieStore.get('access_token')?.value

    if (tokenFromCookie) {
      return tokenFromCookie
    }

    // 2. Vérifier les headers Authorization (Bearer token)
    const headerStore = await headers()
    const authHeader = headerStore.get('authorization')

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // 3. Si une requête est fournie, vérifier ses headers
    if (request) {
      const requestAuth = request.headers.get('authorization')
      if (requestAuth?.startsWith('Bearer ')) {
        return requestAuth.substring(7)
      }
    }

    return null
  } catch (_error) {
    return null
  }
}

/**
 * Décode le payload JWT sans vérifier la signature
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Décoder le payload
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }

    const payload = JSON.parse(atob(base64)) as JWTPayload

    // Vérification basique de structure
    if (!payload.sub || !payload.exp || !payload.email) {
      return null
    }

    // Vérifier l'expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Récupère l'utilisateur authentifié depuis le JWT
 */
export async function getAuthenticatedUser(
  request?: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const token = await extractToken(request)
    if (!token) {
      return null
    }

    const payload = decodeJWTPayload(token)
    if (!payload) {
      return null
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      roles: payload.roles,
      permissions: payload.permissions,
      societeId: payload.societeId,
      societeCodes: payload.societeCodes,
    }
  } catch {
    return null
  }
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  // Super admin a toutes les permissions
  if (user.role === 'SUPER_ADMIN') {
    return true
  }

  // Vérifier dans les permissions explicites
  if (user.permissions?.includes(permission)) {
    return true
  }

  // Vérifier les permissions par rôle
  const rolePermissions: Record<string, string[]> = {
    ADMIN: ['manage_users', 'manage_companies', 'view_analytics'],
    MANAGER: ['manage_team', 'view_reports'],
    USER: ['view_own_data'],
  }

  return rolePermissions[user.role]?.includes(permission) || false
}

/**
 * Vérifie si l'utilisateur est un administrateur
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])
}

/**
 * Vérifie si l'utilisateur a accès à une société spécifique
 */
export function hasAccessToCompany(user: AuthenticatedUser, companyId: string): boolean {
  // Super admin a accès à toutes les sociétés
  if (user.role === 'SUPER_ADMIN') {
    return true
  }

  // Vérifier l'accès direct
  if (user.societeId === companyId) {
    return true
  }

  // Vérifier via les codes société
  return user.societeCodes?.includes(companyId) || false
}
