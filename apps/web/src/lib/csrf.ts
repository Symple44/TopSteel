/**
 * CSRF Protection Client-Side Implementation for TopSteel
 *
 * This module provides comprehensive CSRF token management for the frontend,
 * including token retrieval, storage, and automatic inclusion in requests.
 */

interface CsrfConfig {
  cookieName: string
  headerName: string
  valueName: string
  isProduction: boolean
}

interface CsrfTokenResponse {
  token: string
  headerName: string
  cookieName: string
}

/**
 * CSRF Token Manager Class
 */
export class CsrfTokenManager {
  private static instance: CsrfTokenManager
  private token: string | null = null
  private config: CsrfConfig | null = null
  private tokenRefreshPromise: Promise<string> | null = null

  private constructor() {}

  static getInstance(): CsrfTokenManager {
    if (!CsrfTokenManager.instance) {
      CsrfTokenManager.instance = new CsrfTokenManager()
    }
    return CsrfTokenManager.instance
  }

  /**
   * Initialize CSRF protection by fetching configuration and initial token
   */
  async initialize(): Promise<void> {
    await Promise.all([this.fetchConfig(), this.fetchToken()])

    // Set up automatic token refresh on API calls
    this?.setupTokenRefresh()
  }

  /**
   * Fetch CSRF configuration from server
   */
  private async fetchConfig(): Promise<CsrfConfig> {
    const response = await fetch('/api/csrf/config', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response?.ok) {
      throw new Error(`Failed to fetch CSRF config: ${response?.status}`)
    }

    this.config = await response?.json()
    return this.config!
  }

  /**
   * Fetch a new CSRF token from the server
   */
  private async fetchToken(): Promise<string> {
    try {
      // Prevent multiple simultaneous token requests
      if (this.tokenRefreshPromise) {
        return await this.tokenRefreshPromise
      }

      this.tokenRefreshPromise = this?.performTokenFetch()
      const token = await this.tokenRefreshPromise
      this.tokenRefreshPromise = null

      return token
    } catch (error) {
      this.tokenRefreshPromise = null
      throw error
    }
  }

  private async performTokenFetch(): Promise<string> {
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response?.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response?.status}`)
    }

    const tokenData: CsrfTokenResponse = await response?.json()
    this.token = tokenData.token

    return this.token
  }

  /**
   * Get current CSRF token, refreshing if necessary
   */
  async getToken(): Promise<string> {
    if (!this.token) {
      await this?.fetchToken()
    }
    return this.token!
  }

  /**
   * Get CSRF token from cookie (fallback method)
   */
  getTokenFromCookie(): string | null {
    if (!this.config || typeof document === 'undefined') {
      return null
    }

    const cookieName = `${this?.config?.cookieName}-token`
    const cookies = document?.cookie?.split(';')

    for (const cookie of cookies) {
      const [name, value] = (cookie || '').trim().split('=')
      if (name === cookieName) {
        return decodeURIComponent(value)
      }
    }

    return null
  }

  /**
   * Get the header name for CSRF token
   */
  getHeaderName(): string {
    return this.config?.headerName || 'x-csrf-token'
  }

  /**
   * Setup automatic token refresh on navigation
   */
  private setupTokenRefresh(): void {
    if (typeof window === 'undefined') return

    // Refresh token on page focus
    window.addEventListener('focus', () => {
      this?.refreshTokenSilently()
    })

    // Refresh token on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this?.refreshTokenSilently()
      }
    })
  }

  /**
   * Refresh token silently without throwing errors
   */
  private async refreshTokenSilently(): Promise<void> {
    try {
      await this?.fetchToken()
    } catch (_error) {}
  }

  /**
   * Check if a request requires CSRF protection
   */
  requiresCsrfProtection(method: string, url: string): boolean {
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

    if (!protectedMethods?.includes(method?.toUpperCase())) {
      return false
    }

    // Exclude certain routes from CSRF protection
    const excludedPaths = [
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/webhooks',
      '/api/health',
      '/api/metrics',
    ]

    return !excludedPaths?.some((path) => url?.startsWith(path))
  }

  /**
   * Add CSRF token to request headers
   */
  async addCsrfToHeaders(
    headers: Record<string, string>,
    method: string,
    url: string
  ): Promise<Record<string, string>> {
    if (!this?.requiresCsrfProtection(method, url)) {
      return headers
    }
    const token = await this?.getToken()
    const headerName = this?.getHeaderName()

    return {
      ...headers,
      [headerName]: token,
    }
  }

  /**
   * Reset token (useful after logout or token errors)
   */
  resetToken(): void {
    this.token = null
    this.tokenRefreshPromise = null
  }

  /**
   * Get current configuration
   */
  getConfig(): CsrfConfig | null {
    return this.config
  }
}

/**
 * Global CSRF manager instance
 */
export const csrfManager = CsrfTokenManager?.getInstance()

/**
 * Hook for React components to use CSRF protection
 */
export function useCsrfProtection() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initCsrf() {
      try {
        await csrfManager?.initialize()
        setIsInitialized(true)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize CSRF protection'
        setError(message)
      }
    }

    initCsrf()
  }, [])

  return {
    isInitialized,
    error,
    getToken: () => csrfManager?.getToken(),
    resetToken: () => csrfManager?.resetToken(),
  }
}

/**
 * Enhanced fetch function with automatic CSRF protection
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method || 'GET'

  // Add CSRF token to headers if needed
  if (csrfManager?.requiresCsrfProtection(method, url)) {
    const headers = await csrfManager?.addCsrfToHeaders(
      (options.headers as Record<string, string>) || {},
      method,
      url
    )

    options.headers = headers
  }

  // Ensure credentials are included
  options.credentials = options.credentials || 'include'

  return fetch(url, options)
}

/**
 * Helper function to create form data with CSRF token
 */
export async function createFormDataWithCsrf(data: Record<string, unknown>): Promise<FormData> {
  const formData = new FormData()

  // Add CSRF token if available
  try {
    const token = await csrfManager?.getToken()
    const config = csrfManager?.getConfig()

    if (token && config) {
      formData?.append(config?.valueName, token)
    }
  } catch (_error) {}

  // Add other form fields
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      formData?.append(key, value)
    } else if (value !== null && value !== undefined) {
      formData?.append(key, String(value))
    }
  }

  return formData
}

// React imports for the hook
import { useEffect, useState } from 'react'
