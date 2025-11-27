/**
 * JWT Utilities - Shared (Universal)
 * Types and functions that work in both client and server environments
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
  roles: string[]
  permissions: string[]
  societeId?: string
  societeCodes?: string[]
  isAdmin: boolean
  isSuperAdmin: boolean
}

/**
 * Rôles administrateur
 */
export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const

/**
 * Décode le payload JWT sans vérifier la signature
 * La validation complète est faite côté serveur
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token?.split('.')
    if (parts?.length !== 3) {
      return null
    }

    // Décoder le payload (base64url -> base64 -> JSON)
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }

    const payload = JSON.parse(atob(base64)) as JWTPayload

    // Vérification basique de structure
    if (!payload?.sub || !payload?.exp || !payload?.email) {
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
 * Convertit un payload JWT en AuthenticatedUser
 */
export function payloadToUser(payload: JWTPayload): AuthenticatedUser {
  const roles = payload.roles || [payload.role]
  const isAdmin = roles.some((role) => ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]))
  const isSuperAdmin = roles.includes('SUPER_ADMIN')

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    roles,
    permissions: payload.permissions || [],
    societeId: payload.societeId,
    societeCodes: payload.societeCodes,
    isAdmin,
    isSuperAdmin,
  }
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  if (user.isSuperAdmin) {
    return true
  }
  return user.permissions.includes(permission)
}

/**
 * Vérifie si l'utilisateur a au moins une des permissions
 */
export function hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  if (user.isSuperAdmin) {
    return true
  }
  return permissions.some((permission) => user.permissions.includes(permission))
}

/**
 * Vérifie si l'utilisateur a toutes les permissions
 */
export function hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
  if (user.isSuperAdmin) {
    return true
  }
  return permissions.every((permission) => user.permissions.includes(permission))
}

/**
 * Vérifie si l'utilisateur est un administrateur
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.isAdmin
}

/**
 * Vérifie si l'utilisateur a accès à une société spécifique
 */
export function hasAccessToCompany(user: AuthenticatedUser, companyId: string): boolean {
  if (user.isSuperAdmin) {
    return true
  }
  if (user.societeId === companyId) {
    return true
  }
  return user.societeCodes?.includes(companyId) || false
}

/**
 * Récupère l'utilisateur authentifié ou lance une erreur
 */
export function requireAuthenticatedUser(user: AuthenticatedUser | null): AuthenticatedUser {
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}
