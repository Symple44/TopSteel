'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ColumnConfig, SortConfig } from '../types'
import {
  clearAllSorts,
  getColumnSortState,
  isColumnSortable,
  multiColumnSort,
  sortData,
  updateSortConfig,
} from '../utils/sortUtils'

export interface UseDataSortingProps<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  initialSorts?: SortConfig[]
  sortable?: boolean
  multiSort?: boolean // Permet le tri multi-colonnes
}

export interface UseDataSortingReturn<T> {
  sortedData: T[]
  sortConfig: SortConfig[]
  setSortConfig: (config: SortConfig[]) => void
  handleSort: (columnId: string, forceDirection?: 'asc' | 'desc' | null) => void
  getSortDirection: (columnId: string) => 'asc' | 'desc' | null
  clearSorts: () => void
  addSort: (columnId: string, direction: 'asc' | 'desc') => void
  removeSort: (columnId: string) => void
  toggleSort: (columnId: string) => void
  isSorted: (columnId: string) => boolean
  canSort: (columnId: string) => boolean
  sortIndex: (columnId: string) => number // Position dans l'ordre de tri (-1 si non trié)
}

/**
 * Hook pour gérer le tri des données d'une DataTable
 */
export function useDataSorting<T>({
  data,
  columns,
  initialSorts = [],
  sortable = true,
  multiSort = false,
}: UseDataSortingProps<T>): UseDataSortingReturn<T> {
  // État du tri
  const [sortConfig, setSortConfig] = useState<SortConfig[]>(initialSorts)

  // Gestionnaire de tri principal
  const handleSort = useCallback(
    (columnId: string, forceDirection?: 'asc' | 'desc' | null) => {
      if (!sortable) return

      setSortConfig((prev) => {
        // Si pas de multi-tri, garder uniquement le tri sur cette colonne pour permettre le cycle
        const currentConfig = multiSort ? prev : prev.filter((s) => s.column === columnId)

        return updateSortConfig(currentConfig, columnId, forceDirection)
      })
    },
    [sortable, multiSort]
  )

  // Obtenir la direction de tri pour une colonne
  const getSortDirection = useCallback(
    (columnId: string): 'asc' | 'desc' | null => {
      return getColumnSortState(columnId, sortConfig)
    },
    [sortConfig]
  )

  // Effacer tous les tris
  const clearSorts = useCallback(() => {
    setSortConfig(clearAllSorts())
  }, [])

  // Ajouter un tri (pour multi-tri)
  const addSort = useCallback(
    (columnId: string, direction: 'asc' | 'desc') => {
      if (!sortable) return

      setSortConfig((prev) => {
        // Vérifier si la colonne est déjà triée
        const existing = prev.find((s) => s.column === columnId)

        if (existing) {
          // Mettre à jour la direction
          return prev.map((s) => (s.column === columnId ? { ...s, direction } : s))
        }

        // Ajouter le nouveau tri
        if (multiSort) {
          return [...prev, { column: columnId, direction }]
        } else {
          // Si pas de multi-tri, remplacer
          return [{ column: columnId, direction }]
        }
      })
    },
    [sortable, multiSort]
  )

  // Supprimer un tri
  const removeSort = useCallback((columnId: string) => {
    setSortConfig((prev) => prev.filter((s) => s.column !== columnId))
  }, [])

  // Basculer le tri d'une colonne
  const toggleSort = useCallback(
    (columnId: string) => {
      handleSort(columnId)
    },
    [handleSort]
  )

  // Vérifier si une colonne est triée
  const isSorted = useCallback(
    (columnId: string): boolean => {
      return sortConfig.some((s) => s.column === columnId)
    },
    [sortConfig]
  )

  // Vérifier si une colonne peut être triée
  const canSort = useCallback(
    (columnId: string): boolean => {
      const column = columns.find((col) => col.id === columnId)
      return column ? isColumnSortable(column, sortable) : false
    },
    [columns, sortable]
  )

  // Obtenir l'index de tri (pour multi-tri)
  const sortIndex = useCallback(
    (columnId: string): number => {
      const index = sortConfig.findIndex((s) => s.column === columnId)
      return index
    },
    [sortConfig]
  )

  // Calculer les données triées
  const sortedData = useMemo(() => {
    if (sortConfig.length === 0) {
      return data
    }

    // Utiliser le tri multi-colonnes si activé
    if (multiSort && sortConfig.length > 1) {
      return multiColumnSort(data, sortConfig, columns)
    }

    // Sinon utiliser le tri simple
    return sortData(data, sortConfig, columns)
  }, [data, sortConfig, columns, multiSort])

  return {
    sortedData,
    sortConfig,
    setSortConfig,
    handleSort,
    getSortDirection,
    clearSorts,
    addSort,
    removeSort,
    toggleSort,
    isSorted,
    canSort,
    sortIndex,
  }
}
