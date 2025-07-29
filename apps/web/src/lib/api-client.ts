/**
 * ✅ API CLIENT ENTERPRISE - VERSION SÉCURISÉE ET CORRIGÉE
 *
 * Fonctionnalités:
 * - Retry automatique avec backoff
 * - Cache intelligent multi-niveaux
 * - Gestion d'erreurs robuste
 * - Types stricts
 * - Rate limiting client
 * - Authentication automatique
 */

import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  cache?: boolean
  cacheTTL?: number
  retry?: boolean
  retryAttempts?: number
  timeout?: number
  requireAuth?: boolean
}

interface CacheEntry {
  data: unknown
  timestamp: number
  ttl: number
}

interface APIErrorDetails {
  code: string
  message: string
  details?: unknown
  timestamp: number
  requestId?: string
}

interface APIMetrics {
  requests: number
  errors: number
  cacheHits: number
  avgResponseTime: number
}

/**
 * Rate limiter simple
 */
function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests: number[] = []

  return (operation: () => void) => () => {
    const now = Date.now()

    // Nettoyer les requêtes anciennes
    while (requests.length > 0 && requests[0] < now - windowMs) {
      requests.shift()
    }

    if (requests.length >= maxRequests) {
      throw new Error('Rate limit exceeded')
    }

    requests.push(now)

    return operation()
  }
}

/**
 * Classe d'erreur API personnalisée
 */
export class APIError extends Error {
  public readonly code: string
  public readonly details: unknown
  public readonly timestamp: number
  public readonly requestId?: string

  constructor(errorDetails: APIErrorDetails) {
    super(errorDetails.message)
    this.name = 'APIError'
    this.code = errorDetails.code
    this.details = errorDetails.details
    this.timestamp = errorDetails.timestamp
    this.requestId = errorDetails.requestId
  }

  /**
   * Vérification si l'erreur est une erreur réseau
   */
  isNetworkError(): boolean {
    return this.code.startsWith('HTTP_') || this.code === 'NETWORK_ERROR'
  }

  /**
   * Vérification si l'erreur est une erreur d'authentification
   */
  isAuthError(): boolean {
    return this.code === 'HTTP_401' || this.code === 'HTTP_403'
  }

  /**
   * Vérification si l'erreur est récupérable
   */
  isRetryable(): boolean {
    const retryableCodes = ['HTTP_500', 'HTTP_502', 'HTTP_503', 'HTTP_504', 'NETWORK_ERROR']

    return retryableCodes.includes(this.code)
  }
}

/**
 * Client API principal
 */
