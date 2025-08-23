import { authLogger } from '@erp/utils'
import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

/**
 * Interface pour le payload JWT
 */
export interface JWTPayload {
  sub: string
  email: string
  role: string
  roles?: string[]
  societeId?: string
  iat: number
  exp: number
  permissions?: string[]
}

/**
 * Interface pour les informations utilisateur extraites
 */
export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  roles: string[]
  societeId?: string
  permissions: string[]
  isAdmin: boolean
  isSuperAdmin: boolean
}

/**
 * Rôles administrateur
 */
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const

/**
 * Extrait le token JWT depuis les cookies ou headers
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
  } catch (error) {
    authLogger.error('Error extracting token:', error)
    return null
  }
}

/**
 * Décode le payload JWT (sans validation cryptographique)
 * La validation complète est faite côté serveur
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
 * Retourne null si non authentifié
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

    // Construire l'objet utilisateur
    const roles = payload.roles || [payload.role]
    const isAdmin = roles.some((role) => ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]))
    const isSuperAdmin = roles.includes('SUPER_ADMIN')

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      roles,
      societeId: payload.societeId,
      permissions: payload.permissions || [],
      isAdmin,
      isSuperAdmin,
    }
  } catch {
    return null
  }
}

/**
 * Récupère l'utilisateur authentifié ou lance une erreur
 * Utiliser dans les routes qui nécessitent absolument une authentification
 */
export function requireAuthenticatedUser(user: AuthenticatedUser | null): AuthenticatedUser {
  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  // Les super admins ont toutes les permissions
  if (user.isSuperAdmin) {
    return true
  }

  return user.permissions.includes(permission)
}

/**
 * Vérifie si l'utilisateur a au moins une des permissions
 */
export function hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  // Les super admins ont toutes les permissions
  if (user.isSuperAdmin) {
    return true
  }

  return permissions.some((permission) => user.permissions.includes(permission))
}

/**
 * Vérifie si l'utilisateur a toutes les permissions
 */
export function hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
  // Les super admins ont toutes les permissions
  if (user.isSuperAdmin) {
    return true
  }

  return permissions.every((permission) => user.permissions.includes(permission))
}

/**
 * Vérifie si l'utilisateur appartient à une société spécifique
 */
export function belongsToSociete(user: AuthenticatedUser, societeId: string): boolean {
  // Les super admins ont accès à toutes les sociétés
  if (user.isSuperAdmin) {
    return true
  }

  return user.societeId === societeId
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

    const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r as (typeof ADMIN_ROLES)[number]))
    const isSuperAdmin = roles.includes('SUPER_ADMIN')

    return {
      id: userId,
      email,
      role,
      roles,
      societeId: headerStore.get('x-user-societe-id') || undefined,
      permissions,
      isAdmin,
      isSuperAdmin,
    }
  } catch {
    return null
  }
}
