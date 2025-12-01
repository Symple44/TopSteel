'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AdvancedFilterGroup,
  ColumnConfig,
  FilterConfig,
  PaginationConfig,
  SelectionState,
  SortConfig,
  TableSettings,
} from '../types'
import { useDataExport } from './useDataExport'
import { useDataFiltering } from './useDataFiltering'
import { useDataPagination } from './useDataPagination'
import { useDataSelection } from './useDataSelection'
import { useDataSorting } from './useDataSorting'

/**
 * Options pour le hook useDataTable
 */
export interface UseDataTableOptions<T> {
  // Donnees et configuration
  data: T[]
  columns: ColumnConfig<T>[]
  keyField: string | number

  // Options de fonctionnalites
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  selectable?: boolean
  exportable?: boolean
  pagination?: boolean | PaginationConfig
  searchDebounceMs?: number

  // Parametres sauvegardes
  settings?: TableSettings

  // Callbacks
  onSettingsChange?: (settings: TableSettings) => void
  onSelectionChange?: (selection: SelectionState) => void
  onPaginationChange?: (config: PaginationConfig) => void
  onExport?: (format: string, options: any) => void

  // Etat initial
  initialFilters?: FilterConfig[]
  initialSorts?: SortConfig[]
  loading?: boolean
  error?: string | null
}

/**
 * Valeur de retour du hook useDataTable
 */
export interface UseDataTableReturn<T> {
  // Donnees transformees
  data: T[]
  totalCount: number
  visibleColumns: ColumnConfig<T>[]

  // État de filtrage
  filters: FilterConfig[]
  searchTerm: string
  debouncedSearchTerm: string
  advancedFilters: AdvancedFilterGroup | null
  isFiltered: boolean
  isSearchPending: boolean

  // Actions de filtrage
  setFilters: (filters: FilterConfig[]) => void
  setSearchTerm: (term: string) => void
  setAdvancedFilters: (filters: AdvancedFilterGroup | null) => void
  addFilter: (filter: FilterConfig) => void
  removeFilter: (field: string) => void
  clearFilters: () => void
  updateFilter: (field: string, value: unknown, operator?: string) => void

  // État de tri
  sortConfig: SortConfig[]

  // Actions de tri
  handleSort: (columnId: string, direction?: 'asc' | 'desc' | null) => void
  clearSorts: () => void
  getSortDirection: (columnId: string) => 'asc' | 'desc' | null
  addSort: (columnId: string, direction: 'asc' | 'desc') => void
  removeSort: (columnId: string) => void
  toggleSort: (columnId: string) => void
  isSorted: (columnId: string) => boolean
  canSort: (columnId: string) => boolean
  sortIndex: (columnId: string) => number

  // État de selection
  selection: SelectionState
  selectedData: T[]

  // Actions de selection
  toggleRow: (rowId: string | number) => void
  toggleAll: () => void
  selectRange: (startId: string | number, endId: string | number) => void
  clearSelection: () => void

  // État de pagination
  currentPage: number
  pageSize: number
  totalPages: number
  paginationInfo: any

  // Actions de pagination
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void

  // État d'export
  isExporting: boolean

  // Actions d'export
  exportData: (format: 'csv' | 'excel' | 'json' | 'pdf', options?: any) => Promise<void>

  // Actions de colonnes
  toggleColumnVisibility: (columnId: string) => void
  reorderColumns: (startIndex: number, endIndex: number) => void
  resizeColumn: (columnId: string, width: number) => void

  // État UI
  loading: boolean
  error: string | null

  // Parametres
  settings: TableSettings
  updateSettings: (settings: Partial<TableSettings>) => void
  resetSettings: () => void
}

/**
 * Hook orchestrateur qui combine tous les hooks de la DataTable
 *
 * Ce hook simplifie l'utilisation de la DataTable en combinant automatiquement
 * tous les hooks de filtrage, tri, selection, pagination et export.
 *
 * @example
 * ```tsx
 * const table = useDataTable({
 *   data: users,
 *   columns: userColumns,
 *   keyField: 'id',
 *   sortable: true,
 *   filterable: true,
 *   pagination: { pageSize: 20 }
 * })
 *
 * return (
 *   <DataTable
 *     data={table.data}
 *     columns={table.visibleColumns}
 *     onSort={table.handleSort}
 *     sortConfig={table.sortConfig}
 *     // ... autres props
 *   />
 * )
 * ```
 */
