/**
 * 🌐 CLIENT HTTP - CORE API CLIENT
 * Client HTTP centralisé avec intercepteurs et gestion d'erreurs
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

// Temporary local types until @erp/domains dependency is resolved
export interface PaginatedResponse<T> {
  readonly items: T[]
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly totalPages: number
}

export interface OperationResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly validationErrors?: Record<string, string[]>
}

// ===== TYPES =====

export interface ApiConfig {
  readonly baseURL: string
  readonly timeout?: number
  readonly retries?: number
  readonly retryDelay?: number
}

export interface AuthToken {
  readonly access_token: string
  readonly refresh_token?: string
  readonly token_type?: string
  readonly expires_in?: number
}

export interface ApiError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
  readonly statusCode?: number
}

export interface RequestOptions extends AxiosRequestConfig {
  readonly skipAuth?: boolean
  readonly retries?: number
}

// ===== HTTP CLIENT =====

export class HttpClient {
  private client: AxiosInstance
  private authToken?: AuthToken
  private refreshTokenPromise?: Promise<AuthToken>

  constructor(private config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    this.setupInterceptors()
  }

  // ===== SETUP INTERCEPTORS =====

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.authToken && config.headers && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${this.authToken.access_token}`
        }
        return config
      },
      (error: any) => Promise.reject(this.transformError(error))
    )

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const originalRequest = error.config

        // Handle 401 - try to refresh token
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.authToken?.refresh_token
        ) {
          originalRequest._retry = true

          try {
            await this.refreshAccessToken()
            return this.client(originalRequest)
          } catch (refreshError) {
            this.clearAuth()
            return Promise.reject(this.transformError(refreshError))
          }
        }

        return Promise.reject(this.transformError(error))
      }
    )
  }

  // ===== AUTH MANAGEMENT =====

  setAuthToken(token: AuthToken): void {
    this.authToken = token
  }

  clearAuth(): void {
    this.authToken = undefined
    this.refreshTokenPromise = undefined
  }

  private async refreshAccessToken(): Promise<AuthToken> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    if (!this.authToken?.refresh_token) {
      throw new Error('No refresh token available')
    }

    this.refreshTokenPromise = this.post<AuthToken>(
      '/auth/refresh',
      {
        refresh_token: this.authToken.refresh_token,
      },
      { skipAuth: true }
    )
      .then((response) => {
        const newToken = response.data
        this.setAuthToken(newToken)
        this.refreshTokenPromise = undefined
        return newToken
      })
      .catch((error) => {
        this.refreshTokenPromise = undefined
        throw error
      })

    return this.refreshTokenPromise
  }

  // ===== ERROR TRANSFORMATION =====

  private transformError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        code: error.response.data?.code || 'API_ERROR',
        message: error.response.data?.message || error.message || 'Une erreur est survenue',
        details: error.response.data?.details,
        statusCode: error.response.status,
      }
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Erreur de connexion au serveur',
        details: { originalError: error.message },
      }
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Erreur inconnue',
        details: { originalError: error },
      }
    }
  }

  // ===== HTTP METHODS =====

  async get<T>(url: string, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, options)
  }

  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, options)
  }

  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, options)
  }

  async patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, options)
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, options)
  }

  // ===== HELPER METHODS =====

  async getWithPagination<T>(
    url: string,
    params?: Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    const response = await this.get<PaginatedResponse<T>>(url, { params } as RequestOptions)
    return response.data
  }

  async executeOperation<T>(
    operation: () => Promise<AxiosResponse<T>>
  ): Promise<OperationResult<T>> {
    try {
      const response = await operation()
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.message,
        validationErrors: apiError.details as Record<string, string[]>,
      }
    }
  }
}
