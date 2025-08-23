import type { ColumnConfig, SelectionState } from '@erp/ui/data-display'
import { usePersistedTableSettings } from '@erp/ui/data-display'
import { useCallback, useMemo, useState } from 'react'

interface UseDataTableOptions<T> {
  tableId?: string
  userId?: string
  initialData?: T[]
  columns: ColumnConfig<T>[]
  keyField: keyof T | string
  autoSave?: boolean
}

/**
 * Hook personnalisé pour simplifier l'utilisation du DataTable
 */
export function useDataTable<T = any>({
  tableId,
  userId,
  initialData = [],
  columns,
  keyField,
  autoSave = true,
}: UseDataTableOptions<T>) {
  // État des données
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)

  // État de sélection
  const [selection, setSelection] = useState<SelectionState>({
    selectedRows: new Set(),
    selectAll: false,
  })

  // Paramètres persistés
  const persistedSettings = usePersistedTableSettings(
    tableId || '',
    columns,
    userId,
    autoSave && Boolean(tableId)
  )

  // Données sélectionnées
  const selectedData = useMemo(() => {
    return data.filter((row) => selection.selectedRows.has((row as unknown)[keyField]))
  }, [data, selection, keyField])

  // Gestionnaires d'événements
  const handleCellEdit = useCallback(
    (value: any, row: T, column: ColumnConfig<T>) => {
      setData((prevData) =>
        prevData.map((item) =>
          (item as unknown)[keyField] === (row as unknown)[keyField]
            ? { ...item, [column.key]: value }
            : item
        )
      )
    },
    [keyField]
  )

  const handleRowAdd = useCallback((newRow: T) => {
    setData((prev) => [...prev, newRow])
  }, [])

  const handleRowsDelete = useCallback(
    (rowsToDelete: T[]) => {
      const idsToDelete = rowsToDelete.map((row) => (row as unknown)[keyField])
      setData((prev) => prev.filter((item) => !idsToDelete.includes((item as unknown)[keyField])))

      // Nettoyer la sélection
      setSelection((_prev: SelectionState) => ({
        selectedRows: new Set(),
        selectAll: false,
      }))
    },
    [keyField]
  )

  const handleRowUpdate = useCallback(
    (updatedRow: T) => {
      setData((prev) =>
        prev.map((item) =>
          (item as unknown)[keyField] === (updatedRow as unknown)[keyField] ? updatedRow : item
        )
      )
    },
    [keyField]
  )

  const handleBulkUpdate = useCallback(
    (updates: Partial<T>) => {
      const selectedIds = Array.from(selection.selectedRows)
      setData((prev) =>
        prev.map((item) =>
          selectedIds.includes((item as unknown)[keyField]) ? { ...item, ...updates } : item
        )
      )
    },
    [selection, keyField]
  )

  const clearSelection = useCallback(() => {
    setSelection({ selectedRows: new Set(), selectAll: false })
  }, [])

  const selectAll = useCallback(() => {
    const allIds = data.map((row) => (row as unknown)[keyField])
    setSelection({
      selectedRows: new Set(allIds),
      selectAll: true,
    })
  }, [data, keyField])

  const toggleRowSelection = useCallback(
    (rowId: string | number) => {
      setSelection((prev: SelectionState) => {
        const newSelected = new Set(prev.selectedRows)
        if (newSelected.has(rowId)) {
          newSelected.delete(rowId)
        } else {
          newSelected.add(rowId)
        }

        return {
          selectedRows: newSelected,
          selectAll: newSelected.size === data.length,
        }
      })
    },
    [data.length]
  )

  // Actions par défaut
  const defaultActions = useMemo(
    () => ({
      create: () => {},
      edit: (_row: T) => {},
      delete: (rows: T[]) => {
        handleRowsDelete(rows)
      },
    }),
    [handleRowsDelete]
  )

  // Configuration du DataTable
  const tableConfig = useMemo(
    () => ({
      data,
      columns,
      keyField,
      tableId,
      userId,
      editable: true,
      sortable: true,
      searchable: true,
      selectable: true,
      actions: defaultActions,
      settings: persistedSettings?.settings,
      onCellEdit: handleCellEdit,
      onSettingsChange: persistedSettings?.setSettings,
      onSelectionChange: setSelection,
    }),
    [data, columns, keyField, tableId, userId, defaultActions, persistedSettings, handleCellEdit]
  )

  return {
    // État
    data,
    setData,
    loading,
    setLoading,
    selection,
    selectedData,

    // Paramètres (si disponibles)
    settings: persistedSettings?.settings,
    resetSettings: persistedSettings?.resetSettings,
    exportSettings: persistedSettings?.exportSettings,
    importSettings: persistedSettings?.importSettings,

    // Actions sur les données
    handleCellEdit,
    handleRowAdd,
    handleRowsDelete,
    handleRowUpdate,
    handleBulkUpdate,

    // Actions de sélection
    clearSelection,
    selectAll,
    toggleRowSelection,

    // Configuration prête pour le DataTable
    tableConfig,
  }
}

export default useDataTable
