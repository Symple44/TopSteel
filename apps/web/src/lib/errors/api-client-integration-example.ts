/**
 * Example integration of centralized error handling in API client
 *
 * This file demonstrates how to enhance your existing API client
 * with the comprehensive error handling system.
 *
 * Usage:
 * 1. Import this example into your api-client-enhanced.ts
 * 2. Apply the patterns shown here
 * 3. Adjust based on your specific needs
 */

import { errorHandler } from './error-handler'
import { logger } from './logger'
import {
  NetworkError,
  ValidationError,
  AuthError,
  AuthorizationError,
  NotFoundError,
  ServerError,
  type AppError,
} from './error-types'

/**
 * Example: Enhanced request method with comprehensive error handling
 */
export class EnhancedAPIClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Enhanced request method with error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // Start performance tracking
    logger.startPerformance(`api:${endpoint}`)

    try {
      // Log request
      logger.debug('API request started', {
        endpoint,
        method: options.method || 'GET',
        url,
      })

      const response = await fetch(url, options)

      // End performance tracking
      const duration = logger.endPerformance(`api:${endpoint}`, {
        status: response.status,
        success: response.ok,
      })

      // Handle error responses
      if (!response.ok) {
        await this.handleErrorResponse(response, endpoint)
      }

      // Parse successful response
      const data = await response.json() as T

      // Log successful request
      logger.info('API request succeeded', {
        endpoint,
        status: response.status,
        duration,
      })

      return data

    } catch (error) {
      // End performance tracking for failed requests
      logger.endPerformance(`api:${endpoint}`, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Handle and transform error
      return this.handleRequestError(error, endpoint)
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(
    response: Response,
    endpoint: string
  ): Promise<never> {
    const status = response.status
    let errorData: unknown

    try {
      errorData = await response.json()
    } catch {
      errorData = { message: response.statusText }
    }

    const message =
      (errorData as { message?: string })?.message ||
      response.statusText ||
      'An error occurred'

    // Create appropriate error based on status code
    let error: AppError

    switch (status) {
      case 400:
        error = new ValidationError(
          message,
          (errorData as { errors?: Record<string, string[]> })?.errors
        )
        break

      case 401:
        error = new AuthError(message, 'session', {
          endpoint,
          redirectToLogin: true,
        })
        break

      case 403:
        error = new AuthorizationError(message, { endpoint })
        break

      case 404:
        error = new NotFoundError(message, 'resource', endpoint)
        break

      case 429:
        const retryAfter = parseInt(
          response.headers.get('Retry-After') || '60',
          10
        )
        error = new ServerError(message, 429, false, { retryAfter })
        break

      case 500:
      case 502:
      case 503:
        error = new ServerError(message, status, true)
        break

      default:
        error = new ServerError(message, status)
    }

    // Log error
    logger.error('API request failed', error, {
      endpoint,
      status,
      errorData,
    })

    // Handle through centralized error handler
    errorHandler.handle(error, {
      logError: false, // Already logged above
      reportToBackend: status >= 500, // Only report server errors
    })

    throw error
  }

  /**
   * Handle network and other errors
   */
  private handleRequestError(error: unknown, endpoint: string): never {
    let appError: AppError

    if (error instanceof Error) {
      // Network errors
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.name === 'TypeError'
      ) {
        appError = new NetworkError(
          'Unable to connect to server. Please check your internet connection.',
          {
            endpoint,
            originalError: error.message,
          }
        )
      }
      // Timeout errors
      else if (error.message.includes('timeout')) {
        appError = new NetworkError('Request timeout. Please try again.', {
          endpoint,
          timeout: true,
        })
      }
      // Other errors
      else {
        appError = new ServerError(error.message, 500, false, {
          originalError: error.message,
        })
      }
    } else {
      appError = new ServerError('An unexpected error occurred', 500, false, {
        error,
      })
    }

    // Log error
    logger.error('API request error', error instanceof Error ? error : undefined, {
      endpoint,
      errorType: appError.name,
    })

    // Handle through centralized error handler
    errorHandler.handle(appError, {
      logError: false, // Already logged above
      reportToBackend: true,
    })

    throw appError
  }

  /**
   * Example: GET request with retry logic
   */
  async get<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries = 3
  ): Promise<T> {
    let lastError: unknown
    let attempt = 0

    while (attempt < maxRetries) {
      try {
        return await this.request<T>(endpoint, {
          ...options,
          method: 'GET',
        })
      } catch (error) {
        lastError = error

        // Check if error is retryable
        if (!errorHandler.isRetryable(error)) {
          throw error
        }

        attempt++

        // Don't retry if we've exhausted attempts
        if (attempt >= maxRetries) {
          break
        }

        // Exponential backoff
        const delay = 1000 * 2 ** (attempt - 1)
        logger.warn(`Retrying request (attempt ${attempt}/${maxRetries})`, {
          endpoint,
          delay,
        })

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // All retries exhausted
    logger.error(`Request failed after ${maxRetries} retries`, undefined, {
      endpoint,
    })

    throw lastError
  }

  /**
   * Example: POST request with validation error handling
   */
  async post<T>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
      })
    } catch (error) {
      // Special handling for validation errors
      if (ValidationError.isValidationError(error)) {
        const validationError = error as ValidationError
        logger.warn('Validation error in POST request', {
          endpoint,
          fields: validationError.fields,
        })
      }

      throw error
    }
  }

  /**
   * Example: Request with timeout
   */
  async requestWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 30000
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await this.request<T>(endpoint, {
        ...options,
        signal: controller.signal,
      })
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        throw new NetworkError('Request timeout', {
          endpoint,
          timeoutMs,
        })
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Example usage in your application
 */
