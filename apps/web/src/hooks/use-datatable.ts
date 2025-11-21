import type { ColumnConfig, SelectionState } from '@erp/ui'
import { usePersistedTableSettings } from '@erp/ui'
import { useCallback, useMemo, useState } from 'react'

/**
 * Configuration options for the useDataTable hook.
 *
 * @template T - The type of data items in the table
 *
 * @property {string} [tableId] - Unique identifier for the table (required for persistence)
 * @property {string} [userId] - User identifier for user-specific settings persistence
 * @property {T[]} [initialData] - Initial data to populate the table with
 * @property {ColumnConfig<T>[]} columns - Column configuration for the table
 * @property {keyof T | string} keyField - The field to use as unique identifier for rows
 * @property {boolean} [autoSave=true] - Whether to automatically save settings changes
 */
interface UseDataTableOptions<T> {
  tableId?: string
  userId?: string
  initialData?: T[]
  columns: ColumnConfig<T>[]
  keyField: keyof T | string
  autoSave?: boolean
}

/**
 * Custom hook to simplify DataTable usage with built-in state management.
 *
 * This hook provides a complete solution for managing table data, including:
 * - Data state management (add, edit, delete, bulk operations)
 * - Row selection state (single, multiple, select all)
 * - Persisted settings (column visibility, sorting, filters)
 * - Loading states
 * - Ready-to-use handlers for common table operations
 *
 * The hook returns a comprehensive object with all necessary state and handlers,
 * plus a pre-configured `tableConfig` object that can be spread directly into
 * the DataTable component.
 *
 * @template T - The type of data items in the table (defaults to Record<string, unknown>)
 *
 * @param {UseDataTableOptions<T>} options - Configuration options
 * @param {string} [options.tableId] - Unique ID for table (enables persistence)
 * @param {string} [options.userId] - User ID for user-specific settings
 * @param {T[]} [options.initialData=[]] - Initial data array
 * @param {ColumnConfig<T>[]} options.columns - Column definitions
 * @param {keyof T | string} options.keyField - Field to use as unique row identifier
 * @param {boolean} [options.autoSave=true] - Auto-save settings on change
 *
 * @returns {Object} Table state and handlers:
 *   - data: Current table data array
 *   - setData: Function to update data
 *   - loading: Loading state flag
 *   - setLoading: Function to update loading state
 *   - selection: Current selection state
 *   - selectedData: Array of selected data items
 *   - settings: Persisted table settings
 *   - resetSettings: Reset settings to default
 *   - exportSettings: Export current settings
 *   - importSettings: Import settings from file
 *   - handleCellEdit: Handler for cell edit events
 *   - handleRowAdd: Handler for adding new rows
 *   - handleRowsDelete: Handler for deleting rows
 *   - handleRowUpdate: Handler for updating a single row
 *   - handleBulkUpdate: Handler for updating multiple rows
 *   - clearSelection: Clear all row selections
 *   - selectAll: Select all rows
 *   - toggleRowSelection: Toggle selection for a single row
 *   - tableConfig: Pre-configured object to spread into DataTable
 *
 * @example
 * ```tsx
 * interface Product {
 *   id: string
 *   name: string
 *   price: number
 *   stock: number
 * }
 *
 * function ProductTable() {
 *   const columns: ColumnConfig<Product>[] = [
 *     { key: 'name', title: 'Product Name', editable: true },
 *     { key: 'price', title: 'Price', type: 'number' },
 *     { key: 'stock', title: 'Stock', type: 'number' }
 *   ]
 *
 *   const {
 *     data,
 *     loading,
 *     selectedData,
 *     handleBulkUpdate,
 *     tableConfig
 *   } = useDataTable<Product>({
 *     tableId: 'products-table',
 *     userId: currentUser.id,
 *     initialData: products,
 *     columns,
 *     keyField: 'id',
 *   })
 *
 *   const handleBulkDiscount = () => {
 *     handleBulkUpdate({ price: selectedData[0].price * 0.9 })
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleBulkDiscount}>Apply 10% Discount</button>
 *       <DataTable {...tableConfig} />
 *     </div>
 *   )
 * }
 * ```
 */
export function useDataTable<T = Record<string, unknown>>({
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
    return data?.filter((row) =>
      selection?.selectedRows?.has(
        (row as Record<string, unknown>)[keyField as string] as string | number
      )
    )
  }, [data, selection, keyField])

  // Gestionnaires d'événements
  const handleCellEdit = useCallback(
    (value: unknown, row: T, column: ColumnConfig<T>) => {
      setData((prevData) =>
        prevData?.map((item) =>
          (item as Record<string, unknown>)[keyField as string] ===
          (row as Record<string, unknown>)[keyField as string]
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
      const idsToDelete = rowsToDelete?.map(
        (row) => (row as Record<string, unknown>)[keyField as string]
      )
      setData((prev) =>
        prev?.filter(
          (item) => !idsToDelete?.includes((item as Record<string, unknown>)[keyField as string])
        )
      )

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
        prev?.map((item) =>
          (item as Record<string, unknown>)[keyField as string] ===
          (updatedRow as Record<string, unknown>)[keyField as string]
            ? updatedRow
            : item
        )
      )
    },
    [keyField]
  )

  const handleBulkUpdate = useCallback(
    (updates: Partial<T>) => {
      const selectedIds = Array.from(selection.selectedRows)
      setData((prev) =>
        prev?.map((item) =>
          selectedIds?.includes(
            (item as Record<string, unknown>)[keyField as string] as string | number
          )
            ? { ...item, ...updates }
            : item
        )
      )
    },
    [selection, keyField]
  )

  const clearSelection = useCallback(() => {
    setSelection({ selectedRows: new Set(), selectAll: false })
  }, [])

  const selectAll = useCallback(() => {
    const allIds = data?.map(
      (row) => (row as Record<string, unknown>)[keyField as string] as string | number
    )
    setSelection({
      selectedRows: new Set(allIds),
      selectAll: true,
    })
  }, [data, keyField])

  const toggleRowSelection = useCallback(
    (rowId: string | number) => {
      setSelection((prev: SelectionState) => {
        const newSelected = new Set(prev.selectedRows)
        if (newSelected?.has(rowId)) {
          newSelected?.delete(rowId)
        } else {
          newSelected?.add(rowId)
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
