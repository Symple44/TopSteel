/**
 * API Client Instance - Socle
 */
import { apiClient } from './api-client'

export interface APIClientInterface {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, data?: unknown) => Promise<T>
  put: <T>(url: string, data?: unknown) => Promise<T>
  patch: <T>(url: string, data?: unknown) => Promise<T>
  delete: <T>(url: string) => Promise<T>
}

export { apiClient }
