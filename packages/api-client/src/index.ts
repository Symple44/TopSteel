/**
 * 🌐 API CLIENT - PACKAGE @erp/api-client
 * Client API centralisé pour l'ERP TopSteel
 */

// ===== CORE =====
export * from './core'

// ===== DOMAIN CLIENTS =====
export * from './clients'
export * from './projects'
export * from './quotes'
export * from './inventory'
export * from './auth'
export * from './users'
export * from './admin'

// ===== MAIN API CLIENT =====

import type { ApiClientConfig } from './core'
import { ClientApiClient } from './clients'
import { ProjectApiClient } from './projects'
import { UserSettingsApiClient } from './users'
import { SystemParametersApiClient } from './admin'

export class ERPApiClient {
  public readonly clients: ClientApiClient
  public readonly projects: ProjectApiClient
  public readonly userSettings: UserSettingsApiClient
  public readonly systemParameters: SystemParametersApiClient

  constructor(config: ApiClientConfig) {
    // Initialize domain clients
    this.clients = new ClientApiClient(config)
    this.projects = new ProjectApiClient(config)
    this.userSettings = new UserSettingsApiClient(config)
    this.systemParameters = new SystemParametersApiClient(config)
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