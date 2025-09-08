/**
 * API Response Handler
 * Provides type-safe handling of API responses
 */

import type { ApiError, ApiResponse } from '@/types/api-types'

/**
 * Safe access to response data with type guards
 */
export function isApiResponse<T = any>(obj: unknown): obj is ApiResponse<T> {
  return (
    typeof obj === 'object' && obj !== null && 'success' in obj && typeof obj.success === 'boolean'
  )
}

/**
 * Extract data from API response safely
 */
export function extractData<T>(response: unknown): T | null {
  if (!response) return null

  // Handle direct data response
  if (response?.data !== undefined) {
    return response?.data as T
  }

  // Handle axios-like response
  if (response !== undefined) {
    return response?.data?.data as T
  }

  // If response itself looks like the data
  if (!('success' in response) && !('error' in response)) {
    return response as T
  }

  return null
}

/**
 * Extract error from API response safely
 */
export function extractError(response: unknown): string | null {
  if (!response) return null

  // Check for error property
  if (response?.error) {
    if (typeof response?.error === 'string') {
      return response?.error
    }
    if (typeof response?.error === 'object' && response?.error?.message) {
      return response?.error?.message
    }
  }

  // Check for message property
  if (response?.message && typeof response?.message === 'string') {
    return response?.message
  }

  // Check axios error structure
  if (response?.response?.data?.error) {
    return extractError(response?.response?.data)
  }

  // Check for standard Error object
  if (response instanceof Error) {
    return response?.message
  }

  return null
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string | Error,
  statusCode?: number
): ApiResponse<never> {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorObj: ApiError = {
    message: errorMessage,
    statusCode,
    timestamp: new Date().toISOString(),
  }

  return {
    success: false,
    error: errorObj,
    statusCode,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Handle API response with proper type checking
 */
export async function handleApiResponse<T>(promise: Promise<unknown>): Promise<T> {
  try {
    const response = await promise

    // Extract data from response
    const data = extractData<T>(response)
    if (data !== null) {
      return data
    }

    // If no data found, throw error
    const error = extractError(response)
    throw new Error(error || 'No data received from API')
  } catch (error) {
    const errorMessage = extractError(error)
    throw new Error(errorMessage || 'API request failed')
  }
}

/**
 * Type guard for checking if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Safe property access with fallback
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback?: T[K]
): T[K] | undefined {
  if (!isDefined(obj)) return fallback
  return obj[key] ?? fallback
}
