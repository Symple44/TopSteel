import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

class MarketplaceApiClient {
  private client: AxiosInstance
  private tenant: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_MARKETPLACE_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3004/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor pour ajouter le tenant
    this.client.interceptors.request.use((config) => {
      if (this.tenant) {
        config.headers['X-Tenant'] = this.tenant
      }
      return config
    })

    // Response interceptor pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 404 && error.config.url?.includes('storefront')) {
          // Tenant non trouvé ou marketplace non activée
          throw new Error('TENANT_NOT_FOUND')
        }
        return Promise.reject(error)
      }
    )
  }

  setTenant(tenant: string) {
    this.tenant = tenant
  }

  getTenant() {
    return this.tenant
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config)
    return response.data
  }

  // Méthodes spécifiques storefront
  storefront = {
    getConfig: () => this.get('/storefront/config'),
    getProducts: (params?: Record<string, unknown>) => this.get('/storefront/products', { params }),
    getProduct: (id: string) => this.get(`/storefront/products/${id}`),
    getFeaturedProducts: (limit?: number) =>
      this.get('/storefront/products/featured', { params: { limit } }),
    getCategories: () => this.get('/storefront/products/categories'),
    getProductsByCategory: (category: string, params?: Record<string, unknown>) =>
      this.get(`/storefront/products/category/${category}`, { params }),
    searchProducts: (query: string, params?: Record<string, unknown>) =>
      this.get('/storefront/search', { params: { q: query, ...params } }),
    getTheme: () => this.get('/storefront/theme'),
    getMenu: () => this.get('/storefront/menu'),
    getPage: (slug: string) => this.get(`/storefront/pages/${slug}`),
    subscribeNewsletter: (email: string) =>
      this.post('/storefront/newsletter/subscribe', { email }),
    sendContactMessage: (data: Record<string, unknown>) => this.post('/storefront/contact', data),
  }

  // Méthodes customers
  customers = {
    register: (data: Record<string, unknown>) => this.post('/customers/register', data),
    login: (data: Record<string, unknown>) => this.post('/customers/login', data),
    createGuest: (data: Record<string, unknown>) => this.post('/customers/guest', data),
    getProfile: (customerId: string) => this.get(`/customers/profile/${customerId}`),
    updateProfile: (customerId: string, data: Record<string, unknown>) =>
      this.put(`/customers/profile/${customerId}`, data),
    addAddress: (customerId: string, address: Record<string, unknown>) =>
      this.post(`/customers/profile/${customerId}/addresses`, address),
    updateAddress: (customerId: string, addressId: string, data: Record<string, unknown>) =>
      this.put(`/customers/profile/${customerId}/addresses/${addressId}`, data),
    removeAddress: (customerId: string, addressId: string) =>
      this.delete(`/customers/profile/${customerId}/addresses/${addressId}`),
    convertToAccount: (customerId: string, data: Record<string, unknown>) =>
      this.post(`/customers/profile/${customerId}/convert-to-account`, data),
    updatePassword: (customerId: string, data: Record<string, unknown>) =>
      this.put(`/customers/profile/${customerId}/password`, data),
    requestPasswordReset: (email: string) =>
      this.post('/customers/password/reset-request', { email }),
    resetPassword: (token: string, newPassword: string) =>
      this.post('/customers/password/reset', { token, newPassword }),
    checkEmail: (email: string) => this.get(`/customers/check-email/${email}`),
  }
}

// Instance singleton
export const apiClient = new MarketplaceApiClient()
export const marketplaceApi = apiClient

// Hook pour définir le tenant
export const useTenant = (tenant: string) => {
  apiClient.setTenant(tenant)
  return apiClient
}
