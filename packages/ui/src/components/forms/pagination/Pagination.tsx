'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Total items count (optional, for display) */
  totalItems?: number
  /** Items per page (optional, for display) */
  pageSize?: number
  /** Show first/last buttons */
  showFirstLast?: boolean
  /** Show page size selector */
  showPageSize?: boolean
  /** Available page sizes */
  pageSizeOptions?: number[]
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void
  /** Number of page buttons to show */
  siblingCount?: number
  /** Custom class name */
  className?: string
  /** Compact mode for mobile */
  compact?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Labels for accessibility */
  labels?: {
    previous?: string
    next?: string
    first?: string
    last?: string
    page?: string
    of?: string
    items?: string
    perPage?: string
  }
}

const defaultLabels = {
  previous: 'Page précédente',
  next: 'Page suivante',
  first: 'Première page',
  last: 'Dernière page',
  page: 'Page',
  of: 'sur',
  items: 'éléments',
  perPage: 'par page',
}

function generatePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 3 // siblings + current + first + last
  const totalBlocks = totalNumbers + 2 // + 2 ellipsis

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

  const shouldShowLeftEllipsis = leftSiblingIndex > 2
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
    return [...leftRange, 'ellipsis', totalPages]
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    )
    return [1, 'ellipsis', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  )
  return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages]
}

/**
 * Pagination component with accessibility support
 * Supports keyboard navigation and screen readers
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  showFirstLast = true,
  showPageSize = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  siblingCount = 1,
  className,
  compact = false,
  disabled = false,
  labels: customLabels,
}: PaginationProps) {
  const labels = { ...defaultLabels, ...customLabels }
  const pages = generatePagination(currentPage, totalPages, siblingCount)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  const buttonBaseClass = cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'min-h-[44px] min-w-[44px]', // Touch target
    'hover:bg-accent hover:text-accent-foreground'
  )

  const activeButtonClass = cn(
    buttonBaseClass,
    'bg-primary text-primary-foreground hover:bg-primary/90'
  )

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4 flex-wrap', className)}
    >
      {/* Items info */}
      {totalItems !== undefined && pageSize !== undefined && (
        <div className="text-sm text-muted-foreground hidden sm:block">
          {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)}{' '}
          {labels.of} {totalItems} {labels.items}
        </div>
      )}

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        {showFirstLast && !compact && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            onKeyDown={(e) => handleKeyDown(e, () => onPageChange(1))}
            disabled={!canGoPrevious || disabled}
            className={buttonBaseClass}
            aria-label={labels.first}
            title={labels.first}
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {/* Previous page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          onKeyDown={(e) => handleKeyDown(e, () => onPageChange(currentPage - 1))}
          disabled={!canGoPrevious || disabled}
          className={buttonBaseClass}
          aria-label={labels.previous}
          title={labels.previous}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {!compact && <span className="hidden sm:inline ml-1">{labels.previous}</span>}
        </button>

        {/* Page numbers */}
        {!compact && (
          <div className="hidden sm:flex items-center gap-1">
            {pages.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-muted-foreground"
                    aria-hidden="true"
                  >
                    ...
                  </span>
                )
              }

              const isActive = page === currentPage
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  onKeyDown={(e) => handleKeyDown(e, () => onPageChange(page))}
                  disabled={disabled}
                  className={isActive ? activeButtonClass : buttonBaseClass}
                  aria-label={`${labels.page} ${page}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            })}
          </div>
        )}

        {/* Compact page indicator */}
        {compact && (
          <span className="px-3 text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
        )}

        {/* Mobile page indicator */}
        {!compact && (
          <span className="sm:hidden px-3 text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
        )}

        {/* Next page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          onKeyDown={(e) => handleKeyDown(e, () => onPageChange(currentPage + 1))}
          disabled={!canGoNext || disabled}
          className={buttonBaseClass}
          aria-label={labels.next}
          title={labels.next}
        >
          {!compact && <span className="hidden sm:inline mr-1">{labels.next}</span>}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Last page */}
        {showFirstLast && !compact && (
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            onKeyDown={(e) => handleKeyDown(e, () => onPageChange(totalPages))}
            disabled={!canGoNext || disabled}
            className={buttonBaseClass}
            aria-label={labels.last}
            title={labels.last}
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Page size selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-muted-foreground hidden sm:block">
            {labels.perPage}:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={disabled}
            className={cn(
              'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  )
}

export default Pagination
