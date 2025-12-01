/**
 * GraphQL Data Adapter
 * Implements data operations for GraphQL APIs
 */

import type {
  DataAdapter,
  DataQuery,
  DataResponse,
  GraphQLAdapterConfig,
} from './types'
import {
  AdapterError,
  AuthenticationError,
  NetworkError,
  ValidationError,
} from './types'

/**
 * GraphQL query builder utility
 */
class GraphQLQueryBuilder {
  static buildFetchQuery(
    typeName: string,
    customQuery?: string
  ): string {
    if (customQuery) return customQuery

    return `
      query FetchData(
        $page: Int
        $pageSize: Int
        $sort: [SortInput]
        $filters: FilterInput
        $search: String
      ) {
        ${typeName}(
          page: $page
          pageSize: $pageSize
          sort: $sort
          filters: $filters
          search: $search
        ) {
          data {
            id
          }
          total
          page
          pageSize
        }
      }
    `
  }

  static buildCreateMutation(
    typeName: string,
    customMutation?: string
  ): string {
    if (customMutation) return customMutation

    return `
      mutation Create${typeName}($input: ${typeName}Input!) {
        create${typeName}(input: $input) {
          id
        }
      }
    `
  }

  static buildUpdateMutation(
    typeName: string,
    customMutation?: string
  ): string {
    if (customMutation) return customMutation

    return `
      mutation Update${typeName}($id: ID!, $input: ${typeName}Input!) {
        update${typeName}(id: $id, input: $input) {
          id
        }
      }
    `
  }

  static buildDeleteMutation(
    typeName: string,
    customMutation?: string
  ): string {
    if (customMutation) return customMutation

    return `
      mutation Delete${typeName}($id: ID!) {
        delete${typeName}(id: $id)
      }
    `
  }

  static buildBulkDeleteMutation(
    typeName: string,
    customMutation?: string
  ): string {
    if (customMutation) return customMutation

    return `
      mutation BulkDelete${typeName}($ids: [ID!]!) {
        bulkDelete${typeName}(ids: $ids)
      }
    `
  }
}

/**
 * GraphQLAdapter - Works with GraphQL APIs
 * Supports dynamic query generation and custom operations
 */
