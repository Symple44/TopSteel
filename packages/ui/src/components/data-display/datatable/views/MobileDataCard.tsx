'use client'

import { ChevronRight, MoreVertical } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../../lib/utils'
import { Button } from '../../../primitives/button'
import { DropdownItem, DropdownPortal } from '../../../primitives/dropdown-portal'
import type { ColumnConfig } from '../types'

export interface MobileDataCardProps<T extends Record<string, unknown>> {
  /** Row data */
  data: T
  /** Column configurations */
  columns: ColumnConfig<T>[]
  /** Key field for identification */
  keyField?: keyof T
  /** Primary field to display as title */
  primaryField?: keyof T
  /** Secondary field to display as subtitle */
  secondaryField?: keyof T
  /** Callback when card is clicked */
  onCardClick?: (row: T) => void
  /** Actions to show in dropdown */
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    variant?: 'default' | 'destructive'
  }>
  /** Max fields to show (excluding primary/secondary) */
  maxVisibleFields?: number
  /** Custom class name */
  className?: string
  /** Whether the card is selected */
  isSelected?: boolean
  /** Selection toggle callback */
  onSelectionToggle?: (row: T) => void
  /** Selectable mode */
  selectable?: boolean
}

/**
 * MobileDataCard - Renders a single data row as a card for mobile view
 * Optimized for touch interactions with 44px minimum touch targets
 */