export function exampleUsage() {
  const api = new EnhancedAPIClient('https://api.example.com')

  // Example 1: Simple GET request
  async function fetchUser(id: string) {
    try {
      const user = await api.get(`/users/${id}`)
      return user
    } catch (error) {
      // Error already handled by API client
      // You can add additional error handling here if needed
      console.error('Failed to fetch user', error)
      return null
    }
  }

  // Example 2: POST request with validation
  async function createUser(userData: unknown) {
    try {
      const newUser = await api.post('/users', userData)
      return newUser
    } catch (error) {
      if (ValidationError.isValidationError(error)) {
        // Handle validation errors specifically
        const validationError = error as ValidationError
        console.log('Validation errors:', validationError.fields)
      }
      throw error
    }
  }

  // Example 3: Request with custom timeout
  async function fetchWithTimeout() {
    try {
      return await api.requestWithTimeout('/slow-endpoint', {}, 5000)
    } catch (error) {
      if (NetworkError.isNetworkError(error)) {
        console.log('Request timed out or network error occurred')
      }
      throw error
    }
  }
}

/**
 * Integration pattern for existing APIClientEnhanced
 *
 * Apply this pattern to your existing API client:
 */
export function integrationPattern() {
  // 1. Import error handling utilities
  // import { errorHandler, logger, NetworkError, ValidationError } from './errors'

  // 2. Wrap your existing request method
  // async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  //   logger.startPerformance(`api:${endpoint}`)
  //
  //   try {
  //     const result = await super.request<T>(endpoint, config)
  //     logger.endPerformance(`api:${endpoint}`, { success: true })
  //     return result
  //   } catch (error) {
  //     logger.endPerformance(`api:${endpoint}`, { success: false })
  //
  //     // Transform error if needed
  //     const appError = this.transformError(error)
  //
  //     // Handle error
  //     errorHandler.handle(appError, {
  //       logError: true,
  //       reportToBackend: true,
  //     })
  //
  //     throw appError
  //   }
  // }

  // 3. Add error transformation method
  // private transformError(error: unknown): AppError {
  //   // Your logic to transform errors to custom error types
  // }

  console.log('See comments in this function for integration patterns')
}
