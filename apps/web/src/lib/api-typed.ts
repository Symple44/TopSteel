/**
 * Typed API Client Wrapper
 * Ensures all API responses are properly typed
 */

import type { ApiResponse } from '@/types/api-types'
import type { RequestConfig } from './api-client'
import { apiClient } from './api-client-instance'
import { extractData, extractError } from './api-response-handler'

// HTTPRequestConfig compatible with the API client
interface HTTPRequestConfig extends RequestConfig {
  params?: Record<string, unknown>
  responseType?: 'json' | 'blob' | 'text'
  signal?: AbortSignal
}

// Generic typed fetch function
export async function fetchTyped<T>(url: string, options?: HTTPRequestConfig): Promise<T> {
  try {
    // Extract signal from options if present and pass it to the RequestConfig
    const { signal, ...configOptions } = options || {}
    const requestConfig: RequestConfig = {
      ...configOptions,
      // Pass signal as part of headers or as a custom property if supported
      ...(signal && { signal }),
    }

    const response = await apiClient.get<ApiResponse<T>>(url, requestConfig)

    // Handle direct data response
    if (response && typeof response === 'object') {
      // Check if it's already the data we want
      if (!('data' in response) && !('error' in response)) {
        return response as T
      }

      // Extract from ApiResponse wrapper
      if ('data' in response) {
        return response?.data as T
      }
    }

    // Use extraction helper
    const data = extractData<T>(response)
    if (data !== null) {
      return data
    }

    throw new Error('No data received from API')
  } catch (error) {
    const errorMessage = extractError(error)
    throw new Error(errorMessage || 'API request failed')
  }
}

// POST with typed response
export async function postTyped<T, D = any>(
  url: string,
  data?: D,
  options?: HTTPRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, options)

    // Handle direct response
    if (response && typeof response === 'object') {
      if (!('data' in response) && !('error' in response)) {
        return response as T
      }
      if ('data' in response) {
        return response?.data as T
      }
    }

    const extractedData = extractData<T>(response)
    if (extractedData !== null) {
      return extractedData
    }

    throw new Error('No data received from API')
  } catch (error) {
    const errorMessage = extractError(error)
    throw new Error(errorMessage || 'API request failed')
  }
}

// PUT with typed response
export async function putTyped<T, D = any>(
  url: string,
  data?: D,
  options?: HTTPRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, options)

    if (response && typeof response === 'object') {
      if (!('data' in response) && !('error' in response)) {
        return response as T
      }
      if ('data' in response) {
        return response?.data as T
      }
    }

    const extractedData = extractData<T>(response)
    if (extractedData !== null) {
      return extractedData
    }

    throw new Error('No data received from API')
  } catch (error) {
    const errorMessage = extractError(error)
    throw new Error(errorMessage || 'API request failed')
  }
}

// DELETE with typed response
export async function deleteTyped<T = void>(url: string, options?: HTTPRequestConfig): Promise<T> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, options)

    if (response && typeof response === 'object') {
      if (!('data' in response) && !('error' in response)) {
        return response as T
      }
      if ('data' in response) {
        return response?.data as T
      }
    }

    const data = extractData<T>(response)
    if (data !== null) {
      return data
    }

    // For DELETE, no data is often expected
    return undefined as unknown as T
  } catch (error) {
    const errorMessage = extractError(error)
    throw new Error(errorMessage || 'API request failed')
  }
}

// Ensure response has data property
export function ensureDataProperty<T>(response: unknown): { data: T } {
  if (response && typeof response === 'object') {
    if ('data' in response) {
      return response as { data: T }
    }
    // Wrap in data property
    return { data: response as T }
  }
  return { data: response as T }
}

// Type guard for checking if response has data
export function hasDataProperty<T>(response: unknown): response is { data: T } {
  return response !== null && typeof response === 'object' && 'data' in response
}

// Extract or default
export function extractOrDefault<T>(response: unknown, defaultValue: T): T {
  const data = extractData<T>(response)
  return data !== null ? data : defaultValue
}
