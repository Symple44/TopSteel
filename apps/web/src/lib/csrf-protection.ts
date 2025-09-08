import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Protection CSRF pour Next.js
 * Implémente le pattern Double Submit Cookie avec validation stricte
 */

interface CsrfConfig {
  cookieName?: string
  headerName?: string
  secretLength?: number
  tokenExpiry?: number
  excludedPaths?: string[]
  sameSite?: 'strict' | 'lax' | 'none'
}

const defaultConfig: Required<CsrfConfig> = {
  cookieName: '__Host-csrf',
  headerName: 'x-csrf-token',
  secretLength: 32,
  tokenExpiry: 3600000, // 1 heure
  excludedPaths: [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/webhooks',
    '/api/health',
  ],
  sameSite: 'strict',
}

class CsrfProtection {
  private config: Required<CsrfConfig>
  private secret: string

  constructor(config?: CsrfConfig) {
    this.config = { ...defaultConfig, ...config }
    this.secret = process.env.CSRF_SECRET || this.generateSecret()

    if (!process.env.CSRF_SECRET) {
      console.warn('⚠️  CSRF_SECRET not set. Using generated secret (not recommended for production)')
    }
  }

  /**
   * Génère un nouveau token CSRF
   */
  generateToken(sessionId?: string): string {
    const timestamp = Date.now()
    const data = `${sessionId || 'anonymous'}:${timestamp}:${crypto.randomBytes(16).toString('hex')}`
    
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url')
  }

  /**
   * Valide un token CSRF
   */
  validateToken(token: string | null, sessionId?: string): boolean {
    if (!token) return false

    // Vérifier le format du token
    if (!/^[A-Za-z0-9_-]{43,}$/.test(token)) {
      return false
    }

    // Dans une implémentation complète, on vérifierait aussi :
    // - L'expiration du token
    // - L'association avec la session
    // - Le nombre d'utilisations
    
    return true
  }

  /**
   * Middleware pour protéger les routes API
   */
  middleware(request: NextRequest): NextResponse | null {
    const path = request.nextUrl.pathname
    const method = request.method

    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return null
    }

    // Skip CSRF for excluded paths
    if (this.config.excludedPaths.some(excluded => path.startsWith(excluded))) {
      return null
    }

    // Extract token from request
    const token = this.extractToken(request)
    const cookieToken = request.cookies.get(this.config.cookieName)?.value

    // Validate token
    if (!token || !cookieToken || token !== cookieToken) {
      return this.createErrorResponse('Invalid CSRF token', 403)
    }

    // Validate origin
    if (!this.validateOrigin(request)) {
      return this.createErrorResponse('Invalid origin', 403)
    }

    // Validate referer
    if (!this.validateReferer(request)) {
      return this.createErrorResponse('Invalid referer', 403)
    }

    return null // Continue to the route handler
  }

  /**
   * Crée une réponse avec un nouveau token CSRF
   */
  createTokenResponse(): NextResponse {
    const token = this.generateToken()
    const response = NextResponse.json({ token })

    // Set CSRF cookie
    response.cookies.set({
      name: this.config.cookieName,
      value: token,
      httpOnly: false, // Must be accessible by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: this.config.sameSite,
      maxAge: this.config.tokenExpiry / 1000,
      path: '/',
    })

    // Set response header
    response.headers.set('X-CSRF-Token', token)

    return response
  }

  /**
   * Ajoute un token CSRF à une réponse existante
   */
  addTokenToResponse(response: NextResponse): NextResponse {
    const token = this.generateToken()

    response.cookies.set({
      name: this.config.cookieName,
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: this.config.sameSite,
      maxAge: this.config.tokenExpiry / 1000,
      path: '/',
    })

    response.headers.set('X-CSRF-Token', token)

    return response
  }

  /**
   * Extrait le token CSRF de la requête
   */
  private extractToken(request: NextRequest): string | null {
    // Priority: Header > Body > Query
    return (
      request.headers.get(this.config.headerName) ||
      request.headers.get('x-xsrf-token') ||
      request.nextUrl.searchParams.get('_csrf') ||
      null
    )
  }

  /**
   * Valide l'origine de la requête
   */
  private validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (!origin) {
      // Same-origin request
      return true
    }

    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      process.env.NEXT_PUBLIC_APP_URL,
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
    ].filter(Boolean)

    return allowedOrigins.some(allowed => {
      if (!allowed) return false
      return origin === allowed || origin.startsWith(`${allowed}/`)
    })
  }

  /**
   * Valide le referer de la requête
   */
  private validateReferer(request: NextRequest): boolean {
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    if (!referer) {
      // No referer might be legitimate (direct API call)
      return process.env.NODE_ENV !== 'production'
    }

    try {
      const refererUrl = new URL(referer)
      return refererUrl.host === host
    } catch {
      return false
    }
  }

  /**
   * Génère un secret cryptographiquement sûr
   */
  private generateSecret(): string {
    return crypto.randomBytes(this.config.secretLength).toString('base64')
  }

  /**
   * Crée une réponse d'erreur
   */
  private createErrorResponse(message: string, status: number): NextResponse {
    return NextResponse.json(
      {
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status }
    )
  }
}

// Instance singleton
const csrfProtection = new CsrfProtection()

/**
 * Hook React pour utiliser CSRF dans les composants
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCsrfToken()
  }, [])

  const fetchCsrfToken = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/csrf-token')
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }

      const data = await response.json()
      setToken(data.token)
      
      // Also get from cookie as backup
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('__Host-csrf='))
        ?.split('=')[1]
      
      if (!data.token && cookieToken) {
        setToken(cookieToken)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Failed to fetch CSRF token:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = () => {
    fetchCsrfToken()
  }

  return { token, loading, error, refreshToken }
}

/**
 * Composant pour inclure automatiquement le token CSRF dans les formulaires
 */
export function CsrfTokenField() {
  const { token } = useCsrfToken()
  
  if (!token) return null
  
  return <input type="hidden" name="_csrf" value={token} />
}

/**
 * Intercepteur Axios pour ajouter automatiquement le token CSRF
 */
export function setupCsrfInterceptor(axiosInstance: any) {
  axiosInstance.interceptors.request.use(
    async (config: any) => {
      // Skip CSRF for safe methods
      if (['get', 'head', 'options'].includes(config.method?.toLowerCase() || '')) {
        return config
      }

      // Get CSRF token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('__Host-csrf='))
        ?.split('=')[1]

      if (token) {
        config.headers['x-csrf-token'] = token
      }

      return config
    },
    (error: any) => Promise.reject(error)
  )

  // Handle CSRF errors
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
        // Token expired or invalid, try to refresh
        try {
          const response = await fetch('/api/csrf-token')
          const data = await response.json()
          
          // Retry the original request with new token
          error.config.headers['x-csrf-token'] = data.token
          return axiosInstance.request(error.config)
        } catch {
          // Refresh failed, redirect to login
          window.location.href = '/login'
        }
      }
      
      return Promise.reject(error)
    }
  )
}

/**
 * Fonction utilitaire pour ajouter le token CSRF aux headers fetch
 */
export function getCsrfHeaders(): HeadersInit {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('__Host-csrf='))
    ?.split('=')[1]

  return token ? { 'x-csrf-token': token } : {}
}

// Export utilities
export {
  csrfProtection,
  CsrfProtection,
}

// Middleware export for Next.js
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  return csrfProtection.middleware(request)
}

// API route handler for getting CSRF token
export async function GET() {
  return csrfProtection.createTokenResponse()
}

import { useState, useEffect } from 'react'