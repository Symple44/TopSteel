'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type CellPosition, type RangeSelection, RangeSelectionManager } from './range-selection'

export function useRangeSelection() {
  const managerRef = useRef<RangeSelectionManager>(new RangeSelectionManager())
  const [selection, setSelection] = useState<RangeSelection>(() =>
    managerRef.current.getSelection()
  )

  useEffect(() => {
    const manager = managerRef.current
    const unsubscribe = manager.subscribe(setSelection)
    return unsubscribe
  }, [])

  const startSelection = useCallback((position: CellPosition, multiSelect: boolean = false) => {
    managerRef.current.startSelection(position, multiSelect)
  }, [])

  const extendSelection = useCallback((position: CellPosition) => {
    managerRef.current.extendSelection(position)
  }, [])

  const endSelection = useCallback(() => {
    managerRef.current.endSelection()
  }, [])

  const clearSelection = useCallback(() => {
    managerRef.current.clearSelection()
  }, [])

  const selectRange = useCallback(
    (start: CellPosition, end: CellPosition, multiSelect: boolean = false) => {
      managerRef.current.selectRange(start, end, multiSelect)
    },
    []
  )

  const selectRow = useCallback((row: number, columns: string[], multiSelect: boolean = false) => {
    managerRef.current.selectRow(row, columns, multiSelect)
  }, [])

  const selectColumn = useCallback(
    (column: string, rows: number[], multiSelect: boolean = false) => {
      managerRef.current.selectColumn(column, rows, multiSelect)
    },
    []
  )

  const isCellSelected = useCallback((row: number, column: string, columnOrder?: string[]) => {
    return managerRef.current.isCellSelected(row, column, columnOrder)
  }, []) // Dépend de selection pour re-render

  const isCellInActiveRange = useCallback((row: number, column: string, columnOrder?: string[]) => {
    return managerRef.current.isCellInActiveRange(row, column, columnOrder)
  }, []) // Dépend de selection pour re-render

  const fillDown = useCallback(
    <T>(
      data: T[],
      columns: Array<{ id: string; key: keyof T | string }>,
      onCellChange: (rowIndex: number, columnId: string, value: any) => void
    ) => {
      managerRef.current.fillDown(data, columns, onCellChange)
    },
    []
  )

  const fillRight = useCallback(
    <T>(
      data: T[],
      columns: Array<{ id: string; key: keyof T | string }>,
      onCellChange: (rowIndex: number, columnId: string, value: any) => void
    ) => {
      managerRef.current.fillRight(data, columns, onCellChange)
    },
    []
  )

  const copyToClipboard = useCallback(
    <T>(
      data: T[],
      columns: Array<{ id: string; key: keyof T | string; getValue?: (row: T) => any }>
    ) => {
      return managerRef.current.copyToClipboard(data, columns)
    },
    []
  )

  return {
    selection,
    startSelection,
    extendSelection,
    endSelection,
    clearSelection,
    selectRange,
    selectRow,
    selectColumn,
    isCellSelected,
    isCellInActiveRange,
    fillDown,
    fillRight,
    copyToClipboard,
    manager: managerRef.current,
  }
}
