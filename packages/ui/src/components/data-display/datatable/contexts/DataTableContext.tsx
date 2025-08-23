'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import type { DataTableState, UseDataTableStateReturn } from '../hooks/useDataTableState'

/**
 * Contexte pour partager l'état du DataTable entre les composants
 */
export interface DataTableContextValue<T = any> extends UseDataTableStateReturn<T> {
  // État additionnel si nécessaire
  tableId?: string
  userId?: string
}

// Créer le contexte avec une valeur par défaut undefined
const DataTableContext = createContext<DataTableContextValue | undefined>(undefined)

/**
 * Provider pour le contexte DataTable
 */
export interface DataTableProviderProps<T = any> {
  children: ReactNode
  value: DataTableContextValue<T>
}

export function DataTableProvider<T = any>({ 
  children, 
  value 
}: DataTableProviderProps<T>) {
  return (
    <DataTableContext.Provider value={value as DataTableContextValue}>
      {children}
    </DataTableContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte DataTable
 * @throws {Error} Si utilisé en dehors du DataTableProvider
 */
export function useDataTableContext<T = any>(): DataTableContextValue<T> {
  const context = useContext(DataTableContext)
  
  if (!context) {
    throw new Error(
      'useDataTableContext doit être utilisé à l\'intérieur d\'un DataTableProvider'
    )
  }
  
  return context as DataTableContextValue<T>
}

/**
 * Hook pour accéder uniquement à l'état du DataTable
 */
export function useDataTableState<T = any>(): DataTableState<T> {
  const context = useDataTableContext<T>()
  return context.state
}

/**
 * Hook pour accéder aux actions de filtrage
 */
export function useDataTableFilters<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    filters: context.state.filters,
    searchTerm: context.state.searchTerm,
    advancedFilters: context.state.advancedFilters,
    isFiltered: context.state.isFiltered,
    setFilters: context.setFilters,
    addFilter: context.addFilter,
    removeFilter: context.removeFilter,
    clearFilters: context.clearFilters,
    setSearchTerm: context.setSearchTerm,
    setAdvancedFilters: context.setAdvancedFilters,
  }
}

/**
 * Hook pour accéder aux actions de tri
 */
export function useDataTableSort<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    sortConfig: context.state.sortConfig,
    handleSort: context.handleSort,
    clearSorts: context.clearSorts,
  }
}

/**
 * Hook pour accéder aux actions de sélection
 */
export function useDataTableSelection<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    selection: context.state.selection,
    selectedData: context.state.selectedData,
    toggleRow: context.toggleRow,
    toggleAll: context.toggleAll,
    selectRange: context.selectRange,
    clearSelection: context.clearSelection,
  }
}

/**
 * Hook pour accéder aux actions de pagination
 */
export function useDataTablePagination<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    currentPage: context.state.currentPage,
    pageSize: context.state.pageSize,
    totalPages: context.state.totalPages,
    paginationInfo: context.state.paginationInfo,
    goToPage: context.goToPage,
    nextPage: context.nextPage,
    prevPage: context.prevPage,
    setPageSize: context.setPageSize,
  }
}

/**
 * Hook pour accéder aux actions d'export
 */
export function useDataTableExport<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    isExporting: context.state.isExporting,
    exportData: context.exportData,
  }
}

/**
 * Hook pour accéder aux actions sur les colonnes
 */
export function useDataTableColumns<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    columns: context.state.columns,
    visibleColumns: context.state.visibleColumns,
    toggleColumnVisibility: context.toggleColumnVisibility,
    reorderColumns: context.reorderColumns,
    resizeColumn: context.resizeColumn,
  }
}

/**
 * Hook pour accéder aux données affichées
 */
export function useDataTableData<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    data: context.state.data,
    processedData: context.state.processedData,
    displayData: context.state.displayData,
  }
}

/**
 * Hook pour accéder aux paramètres
 */
export function useDataTableSettings<T = any>() {
  const context = useDataTableContext<T>()
  
  return {
    settings: context.state.settings,
    updateSettings: context.updateSettings,
    resetSettings: context.resetSettings,
  }
}