import { safeFetch } from './fetch-safe'

// Configuration centralisée pour les appels backend
const BACKEND_CONFIG = {
  baseUrl: process?.env?.NEXT_PUBLIC_API_URL || process?.env?.API_URL || 'http://localhost:3002',
  globalPrefix: 'api',
}

// ============================================================================
// Types & Errors
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface RequestConfig {
  method?: string
  headers?: Record<string, string>
  body?: unknown
}

export interface APIMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
}

export interface APIErrorDetails {
  message: string
  code?: string
  status?: number
}

export interface APIClientInterface {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, data?: unknown) => Promise<T>
  put: <T>(url: string, data?: unknown) => Promise<T>
  patch: <T>(url: string, data?: unknown) => Promise<T>
  delete: <T>(url: string) => Promise<T>
}

// ============================================================================
// Token & Cookie Utilities
// ============================================================================

/**
 * Get the access token from cookies (client-side)
 */
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'accessToken') {
      return value
    }
  }
  return null
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

  // Construction automatique de l'URL avec préfixe
  const url = `${BACKEND_CONFIG?.baseUrl}/${BACKEND_CONFIG?.globalPrefix}/${endpoint?.replace(/^\/+/, '')}`

  // Extract headers from options to merge properly
  const { headers: optionHeaders, ...restOptions } = options

  // Configuration par défaut avec credentials
  const defaultOptions: RequestInit = {
    credentials: 'include',
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(optionHeaders as Record<string, string>),
    },
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

  const authHeader = request?.headers?.get('authorization')
  const cookieHeader = request?.headers?.get('cookie')

  let accessToken = null
  if (cookieHeader) {
    const cookies = cookieHeader?.split(';').map((c) => c?.trim())
    const accessTokenCookie = cookies?.find((c) => c?.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie?.split('=')[1]
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
  const { timeout = 5000, headers: optionHeaders, ...restOptions } = options || {}

  const url = `${BACKEND_CONFIG?.baseUrl}/${BACKEND_CONFIG?.globalPrefix}/${endpoint?.replace(/^\/+/, '')}`

  const defaultOptions: RequestInit = {
    credentials: 'include',
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(optionHeaders as Record<string, string>),
    },
    signal: AbortSignal?.timeout(timeout),
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
  const url = `/api/${endpoint?.replace(/^\/+/, '')}`

  // Extract headers from options to merge properly
  const { headers: optionHeaders, ...restOptions } = options

  // Normalize headers to a plain object (handles Headers instances and arrays)
  let normalizedHeaders: Record<string, string> = {}
  if (optionHeaders) {
    if (optionHeaders instanceof Headers) {
      optionHeaders.forEach((value, key) => {
        normalizedHeaders[key] = value
      })
    } else if (Array.isArray(optionHeaders)) {
      optionHeaders.forEach(([key, value]) => {
        normalizedHeaders[key] = value
      })
    } else {
      normalizedHeaders = optionHeaders as Record<string, string>
    }
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...normalizedHeaders,
  }

  const defaultOptions: RequestInit = {
    credentials: 'include',
    ...restOptions,
    headers: finalHeaders,
  }

  // Debug logging
  console.log('[callClientApi] URL:', url)
  console.log('[callClientApi] Headers being sent:', finalHeaders)
  console.log('[callClientApi] Authorization header:', finalHeaders['Authorization'] || finalHeaders['authorization'] || 'NOT SET')

  return safeFetch(url, defaultOptions)
}

/**
 * Configuration actuelle du backend (pour debug/info)
 */
export function getBackendConfig() {
  return { ...BACKEND_CONFIG }
}

// ============================================================================
// Typed Fetch Utilities (consolidated from api-typed.ts)
// ============================================================================

/**
 * Fetch with automatic typing and auth token handling
 */
export async function fetchTyped<T>(url: string, options?: RequestInit): Promise<T> {
  const apiUrl = url.startsWith('/api') ? url : `/api${url}`
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BACKEND_CONFIG.baseUrl}${apiUrl}`, {
    ...options,
    credentials: 'include',
    headers,
  })
  if (!response.ok) throw new APIError(`Request failed: ${response.status}`, response.status)
  return response.json()
}

export async function postTyped<T>(url: string, data?: unknown): Promise<T> {
  return fetchTyped<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function putTyped<T>(url: string, data?: unknown): Promise<T> {
  return fetchTyped<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function deleteTyped<T>(url: string): Promise<T> {
  return fetchTyped<T>(url, { method: 'DELETE' })
}

// ============================================================================
// API Client Object (consolidated from api-client.ts)
// ============================================================================

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const apiUrl = url.startsWith('/api') ? url : `/api${url}`
  const response = await fetch(`${BACKEND_CONFIG.baseUrl}${apiUrl}`, {
    ...options,
    credentials: 'include',
  })
  if (!response.ok) throw new APIError('Request failed', response.status)
  return response.json()
}

export const apiClient: APIClientInterface = {
  get: async <T>(url: string): Promise<T> => request<T>(url),
  post: async <T>(url: string, data?: unknown): Promise<T> =>
    request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: async <T>(url: string, data?: unknown): Promise<T> =>
    request<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: async <T>(url: string, data?: unknown): Promise<T> =>
    request<T>(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: async <T>(url: string): Promise<T> => request<T>(url, { method: 'DELETE' }),
}

// ============================================================================
// Data Extraction Helpers
// ============================================================================

export function hasDataProperty<T>(obj: unknown): obj is { data: T } {
  return typeof obj === 'object' && obj !== null && 'data' in obj
}

export function ensureDataProperty<T>(response: unknown): T {
  if (hasDataProperty<T>(response)) return response.data
  return response as T
}

export function extractOrDefault<T>(response: unknown, defaultValue: T): T {
  try {
    if (hasDataProperty<T>(response)) return response.data
    return (response as T) ?? defaultValue
  } catch {
    return defaultValue
  }
}
