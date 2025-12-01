'use client'

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Checkbox } from '../../primitives/checkbox'
import { ColumnFilterAdvanced } from './ColumnFilterAdvanced'
import { DataTableBody } from './components/DataTableBody'
import { DataTableFooter } from './components/DataTableFooter'
import { DataTableHeader } from './components/DataTableHeader'
import { DataTableProvider } from './contexts/DataTableContext'
import { useDataTableState } from './hooks/useDataTableState'
import { applyPreset } from './presets'
import type { ColumnConfig, DataTableProps } from './types'

/**
 * Composant DataTable refactorisé
 * Utilise les hooks et contextes pour une architecture modulaire
 * Supporte les presets pour une configuration simplifiée
 */
export function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  columns,
  keyField = 'id' as keyof T,

  // Identifiants
  tableId,
  userId,

  // Preset system
  preset,

  // Fonctionnalites
  sortable: sortableProp,
  filterable: filterableProp,
  searchable: searchableProp,
  selectable: selectableProp,
  editable: editableProp,
  exportable: exportableProp,
  pagination: paginationProp,
  searchDebounceMs: searchDebounceMsProp,
  virtualize: virtualizeProp,
  virtualizeThreshold: virtualizeThresholdProp,
  estimatedRowHeight: estimatedRowHeightProp,

  // Apparence
  title,
  className,
  height,
  striped: stripedProp,
  bordered: borderedProp,
  hoverable: hoverableProp,
  compact: compactProp,
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
  // Apply preset configuration if provided
  const presetConfig = preset ? applyPreset(preset) : null

  // Merge preset config with explicit props (explicit props take precedence)
  const sortable = sortableProp ?? presetConfig?.sortable ?? true
  const filterable = filterableProp ?? presetConfig?.filterable ?? true
  const searchable = searchableProp ?? presetConfig?.searchable ?? true
  const selectable = selectableProp ?? presetConfig?.selectable ?? false
  const editable = editableProp ?? presetConfig?.editable ?? false
  const exportable = exportableProp ?? presetConfig?.exportable ?? false
  const pagination = paginationProp ?? presetConfig?.pagination ?? false
  const searchDebounceMs = searchDebounceMsProp ?? presetConfig?.searchDebounceMs ?? 300
  const virtualize = virtualizeProp ?? presetConfig?.virtualize
  const virtualizeThreshold = virtualizeThresholdProp ?? presetConfig?.virtualizeThreshold ?? 100
  const estimatedRowHeight = estimatedRowHeightProp ?? presetConfig?.estimatedRowHeight ?? 48
  const striped = stripedProp ?? presetConfig?.striped ?? true
  const bordered = borderedProp ?? presetConfig?.bordered ?? true
  const hoverable = hoverableProp ?? presetConfig?.hoverable ?? true
  const compact = compactProp ?? presetConfig?.compact ?? false
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

  const { state, handleSort, toggleAll, addFilter, removeFilter } = tableState

  // Rendu du header de colonne avec tri et filtre
  const renderColumnHeader = (column: ColumnConfig<T>) => {
    const isSortable = sortable && column.sortable !== false
    const isFilterable = filterable && column.filterable !== false
    const sortDirection = state.sortConfig.find((s) => s.column === column.id)?.direction
    // Récupérer le filtre actuel pour cette colonne
    const currentColumnFilter = state.filters.find((f) => f.field === column.id)
    const columnFilterValue = currentColumnFilter?.value as { type: string; values?: string[]; min?: number; max?: number; start?: string; end?: string } | undefined

    return (
      <th
        key={column.id}
        role="columnheader"
        aria-sort={sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={cn(
          'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide',
          'transition-colors duration-100 select-none',
          sortDirection && 'text-primary bg-primary/5',
          compact && 'py-2'
        )}
        style={{ width: column.width }}
      >
        <div className="flex items-center gap-1.5 group">
          {/* Zone cliquable pour le tri */}
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 flex-1 min-w-0',
              isSortable && 'cursor-pointer hover:text-foreground'
            )}
            onClick={isSortable ? () => handleSort(column.id) : undefined}
            disabled={!isSortable}
          >
            <span className="truncate">{column.title}</span>
            {isSortable && (
              <span className={cn(
                'flex-shrink-0 transition-opacity',
                sortDirection ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
              )}>
                {sortDirection === 'asc' ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : sortDirection === 'desc' ? (
                  <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </span>
            )}
          </button>

          {/* Filtre de colonne */}
          {isFilterable && (
            <ColumnFilterAdvanced
              column={{
                id: column.id,
                title: column.title,
                type: column.type as 'text' | 'number' | 'date' | 'boolean' | 'select' | 'richtext' | undefined,
                key: column.key,
                getValue: column.getValue as ((row: Record<string, unknown>) => unknown) | undefined,
              }}
              data={data as Record<string, unknown>[]}
              currentSort={sortDirection || null}
              currentFilters={columnFilterValue as any}
              onSort={(direction) => {
                if (direction) {
                  handleSort(column.id, direction)
                } else {
                  handleSort(column.id)
                }
              }}
              onFilter={(filter) => {
                if (filter) {
                  addFilter({
                    field: column.id,
                    value: filter as Record<string, unknown>,
                    operator: 'equals',
                  })
                } else {
                  removeFilter(column.id)
                }
              }}
            />
          )}
        </div>
      </th>
    )
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-3">
          <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <DataTableProvider value={tableState}>
      <div
        className={cn(
          'flex flex-col bg-background rounded-lg overflow-hidden',
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
            <thead className="sticky top-0 bg-muted/30 backdrop-blur-sm border-b border-border/40 z-10">
              <tr className="group">
                {/* Checkbox de sélection globale */}
                {selectable && (
                  <th className="w-12 px-4 py-3">
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
                  <th className="w-16 px-2 py-3">
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
