/**
 * Supabase Data Adapter
 * Implements data operations for Supabase backend
 */

import type {
  DataAdapter,
  DataQuery,
  DataResponse,
  FilterValue,
  SupabaseAdapterConfig,
} from './types'
import { AdapterError, NetworkError } from './types'

/**
 * Supabase client type (to avoid direct dependency)
 */
interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder
  channel: (name: string) => SupabaseRealtimeChannel
}

interface SupabaseQueryBuilder {
  select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated' }) => SupabaseQueryBuilder
  insert: (data: unknown) => SupabaseQueryBuilder
  update: (data: unknown) => SupabaseQueryBuilder
  delete: () => SupabaseQueryBuilder
  eq: (column: string, value: unknown) => SupabaseQueryBuilder
  neq: (column: string, value: unknown) => SupabaseQueryBuilder
  gt: (column: string, value: unknown) => SupabaseQueryBuilder
  gte: (column: string, value: unknown) => SupabaseQueryBuilder
  lt: (column: string, value: unknown) => SupabaseQueryBuilder
  lte: (column: string, value: unknown) => SupabaseQueryBuilder
  like: (column: string, pattern: string) => SupabaseQueryBuilder
  ilike: (column: string, pattern: string) => SupabaseQueryBuilder
  in: (column: string, values: unknown[]) => SupabaseQueryBuilder
  contains: (column: string, value: unknown) => SupabaseQueryBuilder
  containedBy: (column: string, value: unknown) => SupabaseQueryBuilder
  range: (from: number, to: number) => SupabaseQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder
  limit: (count: number) => SupabaseQueryBuilder
  single: () => SupabaseQueryBuilder
  maybeSingle: () => SupabaseQueryBuilder
  then: <T>(
    onfulfilled?: (value: { data: T | null; error: Error | null; count?: number | null }) => unknown
  ) => Promise<unknown>
}

interface SupabaseRealtimeChannel {
  on: (
    event: string,
    filter: Record<string, unknown>,
    callback: (payload: { new: unknown; old: unknown }) => void
  ) => SupabaseRealtimeChannel
  subscribe: () => SupabaseRealtimeChannel
  unsubscribe: () => Promise<void>
}

/**
 * SupabaseAdapter - Works with Supabase backend
 * Provides full CRUD operations with real-time subscription support
 */
