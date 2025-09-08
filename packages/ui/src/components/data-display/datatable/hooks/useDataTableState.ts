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

export interface DataTableState<T> {
  // Colonnes
  columns: ColumnConfig<T>[]
  visibleColumns: ColumnConfig<T>[]

  // Données
  data: T[]
  processedData: T[]
  displayData: T[]

  // Filtrage
  filters: FilterConfig[]
  searchTerm: string
  advancedFilters: AdvancedFilterGroup | null
  isFiltered: boolean

  // Tri
  sortConfig: SortConfig[]

  // Sélection
  selection: SelectionState
  selectedData: T[]

  // Pagination
  currentPage: number
  pageSize: number
  totalPages: number
  paginationInfo: any

  // Export
  isExporting: boolean

  // État UI
  loading: boolean
  error: string | null

  // Paramètres
  settings: TableSettings
}

export interface UseDataTableStateProps<T> {
  // Données et configuration
  data: T[]
  columns: ColumnConfig<T>[]
  keyField: string | number

  // Options de fonctionnalités
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  selectable?: boolean
  exportable?: boolean
  pagination?: boolean | PaginationConfig

  // Paramètres sauvegardés
  settings?: TableSettings

  // Callbacks
  onSettingsChange?: (settings: TableSettings) => void
  onSelectionChange?: (selection: SelectionState) => void
  onPaginationChange?: (config: PaginationConfig) => void
  onExport?: (format: string, options: any) => void

  // État initial
  initialFilters?: FilterConfig[]
  initialSorts?: SortConfig[]
  loading?: boolean
  error?: string | null
}

export interface UseDataTableStateReturn<T> {
  // État
  state: DataTableState<T>

  // Actions de filtrage
  setFilters: (filters: FilterConfig[]) => void
  addFilter: (filter: FilterConfig) => void
  removeFilter: (field: string) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void
  setAdvancedFilters: (filters: AdvancedFilterGroup | null) => void

  // Actions de tri
  handleSort: (columnId: string, direction?: 'asc' | 'desc' | null) => void
  clearSorts: () => void

  // Actions de sélection
  toggleRow: (rowId: string | number) => void
  toggleAll: () => void
  selectRange: (startId: string | number, endId: string | number) => void
  clearSelection: () => void

  // Actions de pagination
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void

  // Actions d'export
  exportData: (format: 'csv' | 'excel' | 'json' | 'pdf', options?: any) => Promise<void>

  // Actions de colonnes
  toggleColumnVisibility: (columnId: string) => void
  reorderColumns: (startIndex: number, endIndex: number) => void
  resizeColumn: (columnId: string, width: number) => void

  // Actions de paramètres
  updateSettings: (settings: Partial<TableSettings>) => void
  resetSettings: () => void
}

/**
 * Hook principal pour gérer l'état complet d'une DataTable
 */
export function useDataTableState<T extends Record<string, unknown>>({
  data,
  columns: initialColumns,
  keyField,
  sortable = true,
  filterable = true,
  searchable = true,
  selectable = false,
  exportable = false,
  pagination = false,
  settings: initialSettings = { columns: {} },
  onSettingsChange,
  onSelectionChange,
  onPaginationChange,
  onExport,
  initialFilters = [],
  initialSorts = [],
  loading = false,
  error = null,
}: UseDataTableStateProps<T>): UseDataTableStateReturn<T> {
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

  // Hook de filtrage
  const {
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
    isFiltered,
  } = useDataFiltering({
    data,
    columns: visibleColumns,
    initialFilters,
    searchable,
  })

  // Hook de tri
  const { sortedData, sortConfig, setSortConfig, handleSort, clearSorts } = useDataSorting({
    data: filteredData,
    columns: visibleColumns,
    initialSorts,
    sortable,
  })

  // Hook de sélection
  const {
    selection,
    selectedData,
    toggleRow,
    toggleAll,
    selectRange,
    deselectAll: clearSelection,
  } = useDataSelection({
    data: sortedData,
    keyField,
    selectable,
    onSelectionChange,
  })

  // Hook de pagination
  const {
    paginatedData,
    paginationInfo,
    currentPage,
    pageSize,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  } = useDataPagination({
    data: sortedData,
    pagination,
    onPaginationChange,
  })

  // Hook d'export
  const { exportData, isExporting } = useDataExport({
    data: sortedData,
    columns: visibleColumns,
    selectedRows: selection.selectedRows,
    keyField,
    exportable,
    onExport,
  })

  // Données affichées (après tous les traitements)
  const displayData = useMemo(() => {
    return pagination ? paginatedData : sortedData
  }, [pagination, paginatedData, sortedData])

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

  // Gestion des paramètres
  const updateSettings = useCallback((newSettings: Partial<TableSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ columns: {} })
    setSortConfig([])
    clearFilters()
    clearSelection()
  }, [clearFilters, clearSelection, setSortConfig])

  // Synchroniser les paramètres
  useEffect(() => {
    onSettingsChange?.(settings)
  }, [settings, onSettingsChange])

  // Synchroniser les colonnes quand elles changent depuis l'extérieur
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  // État consolidé
  const state: DataTableState<T> = useMemo(
    () => ({
      columns,
      visibleColumns,
      data,
      processedData: sortedData,
      displayData,
      filters,
      searchTerm,
      advancedFilters,
      isFiltered,
      sortConfig,
      selection,
      selectedData,
      currentPage,
      pageSize,
      totalPages,
      paginationInfo,
      isExporting,
      loading,
      error,
      settings,
    }),
    [
      columns,
      visibleColumns,
      data,
      sortedData,
      displayData,
      filters,
      searchTerm,
      advancedFilters,
      isFiltered,
      sortConfig,
      selection,
      selectedData,
      currentPage,
      pageSize,
      totalPages,
      paginationInfo,
      isExporting,
      loading,
      error,
      settings,
    ]
  )

  return {
    state,
    // Filtrage
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    setSearchTerm,
    setAdvancedFilters,
    // Tri
    handleSort,
    clearSorts,
    // Sélection
    toggleRow,
    toggleAll,
    selectRange,
    clearSelection,
    // Pagination
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    // Export
    exportData,
    // Colonnes
    toggleColumnVisibility,
    reorderColumns,
    resizeColumn,
    // Paramètres
    updateSettings,
    resetSettings,
  }
}
