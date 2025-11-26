'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AdvancedFilterGroup, ColumnConfig, FilterConfig } from '../types'
import { applyAdvancedFilter, filterDataByColumns, filterDataBySearch } from '../utils/filterUtils'

export interface UseDataFilteringProps<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  initialFilters?: FilterConfig[]
  searchable?: boolean
  /** Delai de debounce pour la recherche en ms (defaut: 300) */
  searchDebounceMs?: number
}

export interface UseDataFilteringReturn<T> {
  filteredData: T[]
  filters: FilterConfig[]
  searchTerm: string
  /** Valeur debouncee de searchTerm utilisee pour le filtrage */
  debouncedSearchTerm: string
  advancedFilters: AdvancedFilterGroup | null
  setFilters: (filters: FilterConfig[]) => void
  setSearchTerm: (term: string) => void
  setAdvancedFilters: (filters: AdvancedFilterGroup | null) => void
  addFilter: (filter: FilterConfig) => void
  removeFilter: (field: string) => void
  clearFilters: () => void
  updateFilter: (field: string, value: unknown, operator?: string) => void
  isFiltered: boolean
  /** Indique si une recherche est en cours de debounce */
  isSearchPending: boolean
}

/**
 * Hook pour gerer le filtrage des donnees d'une DataTable
 * Inclut un debounce automatique sur la recherche pour optimiser les performances
 */
export function useDataFiltering<T>({
  data,
  columns,
  initialFilters = [],
  searchable = true,
  searchDebounceMs = 300,
}: UseDataFilteringProps<T>): UseDataFilteringReturn<T> {
  // Etat des filtres
  const [filters, setFilters] = useState<FilterConfig[]>(initialFilters)
  const [searchTerm, setSearchTermInternal] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterGroup | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mise a jour du terme de recherche avec debounce
  const setSearchTerm = useCallback(
    (term: string) => {
      setSearchTermInternal(term)

      // Annuler le timer precedent
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }

      // Si le terme est vide, mettre a jour immediatement
      if (!term) {
        setDebouncedSearchTerm('')
        return
      }

      // Sinon, debouncer la mise a jour
      searchTimerRef.current = setTimeout(() => {
        setDebouncedSearchTerm(term)
      }, searchDebounceMs)
    },
    [searchDebounceMs]
  )

  // Cleanup du timer au demontage
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

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
    // Annuler le timer de debounce
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    setSearchTermInternal('')
    setDebouncedSearchTerm('')
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

        let value: unknown
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

        // Convert AdvancedFilterRule to FilterRule format
        const operatorMapping: Record<string, string> = {
          equals: 'equals',
          not_equals: 'not_equals',
          contains: 'contains',
          not_contains: 'not_contains',
          starts_with: 'starts_with',
          ends_with: 'ends_with',
          gt: 'greater_than',
          gte: 'greater_or_equal',
          lt: 'less_than',
          lte: 'less_or_equal',
          is_empty: 'is_empty',
          is_not_empty: 'is_not_empty',
          in: 'in',
          not_in: 'not_in',
          between: 'between',
        }

        const simpleRule = {
          operator: (operatorMapping[rule.operator] || rule.operator) as
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'starts_with'
            | 'ends_with'
            | 'is_empty'
            | 'is_not_empty'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'between'
            | 'in'
            | 'not_in',
          value: rule.value,
          secondValue: rule.value2,
        }
        return applyAdvancedFilter(value, simpleRule, column)
      })

      // Appliquer la logique AND/OR
      return group.condition === 'AND' ? results.every(Boolean) : results.some(Boolean)
    },
    [columns]
  )

  // Calcul des donnees filtrees (utilise debouncedSearchTerm pour les performances)
  const filteredData = useMemo(() => {
    let result = [...data]

    // 1. Appliquer les filtres de colonnes
    if (filters.length > 0) {
      result = filterDataByColumns(result, filters, columns)
    }

    // 2. Appliquer la recherche globale (avec valeur debouncee)
    if (searchable && debouncedSearchTerm) {
      result = filterDataBySearch(result, debouncedSearchTerm, columns)
    }

    // 3. Appliquer les filtres avances
    if (advancedFilters) {
      result = result.filter((row) => applyAdvancedFiltersToRow(row, advancedFilters))
    }

    return result
  }, [
    data,
    filters,
    debouncedSearchTerm,
    advancedFilters,
    columns,
    searchable,
    applyAdvancedFiltersToRow,
  ])

  // Indicateur si des filtres sont actifs
  const isFiltered = useMemo(() => {
    return filters.length > 0 || searchTerm !== '' || advancedFilters !== null
  }, [filters, searchTerm, advancedFilters])

  // Indicateur si une recherche est en attente de debounce
  const isSearchPending = searchTerm !== debouncedSearchTerm

  return {
    filteredData,
    filters,
    searchTerm,
    debouncedSearchTerm,
    advancedFilters,
    setFilters,
    setSearchTerm,
    setAdvancedFilters,
    addFilter,
    removeFilter,
    clearFilters,
    updateFilter,
    isFiltered,
    isSearchPending,
  }
}
