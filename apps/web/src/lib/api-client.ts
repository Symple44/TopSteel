// apps/web/src/lib/api-client.ts
import type { AxiosInstance, AxiosError } from 'axios';
import axios from 'axios'
import { useAuthStore } from '@/hooks/use-auth'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token
    this.client.interceptors.request.use(
      (config) => {
        const { tokens } = useAuthStore.getState()
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor pour gérer l'authentification
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const { refreshToken, logout } = useAuthStore.getState()

        if (error.response?.status === 401) {
          try {
            await refreshToken()
            // Retry the original request
            return this.client.request(error.config!)
          } catch (refreshError) {
            logout()
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  get<T = any>(url: string, config = {}) {
    return this.client.get<T>(url, config)
  }

  post<T = any>(url: string, data = {}, config = {}) {
    return this.client.post<T>(url, data, config)
  }

  put<T = any>(url: string, data = {}, config = {}) {
    return this.client.put<T>(url, data, config)
  }

  delete<T = any>(url: string, config = {}) {
    return this.client.delete<T>(url, config)
  }
}

export const apiClient = new ApiClient()