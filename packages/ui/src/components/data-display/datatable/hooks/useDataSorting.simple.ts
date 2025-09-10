'use client'

import { useMemo } from 'react'
import type { SortConfig } from '../types'

/**
 * Simple hook for sorting data based on sort configuration
 * Used for testing purposes
 */
export function useDataSorting<T extends Record<string, unknown>>(
  data: T[],
  sortConfig: SortConfig[]
): T[] {
  return useMemo(() => {
    if (!sortConfig || sortConfig.length === 0) {
      return data
    }

    const sorted = [...data].sort((a, b) => {
      for (const sort of sortConfig) {
        const { column, direction } = sort

        const aValue = a[column]
        const bValue = b[column]

        // Handle null/undefined values - they should go to the end
        if (aValue == null && bValue == null) continue
        if (aValue == null) return 1
        if (bValue == null) return -1

        if (aValue === bValue) continue

        const comparison = aValue < bValue ? -1 : 1
        return direction === 'asc' ? comparison : -comparison
      }
      return 0
    })

    return sorted
  }, [data, sortConfig])
}
