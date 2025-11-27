/**
 * JWT Utilities - Client Components
 * For browser-side token extraction
 * Does NOT depend on next/headers
 */

import type { NextRequest } from 'next/server'
import {
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
 * Extrait le token depuis les cookies du navigateur (côté client)
 */
export function extractTokenFromCookies(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'token' || name === 'access_token' || name === 'topsteel-access-token') {
        return value
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extrait le token depuis une requête (pour API routes/middleware)
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  try {
    const tokenFromCookie =
      request.cookies?.get('token')?.value ||
      request.cookies?.get('access_token')?.value ||
      request.cookies?.get('topsteel-access-token')?.value

    if (tokenFromCookie) {
      return tokenFromCookie
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    return null
  } catch {
    return null
  }
}

/**
 * Récupère l'utilisateur depuis le token (côté client)
 */
export function getAuthenticatedUser(): AuthenticatedUser | null {
  try {
    const token = extractTokenFromCookies()
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
