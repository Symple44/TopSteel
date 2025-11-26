/**
 * API Client - Socle
 *
 * Generic API client for calling backend endpoints.
 * Uses NEXT_PUBLIC_API_URL env var or defaults to localhost:3002
 * Automatically adds /api prefix for NestJS global prefix
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface RequestConfig {
  method?: string
  headers?: Record<string, string>
  body?: unknown
}

export interface APIMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
}

export interface APIErrorDetails {
  message: string
  code?: string
  status?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // Ensure URL starts with /api for NestJS global prefix
  const apiUrl = url.startsWith('/api') ? url : `/api${url}`
  const response = await fetch(`${API_BASE_URL}${apiUrl}`, {
    ...options,
    credentials: 'include',
  })
  if (!response.ok) throw new APIError('Request failed', response.status)
  return response.json()
}

export const apiClient = {
  get: async <T>(url: string): Promise<T> => request<T>(url),
  post: async <T>(url: string, data?: unknown): Promise<T> => 
    request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: async <T>(url: string, data?: unknown): Promise<T> => 
    request<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: async <T>(url: string, data?: unknown): Promise<T> => 
    request<T>(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: async <T>(url: string): Promise<T> => 
    request<T>(url, { method: 'DELETE' }),
}
