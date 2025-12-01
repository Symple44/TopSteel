'use client'

/**
 * useDataAdapter Hook
 * React hook for managing data adapter state and operations
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DataAdapter, DataQuery, DataResponse } from './types'
import { AdapterError } from './types'

/**
 * Hook state interface
 */
interface UseDataAdapterState<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: Error | null
  metadata?: Record<string, unknown>
}

/**
 * Hook return interface
 */
interface UseDataAdapterReturn<T> {
  /** Current data array */
  data: T[]
  /** Total number of items across all pages */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  pageSize: number
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Optional metadata from response */
  metadata?: Record<string, unknown>
  /** Refetch data with current or new query */
  refetch: (newQuery?: Partial<DataQuery>) => Promise<void>
  /** Create a new item */
  create: (item: Partial<T>) => Promise<T | null>
  /** Update an existing item */
  update: (id: string | number, item: Partial<T>) => Promise<T | null>
  /** Delete a single item */
  deleteItem: (id: string | number) => Promise<boolean>
  /** Delete multiple items */
  bulkDelete: (ids: (string | number)[]) => Promise<boolean>
  /** Update query parameters */
  setQuery: (query: Partial<DataQuery>) => void
  /** Current query */
  query: DataQuery
}

/**
 * Hook options
 */
interface UseDataAdapterOptions {
  /** Automatically fetch data on mount */
  autoFetch?: boolean
  /** Refetch data on query change */
  refetchOnQueryChange?: boolean
  /** Enable real-time updates (if adapter supports it) */
  enableRealtime?: boolean
  /** Callback when data changes */
  onDataChange?: (data: DataResponse<unknown>) => void
  /** Callback when error occurs */
  onError?: (error: Error) => void
  /** Callback when operation succeeds */
  onSuccess?: (operation: 'fetch' | 'create' | 'update' | 'delete', data?: unknown) => void
}

/**
 * useDataAdapter Hook
 * Manages data fetching and CRUD operations with a DataAdapter
 *
 * @param adapter - Data adapter instance
 * @param initialQuery - Initial query parameters
 * @param options - Hook options
 * @returns Hook state and methods
 *
 * @example
 * ```tsx
 * const adapter = new RestAdapter({ baseUrl: '/api/users' })
 * const { data, isLoading, refetch, create } = useDataAdapter(adapter, {
 *   page: 1,
 *   pageSize: 10
 * })
 * ```
 */
