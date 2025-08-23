'use client'

import React from 'react'
import { cn } from '../../../lib/utils'
import { DataTableProvider } from './contexts/DataTableContext'
import { useDataTableState } from './hooks/useDataTableState'
import { DataTableHeader } from './components/DataTableHeader'
import { DataTableBody } from './components/DataTableBody'
import { DataTableFooter } from './components/DataTableFooter'
import { Checkbox } from '../../primitives/checkbox'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { 
  ColumnConfig, 
  SelectionState, 
  PaginationConfig,
  TableSettings 
} from './types'

/**
 * Props du composant DataTable refactorisé
 */
export interface DataTableProps<T extends Record<string, any>> {
  // Données et configuration
  data: T[]
  columns: ColumnConfig<T>[]
  keyField?: keyof T
  
  // Fonctionnalités
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  selectable?: boolean
  editable?: boolean
  exportable?: boolean
  pagination?: boolean | PaginationConfig
  
  // Apparence
  title?: string
  className?: string
  height?: number | string
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  compact?: boolean
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  
  // Actions et callbacks
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    variant?: 'default' | 'destructive' | 'outline'
    disabled?: (row: T) => boolean
  }>
  onRowClick?: (row: T, index: number) => void
  onRowDoubleClick?: (row: T, index: number) => void
  onCellEdit?: (row: T, column: ColumnConfig<T>, value: any) => void
  onSelectionChange?: (selection: SelectionState) => void
  onPaginationChange?: (config: PaginationConfig) => void
  onAddNew?: () => void
  
  // Paramètres persistants
  tableId?: string
  settings?: TableSettings
  onSettingsChange?: (settings: TableSettings) => void
}

/**
 * Composant DataTable refactorisé
 * Utilise les hooks et contextes pour une architecture modulaire
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField = 'id' as keyof T,
  
  sortable = true,
  filterable = true,
  searchable = true,
  selectable = false,
  editable = false,
  exportable = false,
  pagination = false,
  
  title,
  className,
  height,
  striped = true,
  bordered = true,
  hoverable = true,
  compact = false,
  loading = false,
  error = null,
  emptyMessage = 'Aucune donnée disponible',
  
  actions,
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
  onSelectionChange,
  onPaginationChange,
  onAddNew,
  
  tableId,
  settings,
  onSettingsChange,
}: DataTableProps<T>) {
  // Utiliser le hook principal pour gérer tout l'état
  const tableState = useDataTableState({
    data,
    columns,
    keyField: keyField as string,
    sortable,
    filterable,
    searchable,
    selectable,
    exportable,
    pagination,
    settings,
    onSettingsChange,
    onSelectionChange,
    onPaginationChange,
    loading,
    error,
  })

  const {
    state,
    handleSort,
    toggleRow,
    toggleAll,
  } = tableState

  // Rendu du header de colonne avec tri
  const renderColumnHeader = (column: ColumnConfig<T>) => {
    const isSortable = sortable && column.sortable !== false
    const sortDirection = state.sortConfig.find(s => s.column === column.id)?.direction
    
    return (
      <th
        key={column.id}
        className={cn(
          'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
          isSortable && 'cursor-pointer hover:text-foreground',
          compact && 'py-2'
        )}
        style={{ width: column.width }}
        onClick={isSortable ? () => handleSort(column.id) : undefined}
      >
        <div className="flex items-center gap-2">
          <span>{column.title}</span>
          {column.description && (
            <span className="text-xs text-muted-foreground">ⓘ</span>
          )}
          {isSortable && (
            <span className="ml-auto">
              {!sortDirection ? (
                <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
              ) : sortDirection === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      </th>
    )
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-destructive/10">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <DataTableProvider value={tableState}>
      <div 
        className={cn(
          'flex flex-col bg-background rounded-lg',
          bordered && 'border',
          className
        )}
        style={{ height }}
      >
        {/* Header avec recherche et actions */}
        <DataTableHeader
          title={title}
          showSearch={searchable}
          showFilters={filterable}
          showExport={exportable}
          showColumnToggle={true}
          onAddNew={onAddNew}
        />

        {/* Table principale */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            {/* En-têtes de colonnes */}
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                {/* Checkbox de sélection globale */}
                {selectable && (
                  <th className="w-12 px-4">
                    <Checkbox
                      checked={
                        state.selection.selectAll || 
                        (state.displayData.length > 0 && 
                         state.selection.selectedRows.size === state.displayData.length)
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Sélectionner tout"
                    />
                  </th>
                )}
                
                {/* En-têtes de colonnes */}
                {state.visibleColumns.map(renderColumnHeader)}
                
                {/* Colonne actions */}
                {actions && actions.length > 0 && (
                  <th className="w-20 px-2">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            {/* Corps du tableau */}
            <DataTableBody
              onRowClick={onRowClick}
              onRowDoubleClick={onRowDoubleClick}
              onCellEdit={onCellEdit}
              striped={striped}
              hoverable={hoverable}
              actions={actions}
              keyField={keyField as string}
              loading={loading}
              emptyMessage={emptyMessage}
            />
          </table>
        </div>

        {/* Footer avec pagination */}
        <DataTableFooter
          showPagination={!!pagination}
          showSelection={selectable}
        />
      </div>
    </DataTableProvider>
  )
}

// Export par défaut pour compatibilité
export default DataTable