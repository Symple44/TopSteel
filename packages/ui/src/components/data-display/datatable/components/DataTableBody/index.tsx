'use client'

import React, { memo } from 'react'
import { Checkbox } from '../../../../primitives/checkbox'
import { cn } from '../../../../../lib/utils'
import { useDataTableContext } from '../../contexts/DataTableContext'
import { TableCell } from './TableCell'
import { InlineActions } from './InlineActions'
import type { ColumnConfig } from '../../types'

export interface DataTableBodyProps<T = any> {
  onRowClick?: (row: T, index: number) => void
  onRowDoubleClick?: (row: T, index: number) => void
  onCellEdit?: (row: T, column: ColumnConfig<T>, value: any) => void
  striped?: boolean
  hoverable?: boolean
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    variant?: 'default' | 'destructive' | 'outline'
    disabled?: (row: T) => boolean
  }>
  keyField?: string
  loading?: boolean
  emptyMessage?: string
}

/**
 * Corps du DataTable avec rendu des lignes et cellules
 */
export function DataTableBody<T extends Record<string, any>>({
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
  striped = true,
  hoverable = true,
  actions,
  keyField = 'id',
  loading = false,
  emptyMessage = 'Aucune donnée',
}: DataTableBodyProps<T>) {
  const {
    state,
    toggleRow,
    toggleAll,
  } = useDataTableContext<T>()

  const { displayData, visibleColumns, selection } = state

  // Rendu d'une ligne
  const renderRow = (row: T, index: number) => {
    const rowId = row[keyField] as string | number
    const isSelected = selection.selectedRows.has(rowId)
    
    return (
      <tr
        key={rowId}
        className={cn(
          'border-b transition-colors',
          striped && index % 2 === 0 && 'bg-muted/50',
          hoverable && 'hover:bg-muted/50',
          isSelected && 'bg-primary/10',
          onRowClick && 'cursor-pointer'
        )}
        onClick={() => onRowClick?.(row, index)}
        onDoubleClick={() => onRowDoubleClick?.(row, index)}
      >
        {/* Checkbox de sélection */}
        {state.selection && (
          <td className="w-12 px-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleRow(rowId)}
              aria-label={`Sélectionner la ligne ${index + 1}`}
            />
          </td>
        )}

        {/* Cellules de données */}
        {visibleColumns.map((column) => (
          <TableCell
            key={column.id}
            row={row}
            column={column}
            onEdit={onCellEdit ? (value) => onCellEdit(row, column, value) : undefined}
          />
        ))}

        {/* Actions en ligne */}
        {actions && actions.length > 0 && (
          <td className="w-20 px-2">
            <InlineActions row={row} actions={actions} />
          </td>
        )}
      </tr>
    )
  }

  // États vides et chargement
  if (loading) {
    return (
      <tbody>
        <tr>
          <td 
            colSpan={visibleColumns.length + (state.selection ? 1 : 0) + (actions ? 1 : 0)}
            className="text-center py-8"
          >
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Chargement...</span>
            </div>
          </td>
        </tr>
      </tbody>
    )
  }

  if (displayData.length === 0) {
    return (
      <tbody>
        <tr>
          <td 
            colSpan={visibleColumns.length + (state.selection ? 1 : 0) + (actions ? 1 : 0)}
            className="text-center py-8 text-muted-foreground"
          >
            {state.isFiltered ? 'Aucun résultat trouvé' : emptyMessage}
          </td>
        </tr>
      </tbody>
    )
  }

  return (
    <tbody>
      {displayData.map((row, index) => renderRow(row, index))}
    </tbody>
  )
}

// Export avec memo pour optimiser les re-renders
export default memo(DataTableBody) as typeof DataTableBody