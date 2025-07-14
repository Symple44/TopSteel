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

// ===== MAIN API CLIENT =====

import type { ApiClientConfig } from './core'
import { ClientApiClient } from './clients'
import { ProjectApiClient } from './projects'

export class ERPApiClient {
  public readonly clients: ClientApiClient
  public readonly projects: ProjectApiClient

  constructor(config: ApiClientConfig) {
    // Initialize domain clients
    this.clients = new ClientApiClient(config)
    this.projects = new ProjectApiClient(config)
  }

  // ===== GLOBAL AUTH MANAGEMENT =====

  setAuthToken(token: { access_token: string; refresh_token?: string }): void {
    this.clients.setAuthToken(token)
    this.projects.setAuthToken(token)
  }

  clearAuth(): void {
    this.clients.clearAuth()
    this.projects.clearAuth()
  }
}

// ===== DEFAULT EXPORT =====
export { ERPApiClient as default }