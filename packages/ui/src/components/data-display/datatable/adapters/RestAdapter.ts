/**
 * REST API Data Adapter
 * Implements data operations for RESTful APIs
 */

import type {
  DataAdapter,
  DataQuery,
  DataResponse,
  RestAdapterConfig,
} from './types'
import {
  AdapterError,
  AuthenticationError,
  NetworkError,
  NotFoundError,
  ValidationError,
} from './types'

/**
 * RestAdapter - Works with RESTful APIs
 * Supports different API conventions and customizable query transformations
 */
export class RestAdapter<T extends Record<string, unknown> = Record<string, unknown>>
  implements DataAdapter<T>
{
  private readonly baseUrl: string
  private readonly endpoints: Required<NonNullable<RestAdapterConfig['endpoints']>>
  private readonly headers: Record<string, string>
  private readonly queryParams: Required<NonNullable<RestAdapterConfig['queryParams']>>
  private readonly convention: NonNullable<RestAdapterConfig['convention']>
  private readonly timeout: number
  private readonly debug: boolean
  private readonly transformQuery?: (query: DataQuery) => Record<string, unknown>
  private readonly transformResponse?: <R>(response: unknown) => DataResponse<R>

  constructor(config: RestAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.endpoints = {
      fetch: config.endpoints?.fetch ?? '',
      create: config.endpoints?.create ?? '',
      update: config.endpoints?.update ?? '/:id',
      delete: config.endpoints?.delete ?? '/:id',
      bulkDelete: config.endpoints?.bulkDelete ?? '/bulk-delete',
    }
    this.queryParams = {
      page: config.queryParams?.page ?? 'page',
      pageSize: config.queryParams?.pageSize ?? 'pageSize',
      sort: config.queryParams?.sort ?? 'sort',
      search: config.queryParams?.search ?? 'search',
    }
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }

    if (config.authToken) {
      this.headers['Authorization'] = `Bearer ${config.authToken}`
    }

    this.convention = config.convention ?? 'rest'
    this.timeout = config.timeout ?? 30000
    this.debug = config.debug ?? false
    this.transformQuery = config.transformQuery
    this.transformResponse = config.transformResponse
  }

  /**
   * Fetch data from REST API
   */
  async fetch(query: DataQuery): Promise<DataResponse<T>> {
    this.log('Fetching data with query:', query)

    const url = this.buildUrl(this.endpoints.fetch, query)
    const response = await this.request<DataResponse<T> | T[]>(url, {
      method: 'GET',
    })

    return this.normalizeResponse(response, query)
  }

  /**
   * Create a new item
   */
  async create(item: Partial<T>): Promise<T> {
    this.log('Creating item:', item)

    const url = this.buildUrl(this.endpoints.create)
    const response = await this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(this.normalizeRequestBody(item)),
    })

    return this.extractData(response)
  }

  /**
   * Update an existing item
   */
  async update(id: string | number, item: Partial<T>): Promise<T> {
    this.log('Updating item:', id, item)

    const url = this.buildUrl(this.endpoints.update, undefined, { id: String(id) })
    const response = await this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(this.normalizeRequestBody(item)),
    })

    return this.extractData(response)
  }

  /**
   * Delete a single item
   */
  async delete(id: string | number): Promise<void> {
    this.log('Deleting item:', id)

    const url = this.buildUrl(this.endpoints.delete, undefined, { id: String(id) })
    await this.request<void>(url, {
      method: 'DELETE',
    })
  }

  /**
   * Delete multiple items
   */
  async bulkDelete(ids: (string | number)[]): Promise<void> {
    this.log('Bulk deleting items:', ids)

    const url = this.buildUrl(this.endpoints.bulkDelete)
    await this.request<void>(url, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  /**
   * Build URL with query parameters and path parameters
   */
  private buildUrl(
    endpoint: string,
    query?: DataQuery,
    pathParams?: Record<string, string>
  ): string {
    let url = `${this.baseUrl}${endpoint}`

    // Replace path parameters
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`:${key}`, encodeURIComponent(value))
      })
    }

    // Add query parameters
    if (query) {
      const params = new URLSearchParams()

      // Use custom query transformer if provided
      if (this.transformQuery) {
        const customParams = this.transformQuery(query)
        Object.entries(customParams).forEach(([key, value]) => {
          params.append(key, String(value))
        })
      } else {
        // Default query parameter handling
        if (query.page !== undefined) {
          params.append(this.queryParams.page, String(query.page))
        }
        if (query.pageSize !== undefined) {
          params.append(this.queryParams.pageSize, String(query.pageSize))
        }
        if (query.search) {
          params.append(this.queryParams.search, query.search)
        }
        if (query.sort && query.sort.length > 0) {
          // Format: column:direction,column:direction
          const sortString = query.sort
            .map((s) => `${s.column}:${s.direction}`)
            .join(',')
          params.append(this.queryParams.sort, sortString)
        }
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              params.append(`filter[${key}]`, String(value))
            }
          })
        }
        if (query.params) {
          Object.entries(query.params).forEach(([key, value]) => {
            params.append(key, String(value))
          })
        }
      }

      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    return url
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async request<R>(url: string, options: RequestInit): Promise<R> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      this.log('Request:', options.method, url)

      const response = await fetch(url, {
        ...options,
        headers: this.headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as R
      }

      const data = await response.json()
      this.log('Response:', data)

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`)
      }

      if (error instanceof AdapterError) {
        throw error
      }

      throw new NetworkError(
        `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    let errorDetails: unknown

    try {
      errorDetails = await response.json()
      if (errorDetails && typeof errorDetails === 'object' && 'message' in errorDetails) {
        errorMessage = (errorDetails as { message: string }).message
      }
    } catch {
      // Unable to parse error response
    }

    switch (response.status) {
      case 400:
        throw new ValidationError(errorMessage, errorDetails)
      case 401:
      case 403:
        throw new AuthenticationError(errorMessage, errorDetails)
      case 404:
        throw new NotFoundError(errorMessage, errorDetails)
      default:
        throw new AdapterError(errorMessage, `HTTP_${response.status}`, errorDetails)
    }
  }

  /**
   * Normalize response based on API convention
   */
  private normalizeResponse(response: DataResponse<T> | T[], query: DataQuery): DataResponse<T> {
    // Use custom response transformer if provided
    if (this.transformResponse) {
      return this.transformResponse<T>(response)
    }

    // Handle array response (simple REST)
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? response.length,
      }
    }

    // Handle JSON:API format
    if (this.convention === 'jsonapi' && 'data' in response) {
      const jsonApiResponse = response as {
        data: T[]
        meta?: { total?: number; page?: number; pageSize?: number }
      }
      return {
        data: jsonApiResponse.data,
        total: jsonApiResponse.meta?.total ?? jsonApiResponse.data.length,
        page: jsonApiResponse.meta?.page ?? query.page ?? 1,
        pageSize: jsonApiResponse.meta?.pageSize ?? query.pageSize ?? jsonApiResponse.data.length,
      }
    }

    // Handle standard DataResponse format
    if ('data' in response && 'total' in response) {
      return response as DataResponse<T>
    }

    // Fallback: treat as array
    return {
      data: [response] as unknown as T[],
      total: 1,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 1,
    }
  }

  /**
   * Normalize request body based on API convention
   */
  private normalizeRequestBody(item: Partial<T>): unknown {
    if (this.convention === 'jsonapi') {
      return {
        data: {
          type: 'resource',
          attributes: item,
        },
      }
    }

    return item
  }

  /**
   * Extract data from response based on API convention
   */
  private extractData(response: unknown): T {
    if (this.convention === 'jsonapi') {
      const jsonApiResponse = response as { data: { attributes: T } }
      return jsonApiResponse.data.attributes
    }

    return response as T
  }

  /**
   * Update adapter configuration
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[RestAdapter]', ...args)
    }
  }
}
