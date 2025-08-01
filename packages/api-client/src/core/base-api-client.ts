/**
 * 🏗️ BASE API CLIENT
 * Client de base pour tous les domaines métier
 */

import { type ApiConfig, type AuthToken, HttpClient } from './http-client'

export interface ApiClientConfig extends ApiConfig {
  readonly apiKey?: string
  readonly environment?: 'development' | 'staging' | 'production'
}

export abstract class BaseApiClient {
  protected http: HttpClient

  constructor(config: ApiClientConfig) {
    this.http = new HttpClient(config)
  }

  // ===== AUTH MANAGEMENT =====

  setAuthToken(token: AuthToken): void {
    this.http.setAuthToken(token)
  }

  clearAuth(): void {
    this.http.clearAuth()
  }

  // ===== PROTECTED HELPERS =====

  protected buildEndpoint(path: string): string {
    return path.startsWith('/') ? path : `/${path}`
  }

  protected buildQueryParams(params: Record<string, any>): Record<string, string> {
    const cleanParams: Record<string, string> = {}

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          cleanParams[key] = value.join(',')
        } else if (value instanceof Date) {
          cleanParams[key] = value.toISOString()
        } else {
          cleanParams[key] = String(value)
        }
      }
    }

    return cleanParams
  }

  protected normalizeId(id: string | number): string {
    return String(id)
  }

  // ===== CONTEXT KEY GENERATION =====

  /**
   * Creates a context key for React Query or similar state management
   */
  createContextKey(domain: string, resource?: string, id?: string | number): string[] {
    const parts = [domain]

    if (resource) {
      parts.push(resource)
    }

    if (id !== undefined) {
      parts.push(this.normalizeId(id))
    }

    return parts
  }
}
