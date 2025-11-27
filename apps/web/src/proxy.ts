import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { areTokensExpired, getTokensFromCookies } from './lib/auth/cookie-auth'

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
  '/api/csrf/token',
  '/api/csrf/config',
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
  return PUBLIC_ROUTES?.some((route) => pathname === route || pathname?.startsWith(route))
}

/**
 * Vérifie si une route API est publique
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES?.some((route) => pathname === route || pathname?.startsWith(route))
}

/**
 * Vérifie si une route API est protégée
 */
function _isProtectedApiRoute(pathname: string): boolean {
  if (!pathname?.startsWith('/api')) return false
  if (isPublicApiRoute(pathname)) return false

  return PROTECTED_API_PREFIXES?.some((prefix) => pathname?.startsWith(prefix))
}

/**
 * Vérifie la structure basique d'un token JWT côté client
 * Note: Cette validation est uniquement pour le routing côté client.
 * La validation cryptographique réelle est effectuée côté serveur.
 */
function validateJWTStructure(token: string): {
  valid: boolean
  payload?: JWTPayload
  error?: string
} {
  try {
    // Validation basique du format
    const parts = token?.split('.')
    if (parts?.length !== 3) {
      return { valid: false, error: 'Session invalide' }
    }

    // Décoder le payload pour vérifier l'expiration uniquement
    let base64 = parts?.[1]?.replace(/-/g, '+').replace(/_/g, '/')
    while (base64?.length % 4) {
      base64 += '='
    }

    const payload = JSON.parse(atob(base64)) as JWTPayload

    // Vérification minimale de structure
    if (!payload?.sub || !payload?.exp) {
      return { valid: false, error: 'Session invalide' }
    }

    // Vérifier uniquement l'expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload?.exp <= now) {
      return { valid: false, error: 'Session expirée' }
    }

    // Note: La validation complète et sécurisée est effectuée côté serveur
    // Cette fonction est uniquement pour optimiser l'expérience utilisateur
    return { valid: true, payload }
  } catch {
    return { valid: false, error: 'Session invalide' }
  }
}

/**
 * Vérifie si l'utilisateur a les permissions administrateur
 */
function hasAdminAccess(payload: JWTPayload): boolean {
  // Vérifier le rôle principal
  if (ADMIN_ROLES?.includes(payload?.role as (typeof ADMIN_ROLES)[number])) {
    return true
  }

  // Vérifier dans les rôles multiples (si disponible)
  if (payload.roles && Array.isArray(payload.roles)) {
    return payload?.roles?.some((role) =>
      ADMIN_ROLES?.includes(role as (typeof ADMIN_ROLES)[number])
    )
  }

  return false
}

/**
 * Valide l'accès au tenant
 */
function validateTenantAccess(payload: JWTPayload, requestedTenantId?: string): boolean {
  // Si un tenant spécifique est demandé, vérifier que l'utilisateur y a accès
  if (requestedTenantId && payload?.societeId !== requestedTenantId) {
    return false
  }
  return true
}

/**
 * Ajoute les headers utilisateur de manière centralisée
 */
function addUserHeaders(
  response: NextResponse,
  payload: JWTPayload,
  request: NextRequest
): NextResponse {
  // Vérifier l'accès au tenant si spécifié dans la requête
  const requestedTenantId = request?.headers?.get('x-tenant-id')
  if (requestedTenantId && !validateTenantAccess(payload, requestedTenantId)) {
    return createApiErrorResponse('Accès non autorisé à ce tenant', 403)
  }

  response?.headers?.set('x-user-id', payload?.sub)
  response?.headers?.set('x-user-email', payload?.email)
  response?.headers?.set('x-user-role', payload?.role)

  if (payload?.societeId) {
    response?.headers?.set('x-user-societe-id', payload?.societeId)
  }

  if (payload.roles && Array.isArray(payload.roles)) {
    response?.headers?.set('x-user-roles', payload?.roles?.join(','))
  }

  if (payload.permissions && Array.isArray(payload.permissions)) {
    response?.headers?.set('x-user-permissions', payload?.permissions?.join(','))
  }

  return response
}

