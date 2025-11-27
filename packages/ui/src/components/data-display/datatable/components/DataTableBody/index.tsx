'use client'

import type React from 'react'
import { memo, useCallback, useRef } from 'react'
import { cn } from '../../../../../lib/utils'
import { Checkbox } from '../../../../primitives/checkbox'
import { useDataTableContext } from '../../contexts/DataTableContext'
import { useVirtualizedTable, VIRTUAL_TABLE_DEFAULTS } from '../../hooks/useVirtualizedTable'
import type { ColumnConfig } from '../../types'
import { InlineActions } from './InlineActions'
import { TableCell } from './TableCell'

export interface DataTableBodyProps<T = Record<string, unknown>> {
  onRowClick?: (row: T, index: number) => void
  onRowDoubleClick?: (row: T, index: number) => void
  onCellEdit?: (row: T, column: ColumnConfig<T>, value: unknown) => void
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
  /** Active la virtualisation pour les grandes listes (defaut: auto basee sur le seuil) */
  virtualize?: boolean
  /** Seuil de lignes pour activer la virtualisation (defaut: 100) */
  virtualizeThreshold?: number
  /** Hauteur estimee d'une ligne en pixels (defaut: 48) */
  estimatedRowHeight?: number
}

/**
 * Corps du DataTable avec rendu des lignes et cellules
 * Supporte la virtualisation pour les grandes listes (50k+ lignes)
 */
export function DataTableBody<T extends Record<string, unknown>>({
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
  striped = true,
  hoverable = true,
  actions,
  keyField = 'id',
  loading = false,
  emptyMessage = 'Aucune donnee',
  virtualize,
  virtualizeThreshold = VIRTUAL_TABLE_DEFAULTS.THRESHOLD,
  estimatedRowHeight = VIRTUAL_TABLE_DEFAULTS.ROW_HEIGHT,
}: DataTableBodyProps<T>) {
  const { state, toggleRow } = useDataTableContext<T>()
  const { displayData, visibleColumns, selection } = state
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())

  // Determiner si on doit virtualiser
  const shouldVirtualize = virtualize ?? displayData.length >= virtualizeThreshold

  // Hook de virtualisation
  const { virtualRows, paddingTop, paddingBottom, isVirtualized, measureRow } = useVirtualizedTable(
    {
      data: displayData,
      estimatedRowHeight,
      virtualizeThreshold,
      forceVirtualize: virtualize === true,
    }
  )

  // Synchroniser la ref du conteneur avec le hook de virtualisation
  // Note: Le conteneur est gere par le parent DataTable

  // Callback pour mesurer les lignes apres le rendu
  const handleRowRef = useCallback(
    (index: number, element: HTMLTableRowElement | null) => {
      if (element) {
        rowRefs.current.set(index, element)
        measureRow(index, element)
      } else {
        rowRefs.current.delete(index)
      }
    },
    [measureRow]
  )

  // Rendu d'une ligne
  const renderRow = useCallback(
    (row: T, index: number, virtualIndex?: number) => {
      const rowId = row[keyField] as string | number
      const isSelected = selection.selectedRows.has(rowId)
      const actualIndex = virtualIndex ?? index

      return (
        <tr
          key={rowId}
          ref={(el) => isVirtualized && handleRowRef(actualIndex, el)}
          data-index={actualIndex}
          className={cn(
            'border-b transition-colors',
            striped && actualIndex % 2 === 0 && 'bg-muted/50',
            hoverable && 'hover:bg-muted/50',
            isSelected && 'bg-primary/10',
            onRowClick && 'cursor-pointer'
          )}
          onClick={() => onRowClick?.(row, actualIndex)}
          onDoubleClick={() => onRowDoubleClick?.(row, actualIndex)}
        >
          {/* Checkbox de selection */}
          {state.selection && (
            <td className="w-12 px-4">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleRow(rowId)}
                aria-label={`Selectionner la ligne ${actualIndex + 1}`}
              />
            </td>
          )}

          {/* Cellules de donnees */}
          {visibleColumns.map((column) => (
            <TableCell
              key={column.id}
              row={row as any}
              column={column as any}
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
    },
    [
      keyField,
      selection.selectedRows,
      isVirtualized,
      handleRowRef,
      striped,
      hoverable,
      onRowClick,
      onRowDoubleClick,
      state.selection,
      toggleRow,
      visibleColumns,
      onCellEdit,
      actions,
    ]
  )

  // Nombre de colonnes pour le colspan
  const colSpan = visibleColumns.length + (state.selection ? 1 : 0) + (actions ? 1 : 0)

  // Composant skeleton row pour le chargement
  const SkeletonRow = ({ index }: { index: number }) => (
    <tr
      key={`skeleton-${index}`}
      className={cn(
        'border-b animate-pulse',
        striped && index % 2 === 0 && 'bg-muted/30'
      )}
    >
      {state.selection && (
        <td className="w-12 px-4 py-3">
          <div className="h-4 w-4 bg-muted rounded" />
        </td>
      )}
      {visibleColumns.map((column, colIndex) => (
        <td key={`skeleton-${index}-${column.id}`} className="px-4 py-3">
          <div
            className="h-4 bg-muted rounded"
            style={{
              width: colIndex === 0 ? '70%' : colIndex === visibleColumns.length - 1 ? '40%' : '60%',
            }}
          />
        </td>
      ))}
      {actions && actions.length > 0 && (
        <td className="w-20 px-2 py-3">
          <div className="h-6 w-6 bg-muted rounded mx-auto" />
        </td>
      )}
    </tr>
  )

  // Etats vides et chargement
  if (loading) {
    return (
      <tbody>
        {/* Afficher 5 skeleton rows pour un meilleur feedback */}
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonRow key={index} index={index} />
        ))}
      </tbody>
    )
  }

  if (displayData.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className="w-12 h-12 text-muted-foreground/50 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {state.isFiltered ? 'Aucun résultat trouvé' : 'Aucune donnée'}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {state.isFiltered
                  ? 'Essayez de modifier vos filtres de recherche'
                  : emptyMessage}
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    )
  }

  // Rendu virtualise
  if (isVirtualized && shouldVirtualize) {
    return (
      <tbody>
        {/* Spacer row pour le padding top */}
        {paddingTop > 0 && (
          <tr>
            <td colSpan={colSpan} style={{ height: paddingTop, padding: 0, border: 'none' }} />
          </tr>
        )}

        {/* Lignes virtuelles visibles */}
        {virtualRows.map((virtualRow) =>
          renderRow(virtualRow.data, virtualRow.index, virtualRow.index)
        )}

        {/* Spacer row pour le padding bottom */}
        {paddingBottom > 0 && (
          <tr>
            <td colSpan={colSpan} style={{ height: paddingBottom, padding: 0, border: 'none' }} />
          </tr>
        )}
      </tbody>
    )
  }

  // Rendu standard (non virtualise)
  return <tbody>{displayData.map((row, index) => renderRow(row, index))}</tbody>
}

// Export avec memo pour optimiser les re-renders
export default memo(DataTableBody) as typeof DataTableBody
