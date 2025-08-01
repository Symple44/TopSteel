import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/backend-error',
  '/unauthorized',
  '/_next',
  '/favicon.ico',
]

// Routes API qui nécessitent une authentification
const protectedApiRoutes = ['/api/user', '/api/admin', '/api/notifications']

export function middleware(request: NextRequest) {
  // Temporarily disable middleware to debug OpenTelemetry issues
  return NextResponse.next()

  const { pathname } = request.nextUrl

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Vérifier si c'est une route API protégée
  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route))

  // Récupérer le token depuis les cookies
  const token = request.cookies.get('accessToken')?.value

  // Pour les routes API protégées
  if (isProtectedApiRoute) {
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentification requise',
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    // Vérifier si le token est expiré (basique)
    try {
      if (!token) {
        throw new Error('Token is undefined')
      }

      // Vérifier le format JWT
      const tokenParts = token?.split('.')
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format')
      }

      const payload = JSON.parse(atob(tokenParts[1]))
      const now = Math.floor(Date.now() / 1000)

      if (payload.exp && payload.exp < now) {
        return NextResponse.json(
          {
            success: false,
            message: 'Token expiré',
            requiresAuth: true,
          },
          { status: 401 }
        )
      }
    } catch {
      // Si on ne peut pas décoder le token, on laisse passer
      // Le backend vérifiera la validité
    }
  }

  // Pour les pages (non-API)
  if (!pathname.startsWith('/api')) {
    if (!token) {
      // Éviter la boucle infinie : ne pas rediriger si on est déjà sur login
      if (pathname === '/login') {
        return NextResponse.next()
      }

      // Rediriger vers la page de login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