export function MobileDataCard<T extends Record<string, unknown>>({
  data,
  columns,
  keyField = 'id' as keyof T,
  primaryField,
  secondaryField,
  onCardClick,
  actions,
  maxVisibleFields = 4,
  className,
  isSelected = false,
  onSelectionToggle,
  selectable = false,
}: MobileDataCardProps<T>) {
  // Determine primary and secondary fields
  const primaryCol = primaryField
    ? columns.find((c) => c.id === primaryField)
    : columns[0]
  const secondaryCol = secondaryField
    ? columns.find((c) => c.id === secondaryField)
    : columns[1]

  // Get remaining columns to display
  const remainingColumns = columns.filter(
    (c) =>
      c.id !== primaryCol?.id &&
      c.id !== secondaryCol?.id &&
      c.id !== keyField &&
      !c.hidden
  )

  const visibleColumns = remainingColumns.slice(0, maxVisibleFields)
  const hiddenCount = remainingColumns.length - visibleColumns.length

  // Get display value
  const getDisplayValue = (column: ColumnConfig<T>) => {
    const value = data[column.id as keyof T]
    if (column.render) {
      return column.render(value, data)
    }
    if (value === null || value === undefined) {
      return '-'
    }
    return String(value)
  }

  const handleCardClick = () => {
    if (!selectable) {
      onCardClick?.(data)
    }
  }

  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionToggle?.(data)
  }

  return (
    <div
      role="listitem"
      className={cn(
        'bg-background border rounded-lg overflow-hidden',
        'transition-all duration-200',
        onCardClick && 'cursor-pointer hover:shadow-md hover:border-primary/30',
        isSelected && 'ring-2 ring-primary border-primary',
        className
      )}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      tabIndex={onCardClick ? 0 : undefined}
    >
      <div className="p-4">
        {/* Header with title, selection and actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Selection checkbox */}
            {selectable && (
              <button
                type="button"
                onClick={handleSelectionClick}
                className={cn(
                  'flex items-center justify-center min-h-[44px] min-w-[44px] -m-2',
                  'rounded-md transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                aria-label={isSelected ? 'Désélectionner' : 'Sélectionner'}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    'transition-colors',
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-input'
                  )}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            )}

            {/* Title and subtitle */}
            <div className="flex-1 min-w-0">
              {primaryCol && (
                <h3 className="font-semibold text-base line-clamp-2 text-foreground">
                  {getDisplayValue(primaryCol)}
                </h3>
              )}
              {secondaryCol && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {getDisplayValue(secondaryCol)}
                </p>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          {actions && actions.length > 0 && (
            <DropdownPortal
              align="end"
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] -mr-2"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  aria-label="Actions"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              }
            >
              {actions.map((action, index) => (
                <DropdownItem
                  key={`action-${index}`}
                  onClick={() => action.onClick(data)}
                  className={cn(
                    'min-h-[44px]',
                    action.variant === 'destructive' && 'text-destructive'
                  )}
                >
                  {action.icon && (
                    <span className="mr-2" aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </DropdownItem>
              ))}
            </DropdownPortal>
          )}
        </div>

        {/* Field values */}
        {visibleColumns.length > 0 && (
          <div className="space-y-2">
            {visibleColumns.map((column) => (
              <div
                key={column.id}
                className="flex justify-between items-center text-sm gap-2"
              >
                <span className="text-muted-foreground font-medium truncate">
                  {column.header}
                </span>
                <span className="text-foreground text-right truncate max-w-[60%]">
                  {getDisplayValue(column)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Hidden fields indicator */}
        {hiddenCount > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-3 pt-2 border-t">
            +{hiddenCount} autres champs
          </p>
        )}
      </div>

      {/* Click indicator */}
      {onCardClick && (
        <div className="px-4 pb-3 flex items-center justify-end text-xs text-muted-foreground">
          <span className="mr-1">Voir détails</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

export interface MobileDataCardListProps<T extends Record<string, unknown>> {
  /** Array of row data */
  data: T[]
  /** Column configurations */
  columns: ColumnConfig<T>[]
  /** Key field for identification */
  keyField?: keyof T
  /** Primary field to display as title */
  primaryField?: keyof T
  /** Secondary field to display as subtitle */
  secondaryField?: keyof T
  /** Callback when card is clicked */
  onCardClick?: (row: T) => void
  /** Actions to show in dropdown for each card */
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    variant?: 'default' | 'destructive'
  }>
  /** Max fields to show per card */
  maxVisibleFields?: number
  /** Custom class name */
  className?: string
  /** Selectable mode */
  selectable?: boolean
  /** Selected row keys */
  selectedKeys?: Set<unknown>
  /** Selection change callback */
  onSelectionChange?: (selectedKeys: Set<unknown>) => void
  /** Empty state message */
  emptyMessage?: string
  /** Loading state */
  loading?: boolean
}

/**
 * MobileDataCardList - Renders a list of data rows as cards
 */
export function MobileDataCardList<T extends Record<string, unknown>>({
  data,
  columns,
  keyField = 'id' as keyof T,
  primaryField,
  secondaryField,
  onCardClick,
  actions,
  maxVisibleFields = 4,
  className,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  emptyMessage = 'Aucune donnée disponible',
  loading = false,
}: MobileDataCardListProps<T>) {
  const handleSelectionToggle = (row: T) => {
    const key = row[keyField]
    const newSelectedKeys = new Set(selectedKeys)
    if (newSelectedKeys.has(key)) {
      newSelectedKeys.delete(key)
    } else {
      newSelectedKeys.add(key)
    }
    onSelectionChange?.(newSelectedKeys)
  }

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-background border rounded-lg p-4 animate-pulse"
          >
            <div className="h-5 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-3" aria-hidden="true">
            📋
          </div>
          <p className="text-base font-medium">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div role="list" className={cn('space-y-3', className)}>
      {data.map((row) => (
        <MobileDataCard
          key={String(row[keyField])}
          data={row}
          columns={columns}
          keyField={keyField}
          primaryField={primaryField}
          secondaryField={secondaryField}
          onCardClick={onCardClick}
          actions={actions}
          maxVisibleFields={maxVisibleFields}
          selectable={selectable}
          isSelected={selectedKeys.has(row[keyField])}
          onSelectionToggle={handleSelectionToggle}
        />
      ))}
    </div>
  )
}

export default MobileDataCard
