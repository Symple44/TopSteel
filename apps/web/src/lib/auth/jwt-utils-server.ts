/**
 * JWT Utilities - Server Components
 * Uses next/headers for Server Components and API routes
 * For Client Components, use jwt-utils-client.ts
 */

import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'
import {
  ADMIN_ROLES,
  type AuthenticatedUser,
  type JWTPayload,
  decodeJWTPayload,
  hasAccessToCompany,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isAdmin,
  payloadToUser,
  requireAuthenticatedUser,
} from './jwt-utils-shared'

// Re-export shared types and functions
export type { AuthenticatedUser, JWTPayload }
export {
  decodeJWTPayload,
  hasAccessToCompany,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isAdmin,
  requireAuthenticatedUser,
}

/**
 * Extrait le token JWT depuis les cookies ou headers (Server Component)
 */
export async function extractToken(request?: NextRequest): Promise<string | null> {
  try {
    // 1. Vérifier les cookies (prioritaire)
    const cookieStore = await cookies()
    const tokenFromCookie =
      cookieStore.get('token')?.value ||
      cookieStore.get('access_token')?.value ||
      cookieStore.get('topsteel-access-token')?.value

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
  } catch {
    return null
  }
}

/**
 * Récupère l'utilisateur authentifié depuis le JWT (Server Component)
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = await extractToken(request)
    if (!token) {
      return null
    }

    const payload = decodeJWTPayload(token)
    if (!payload) {
      return null
    }

    return payloadToUser(payload)
  } catch {
    return null
  }
}

/**
 * Récupère l'utilisateur depuis les headers du middleware
 * Utiliser dans les routes API après le middleware
 */
export async function getUserFromHeaders(): Promise<AuthenticatedUser | null> {
  try {
    const headerStore = await headers()

    const userId = headerStore.get('x-user-id')
    const email = headerStore.get('x-user-email')
    const role = headerStore.get('x-user-role')

    if (!userId || !email || !role) {
      return null
    }

    const rolesHeader = headerStore.get('x-user-roles')
    const roles = rolesHeader ? rolesHeader.split(',') : [role]

    const permissionsHeader = headerStore.get('x-user-permissions')
    const permissions = permissionsHeader ? permissionsHeader.split(',') : []

    const isAdminUser = roles.some((r) => ADMIN_ROLES.includes(r as (typeof ADMIN_ROLES)[number]))
    const isSuperAdmin = roles.includes('SUPER_ADMIN')

    return {
      id: userId,
      email,
      role,
      roles,
      permissions,
      societeId: headerStore.get('x-user-societe-id') || undefined,
      isAdmin: isAdminUser,
      isSuperAdmin,
    }
  } catch {
    return null
  }
}

/**
 * Vérifie si l'utilisateur appartient à une société spécifique
 */
export function belongsToSociete(user: AuthenticatedUser, societeId: string): boolean {
  if (user.isSuperAdmin) {
    return true
  }
  return user.societeId === societeId
}
