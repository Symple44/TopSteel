/**
 * 🌐 @erp/api-client - MAIN EXPORT INDEX
 * Tree-shaking optimized API client exports for TopSteel ERP
 *
 * ORGANIZATION:
 * - Core utilities and base classes
 * - Domain-specific API clients
 * - Main ERPApiClient for convenience
 *
 * For better tree-shaking, prefer importing from specific subpaths:
 * - @erp/api-client/core
 * - @erp/api-client/clients
 * - @erp/api-client/projects
 * - etc.
 */

// ===== COMPLETE DOMAIN EXPORTS =====
// Re-export all API clients for backward compatibility
export * from './admin'
export * from './auth'
export * from './clients'
// ===== ESSENTIAL DOMAIN EXPORTS =====
// Most commonly used API clients
export { ClientApiClient } from './clients'
export type { ApiClientConfig } from './core'
// ===== CORE EXPORTS =====
export * from './core'
export * from './inventory'
export * from './partners'
export * from './pricing'
export * from './projects'
export { ProjectApiClient } from './projects'
export * from './quotes'
export * from './users'
export { UserSettingsApiClient } from './users'

// ===== MAIN API CLIENT =====
import { SystemParametersApiClient } from './admin'
import { ClientApiClient } from './clients'
import type { ApiClientConfig } from './core'
import { HttpClient } from './core'
import { PartnerApi } from './partners'
import { PricingApi } from './pricing'
import { ProjectApiClient } from './projects'
import { UserSettingsApiClient } from './users'

/**
 * Main ERP API Client - Orchestrates all domain-specific clients
 *
 * @example
 * ```typescript
 * const apiClient = new ERPApiClient({ baseURL: 'https://api.example.com' })
 * const projects = await apiClient.projects.getAll()
 * ```
 */
export class ERPApiClient {
  public readonly clients: ClientApiClient
  public readonly projects: ProjectApiClient
  public readonly userSettings: UserSettingsApiClient
  public readonly systemParameters: SystemParametersApiClient
  public readonly partners: PartnerApi
  public readonly pricing: PricingApi

  constructor(config: ApiClientConfig) {
    // Initialize domain clients
    this.clients = new ClientApiClient(config)
    this.projects = new ProjectApiClient(config)
    this.userSettings = new UserSettingsApiClient(config)
    this.systemParameters = new SystemParametersApiClient(config)

    // Initialize APIs with HttpClient
    const httpClient = new HttpClient(config)
    this.partners = new PartnerApi(httpClient.axiosInstance)
    this.pricing = new PricingApi(httpClient)
  }

  // ===== GLOBAL AUTH MANAGEMENT =====

  setAuthToken(token: { access_token: string; refresh_token?: string }): void {
    this.clients.setAuthToken(token)
    this.projects.setAuthToken(token)
    this.userSettings.setAuthToken(token)
    this.systemParameters.setAuthToken(token)
  }

  clearAuth(): void {
    this.clients.clearAuth()
    this.projects.clearAuth()
    this.userSettings.clearAuth()
    this.systemParameters.clearAuth()
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
      parts.push(String(id))
    }

    return parts
  }
}

// ===== DEFAULT EXPORT =====
export { ERPApiClient as default }
