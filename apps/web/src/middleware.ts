import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  // Pages d'authentification
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  // Pages publiques
  '/privacy',
  '/terms',
  '/support',
  '/backend-error',
  '/unauthorized',
  // Assets Next.js
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
] as const

// Routes API publiques
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/validate',
  '/api/health',
  '/api/config',
] as const

// Routes API protégées (toutes les autres routes API sauf les publiques)
const PROTECTED_API_PREFIXES = [
  '/api/user',
  '/api/admin',
  '/api/notifications',
  '/api/query-builder',
  '/api/search',
  '/api/images',
  '/api/datatable',
  '/api/translations',
  '/api/ui-preferences',
  '/api/parameters',
  '/api/test-tables',
  '/api/users',
  '/api/v1',
] as const

// Rôles autorisés pour les routes admin
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const

// Interface pour le payload JWT
interface JWTPayload {
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
 * Vérifie si une route est publique
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))
}

/**
 * Vérifie si une route API est publique
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route))
}

/**
 * Vérifie si une route API est protégée
 */
function _isProtectedApiRoute(pathname: string): boolean {
  if (!pathname.startsWith('/api')) return false
  if (isPublicApiRoute(pathname)) return false

  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Décode et valide un token JWT côté client (validation basique)
 */
function validateJWTStructure(token: string): {
  valid: boolean
  payload?: JWTPayload
  error?: string
} {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Format JWT invalide' }
    }

    // Décoder le payload (base64url) - version sécurisée
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    // Ajouter padding si nécessaire
    while (base64.length % 4) {
      base64 += '='
    }

    const payload = JSON.parse(atob(base64)) as JWTPayload

    // Vérifications basiques obligatoires
    if (!payload.sub || !payload.email || !payload.exp || !payload.iat) {
      return { valid: false, error: 'Payload JWT incomplet' }
    }

    // Vérifier l'expiration avec marge
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) {
      return { valid: false, error: 'Token expiré' }
    }

    // Vérifier que le token n'est pas émis dans le futur (tolérance 60s)
    if (payload.iat > now + 60) {
      return { valid: false, error: 'Token émis dans le futur' }
    }

    // Vérifier la durée de vie maximale (24h)
    if (payload.exp - payload.iat > 24 * 60 * 60) {
      return { valid: false, error: 'Durée de vie token trop longue' }
    }

    return { valid: true, payload }
  } catch {
    return { valid: false, error: 'Erreur de décodage JWT' }
  }
}

/**
 * Vérifie si l'utilisateur a les permissions administrateur
 */
function hasAdminAccess(payload: JWTPayload): boolean {
  // Vérifier le rôle principal
  if (ADMIN_ROLES.includes(payload.role as any)) {
    return true
  }

  // Vérifier dans les rôles multiples (si disponible)
  if (payload.roles && Array.isArray(payload.roles)) {
    return payload.roles.some((role) => ADMIN_ROLES.includes(role as any))
  }

  return false
}

/**
 * Ajoute les headers utilisateur de manière centralisée
 */
function addUserHeaders(response: NextResponse, payload: JWTPayload): NextResponse {
  response.headers.set('x-user-id', payload.sub)
  response.headers.set('x-user-email', payload.email)
  response.headers.set('x-user-role', payload.role)

  if (payload.societeId) {
    response.headers.set('x-user-societe-id', payload.societeId)
  }

  if (payload.roles && Array.isArray(payload.roles)) {
    response.headers.set('x-user-roles', payload.roles.join(','))
  }

  if (payload.permissions && Array.isArray(payload.permissions)) {
    response.headers.set('x-user-permissions', payload.permissions.join(','))
  }

  return response
}

/**
 * Crée une réponse d'erreur standardisée pour les API
 */
function createApiErrorResponse(message: string, status: number = 401) {
  return NextResponse.json(
    {
      success: false,
      message,
      requiresAuth: status === 401,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Crée une redirection vers la page de login
 */
function createLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'

  // Conserver la route de destination pour redirection après login
  if (request.nextUrl.pathname !== '/login' && !request.nextUrl.pathname.startsWith('/api')) {
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  }

  // Nettoyer les paramètres sensibles
  loginUrl.searchParams.delete('token')
  loginUrl.searchParams.delete('session')

  return NextResponse.redirect(loginUrl)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // === ÉTAPE 1: Gestion des routes publiques ===
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // === ÉTAPE 2: Récupération et validation du token ===
  const accessToken = request.cookies.get('accessToken')?.value

  // Pas de token du tout
  if (!accessToken) {
    if (pathname.startsWith('/api')) {
      return isPublicApiRoute(pathname)
        ? NextResponse.next()
        : createApiErrorResponse("Token d'accès manquant")
    }
    return createLoginRedirect(request)
  }

  // Validation de la structure du token
  const tokenValidation = validateJWTStructure(accessToken)
  if (!tokenValidation.valid) {
    if (pathname.startsWith('/api')) {
      return isPublicApiRoute(pathname)
        ? NextResponse.next()
        : createApiErrorResponse(`Token invalide: ${tokenValidation.error}`)
    }
    return createLoginRedirect(request)
  }

  const { payload } = tokenValidation

  // === ÉTAPE 3: Gestion des routes API ===
  if (pathname.startsWith('/api')) {
    // Routes API publiques
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next()
    }

    // Routes API protégées - ajouter headers utilisateur
    return addUserHeaders(NextResponse.next(), payload!)
  }

  // === ÉTAPE 4: Contrôle d'accès pour les pages admin ===
  if (pathname.startsWith('/admin') && !hasAdminAccess(payload!)) {
    const unauthorizedUrl = request.nextUrl.clone()
    unauthorizedUrl.pathname = '/unauthorized'
    return NextResponse.redirect(unauthorizedUrl)
  }

  // === ÉTAPE 5: Pages protégées - ajouter headers utilisateur ===
  return addUserHeaders(NextResponse.next(), payload!)
}

// Configuration du middleware - Routes à traiter
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico, robots.txt, sitemap.xml
     * - fichiers publics (.ico, .png, .jpg, .svg, etc.)
     * - _vercel (déploiement Vercel)
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|css|js|map)$).*)',
  ],
}
