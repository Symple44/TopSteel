import { useAuthStore } from '@/hooks/use-auth';
import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';

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
        const originalRequest = error.config
        
        // ✅ NE PAS faire de retry pour les routes de logout ou login
        if (originalRequest?.url?.includes('/auth/logout') || 
            originalRequest?.url?.includes('/auth/login')) {
          return Promise.reject(error)
        }

        const { refreshToken, logout } = useAuthStore.getState()

        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true
          
          try {
            await refreshToken()
            // Retry the original request with new token
            return this.client.request(originalRequest)
          } catch (refreshError) {
            // ✅ Clear auth state sans appeler l'API logout (déjà échoué)
            useAuthStore.setState({
              user: null,
              tokens: null,
              isAuthenticated: false,
            })
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