export function useDataTable<T extends Record<string, unknown>>({
  data,
  columns: initialColumns,
  keyField,
  sortable = true,
  filterable = true,
  searchable = true,
  selectable = false,
  exportable = false,
  pagination = false,
  searchDebounceMs = 300,
  settings: initialSettings = { columns: {} },
  onSettingsChange,
  onSelectionChange,
  onPaginationChange,
  onExport,
  initialFilters = [],
  initialSorts = [],
  loading = false,
  error = null,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  // État des colonnes
  const [columns, setColumns] = useState<ColumnConfig<T>[]>(initialColumns)
  const [settings, setSettings] = useState<TableSettings>(initialSettings)

  // Colonnes visibles et ordonnées
  const visibleColumns = useMemo(() => {
    return columns
      .filter((col) => {
        const settingVisible = settings.columns[col.id]?.visible
        return settingVisible !== undefined ? settingVisible : col.visible !== false
      })
      .sort((a, b) => {
        const orderA = settings.columns[a.id]?.order ?? 999
        const orderB = settings.columns[b.id]?.order ?? 999
        return orderA - orderB
      })
  }, [columns, settings])

  // Hook de filtrage (avec debounce sur la recherche)
  const filtering = useDataFiltering({
    data,
    columns: visibleColumns,
    initialFilters,
    searchable,
    searchDebounceMs,
  })

  // Hook de tri
  const sorting = useDataSorting({
    data: filtering.filteredData,
    columns: visibleColumns,
    initialSorts,
    sortable,
  })

  // Hook de selection
  const selection = useDataSelection<T>({
    data: sorting.sortedData as T[],
    keyField: keyField as string | number,
    selectable,
    onSelectionChange,
  })

  // Hook de pagination
  const paging = useDataPagination({
    data: sorting.sortedData,
    pagination,
    onPaginationChange,
  })

  // Hook d'export
  const exporting = useDataExport({
    data: sorting.sortedData as any,
    columns: visibleColumns as any,
    selectedRows: selection.selection.selectedRows,
    keyField,
    exportable,
    onExport,
  })

  // Données affichées (après tous les traitements)
  const displayData = useMemo(() => {
    return pagination ? paging.paginatedData : sorting.sortedData
  }, [pagination, paging.paginatedData, sorting.sortedData])

  // Actions sur les colonnes
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setSettings((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          visible: !prev.columns[columnId]?.visible,
        },
      },
    }))
  }, [])

  const reorderColumns = useCallback(
    (startIndex: number, endIndex: number) => {
      const newColumns = [...columns]
      const [removed] = newColumns.splice(startIndex, 1)
      newColumns.splice(endIndex, 0, removed)

      // Mettre à jour l'ordre dans les settings
      const newSettings = { ...settings }
      newColumns.forEach((col, index) => {
        if (!newSettings.columns[col.id]) {
          newSettings.columns[col.id] = {}
        }
        newSettings.columns[col.id].order = index
      })

      setColumns(newColumns)
      setSettings(newSettings)
    },
    [columns, settings]
  )

  const resizeColumn = useCallback((columnId: string, width: number) => {
    setSettings((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          width,
        },
      },
    }))
  }, [])

  // Gestion des parametres
  const updateSettings = useCallback((newSettings: Partial<TableSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ columns: {} })
    sorting.setSortConfig([])
    filtering.clearFilters()
    selection.deselectAll()
  }, [filtering, selection, sorting])

  // Synchroniser les parametres
  useEffect(() => {
    onSettingsChange?.(settings)
  }, [settings, onSettingsChange])

  // Synchroniser les colonnes quand elles changent depuis l'extérieur
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  return {
    // Donnees transformees
    data: displayData,
    totalCount: filtering.filteredData.length,
    visibleColumns,

    // Filtrage
    filters: filtering.filters,
    searchTerm: filtering.searchTerm,
    debouncedSearchTerm: filtering.debouncedSearchTerm,
    advancedFilters: filtering.advancedFilters,
    isFiltered: filtering.isFiltered,
    isSearchPending: filtering.isSearchPending,
    setFilters: filtering.setFilters,
    setSearchTerm: filtering.setSearchTerm,
    setAdvancedFilters: filtering.setAdvancedFilters,
    addFilter: filtering.addFilter,
    removeFilter: filtering.removeFilter,
    clearFilters: filtering.clearFilters,
    updateFilter: filtering.updateFilter,

    // Tri
    sortConfig: sorting.sortConfig,
    handleSort: sorting.handleSort,
    clearSorts: sorting.clearSorts,
    getSortDirection: sorting.getSortDirection,
    addSort: sorting.addSort,
    removeSort: sorting.removeSort,
    toggleSort: sorting.toggleSort,
    isSorted: sorting.isSorted,
    canSort: sorting.canSort,
    sortIndex: sorting.sortIndex,

    // Selection
    selection: selection.selection,
    selectedData: selection.selectedData,
    toggleRow: selection.toggleRow,
    toggleAll: selection.toggleAll,
    selectRange: selection.selectRange,
    clearSelection: selection.deselectAll,

    // Pagination
    currentPage: paging.currentPage,
    pageSize: paging.pageSize,
    totalPages: paging.totalPages,
    paginationInfo: paging.paginationInfo,
    goToPage: paging.goToPage,
    nextPage: paging.nextPage,
    prevPage: paging.prevPage,
    setPageSize: paging.setPageSize,

    // Export
    isExporting: exporting.isExporting,
    exportData: exporting.exportData,

    // Colonnes
    toggleColumnVisibility,
    reorderColumns,
    resizeColumn,

    // État UI
    loading,
    error,

    // Parametres
    settings,
    updateSettings,
    resetSettings,
  }
}
