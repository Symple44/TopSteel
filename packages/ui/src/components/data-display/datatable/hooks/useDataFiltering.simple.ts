'use client'

import { useMemo } from 'react'
import type { FilterConfig } from '../types'

/**
 * Simple hook for filtering data
 * Used for testing purposes
 */
export function useDataFiltering<T>(
  data: T[],
  filters: FilterConfig[],
  searchTerm?: string
): T[] {
  return useMemo(() => {
    let filtered = [...data]

    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(search))
      )
    }

    // Apply filters
    filters.forEach((filter) => {
      const { field, column, value, operator = 'equals' } = filter
      const fieldName = field || column
      if (!fieldName) return

      filtered = filtered.filter((row) => {
        const rowValue = row[fieldName]

        switch (operator) {
          case 'equals':
            return rowValue === value
          case 'not_equals':
            return rowValue !== value
          case 'contains':
            return String(rowValue).toLowerCase().includes(String(value).toLowerCase())
          case 'not_contains':
            return !String(rowValue).toLowerCase().includes(String(value).toLowerCase())
          case 'starts_with':
            return String(rowValue).toLowerCase().startsWith(String(value).toLowerCase())
          case 'ends_with':
            return String(rowValue).toLowerCase().endsWith(String(value).toLowerCase())
          case 'gt':
            return Number(rowValue) > Number(value)
          case 'lt':
            return Number(rowValue) < Number(value)
          case 'gte':
            return Number(rowValue) >= Number(value)
          case 'lte':
            return Number(rowValue) <= Number(value)
          case 'is_empty':
            return !rowValue || rowValue === ''
          case 'is_not_empty':
            return rowValue && rowValue !== ''
          case 'in':
            return Array.isArray(value) && value.includes(rowValue)
          case 'not_in':
            return Array.isArray(value) && !value.includes(rowValue)
          case 'between':
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              Number(rowValue) >= Number(value[0]) &&
              Number(rowValue) <= Number(value[1])
            )
          default:
            return true
        }
      })
    })

    return filtered
  }, [data, filters, searchTerm])
}