/**
 * Crée une réponse d'erreur standardisée pour les API
 */
function createApiErrorResponse(message: string, status: number = 401) {
  return NextResponse?.json(
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
  const loginUrl = request?.nextUrl?.clone()
  if (loginUrl) {
    loginUrl.pathname = '/login'
  }

  // Conserver la route de destination pour redirection après login
  if (request?.nextUrl?.pathname !== '/login' && !request?.nextUrl?.pathname?.startsWith('/api')) {
    loginUrl?.searchParams?.set('redirect', request?.nextUrl?.pathname)
  }

  // Nettoyer les paramètres sensibles
  loginUrl?.searchParams?.delete('token')
  loginUrl?.searchParams?.delete('session')

  return NextResponse?.redirect(loginUrl)
}

// Mapping des anciennes URLs vers les nouvelles
const redirectMap: Record<string, string> = {
  // Anciennes routes protected vers (app)
  '/protected/partners': '/partners',
  '/protected/partners/clients': '/partners/clients',
  '/protected/partners/suppliers': '/partners/suppliers',
  '/protected/inventory': '/inventory',
  '/protected/inventory/materials': '/inventory/materials',
  '/protected/inventory/articles': '/inventory/articles',
  '/protected/inventory/stock': '/inventory/stock',
  '/protected/sales': '/sales',
  '/protected/sales/quotes': '/sales/quotes',
  '/protected/sales/orders': '/sales/orders',
  '/protected/finance': '/finance',
  '/protected/finance/invoices': '/finance/invoices',
  '/protected/projects': '/projects',
}

/**
 * Ajoute les headers de sécurité
 */
function addSecurityHeaders(response: NextResponse, _request: NextRequest): NextResponse {
  // Headers de sécurité essentiels
  response?.headers?.set('X-Frame-Options', 'DENY')
  response?.headers?.set('X-Content-Type-Options', 'nosniff')
  response?.headers?.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response?.headers?.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy strict - Production ready
  const isDevelopment = process?.env?.NODE_ENV === 'development'

  // Generate cryptographically secure nonce for inline scripts/styles
  // Use Web Crypto API (compatible with Edge Runtime)
  const nonce = crypto.randomUUID()
  response?.headers?.set('X-CSP-Nonce', nonce)
  response?.headers?.set('X-Nonce', nonce) // Legacy support

  // Enhanced CSP - very permissive in dev, strict in production
  const cspDirectives = isDevelopment
    ? [
        "default-src 'self'",
        // Very permissive for development - allows inline styles/scripts
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        "img-src 'self' data: blob: https:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' ws://localhost:* http://localhost:* https: wss:",
        "frame-src 'none'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "media-src 'self'",
        "worker-src 'self' blob:",
        "base-uri 'self'",
        "form-action 'self'",
        "manifest-src 'self'",
        "child-src 'none'",
      ]
    : [
        "default-src 'self'",
        // Strict nonce-based CSP for production
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        `style-src 'self' 'nonce-${nonce}'`,
        "img-src 'self' data: blob: https:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' https: wss:",
        "frame-src 'none'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "media-src 'self'",
        "worker-src 'self' blob:",
        "base-uri 'self'",
        "form-action 'self'",
        "manifest-src 'self'",
        "child-src 'none'",
      ]

  // Add upgrade-insecure-requests in production
  if (!isDevelopment) {
    cspDirectives?.push('upgrade-insecure-requests')
  }

  // Add CSP violation reporting (disabled in development to avoid backend connection errors)
  if (!isDevelopment) {
    const reportUri = 'https://api.topsteel.fr/api/security/csp-violations'
    cspDirectives?.push(`report-uri ${reportUri}`)
  }

  const csp = cspDirectives?.join('; ')
  response?.headers?.set('Content-Security-Policy', csp)

  // Additional security headers
  if (!isDevelopment) {
    response?.headers?.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Permissions Policy (removed 'speaker' as it's not a valid feature)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'fullscreen=(self)',
  ].join(', ')
  response?.headers?.set('Permissions-Policy', permissionsPolicy)

  // Cross-Origin policies
  response?.headers?.set('Cross-Origin-Opener-Policy', 'same-origin')
  response?.headers?.set('Cross-Origin-Resource-Policy', 'same-origin')

  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // === ÉTAPE 0: Gestion des redirections ===
  // Vérifier si l'URL nécessite une redirection
  if (redirectMap[pathname]) {
    const url = request?.nextUrl?.clone()
    if (url) {
      url.pathname = redirectMap[pathname]
    }
    return NextResponse?.redirect(url, { status: 301 }) // 301 = Permanent redirect
  }

  // Redirection générique pour toutes les routes /protected/*
  if (pathname?.startsWith('/protected/')) {
    const newPath = pathname?.replace('/protected/', '/')
    const url = request?.nextUrl?.clone()
    if (url) {
      url.pathname = newPath
    }
    return NextResponse?.redirect(url, { status: 301 })
  }

  // === ÉTAPE 1: Gestion des routes publiques ===
  if (isPublicRoute(pathname)) {
    return addSecurityHeaders(NextResponse?.next(), request)
  }

  // === ÉTAPE 2: Récupération et validation du token ===
  // Récupérer les tokens depuis les cookies HttpOnly
  const tokens = await getTokensFromCookies(request)

  // Essayer aussi depuis le cookie non-HttpOnly pour la compatibilité
  const legacyToken = request.cookies?.get('accessToken')?.value
  const accessToken = tokens?.accessToken || legacyToken

  // Pas de token du tout
  if (!accessToken) {
    if (pathname?.startsWith('/api')) {
      return isPublicApiRoute(pathname)
        ? NextResponse?.next()
        : createApiErrorResponse("Token d'accès manquant")
    }
    return createLoginRedirect(request)
  }

  // Vérifier si le token doit être rafraîchi (seulement pour les tokens depuis cookies HttpOnly)
  if (tokens && areTokensExpired(tokens) && tokens?.refreshToken) {
    // Note: Le rafraîchissement automatique peut être géré par un intercepteur côté client
    // ou dans les routes API individuelles
  }

  // Validation de la structure du token
  const tokenValidation = validateJWTStructure(accessToken)
  if (!tokenValidation?.valid) {
    if (pathname?.startsWith('/api')) {
      return isPublicApiRoute(pathname)
        ? NextResponse?.next()
        : createApiErrorResponse(`Token invalide: ${tokenValidation.error}`)
    }
    return createLoginRedirect(request)
  }

  const { payload } = tokenValidation || {}

  // === ÉTAPE 3: Gestion des routes API ===
  if (pathname?.startsWith('/api')) {
    // Routes API publiques
    if (isPublicApiRoute(pathname)) {
      return addSecurityHeaders(NextResponse?.next(), request)
    }

    // Routes API protégées - ajouter headers utilisateur
    const response = addUserHeaders(NextResponse?.next(), payload!, request)
    return addSecurityHeaders(response, request)
  }

  // === ÉTAPE 4: Contrôle d'accès pour les pages admin ===
  if (pathname?.startsWith('/admin') && !hasAdminAccess(payload!)) {
    const unauthorizedUrl = request?.nextUrl?.clone()
    if (unauthorizedUrl) {
      unauthorizedUrl.pathname = '/unauthorized'
    }
    return NextResponse?.redirect(unauthorizedUrl)
  }

  // === ÉTAPE 5: Pages protégées - ajouter headers utilisateur ===
  const response = addUserHeaders(NextResponse?.next(), payload!, request)
  return addSecurityHeaders(response, request)
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
