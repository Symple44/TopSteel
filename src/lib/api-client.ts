import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useStore } from '@/store'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = useStore.getState().accessToken

        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await useStore.getState().refreshTokens()
            return this.instance(originalRequest)
          } catch (refreshError) {
            useStore.getState().logout()
            return Promise.reject(refreshError)
          }
        }

        // Gestion des erreurs globales
        if (error.response?.status === 500) {
          useStore.getState().addNotification({
            type: 'error',
            title: 'Erreur serveur',
            message: 'Une erreur est survenue. Veuillez réessayer plus tard.',
          })
        }

        if (error.response?.status === 403) {
          useStore.getState().addNotification({
            type: 'error',
            title: 'Accès refusé',
            message: "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
          })
        }

        return Promise.reject(error)
      }
    )
  }

  // Méthodes HTTP
  async get<T = any>(url: string, config?: any) {
    const response = await this.instance.get<T>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: any) {
    const response = await this.instance.post<T>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: any) {
    const response = await this.instance.put<T>(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: any) {
    const response = await this.instance.patch<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: any) {
    const response = await this.instance.delete<T>(url, config)
    return response.data
  }

  // Upload de fichiers
  async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void) {
    const response = await this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  }

  // Téléchargement de fichiers
  async download(url: string, filename?: string) {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }
}

export const apiClient = new ApiClient()

// Types d'aide pour les réponses API
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}