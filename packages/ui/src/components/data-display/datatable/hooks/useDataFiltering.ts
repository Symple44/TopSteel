'use client'

import { useCallback, useMemo, useState } from 'react'
import type { AdvancedFilterGroup, ColumnConfig, FilterConfig } from '../types'
import { applyAdvancedFilter, filterDataByColumns, filterDataBySearch } from '../utils/filterUtils'

export interface UseDataFilteringProps<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  initialFilters?: FilterConfig[]
  searchable?: boolean
}

export interface UseDataFilteringReturn<T> {
  filteredData: T[]
  filters: FilterConfig[]
  searchTerm: string
  advancedFilters: AdvancedFilterGroup | null
  setFilters: (filters: FilterConfig[]) => void
  setSearchTerm: (term: string) => void
  setAdvancedFilters: (filters: AdvancedFilterGroup | null) => void
  addFilter: (filter: FilterConfig) => void
  removeFilter: (field: string) => void
  clearFilters: () => void
  updateFilter: (field: string, value: unknown, operator?: string) => void
  isFiltered: boolean
}

/**
 * Hook pour gérer le filtrage des données d'une DataTable
 */
export function useDataFiltering<T extends Record<string, unknown>>({
  data,
  columns,
  initialFilters = [],
  searchable = true,
}: UseDataFilteringProps<T>): UseDataFilteringReturn<T> {
  // État des filtres
  const [filters, setFilters] = useState<FilterConfig[]>(initialFilters)
  const [searchTerm, setSearchTerm] = useState('')
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterGroup | null>(null)

  // Ajout d'un filtre
  const addFilter = useCallback((filter: FilterConfig) => {
    setFilters((prev) => {
      const existing = prev.findIndex((f) => f.field === filter.field)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = filter
        return updated
      }
      return [...prev, filter]
    })
  }, [])

  // Suppression d'un filtre
  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field))
  }, [])

  // Effacement de tous les filtres
  const clearFilters = useCallback(() => {
    setFilters([])
    setSearchTerm('')
    setAdvancedFilters(null)
  }, [])

  // Mise à jour d'un filtre
  const updateFilter = useCallback((field: string, value: unknown, operator?: string) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.field === field)
      const validOperator = (operator || 'contains') as FilterConfig['operator']

      if (existing) {
        return prev.map((f) =>
          f.field === field ? ({ ...f, value, operator: validOperator } as FilterConfig) : f
        )
      }
      return [...prev, { field, value, operator: validOperator } as FilterConfig]
    })
  }, [])

  // Application des filtres avancés
  const applyAdvancedFiltersToRow = useCallback(
    (row: T, group: AdvancedFilterGroup): boolean => {
      const results = group.rules.map((rule) => {
        if ('rules' in rule) {
          // C'est un sous-groupe
          return applyAdvancedFiltersToRow(row, rule as AdvancedFilterGroup)
        }

        // C'est une règle simple
        const ruleField = rule.field || rule.column
        const column = columns.find((col) => col.id === ruleField)

        let value: any
        if (column?.getValue) {
          value = column.getValue(row)
        } else if (column?.accessor) {
          value =
            typeof column.accessor === 'function'
              ? column.accessor(row)
              : row[column.accessor as keyof T]
        } else {
          value = row[(ruleField || column?.key) as keyof T]
        }

        return applyAdvancedFilter(value, rule, column)
      })

      // Appliquer la logique AND/OR
      return group.condition === 'AND' ? results.every(Boolean) : results.some(Boolean)
    },
    [columns]
  )

  // Calcul des données filtrées
  const filteredData = useMemo(() => {
    let result = [...data]

    // 1. Appliquer les filtres de colonnes
    if (filters.length > 0) {
      result = filterDataByColumns(result, filters, columns)
    }

    // 2. Appliquer la recherche globale
    if (searchable && searchTerm) {
      result = filterDataBySearch(result, searchTerm, columns)
    }

    // 3. Appliquer les filtres avancés
    if (advancedFilters) {
      result = result.filter((row) => applyAdvancedFiltersToRow(row, advancedFilters))
    }

    return result
  }, [data, filters, searchTerm, advancedFilters, columns, searchable, applyAdvancedFiltersToRow])

  // Indicateur si des filtres sont actifs
  const isFiltered = useMemo(() => {
    return filters.length > 0 || searchTerm !== '' || advancedFilters !== null
  }, [filters, searchTerm, advancedFilters])

  return {
    filteredData,
    filters,
    searchTerm,
    advancedFilters,
    setFilters,
    setSearchTerm,
    setAdvancedFilters,
    addFilter,
    removeFilter,
    clearFilters,
    updateFilter,
    isFiltered,
  }
}