export class APIClient {
  protected baseURL: string
  protected cache = new Map<string, CacheEntry>()
  protected rateLimiter = createRateLimiter(100, 60000) // 100 req/min
  protected metrics: APIMetrics = {
    requests: 0,
    errors: 0,
    cacheHits: 0,
    avgResponseTime: 0,
  }

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '')
    this.startCacheCleanup()
  }

  /**
   * Nettoyage automatique du cache
   */
  private startCacheCleanup(): void {
    setInterval(
      () => {
        const now = Date.now()

        for (const [key, entry] of this.cache.entries()) {
          if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key)
          }
        }
      },
      5 * 60 * 1000
    ) // Nettoyage toutes les 5 minutes
  }

  /**
   * Vérification du cache
   */
  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    const now = Date.now()

    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)

      return null
    }

    this.metrics.cacheHits++

    return entry.data as T
  }

  /**
   * Stockage en cache
   */
  private setCachedData(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Construction de la clé de cache - CHANGÉ EN PROTECTED pour accès par héritage
   */
  protected getCacheKey(endpoint: string, config: RequestConfig): string {
    const method = config.method || 'GET'
    const body = config.body ? JSON.stringify(config.body) : ''

    return `${method}:${endpoint}:${body}`
  }

  /**
   * Construction des headers
   */
  private buildHeaders(config: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...config.headers,
    }

    // Authentification automatique
    if (config.requireAuth !== false) {
      const token = this.getAuthToken()

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    return headers
  }

  /**
   * Récupération du token d'authentification
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const authData = localStorage.getItem('topsteel-tokens')

      if (!authData) return null

      const tokenData = JSON.parse(authData)
      const { accessToken } = tokenData

      return accessToken || null
    } catch {
      return null
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: unknown, endpoint: string): never {
    this.metrics.errors++

    const errorDetails: APIErrorDetails = {
      code: (error as { code?: string }).code || 'UNKNOWN_ERROR',
      message: (error as { message?: string }).message || 'Une erreur inconnue est survenue',
      details: (error as { details?: unknown }).details || null,
      timestamp: Date.now(),
      requestId: (error as { requestId?: string }).requestId || `req_${Date.now()}`,
    }

    // Log simple (sans dépendance externe)
    console.error(`🔴 API Error [${endpoint}]:`, {
      code: errorDetails.code,
      message: errorDetails.message,
      timestamp: new Date(errorDetails.timestamp).toISOString(),
    })

    throw new APIError(errorDetails)
  }

  /**
   * Retry avec backoff exponentiel
   */
  private async executeWithRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation()
      } catch (error) {
        if (i === attempts - 1) throw error

        // Backoff exponentiel
        const delay = Math.min(1000 * 2 ** i, 10000)

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retry attempts reached')
  }

  /**
   * Exécution de requête avec timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout = 30000): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      ),
    ])
  }

  /**
   * Requête générique avec toutes les fonctionnalités
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const startTime = Date.now()

    this.metrics.requests++

    try {
      // Vérification du rate limiting
      this.rateLimiter(() => {})()

      // Vérification du cache pour les requêtes GET
      if ((config.method || 'GET') === 'GET' && config.cache !== false) {
        const cacheKey = this.getCacheKey(endpoint, config)
        const cachedData = this.getCachedData<T>(cacheKey)

        if (cachedData) return cachedData
      }

      // Préparation de la requête
      const url = `${this.baseURL}${endpoint}`
      const headers = this.buildHeaders(config)

      const fetchConfig: RequestInit = {
        method: config.method || 'GET',
        headers,
        ...(config.body ? { body: JSON.stringify(config.body) } : {}),
      }

      // Exécution avec retry et timeout
      const operation = async () => {
        const response = await safeFetch(url, fetchConfig)

        if (!response.ok) {
          throw {
            code: `HTTP_${response.status}`,
            message: response.statusText,
            details: { status: response.status, statusText: response.statusText },
          }
        }

        return response.json()
      }

      const result = await this.executeWithTimeout(
        config.retry !== false
          ? () => this.executeWithRetry(operation, config.retryAttempts)
          : operation,
        config.timeout
      )

      // Mise en cache pour les requêtes GET
      if ((config.method || 'GET') === 'GET' && config.cache !== false) {
        const cacheKey = this.getCacheKey(endpoint, config)
        const cacheTTL = config.cacheTTL || 5 * 60 * 1000 // 5 minutes par défaut

        this.setCachedData(cacheKey, result, cacheTTL)
      }

      // Métriques
      const responseTime = Date.now() - startTime

      this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2

      return result
    } catch (error) {
      this.handleError(error, endpoint)
    }
  }

  /**
   * Requête GET avec cache
   */
  async get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  /**
   * Requête POST
   */
  async post<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data,
      cache: false, // POST jamais en cache
    })
  }

  /**
   * Requête PUT
   */
  async put<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data,
      cache: false,
    })
  }

  /**
   * Requête DELETE
   */
  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
      cache: false,
    })
  }

  /**
   * Requête PATCH
   */
  async patch<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data,
      cache: false,
    })
  }

  /**
   * Upload de fichier
   */
  async upload<T>(endpoint: string, formData: FormData, config: RequestConfig = {}): Promise<T> {
    const uploadConfig = {
      ...config,
      method: 'POST' as const,
      headers: {
        // Ne pas définir Content-Type pour FormData (le navigateur le fera)
        ...config.headers,
      },
    }

    // Supprimer Content-Type pour les uploads
    if (uploadConfig.headers && 'Content-Type' in uploadConfig.headers) {
      const { 'Content-Type': removed, ...restHeaders } = uploadConfig.headers
      uploadConfig.headers = restHeaders
    }

    const url = `${this.baseURL}${endpoint}`
    const headers = this.buildHeaders(uploadConfig)

    const response = await safeFetch(url, {
      method: 'POST',
      headers: Object.fromEntries(
        Object.entries(headers).filter(([key]) => key !== 'Content-Type')
      ),
      body: formData,
    })

    if (!response.ok) {
      throw {
        code: `HTTP_${response.status}`,
        message: response.statusText,
        details: { status: response.status, statusText: response.statusText },
      }
    }

    return response.json()
  }

  /**
   * Invalidation du cache
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()

      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Récupération des métriques
   */
  getMetrics(): APIMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset des métriques
   */
  resetMetrics(): void {
    this.metrics = {
      requests: 0,
      errors: 0,
      cacheHits: 0,
      avgResponseTime: 0,
    }
  }

  /**
   * Creates a context key for React Query or similar state management
   */
  createContextKey(domain: string, resource?: string, id?: string | number): string[] {
    const parts = [domain]
    
    if (resource) {
      parts.push(resource)
    }
    
    if (id !== undefined) {
      parts.push(String(id))
    }
    
    return parts
  }
}

// ✅ INSTANCE GLOBALE EXPORTÉE
export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || '/api'
)

// ✅ TYPES EXPORTÉS
export type { APIErrorDetails, APIMetrics, RequestConfig }
