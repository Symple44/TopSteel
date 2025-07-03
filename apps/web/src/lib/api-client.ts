/**
 * ✅ API CLIENT ENTERPRISE
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

import { SecurityUtils } from './security'
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

interface APIError {
  code: string
  message: string
  details?: any
  timestamp: number
  requestId?: string
}

class APIClient {
  private baseURL: string
  private cache = new Map<string, CacheEntry>()
  private rateLimiter = SecurityUtils.createRateLimiter(100, 60000) // 100 req/min
  private metrics = {
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
   * Requête principale avec toutes les fonctionnalités
   */
  private async request<T>(endpoint: string, config: RequestConfig): Promise<T> {
    const startTime = performance.now()
    this.metrics.requests++

    try {
      // ✅ RATE LIMITING
      if (!this.rateLimiter.isAllowed()) {
        throw new APIError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Trop de requêtes, veuillez patienter',
          timestamp: Date.now()
        })
      }

      // ✅ VÉRIFICATION CACHE
      if (config.cache !== false && config.method === 'GET') {
        const cached = this.getFromCache(endpoint)
        if (cached) {
          this.metrics.cacheHits++
          return cached
        }
      }

      // ✅ CONSTRUCTION DE LA REQUÊTE
      const url = `${this.baseURL}${endpoint}`
      const headers = await this.buildHeaders(config)
      
      const requestConfig: RequestInit = {
        method: config.method || 'GET',
        headers,
        signal: this.createTimeoutSignal(config.timeout || 30000)
      }

      if (config.body && config.method !== 'GET') {
        requestConfig.body = JSON.stringify(config.body)
      }

      // ✅ EXÉCUTION AVEC RETRY
      const response = config.retry !== false 
        ? await this.requestWithRetry(url, requestConfig, config.retryAttempts || 3)
        : await fetch(url, requestConfig)

      // ✅ GESTION RÉPONSE
      const data = await this.handleResponse<T>(response)

      // ✅ MISE EN CACHE
      if (config.cache !== false && config.method === 'GET') {
        this.setCache(endpoint, data, config.cacheTTL || 300000) // 5min par défaut
      }

      // ✅ MÉTRIQUES
      const responseTime = performance.now() - startTime
      this.updateMetrics(responseTime, false)

      return data

    } catch (error) {
      this.metrics.errors++
      this.updateMetrics(performance.now() - startTime, true)
      
      if (error instanceof APIError) {
        throw error
      }
      
      throw new APIError({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Erreur réseau inconnue',
        timestamp: Date.now()
      })
    }
  }

  /**
   * Retry avec backoff exponentiel
   */
  private async requestWithRetry(
    url: string, 
    config: RequestInit, 
    attempts: number
  ): Promise<Response> {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, config)
        
        // Retry sur certains codes d'erreur
        if (response.status >= 500 || response.status === 429) {
          if (i === attempts - 1) {
            return response // Dernière tentative, retourner même si erreur
          }
          
          // Backoff exponentiel: 1s, 2s, 4s...
          await this.delay(Math.pow(2, i) * 1000)
          continue
        }
        
        return response
        
      } catch (error) {
        if (i === attempts - 1) {
          throw error
        }
        
        await this.delay(Math.pow(2, i) * 1000)
      }
    }
    
    throw new Error('Max retry attempts reached')
  }

  /**
   * Construction des headers
   */
  private async buildHeaders(config: RequestConfig): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...config.headers
    }

    // ✅ AUTHENTIFICATION
    if (config.requireAuth !== false) {
      const token = await this.getAuthToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    // ✅ CSRF TOKEN
    const csrfToken = SecurityUtils.generateCSRFToken()
    headers['X-CSRF-Token'] = csrfToken

    // ✅ REQUEST ID POUR TRACKING
    headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return headers
  }

  /**
   * Gestion de la réponse
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const requestId = response.headers.get('X-Request-ID')
    
    if (!response.ok) {
      let errorData: any
      
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: response.statusText }
      }
      
      throw new APIError({
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Erreur ${response.status}`,
        details: errorData,
        timestamp: Date.now(),
        requestId: requestId || undefined
      })
    }

    const contentType = response.headers.get('Content-Type')
    
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text() as unknown as T
  }

  /**
   * Gestion du cache
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
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
    }, 60000) // Nettoyage chaque minute
  }

  /**
   * Timeout signal
   */
  private createTimeoutSignal(timeout: number): AbortSignal {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeout)
    return controller.signal
  }

  /**
   * Récupération du token d'authentification
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const appState = localStorage.getItem('topsteel-app-state')
      if (appState) {
        const parsed = JSON.parse(appState)
        return parsed.state?.auth?.token || null
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error)
    }
    
    return null
  }

  /**
   * Mise à jour des métriques
   */
  private updateMetrics(responseTime: number, isError: boolean): void {
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2

    if (isError) {
      this.metrics.errors++
    }

    // Envoyer vers analytics si configuré
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('api_request', {
        responseTime: Math.round(responseTime),
        isError,
        cacheHitRate: this.metrics.cacheHits / this.metrics.requests
      })
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtenir les métriques
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheHitRate: this.metrics.requests > 0 
        ? (this.metrics.cacheHits / this.metrics.requests) * 100 
        : 0
    }
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Reset des métriques
   */
  resetMetrics(): void {
    this.metrics = {
      requests: 0,
      errors: 0,
      cacheHits: 0,
      avgResponseTime: 0
    }
  }
}

// ✅ INSTANCE GLOBALE
export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
)

// ✅ ERROR CLASS
export class APIError extends Error {
  public code: string
  public details?: any
  public timestamp: number
  public requestId?: string

  constructor(error: {
    code: string
    message: string
    details?: any
    timestamp: number
    requestId?: string
  }) {
    super(error.message)
    this.name = 'APIError'
    this.code = error.code
    this.details = error.details
    this.timestamp = error.timestamp
    this.requestId = error.requestId
  }
}

// ✅ TYPES POUR L'API
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface APIResponse<T> {
  data: T
  message?: string
  timestamp: number
}

