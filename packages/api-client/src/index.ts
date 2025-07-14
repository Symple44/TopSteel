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

export class ERPApiClient {
  public readonly clients: ClientApiClient

  constructor(config: ApiClientConfig) {
    // Initialize domain clients
    this.clients = new ClientApiClient(config)
  }

  // ===== GLOBAL AUTH MANAGEMENT =====

  setAuthToken(token: { access_token: string; refresh_token?: string }): void {
    this.clients.setAuthToken(token)
  }

  clearAuth(): void {
    this.clients.clearAuth()
  }
}

// ===== DEFAULT EXPORT =====
export { ERPApiClient as default }