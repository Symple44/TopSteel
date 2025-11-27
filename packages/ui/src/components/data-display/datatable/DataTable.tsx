'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Checkbox } from '../../primitives/checkbox'
import { DataTableBody } from './components/DataTableBody'
import { DataTableFooter } from './components/DataTableFooter'
import { DataTableHeader } from './components/DataTableHeader'
import { DataTableProvider } from './contexts/DataTableContext'
import { useDataTableState } from './hooks/useDataTableState'
import type { ColumnConfig, DataTableProps } from './types'

/**
 * Composant DataTable refactorisé
 * Utilise les hooks et contextes pour une architecture modulaire
 */
export function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  columns,
  keyField = 'id' as keyof T,

  // Identifiants
  tableId,
  userId,

  // Fonctionnalites
  sortable = true,
  filterable = true,
  searchable = true,
  selectable = false,
  editable = false,
  exportable = false,
  pagination = false,
  searchDebounceMs = 300,
  virtualize,
  virtualizeThreshold = 100,
  estimatedRowHeight = 48,

  // Apparence
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

  // Actions et callbacks
  actions,
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
  onSelectionChange,
  onPaginationChange,
  onAddNew,

  // Paramètres persistants
  settings,
  onSettingsChange,
}: DataTableProps<T>) {
  // Utiliser le hook principal pour gerer tout l'etat
  const tableState = useDataTableState({
    data,
    columns,
    keyField: String(keyField),
    sortable,
    filterable,
    searchable,
    selectable,
    exportable,
    pagination,
    searchDebounceMs,
    settings,
    onSettingsChange,
    onSelectionChange,
    onPaginationChange,
    loading,
    error,
  })

  const { state, handleSort, toggleAll } = tableState

  // Rendu du header de colonne avec tri
  const renderColumnHeader = (column: ColumnConfig<T>) => {
    const isSortable = sortable && column.sortable !== false
    const sortDirection = state.sortConfig.find((s) => s.column === column.id)?.direction

    return (
      <th
        key={column.id}
        className={cn(
          'px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
          'transition-colors duration-150',
          isSortable && 'cursor-pointer hover:text-foreground hover:bg-muted/30',
          sortDirection && 'text-foreground bg-muted/20',
          compact && 'py-2.5'
        )}
        style={{ width: column.width }}
        onClick={isSortable ? () => handleSort(column.id) : undefined}
      >
        <div className="flex items-center gap-2">
          <span>{column.title}</span>
          {column.description && (
            <span className="text-[10px] text-muted-foreground/60 normal-case font-normal" title={column.description}>ⓘ</span>
          )}
          {isSortable && (
            <span className="ml-auto">
              {sortDirection ? (
                sortDirection === 'asc' ? (
                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                )
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
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
          'flex flex-col bg-background rounded-xl overflow-hidden shadow-sm',
          bordered && 'border border-border/50',
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
            <thead className="sticky top-0 bg-muted/40 backdrop-blur-sm border-b border-border/50 z-10">
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

            {/* Corps du tableau (avec virtualisation si necessaire) */}
            <DataTableBody
              onRowClick={onRowClick}
              onRowDoubleClick={onRowDoubleClick}
              onCellEdit={onCellEdit}
              striped={striped}
              hoverable={hoverable}
              actions={actions}
              keyField={String(keyField)}
              loading={loading}
              emptyMessage={emptyMessage}
              virtualize={virtualize}
              virtualizeThreshold={virtualizeThreshold}
              estimatedRowHeight={estimatedRowHeight}
            />
          </table>
        </div>

        {/* Footer avec pagination */}
        <DataTableFooter showPagination={!!pagination} showSelection={selectable} />
      </div>
    </DataTableProvider>
  )
}

// Export par défaut pour compatibilité
export default DataTable