export function useDataAdapter<T extends Record<string, unknown> = Record<string, unknown>>(
  adapter: DataAdapter<T>,
  initialQuery?: DataQuery,
  options: UseDataAdapterOptions = {}
): UseDataAdapterReturn<T> {
  const {
    autoFetch = true,
    refetchOnQueryChange = true,
    enableRealtime = false,
    onDataChange,
    onError,
    onSuccess,
  } = options

  // State
  const [state, setState] = useState<UseDataAdapterState<T>>({
    data: [],
    total: 0,
    page: initialQuery?.page ?? 1,
    pageSize: initialQuery?.pageSize ?? 10,
    isLoading: false,
    error: null,
  })

  const [query, setQueryState] = useState<DataQuery>(initialQuery ?? {})

  // Refs to track mounted state and prevent stale updates
  const isMounted = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  /**
   * Fetch data from adapter
   */
  const fetchData = useCallback(
    async (fetchQuery: DataQuery) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await adapter.fetch(fetchQuery)

        if (!isMounted.current) return

        setState({
          data: response.data,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          metadata: response.metadata,
          isLoading: false,
          error: null,
        })

        onDataChange?.(response as DataResponse<unknown>)
        onSuccess?.('fetch', response)
      } catch (error) {
        if (!isMounted.current) return

        const errorObj = error instanceof Error ? error : new Error('Unknown error')

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorObj,
        }))

        onError?.(errorObj)
      } finally {
        abortControllerRef.current = null
      }
    },
    [adapter, onDataChange, onError, onSuccess]
  )

  /**
   * Refetch data with current or new query
   */
  const refetch = useCallback(
    async (newQuery?: Partial<DataQuery>) => {
      const mergedQuery = { ...query, ...newQuery }
      if (newQuery) {
        setQueryState(mergedQuery)
      }
      await fetchData(mergedQuery)
    },
    [query, fetchData]
  )

  /**
   * Create a new item
   */
  const create = useCallback(
    async (item: Partial<T>): Promise<T | null> => {
      if (!adapter.create) {
        console.warn('[useDataAdapter] Create operation not supported by adapter')
        return null
      }

      try {
        setState((prev) => ({ ...prev, error: null }))
        const created = await adapter.create(item)

        if (!isMounted.current) return null

        onSuccess?.('create', created)

        // Refetch to update the list
        await refetch()

        return created
      } catch (error) {
        if (!isMounted.current) return null

        const errorObj = error instanceof Error ? error : new Error('Create failed')

        setState((prev) => ({ ...prev, error: errorObj }))
        onError?.(errorObj)

        return null
      }
    },
    [adapter, refetch, onError, onSuccess]
  )

  /**
   * Update an existing item
   */
  const update = useCallback(
    async (id: string | number, item: Partial<T>): Promise<T | null> => {
      if (!adapter.update) {
        console.warn('[useDataAdapter] Update operation not supported by adapter')
        return null
      }

      try {
        setState((prev) => ({ ...prev, error: null }))
        const updated = await adapter.update(id, item)

        if (!isMounted.current) return null

        onSuccess?.('update', updated)

        // Refetch to update the list
        await refetch()

        return updated
      } catch (error) {
        if (!isMounted.current) return null

        const errorObj = error instanceof Error ? error : new Error('Update failed')

        setState((prev) => ({ ...prev, error: errorObj }))
        onError?.(errorObj)

        return null
      }
    },
    [adapter, refetch, onError, onSuccess]
  )

  /**
   * Delete a single item
   */
  const deleteItem = useCallback(
    async (id: string | number): Promise<boolean> => {
      if (!adapter.delete) {
        console.warn('[useDataAdapter] Delete operation not supported by adapter')
        return false
      }

      try {
        setState((prev) => ({ ...prev, error: null }))
        await adapter.delete(id)

        if (!isMounted.current) return false

        onSuccess?.('delete', id)

        // Refetch to update the list
        await refetch()

        return true
      } catch (error) {
        if (!isMounted.current) return false

        const errorObj = error instanceof Error ? error : new Error('Delete failed')

        setState((prev) => ({ ...prev, error: errorObj }))
        onError?.(errorObj)

        return false
      }
    },
    [adapter, refetch, onError, onSuccess]
  )

  /**
   * Delete multiple items
   */
  const bulkDelete = useCallback(
    async (ids: (string | number)[]): Promise<boolean> => {
      if (!adapter.bulkDelete) {
        console.warn('[useDataAdapter] Bulk delete operation not supported by adapter')
        return false
      }

      try {
        setState((prev) => ({ ...prev, error: null }))
        await adapter.bulkDelete(ids)

        if (!isMounted.current) return false

        onSuccess?.('delete', ids)

        // Refetch to update the list
        await refetch()

        return true
      } catch (error) {
        if (!isMounted.current) return false

        const errorObj = error instanceof Error ? error : new Error('Bulk delete failed')

        setState((prev) => ({ ...prev, error: errorObj }))
        onError?.(errorObj)

        return false
      }
    },
    [adapter, refetch, onError, onSuccess]
  )

  /**
   * Update query parameters
   */
  const setQuery = useCallback((newQuery: Partial<DataQuery>) => {
    setQueryState((prev) => ({ ...prev, ...newQuery }))
  }, [])

  /**
   * Setup real-time subscription
   */
  useEffect(() => {
    if (!enableRealtime || !adapter.subscribe) {
      return
    }

    unsubscribeRef.current = adapter.subscribe((data) => {
      if (!isMounted.current) return

      setState((prev) => ({
        ...prev,
        data,
        total: data.length,
      }))

      onDataChange?.({ data, total: data.length, page: query.page ?? 1, pageSize: query.pageSize ?? 10 })
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [enableRealtime, adapter, onDataChange, query.page, query.pageSize])

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchData(query)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Refetch on query change
   */
  useEffect(() => {
    if (refetchOnQueryChange && !autoFetch) {
      fetchData(query)
    }
  }, [query, refetchOnQueryChange, autoFetch, fetchData])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMounted.current = false

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return {
    data: state.data,
    total: state.total,
    page: state.page,
    pageSize: state.pageSize,
    isLoading: state.isLoading,
    error: state.error,
    metadata: state.metadata,
    refetch,
    create,
    update,
    deleteItem,
    bulkDelete,
    setQuery,
    query,
  }
}
