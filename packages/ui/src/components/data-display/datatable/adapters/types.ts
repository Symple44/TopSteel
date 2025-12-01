/**
 * Data Adapter Types
 * Defines interfaces for abstracting data sources in the DataTable component
 */

/**
 * Filter value types
 */
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | string[]
  | number[]
  | { min?: number; max?: number }
  | { start?: Date; end?: Date }
  | Record<string, unknown>

/**
 * Sort configuration for data queries
 */
export interface SortQuery {
  column: string
  direction: 'asc' | 'desc'
}

/**
 * Data query parameters
 * Standardized query interface for all adapters
 */
export interface DataQuery {
  /** Current page number (1-indexed) */
  page?: number
  /** Number of items per page */
  pageSize?: number
  /** Sort configuration array (supports multi-column sorting) */
  sort?: SortQuery[]
  /** Filter values by field name */
  filters?: Record<string, FilterValue>
  /** Global search string */
  search?: string
  /** Additional custom parameters */
  params?: Record<string, unknown>
}

/**
 * Standardized data response
 */
export interface DataResponse<T> {
  /** Array of data items */
  data: T[]
  /** Total number of items (across all pages) */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  pageSize: number
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Core data adapter interface
 * All adapters must implement this interface
 */
export interface DataAdapter<T = Record<string, unknown>> {
  /**
   * Fetch data with query parameters
   * @param query - Query parameters for filtering, sorting, pagination
   * @returns Promise resolving to data response
   */
  fetch(query: DataQuery): Promise<DataResponse<T>>

  /**
   * Create a new item (optional)
   * @param item - Partial item data
   * @returns Promise resolving to created item
   */
  create?(item: Partial<T>): Promise<T>

  /**
   * Update an existing item (optional)
   * @param id - Item identifier
   * @param item - Partial item data to update
   * @returns Promise resolving to updated item
   */
  update?(id: string | number, item: Partial<T>): Promise<T>

  /**
   * Delete a single item (optional)
   * @param id - Item identifier
   * @returns Promise resolving when deletion is complete
   */
  delete?(id: string | number): Promise<void>

  /**
   * Delete multiple items (optional)
   * @param ids - Array of item identifiers
   * @returns Promise resolving when deletion is complete
   */
  bulkDelete?(ids: (string | number)[]): Promise<void>

  /**
   * Subscribe to real-time updates (optional)
   * @param callback - Function called when data changes
   * @returns Unsubscribe function
   */
  subscribe?(callback: (data: T[]) => void): () => void
}

/**
 * Adapter configuration options
 */
export interface AdapterConfig {
  /** Enable debug logging */
  debug?: boolean
  /** Request timeout in milliseconds */
  timeout?: number
  /** Retry configuration */
  retry?: {
    attempts: number
    delay: number
  }
  /** Transform response data */
  transformResponse?: <T>(data: unknown) => T[]
  /** Transform error messages */
  transformError?: (error: unknown) => Error
}

/**
 * REST adapter specific configuration
 */
export interface RestAdapterConfig extends AdapterConfig {
  /** Base URL for API endpoints */
  baseUrl: string
  /** Endpoint paths */
  endpoints?: {
    fetch?: string
    create?: string
    update?: string
    delete?: string
    bulkDelete?: string
  }
  /** HTTP headers */
  headers?: Record<string, string>
  /** Authentication token */
  authToken?: string
  /** Query parameter mapping */
  queryParams?: {
    page?: string
    pageSize?: string
    sort?: string
    search?: string
  }
  /** API convention type */
  convention?: 'jsonapi' | 'rest' | 'custom'
  /** Custom query transformer */
  transformQuery?: (query: DataQuery) => Record<string, unknown>
  /** Custom response transformer */
  transformResponse?: <T>(response: unknown) => DataResponse<T>
}

/**
 * GraphQL adapter specific configuration
 */
export interface GraphQLAdapterConfig extends AdapterConfig {
  /** GraphQL endpoint URL */
  endpoint: string
  /** HTTP headers */
  headers?: Record<string, string>
  /** Authentication token */
  authToken?: string
  /** GraphQL queries */
  queries?: {
    fetch?: string
    create?: string
    update?: string
    delete?: string
  }
  /** GraphQL mutations */
  mutations?: {
    create?: string
    update?: string
    delete?: string
    bulkDelete?: string
  }
  /** Type name for GraphQL operations */
  typeName?: string
  /** Custom variables transformer */
  transformVariables?: (query: DataQuery) => Record<string, unknown>
}

/**
 * Supabase adapter specific configuration
 */
export interface SupabaseAdapterConfig extends AdapterConfig {
  /** Supabase client instance */
  client: unknown // SupabaseClient type would be imported from @supabase/supabase-js
  /** Table name */
  table: string
  /** Columns to select (default: '*') */
  selectColumns?: string[]
  /** Enable real-time subscriptions */
  realtime?: boolean
  /** Real-time channel configuration */
  realtimeChannel?: string
  /** Foreign key relationships to include */
  relations?: Array<{
    table: string
    foreignKey: string
    columns?: string[]
  }>
  /** Row-level security policies */
  rls?: boolean
}

/**
 * Local adapter specific configuration
 */
export interface LocalAdapterConfig<T = Record<string, unknown>> extends AdapterConfig {
  /** Initial data array */
  data: T[]
  /** Key field for identifying items (default: 'id') */
  keyField?: keyof T | string
  /** Enable case-insensitive search */
  caseInsensitiveSearch?: boolean
  /** Fields to include in global search */
  searchFields?: (keyof T | string)[]
  /** Custom filter function */
  customFilter?: (item: T, filters: Record<string, FilterValue>) => boolean
  /** Custom sort function */
  customSort?: (a: T, b: T, sort: SortQuery[]) => number
}

/**
 * Adapter error types
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AdapterError'
  }
}

export class NetworkError extends AdapterError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends AdapterError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AdapterError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', details)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends AdapterError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND', details)
    this.name = 'NotFoundError'
  }
}
