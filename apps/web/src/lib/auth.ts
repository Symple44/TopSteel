import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { serverAuthService } from './auth-server'

export interface AuthSession {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    roles: string[]
  }
  token: string
  expires: string
}

/**
 * Authentification côté serveur pour les API routes
 */
export async function auth(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      return null
    }

    // Valider le token avec le service serveur
    const isValid = await serverAuthService.validateToken(token)
    
    if (!isValid) {
      return null
    }

    // Récupérer les infos utilisateur
    const user = await serverAuthService.getProfile(token)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.profile.prenom,
        lastName: user.profile.nom,
        roles: [user.role]
      },
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    }
  } catch (error) {
    console.error('Auth validation error:', error)
    return null
  }
}

/**
 * Authentification pour les API routes avec NextRequest
 */
export async function authFromRequest(request: NextRequest): Promise<AuthSession | null> {
  try {
    const token = request.cookies.get('accessToken')?.value
    
    if (!token) {
      return null
    }

    // Valider le token avec le service serveur
    const isValid = await serverAuthService.validateToken(token)
    
    if (!isValid) {
      return null
    }

    // Récupérer les infos utilisateur
    const user = await serverAuthService.getProfile(token)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.profile.prenom,
        lastName: user.profile.nom,
        roles: [user.role]
      },
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    }
  } catch (error) {
    console.error('Auth validation error:', error)
    return null
  }
}

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 */
export function hasRole(session: AuthSession | null, role: string): boolean {
  return session?.user?.roles?.includes(role) ?? false
}

/**
 * Vérifier si l'utilisateur a au moins un des rôles spécifiés
 */
export function hasAnyRole(session: AuthSession | null, roles: string[]): boolean {
  return roles.some(role => hasRole(session, role))
}

/**
 * Vérifier si l'utilisateur est admin
 */
export function isAdmin(session: AuthSession | null): boolean {
  return hasRole(session, 'ADMIN') || hasRole(session, 'SUPER_ADMIN')
}
