/**
 * 🌐 API CLIENT - PACKAGE @erp/api-client
 * Client API centralisé pour l'ERP TopSteel
 */

export * from './admin'
export * from './auth'
// ===== DOMAIN CLIENTS =====
export * from './clients'
// ===== CORE =====
export * from './core'
export * from './inventory'
export * from './projects'
export * from './quotes'
export * from './users'

// ===== MAIN API CLIENT =====

import { SystemParametersApiClient } from './admin'
import { ClientApiClient } from './clients'
import type { ApiClientConfig } from './core'
import { ProjectApiClient } from './projects'
import { UserSettingsApiClient } from './users'

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
