'use client'

import { useCallback, useMemo, useState } from 'react'
import type { SelectionState } from '../types'

export interface UseDataSelectionProps<T> {
  data: T[]
  keyField: string | number
  selectable?: boolean
  onSelectionChange?: (selection: SelectionState) => void
}

export interface UseDataSelectionReturn<T> {
  selection: SelectionState
  setSelection: (selection: SelectionState) => void
  selectedData: T[]
  selectedIds: Set<string | number>
  isSelected: (rowId: string | number) => boolean
  selectRow: (rowId: string | number) => void
  deselectRow: (rowId: string | number) => void
  toggleRow: (rowId: string | number) => void
  selectAll: () => void
  deselectAll: () => void
  toggleAll: () => void
  selectRange: (startId: string | number, endId: string | number) => void
  selectionCount: number
  hasSelection: boolean
  isAllSelected: boolean
  isPartiallySelected: boolean
}

/**
 * Hook pour gérer la sélection des lignes dans une DataTable
 */
export function useDataSelection<T>({
  data,
  keyField,
  selectable = true,
  onSelectionChange,
}: UseDataSelectionProps<T>): UseDataSelectionReturn<T> {
  // État de la sélection
  const [selection, setSelectionState] = useState<SelectionState>({
    selectedRows: new Set(),
    selectAll: false,
  })

  // Setter avec callback
  const setSelection = useCallback(
    (newSelection: SelectionState) => {
      setSelectionState(newSelection)
      onSelectionChange?.(newSelection)
    },
    [onSelectionChange]
  )

  // Obtenir l'ID d'une ligne
  const getRowId = useCallback(
    (row: T): string | number => {
      return row[keyField] as string | number
    },
    [keyField]
  )

  // Vérifier si une ligne est sélectionnée
  const isSelected = useCallback(
    (rowId: string | number): boolean => {
      if (!selectable) return false
      return selection.selectedRows.has(rowId)
    },
    [selectable, selection.selectedRows]
  )

  // Sélectionner une ligne
  const selectRow = useCallback(
    (rowId: string | number) => {
      if (!selectable) return

      setSelectionState((prevSelection) => {
        const newSelection = {
          selectedRows: new Set([...prevSelection.selectedRows, rowId]),
          selectAll: false,
        }
        onSelectionChange?.(newSelection)
        return newSelection
      })
    },
    [selectable, onSelectionChange]
  )

  // Désélectionner une ligne
  const deselectRow = useCallback(
    (rowId: string | number) => {
      if (!selectable) return

      setSelectionState((prevSelection) => {
        const newSelectedRows = new Set(prevSelection.selectedRows)
        newSelectedRows.delete(rowId)

        const newSelection = {
          selectedRows: newSelectedRows,
          selectAll: false,
        }
        onSelectionChange?.(newSelection)
        return newSelection
      })
    },
    [selectable, onSelectionChange]
  )

  // Basculer la sélection d'une ligne
  const toggleRow = useCallback(
    (rowId: string | number) => {
      if (!selectable) return

      if (isSelected(rowId)) {
        deselectRow(rowId)
      } else {
        selectRow(rowId)
      }
    },
    [selectable, isSelected, selectRow, deselectRow]
  )

  // Sélectionner toutes les lignes
  const selectAll = useCallback(() => {
    if (!selectable) return

    const allIds = data.map((row) => getRowId(row))
    setSelection({
      selectedRows: new Set(allIds),
      selectAll: true,
    })
  }, [selectable, data, getRowId, setSelection])

  // Désélectionner toutes les lignes
  const deselectAll = useCallback(() => {
    setSelection({
      selectedRows: new Set(),
      selectAll: false,
    })
  }, [setSelection])

  // Basculer la sélection de toutes les lignes
  const toggleAll = useCallback(() => {
    if (selection.selectAll || selection.selectedRows.size === data.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selection, data.length, selectAll, deselectAll])

  // Sélectionner une plage de lignes
  const selectRange = useCallback(
    (startId: string | number, endId: string | number) => {
      if (!selectable) return

      const startIndex = data.findIndex((row) => getRowId(row) === startId)
      const endIndex = data.findIndex((row) => getRowId(row) === endId)

      if (startIndex === -1 || endIndex === -1) return

      const minIndex = Math.min(startIndex, endIndex)
      const maxIndex = Math.max(startIndex, endIndex)

      const rangeIds = data.slice(minIndex, maxIndex + 1).map((row) => getRowId(row))

      setSelection({
        ...selection,
        selectedRows: new Set([...selection.selectedRows, ...rangeIds]),
        selectAll: false,
      })
    },
    [selectable, data, getRowId, selection, setSelection]
  )

  // Calculer les données sélectionnées
  const selectedData = useMemo(() => {
    if (!selectable || selection.selectedRows.size === 0) {
      return []
    }

    return data.filter((row) => isSelected(getRowId(row)))
  }, [selectable, data, selection.selectedRows, isSelected, getRowId])

  // IDs sélectionnés
  const selectedIds = useMemo(() => {
    return selection.selectedRows
  }, [selection.selectedRows])

  // Nombre de lignes sélectionnées
  const selectionCount = useMemo(() => {
    return selection.selectedRows.size
  }, [selection.selectedRows])

  // Vérifier s'il y a une sélection
  const hasSelection = useMemo(() => {
    return selectionCount > 0
  }, [selectionCount])

  // Vérifier si tout est sélectionné
  const isAllSelected = useMemo(() => {
    return selectionCount === data.length && data.length > 0
  }, [selectionCount, data.length])

  // Vérifier si partiellement sélectionné
  const isPartiallySelected = useMemo(() => {
    return selectionCount > 0 && selectionCount < data.length
  }, [selectionCount, data.length])

  return {
    selection,
    setSelection,
    selectedData,
    selectedIds,
    isSelected,
    selectRow,
    deselectRow,
    toggleRow,
    selectAll,
    deselectAll,
    toggleAll,
    selectRange,
    selectionCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
  }
}
