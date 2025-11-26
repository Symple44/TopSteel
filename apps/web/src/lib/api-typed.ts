/**
 * API Typed Utilities - Socle
 *
 * Direct API client for calling backend endpoints.
 * Uses NEXT_PUBLIC_API_URL env var or defaults to localhost:3002
 * Automatically adds /api prefix for NestJS global prefix
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

/**
 * Get the access token from cookies (client-side)
 */
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'accessToken') {
      return value
    }
  }
  return null
}

export async function fetchTyped<T>(url: string, options?: RequestInit): Promise<T> {
  // Ensure URL starts with /api for NestJS global prefix
  const apiUrl = url.startsWith('/api') ? url : `/api${url}`

  // Get auth token and build headers
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${apiUrl}`, {
    ...options,
    credentials: 'include',
    headers,
  })
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json()
}

export async function postTyped<T>(url: string, data?: unknown): Promise<T> {
  return fetchTyped<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function putTyped<T>(url: string, data?: unknown): Promise<T> {
  return fetchTyped<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function deleteTyped<T>(url: string): Promise<T> {
  return fetchTyped<T>(url, { method: 'DELETE' })
}

export function hasDataProperty<T>(obj: unknown): obj is { data: T } {
  return typeof obj === 'object' && obj !== null && 'data' in obj
}

export function ensureDataProperty<T>(response: unknown): T {
  if (hasDataProperty<T>(response)) return response.data
  return response as T
}

export function extractOrDefault<T>(response: unknown, defaultValue: T): T {
  try {
    if (hasDataProperty<T>(response)) return response.data
    return (response as T) ?? defaultValue
  } catch {
    return defaultValue
  }
}
