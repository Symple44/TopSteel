/**
 * ✅ API CLIENT ENTERPRISE - VERSION SÉCURISÉE
 * 
 * Fonctionnalités:
 * - Retry automatique avec backoff
 * - Cache intelligent multi-niveaux
 * - Gestion d'erreurs robuste
 * - Monitoring et métriques
 * - Types stricts
 * - Rate limiting client
 * - Authentication automatique
 */

import { SecurityUtils } from '@/lib/security/security-enhanced'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  cache?: boolean
  cacheTTL?: number
  retry?: boolean
  retryAttempts?: number
  timeout?: number
  requireAuth?: boolean
}

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

interface APIErrorDetails {
  code: string
  message: string
  details?: any
  timestamp: number
  requestId?: string
}

interface APIMetrics {
  requests: number
  errors: number
  cacheHits: number
  avgResponseTime: number
}

// ✅ SÉPARATION CLAIRE - Pas de fusion class/interface
class APIClientBase {
  protected baseURL: string
  protected cache = new Map<string, CacheEntry>()
  protected rateLimiter = SecurityUtils.createRateLimiter(100, 60000) // 100 req/min
  protected metrics: APIMetrics = {
    requests: 0,
    errors: 0,
    cacheHits: 0,
    avgResponseTime: 0
  }

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '')
    this.startCacheCleanup()
  }

  /**
   * Nettoyage automatique du cache
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
        }
      }
    }, 5 * 60 * 1000) // Nettoyage toutes les 5 minutes
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
    return entry.data
  }

  /**
   * Stockage en cache
   */
  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Construction de la clé de cache
   */
  private getCacheKey(endpoint: string, config: RequestConfig): string {
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
      ...config.headers
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
      
      const { accessToken } = JSON.parse(authData)
      return accessToken || null
    } catch {
      return null
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any, endpoint: string): never {
    this.metrics.errors++
    
    const errorDetails: APIErrorDetails = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Une erreur inconnue est survenue',
      details: error.details || null,
      timestamp: Date.now(),
      requestId: error.requestId || `req_${Date.now()}`
    }

    // Log sécurisé
    SecurityUtils.logSecurityEvent('api_error', {
      endpoint,
      error: errorDetails.code,
      message: errorDetails.message
    })

    throw new APIError(errorDetails)
  }

  /**
   * Retry avec backoff exponentiel
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempts: number = 3
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation()
      } catch (error) {
        if (i === attempts - 1) throw error
        
        // Backoff exponentiel
        const delay = Math.min(1000 * Math.pow(2, i), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retry attempts reached')
  }

  /**
   * Exécution de requête avec timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = 30000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ])
  }
}

// ✅ CLASSE PRINCIPALE - Extension claire sans fusion d'interface
export class APIClient extends APIClientBase {
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
        ...(config.body && { body: JSON.stringify(config.body) })
      }

      // Exécution avec retry et timeout
      const operation = async () => {
        const response = await fetch(url, fetchConfig)
        
        if (!response.ok) {
          throw {
            code: `HTTP_${response.status}`,
            message: response.statusText,
            details: { status: response.status, statusText: response.statusText }
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
  async post<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { 
      ...config, 
      method: 'POST', 
      body: data,
      cache: false // POST jamais en cache
    })
  }

  /**
   * Requête PUT
   */
  async put<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { 
      ...config, 
      method: 'PUT', 
      body: data,
      cache: false
    })
  }

  /**
   * Requête DELETE
   */
  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { 
      ...config, 
      method: 'DELETE',
      cache: false
    })
  }

  /**
   * Requête PATCH
   */
  async patch<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { 
      ...config, 
      method: 'PATCH', 
      body: data,
      cache: false
    })
  }

  /**
   * Upload de fichier
   */
  async upload<T>(endpoint: string, file: File, config: RequestConfig = {}): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const uploadConfig = {
      ...config,
      method: 'POST' as const,
      headers: {
        ...config.headers,
        // Retirer Content-Type pour laisser le navigateur gérer multipart/form-data
      },
      body: formData,
      cache: false,
      timeout: 60000 // 1 minute pour uploads
    }

    // Retirer Content-Type du header pour les uploads
    const { 'Content-Type': _, ...headersWithoutContentType } = this.buildHeaders(uploadConfig)
    uploadConfig.headers = headersWithoutContentType

    return this.request<T>(endpoint, uploadConfig)
  }

  /**
   * Nettoyage manuel du cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Statistiques de performance
   */
  getMetrics(): APIMetrics {
    return { ...this.metrics }
  }

  /**
   * Diagnostic de santé
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error', latency: number, cache: number }> {
    const start = Date.now()
    
    try {
      await this.get('/health', { cache: false, timeout: 5000 })
      const latency = Date.now() - start
      
      return {
        status: 'ok',
        latency,
        cache: this.cache.size
      }
    } catch {
      return {
        status: 'error',
        latency: Date.now() - start,
        cache: this.cache.size
      }
    }
  }
}

// ✅ CLASSE D'ERREUR SPÉCIALISÉE - Pas de fusion
export class APIError extends Error {
  public readonly code: string
  public readonly details?: any
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

// ✅ INSTANCE GLOBALE EXPORTÉE
export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
)

// ✅ TYPES EXPORTÉS
export type { APIErrorDetails, APIMetrics, RequestConfig }