export class SupabaseAdapter<T extends Record<string, unknown> = Record<string, unknown>>
  implements DataAdapter<T>
{
  private readonly client: SupabaseClient
  private readonly table: string
  private readonly selectColumns: string
  private readonly realtime: boolean
  private readonly realtimeChannel?: string
  private readonly relations?: NonNullable<SupabaseAdapterConfig['relations']>
  private readonly debug: boolean
  private realtimeSubscription?: SupabaseRealtimeChannel

  constructor(config: SupabaseAdapterConfig) {
    this.client = config.client as SupabaseClient
    this.table = config.table
    this.selectColumns = config.selectColumns?.join(', ') ?? '*'
    this.realtime = config.realtime ?? false
    this.realtimeChannel = config.realtimeChannel
    this.relations = config.relations
    this.debug = config.debug ?? false
  }

  /**
   * Fetch data from Supabase
   */
  async fetch(query: DataQuery): Promise<DataResponse<T>> {
    this.log('Fetching data with query:', query)

    try {
      // Build base query with count
      let supabaseQuery = this.client
        .from(this.table)
        .select(this.buildSelectClause(), { count: 'exact' })

      // Apply filters
      if (query.filters) {
        supabaseQuery = this.applyFilters(supabaseQuery, query.filters)
      }

      // Apply global search
      if (query.search) {
        supabaseQuery = this.applySearch(supabaseQuery, query.search)
      }

      // Apply sorting
      if (query.sort && query.sort.length > 0) {
        for (const sortConfig of query.sort) {
          supabaseQuery = supabaseQuery.order(sortConfig.column, {
            ascending: sortConfig.direction === 'asc',
          })
        }
      }

      // Apply pagination
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 10
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      supabaseQuery = supabaseQuery.range(from, to)

      // Execute query
      const { data, error, count } = await supabaseQuery.then<{
        data: T[] | null
        error: Error | null
        count: number | null
      }>((result) => result)

      if (error) {
        throw new NetworkError(`Supabase query failed: ${error.message}`, error)
      }

      this.log(`Returning ${data?.length ?? 0} of ${count ?? 0} items`)

      return {
        data: data ?? [],
        total: count ?? 0,
        page,
        pageSize,
      }
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error
      }
      throw new NetworkError(
        `Supabase fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Create a new item
   */
  async create(item: Partial<T>): Promise<T> {
    this.log('Creating item:', item)

    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert(item)
        .select()
        .single()
        .then<{ data: T | null; error: Error | null }>((result) => result)

      if (error) {
        throw new NetworkError(`Supabase insert failed: ${error.message}`, error)
      }

      if (!data) {
        throw new AdapterError('No data returned from insert')
      }

      this.log('Item created:', data)
      return data
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error
      }
      throw new NetworkError(
        `Supabase create failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Update an existing item
   */
  async update(id: string | number, item: Partial<T>): Promise<T> {
    this.log('Updating item:', id, item)

    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(item)
        .eq('id', id)
        .select()
        .single()
        .then<{ data: T | null; error: Error | null }>((result) => result)

      if (error) {
        throw new NetworkError(`Supabase update failed: ${error.message}`, error)
      }

      if (!data) {
        throw new AdapterError('No data returned from update')
      }

      this.log('Item updated:', data)
      return data
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error
      }
      throw new NetworkError(
        `Supabase update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Delete a single item
   */
  async delete(id: string | number): Promise<void> {
    this.log('Deleting item:', id)

    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .eq('id', id)
        .then<{ data: null; error: Error | null }>((result) => result)

      if (error) {
        throw new NetworkError(`Supabase delete failed: ${error.message}`, error)
      }

      this.log('Item deleted')
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error
      }
      throw new NetworkError(
        `Supabase delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Delete multiple items
   */
  async bulkDelete(ids: (string | number)[]): Promise<void> {
    this.log('Bulk deleting items:', ids)

    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .in('id', ids)
        .then<{ data: null; error: Error | null }>((result) => result)

      if (error) {
        throw new NetworkError(`Supabase bulk delete failed: ${error.message}`, error)
      }

      this.log(`Deleted ${ids.length} items`)
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error
      }
      throw new NetworkError(
        `Supabase bulk delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: T[]) => void): () => void {
    if (!this.realtime) {
      console.warn('[SupabaseAdapter] Real-time not enabled')
      return () => {}
    }

    this.log('Setting up real-time subscription')

    const channelName = this.realtimeChannel ?? `${this.table}_changes`
    const channel = this.client.channel(channelName)

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: this.table }, (payload) => {
        this.log('Real-time event:', payload)
        // Trigger refetch on any change
        this.fetch({}).then((response) => {
          callback(response.data)
        }).catch((error) => {
          console.error('[SupabaseAdapter] Real-time fetch error:', error)
        })
      })
      .subscribe()

    this.realtimeSubscription = channel

    // Return unsubscribe function
    return () => {
      this.log('Unsubscribing from real-time')
      channel.unsubscribe().catch((error) => {
        console.error('[SupabaseAdapter] Unsubscribe error:', error)
      })
    }
  }

  /**
   * Build SELECT clause with relations
   */
  private buildSelectClause(): string {
    if (!this.relations || this.relations.length === 0) {
      return this.selectColumns
    }

    const relationSelects = this.relations.map((relation) => {
      const columns = relation.columns?.join(', ') ?? '*'
      return `${relation.table}(${columns})`
    })

    return `${this.selectColumns}, ${relationSelects.join(', ')}`
  }

  /**
   * Apply filters to Supabase query
   */
  private applyFilters(
    query: SupabaseQueryBuilder,
    filters: Record<string, FilterValue>
  ): SupabaseQueryBuilder {
    let result = query

    for (const [field, value] of Object.entries(filters)) {
      if (value === null || value === undefined) {
        continue
      }

      // Handle array filters (IN operator)
      if (Array.isArray(value)) {
        result = result.in(field, value)
        continue
      }

      // Handle range filters
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const rangeValue = value as { min?: number; max?: number; start?: Date; end?: Date }

        if ('min' in rangeValue && rangeValue.min !== undefined) {
          result = result.gte(field, rangeValue.min)
        }
        if ('max' in rangeValue && rangeValue.max !== undefined) {
          result = result.lte(field, rangeValue.max)
        }
        if ('start' in rangeValue && rangeValue.start !== undefined) {
          result = result.gte(field, rangeValue.start.toISOString())
        }
        if ('end' in rangeValue && rangeValue.end !== undefined) {
          result = result.lte(field, rangeValue.end.toISOString())
        }

        continue
      }

      // Handle exact match
      result = result.eq(field, value)
    }

    return result
  }

  /**
   * Apply global search to Supabase query
   */
  private applySearch(query: SupabaseQueryBuilder, search: string): SupabaseQueryBuilder {
    // Note: This is a simplified implementation
    // In production, you might want to use Supabase full-text search or
    // apply OR conditions across multiple columns
    // For now, we'll search in all text columns (this requires knowledge of schema)

    // This is a placeholder - implement based on your schema
    return query.ilike('name', `%${search}%`)
  }

  /**
   * Cleanup subscriptions
   */
  async cleanup(): Promise<void> {
    if (this.realtimeSubscription) {
      await this.realtimeSubscription.unsubscribe()
    }
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[SupabaseAdapter]', ...args)
    }
  }
}
