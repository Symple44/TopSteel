import { safeFetch } from './fetch-safe'

// Configuration centralisée pour les appels backend
const BACKEND_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002',
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
  globalPrefix: 'api',
}

/**
 * Utilitaire centralisé pour les appels au backend NestJS
 * Gère automatiquement le versioning et la configuration
 */
export async function callBackendApi(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Vérifier que endpoint est bien une string
  if (typeof endpoint !== 'string') {
    throw new Error(`Expected string endpoint, got ${typeof endpoint}: ${endpoint}`)
  }

  // Construction automatique de l'URL avec préfixe et version
  const url = `${BACKEND_CONFIG.baseUrl}/${BACKEND_CONFIG.globalPrefix}/${BACKEND_CONFIG.apiVersion}/${endpoint.replace(/^\/+/, '')}`

  // Configuration par défaut avec credentials
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  return safeFetch(url, defaultOptions)
}

/**
 * Utilitaire pour extraire les headers d'authentification d'une requête Next.js
 */
export function getAuthHeaders(request: Request): Record<string, string> {
  // Vérifier que la requête et les headers existent
  if (!request || !request.headers) {
    return { 'Content-Type': 'application/json' }
  }

  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')

  let accessToken = null
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim())
    const accessTokenCookie = cookies.find((c) => c.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie.split('=')[1]
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authHeader) {
    headers.Authorization = authHeader
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }

  return headers
}

/**
 * Utilitaire pour faire un appel backend depuis une route API Next.js
 * Transmet automatiquement l'authentification
 */
export async function callBackendFromApi(
  request: Request,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders(request)

  return callBackendApi(endpoint, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  })
}

/**
 * Utilitaire spécialisé pour les endpoints de santé/monitoring
 * Ces endpoints peuvent avoir des timeouts différents et une gestion d'erreur spéciale
 */
export async function callHealthApi(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options

  const url = `${BACKEND_CONFIG.baseUrl}/${BACKEND_CONFIG.globalPrefix}/${BACKEND_CONFIG.apiVersion}/${endpoint.replace(/^\/+/, '')}`

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    signal: AbortSignal.timeout(timeout),
    ...fetchOptions,
  }

  return safeFetch(url, defaultOptions)
}

/**
 * Utilitaire pour les appels côté client (depuis les hooks/composants)
 * Utilise les routes API Next.js comme proxy
 */
export async function callClientApi(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Pour les appels côté client, on utilise les routes API Next.js
  const url = `/api/${endpoint.replace(/^\/+/, '')}`

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  return safeFetch(url, defaultOptions)
}

/**
 * Configuration actuelle du backend (pour debug/info)
 */
export function getBackendConfig() {
  return { ...BACKEND_CONFIG }
}
