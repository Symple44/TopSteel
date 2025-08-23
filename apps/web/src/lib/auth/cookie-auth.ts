/**
 * Système d'authentification basé sur les cookies HttpOnly
 * Plus sécurisé que localStorage pour stocker les tokens
 */

import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import type { AuthTokens, Company, User } from './auth-types'

// Configuration des cookies
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

const ACCESS_TOKEN_COOKIE = 'topsteel-access-token'
const REFRESH_TOKEN_COOKIE = 'topsteel-refresh-token'
const USER_INFO_COOKIE = 'topsteel-user-info'

/**
 * Sauvegarder les tokens dans des cookies HttpOnly (côté serveur)
 */
export async function saveTokensInCookies(
  tokens: AuthTokens,
  response: NextResponse,
  rememberMe = false
): Promise<void> {
  const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60 // 7 jours ou 24h

  // Access token
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge,
  })

  // Refresh token (durée plus longue)
  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 jours ou 7 jours
    })
  }

  // Stocker l'expiration
  response.cookies.set('topsteel-token-expiry', tokens.expiresAt.toString(), {
    ...COOKIE_OPTIONS,
    httpOnly: false, // Accessible côté client pour vérifier l'expiration
    maxAge,
  })
}

/**
 * Sauvegarder les informations utilisateur (non sensibles) dans un cookie
 */
export async function saveUserInfoInCookie(
  user: User,
  company: Company | null,
  response: NextResponse,
  rememberMe = false
): Promise<void> {
  const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60

  // Stocker seulement les infos non sensibles
  const userInfo = {
    id: user.id,
    email: user.email,
    prenom: user.prenom,
    nom: user.nom,
    isSuperAdmin: user.isSuperAdmin,
    company: company
      ? {
          id: company.id,
          nom: company.nom,
          code: company.code,
        }
      : null,
  }

  response.cookies.set(USER_INFO_COOKIE, JSON.stringify(userInfo), {
    ...COOKIE_OPTIONS,
    httpOnly: false, // Accessible côté client pour l'UI
    maxAge,
  })
}

/**
 * Récupérer les tokens depuis les cookies (côté serveur)
 */
export async function getTokensFromCookies(request?: NextRequest): Promise<AuthTokens | null> {
  try {
    const cookieStore = request ? request.cookies : cookies()

    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
    const expiresAt = cookieStore.get('topsteel-token-expiry')?.value

    if (!accessToken) {
      return null
    }

    return {
      accessToken,
      refreshToken: refreshToken || '',
      expiresIn: 0,
      expiresAt: expiresAt ? parseInt(expiresAt) : Date.now(),
    }
  } catch {
    return null
  }
}

/**
 * Récupérer les informations utilisateur depuis les cookies
 */
export async function getUserInfoFromCookie(request?: NextRequest): Promise<{
  user: Partial<User> | null
  company: Partial<Company> | null
}> {
  try {
    const cookieStore = request ? request.cookies : cookies()
    const userInfoCookie = cookieStore.get(USER_INFO_COOKIE)?.value

    if (!userInfoCookie) {
      return { user: null, company: null }
    }

    const userInfo = JSON.parse(userInfoCookie)
    return {
      user: {
        id: userInfo.id,
        email: userInfo.email,
        prenom: userInfo.prenom,
        nom: userInfo.nom,
        isSuperAdmin: userInfo.isSuperAdmin,
      },
      company: userInfo.company,
    }
  } catch {
    return { user: null, company: null }
  }
}

/**
 * Effacer tous les cookies d'authentification
 */
export function clearAuthCookies(response: NextResponse): void {
  const cookiesToClear = [
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    USER_INFO_COOKIE,
    'topsteel-token-expiry',
  ]

  cookiesToClear.forEach((cookieName) => {
    response.cookies.set(cookieName, '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    })
  })
}

/**
 * Vérifier si les tokens sont expirés
 */
export function areTokensExpired(tokens: AuthTokens): boolean {
  if (!tokens.expiresAt) {
    return true
  }

  // Ajouter une marge de 5 minutes
  const now = Date.now()
  const buffer = 5 * 60 * 1000 // 5 minutes
  return now >= tokens.expiresAt - buffer
}

/**
 * Middleware pour rafraîchir automatiquement les tokens
 */
export async function refreshTokenMiddleware(
  request: NextRequest,
  refreshTokenFunction: (refreshToken: string) => Promise<AuthTokens | null>
): Promise<NextResponse | null> {
  const tokens = await getTokensFromCookies(request)

  if (!tokens || !tokens.refreshToken) {
    return null
  }

  if (areTokensExpired(tokens)) {
    try {
      const newTokens = await refreshTokenFunction(tokens.refreshToken)

      if (newTokens) {
        const response = NextResponse.next()
        await saveTokensInCookies(newTokens, response)
        return response
      }
    } catch {
      // En cas d'erreur, laisser la requête continuer
    }
  }

  return null
}

/**
 * Extraire le token d'accès pour les appels API
 */
export function extractAccessToken(request: NextRequest): string | null {
  // Vérifier d'abord l'en-tête Authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Sinon, récupérer depuis les cookies
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  return accessToken || null
}
