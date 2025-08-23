'use client'

import { useMemo } from 'react'
import type { FilterConfig } from '../types'

/**
 * Simple hook for filtering data
 * Used for testing purposes
 */
export function useDataFiltering<T extends Record<string, any>>(
  data: T[],
  filters: FilterConfig[],
  searchTerm?: string
): T[] {
  return useMemo(() => {
    let filtered = [...data]
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(search)
        )
      )
    }
    
    // Apply filters
    filters.forEach(filter => {
      const { column, value, operator = 'equals' } = filter
      
      filtered = filtered.filter(row => {
        const rowValue = row[column]
        
        switch (operator) {
          case 'equals':
            return rowValue === value
          case 'notEquals':
            return rowValue !== value
          case 'contains':
            return String(rowValue).toLowerCase().includes(String(value).toLowerCase())
          case 'notContains':
            return !String(rowValue).toLowerCase().includes(String(value).toLowerCase())
          case 'startsWith':
            return String(rowValue).toLowerCase().startsWith(String(value).toLowerCase())
          case 'endsWith':
            return String(rowValue).toLowerCase().endsWith(String(value).toLowerCase())
          case 'greaterThan':
            return rowValue > value
          case 'lessThan':
            return rowValue < value
          case 'greaterThanOrEqual':
            return rowValue >= value
          case 'lessThanOrEqual':
            return rowValue <= value
          case 'isEmpty':
            return !rowValue || rowValue === ''
          case 'isNotEmpty':
            return rowValue && rowValue !== ''
          case 'in':
            return Array.isArray(value) && value.includes(rowValue)
          case 'notIn':
            return Array.isArray(value) && !value.includes(rowValue)
          default:
            return true
        }
      })
    })
    
    return filtered
  }, [data, filters, searchTerm])
}