export class GraphQLAdapter<T extends Record<string, unknown> = Record<string, unknown>>
  implements DataAdapter<T>
{
  private readonly endpoint: string
  private readonly headers: Record<string, string>
  private readonly typeName: string
  private readonly queries: {
    fetch: string
    create: string
    update: string
    delete: string
  }
  private readonly mutations: {
    create: string
    update: string
    delete: string
    bulkDelete: string
  }
  private readonly timeout: number
  private readonly debug: boolean
  private readonly transformVariables?: (query: DataQuery) => Record<string, unknown>

  constructor(config: GraphQLAdapterConfig) {
    this.endpoint = config.endpoint
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }

    if (config.authToken) {
      this.headers['Authorization'] = `Bearer ${config.authToken}`
    }

    this.typeName = config.typeName ?? 'Item'
    this.timeout = config.timeout ?? 30000
    this.debug = config.debug ?? false
    this.transformVariables = config.transformVariables

    // Build queries
    this.queries = {
      fetch: GraphQLQueryBuilder.buildFetchQuery(this.typeName, config.queries?.fetch),
      create: GraphQLQueryBuilder.buildCreateMutation(this.typeName, config.queries?.create),
      update: GraphQLQueryBuilder.buildUpdateMutation(this.typeName, config.queries?.update),
      delete: GraphQLQueryBuilder.buildDeleteMutation(this.typeName, config.queries?.delete),
    }

    // Build mutations
    this.mutations = {
      create: GraphQLQueryBuilder.buildCreateMutation(this.typeName, config.mutations?.create),
      update: GraphQLQueryBuilder.buildUpdateMutation(this.typeName, config.mutations?.update),
      delete: GraphQLQueryBuilder.buildDeleteMutation(this.typeName, config.mutations?.delete),
      bulkDelete: GraphQLQueryBuilder.buildBulkDeleteMutation(this.typeName, config.mutations?.bulkDelete),
    }
  }

  /**
   * Fetch data using GraphQL query
   */
  async fetch(query: DataQuery): Promise<DataResponse<T>> {
    this.log('Fetching data with query:', query)

    const variables = this.transformVariables
      ? this.transformVariables(query)
      : this.buildDefaultVariables(query)

    const response = await this.executeQuery<{
      [key: string]: DataResponse<T>
    }>(this.queries.fetch, variables)

    // Extract data from response (GraphQL typically nests data under the query name)
    const dataKey = Object.keys(response).find((key) => key !== '__typename')
    if (!dataKey) {
      throw new AdapterError('Invalid GraphQL response structure')
    }

    return response[dataKey]
  }

  /**
   * Create a new item
   */
  async create(item: Partial<T>): Promise<T> {
    this.log('Creating item:', item)

    const response = await this.executeQuery<{
      [key: string]: T
    }>(this.mutations.create, { input: item })

    const dataKey = Object.keys(response).find((key) => key !== '__typename')
    if (!dataKey) {
      throw new AdapterError('Invalid GraphQL response structure')
    }

    return response[dataKey]
  }

  /**
   * Update an existing item
   */
  async update(id: string | number, item: Partial<T>): Promise<T> {
    this.log('Updating item:', id, item)

    const response = await this.executeQuery<{
      [key: string]: T
    }>(this.mutations.update, { id: String(id), input: item })

    const dataKey = Object.keys(response).find((key) => key !== '__typename')
    if (!dataKey) {
      throw new AdapterError('Invalid GraphQL response structure')
    }

    return response[dataKey]
  }

  /**
   * Delete a single item
   */
  async delete(id: string | number): Promise<void> {
    this.log('Deleting item:', id)

    await this.executeQuery(this.mutations.delete, { id: String(id) })
  }

  /**
   * Delete multiple items
   */
  async bulkDelete(ids: (string | number)[]): Promise<void> {
    this.log('Bulk deleting items:', ids)

    await this.executeQuery(this.mutations.bulkDelete, { ids: ids.map(String) })
  }

  /**
   * Execute GraphQL query/mutation
   */
  private async executeQuery<R>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<R> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      this.log('Executing GraphQL:', { query, variables })

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      this.log('GraphQL Response:', result)

      if (result.errors) {
        this.handleGraphQLErrors(result.errors)
      }

      if (!result.data) {
        throw new AdapterError('GraphQL response missing data field')
      }

      return result.data as R
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`)
      }

      if (error instanceof AdapterError) {
        throw error
      }

      throw new NetworkError(
        `GraphQL request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Handle GraphQL errors
   */
  private handleGraphQLErrors(errors: Array<{ message: string; extensions?: { code?: string } }>): never {
    const firstError = errors[0]
    const message = firstError.message
    const code = firstError.extensions?.code

    switch (code) {
      case 'UNAUTHENTICATED':
      case 'FORBIDDEN':
        throw new AuthenticationError(message, errors)
      case 'BAD_USER_INPUT':
        throw new ValidationError(message, errors)
      default:
        throw new AdapterError(message, code, errors)
    }
  }

  /**
   * Build default variables from DataQuery
   */
  private buildDefaultVariables(query: DataQuery): Record<string, unknown> {
    const variables: Record<string, unknown> = {}

    if (query.page !== undefined) {
      variables.page = query.page
    }
    if (query.pageSize !== undefined) {
      variables.pageSize = query.pageSize
    }
    if (query.search) {
      variables.search = query.search
    }
    if (query.sort && query.sort.length > 0) {
      variables.sort = query.sort.map((s) => ({
        field: s.column,
        direction: s.direction.toUpperCase(),
      }))
    }
    if (query.filters && Object.keys(query.filters).length > 0) {
      variables.filters = query.filters
    }
    if (query.params) {
      Object.assign(variables, query.params)
    }

    return variables
  }

  /**
   * Update adapter configuration
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`
  }

  /**
   * Get current endpoint
   */
  getEndpoint(): string {
    return this.endpoint
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[GraphQLAdapter]', ...args)
    }
  }
}
