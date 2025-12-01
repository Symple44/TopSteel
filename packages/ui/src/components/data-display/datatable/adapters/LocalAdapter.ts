/**
 * Local Data Adapter
 * Implements client-side data operations for in-memory arrays
 */

import type {
  DataAdapter,
  DataQuery,
  DataResponse,
  FilterValue,
  LocalAdapterConfig,
  SortQuery,
} from './types'

/**
 * LocalAdapter - Works with in-memory data arrays
 * Provides full CRUD operations with client-side filtering, sorting, and pagination
 */
export class LocalAdapter<T extends Record<string, unknown> = Record<string, unknown>>
  implements DataAdapter<T>
{
  private data: T[]
  private readonly keyField: keyof T | string
  private readonly caseInsensitiveSearch: boolean
  private readonly searchFields?: (keyof T | string)[]
  private readonly customFilter?: (item: T, filters: Record<string, FilterValue>) => boolean
  private readonly customSort?: (a: T, b: T, sort: SortQuery[]) => number
  private readonly debug: boolean

  constructor(config: LocalAdapterConfig<T>) {
    this.data = [...config.data]
    this.keyField = config.keyField || 'id'
    this.caseInsensitiveSearch = config.caseInsensitiveSearch ?? true
    this.searchFields = config.searchFields
    this.customFilter = config.customFilter
    this.customSort = config.customSort
    this.debug = config.debug ?? false
  }

  /**
   * Fetch data with filtering, sorting, and pagination
   */
  async fetch(query: DataQuery): Promise<DataResponse<T>> {
    this.log('Fetching data with query:', query)

    let filteredData = [...this.data]

    // Apply filters
    if (query.filters && Object.keys(query.filters).length > 0) {
      filteredData = this.applyFilters(filteredData, query.filters)
    }

    // Apply global search
    if (query.search && query.search.trim() !== '') {
      filteredData = this.applySearch(filteredData, query.search)
    }

    // Apply sorting
    if (query.sort && query.sort.length > 0) {
      filteredData = this.applySort(filteredData, query.sort)
    }

    const total = filteredData.length
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? total

    // Apply pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = filteredData.slice(startIndex, endIndex)

    this.log(`Returning ${paginatedData.length} of ${total} items`)

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
    }
  }

  /**
   * Create a new item
   */
  async create(item: Partial<T>): Promise<T> {
    this.log('Creating item:', item)

    // Generate ID if not provided
    const newItem = {
      ...item,
      [this.keyField]: item[this.keyField as keyof T] ?? this.generateId(),
    } as T

    this.data.push(newItem)
    this.log('Item created:', newItem)

    return newItem
  }

  /**
   * Update an existing item
   */
  async update(id: string | number, item: Partial<T>): Promise<T> {
    this.log('Updating item:', id, item)

    const index = this.data.findIndex((row) => row[this.keyField] === id)
    if (index === -1) {
      throw new Error(`Item with ${String(this.keyField)}=${id} not found`)
    }

    this.data[index] = {
      ...this.data[index],
      ...item,
      [this.keyField]: id, // Preserve the ID
    }

    this.log('Item updated:', this.data[index])
    return this.data[index]
  }

  /**
   * Delete a single item
   */
  async delete(id: string | number): Promise<void> {
    this.log('Deleting item:', id)

    const index = this.data.findIndex((row) => row[this.keyField] === id)
    if (index === -1) {
      throw new Error(`Item with ${String(this.keyField)}=${id} not found`)
    }

    this.data.splice(index, 1)
    this.log('Item deleted')
  }

  /**
   * Delete multiple items
   */
  async bulkDelete(ids: (string | number)[]): Promise<void> {
    this.log('Bulk deleting items:', ids)

    this.data = this.data.filter((row) => !ids.includes(row[this.keyField] as string | number))
    this.log(`Deleted ${ids.length} items`)
  }

  /**
   * Apply filters to data
   */
  private applyFilters(data: T[], filters: Record<string, FilterValue>): T[] {
    if (this.customFilter) {
      return data.filter((item) => this.customFilter!(item, filters))
    }

    return data.filter((item) => {
      return Object.entries(filters).every(([field, value]) => {
        if (value === null || value === undefined) {
          return true
        }

        const itemValue = item[field]

        // Handle array filters (multiselect)
        if (Array.isArray(value)) {
          return value.includes(itemValue as string | number)
        }

        // Handle range filters
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          const rangeValue = value as { min?: number; max?: number; start?: Date; end?: Date }

          if ('min' in rangeValue && rangeValue.min !== undefined) {
            if ((itemValue as number) < rangeValue.min) return false
          }
          if ('max' in rangeValue && rangeValue.max !== undefined) {
            if ((itemValue as number) > rangeValue.max) return false
          }
          if ('start' in rangeValue && rangeValue.start !== undefined) {
            if (new Date(itemValue as string | Date) < rangeValue.start) return false
          }
          if ('end' in rangeValue && rangeValue.end !== undefined) {
            if (new Date(itemValue as string | Date) > rangeValue.end) return false
          }

          return true
        }

        // Handle string comparison
        if (typeof value === 'string' && typeof itemValue === 'string') {
          if (this.caseInsensitiveSearch) {
            return itemValue.toLowerCase().includes(value.toLowerCase())
          }
          return itemValue.includes(value)
        }

        // Handle exact match
        return itemValue === value
      })
    })
  }

  /**
   * Apply global search to data
   */
  private applySearch(data: T[], search: string): T[] {
    const searchLower = this.caseInsensitiveSearch ? search.toLowerCase() : search
    const fieldsToSearch = this.searchFields || Object.keys(data[0] || {})

    return data.filter((item) => {
      return fieldsToSearch.some((field) => {
        const value = item[field]
        if (value === null || value === undefined) return false

        const stringValue = String(value)
        const compareValue = this.caseInsensitiveSearch ? stringValue.toLowerCase() : stringValue

        return compareValue.includes(searchLower)
      })
    })
  }

  /**
   * Apply sorting to data
   */
  private applySort(data: T[], sort: SortQuery[]): T[] {
    if (this.customSort) {
      return [...data].sort((a, b) => this.customSort!(a, b, sort))
    }

    return [...data].sort((a, b) => {
      for (const sortConfig of sort) {
        const aValue = a[sortConfig.column]
        const bValue = b[sortConfig.column]

        let comparison = 0

        if (aValue === null || aValue === undefined) {
          comparison = 1
        } else if (bValue === null || bValue === undefined) {
          comparison = -1
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue)
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime()
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }

        if (comparison !== 0) {
          return sortConfig.direction === 'desc' ? -comparison : comparison
        }
      }

      return 0
    })
  }

  /**
   * Generate a unique ID for new items
   */
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get current data (useful for external access)
   */
  getData(): T[] {
    return [...this.data]
  }

  /**
   * Set data (useful for updates from external sources)
   */
  setData(data: T[]): void {
    this.data = [...data]
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[LocalAdapter]', ...args)
    }
  }
}
