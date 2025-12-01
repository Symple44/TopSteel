'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import React from 'react'
import { cn } from '../../../../../lib/utils'
import { Button } from '../../../../primitives/button'
import { Select } from '../../../../primitives/select'
import { useDataTableContext } from '../../contexts/DataTableContext'

export interface DataTableFooterProps {
  showPagination?: boolean
  showSelection?: boolean
  pageSizeOptions?: number[]
  className?: string
}

/**
 * Pied de page du DataTable avec pagination et résumé
 */
export function DataTableFooter({
  showPagination = true,
  showSelection = true,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: DataTableFooterProps) {
  const { state, goToPage, nextPage, prevPage, setPageSize, clearSelection } = useDataTableContext()

  const { paginationInfo, selection, processedData, data } = state

  // Générer les numéros de page (version simplifiée)
  const getPageNumbers = () => {
    if (!paginationInfo) return []

    const { currentPage, totalPages } = paginationInfo
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2.5 border-t border-border/40 bg-muted/5 text-sm',
        className
      )}
    >
      {/* Infos de sélection et résumé */}
      <div className="flex items-center gap-3 text-muted-foreground">
        {/* Sélection */}
        {showSelection && selection.selectedRows.size > 0 ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary">
            <span className="font-medium">
              {selection.selectedRows.size} sélectionné{selection.selectedRows.size > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="flex items-center justify-center h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
              aria-label="Désélectionner"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          /* Résumé des données */
          <span>
            {paginationInfo ? (
              <>
                <span className="font-medium text-foreground">{paginationInfo.startIndex}-{paginationInfo.endIndex}</span>
                <span> sur </span>
                <span className="font-medium text-foreground">{paginationInfo.totalItems}</span>
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">{data.length}</span>
                <span> ligne{data.length > 1 ? 's' : ''}</span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Pagination */}
      {showPagination && paginationInfo && (
        <div className="flex items-center gap-4">
          {/* Sélecteur de taille de page */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="hidden sm:inline">Lignes:</span>
            <Select
              value={String(paginationInfo.pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {/* Première page */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={paginationInfo.currentPage === 1}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Première page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Page précédente */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={prevPage}
              disabled={!paginationInfo.hasPrevPage}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Numéros de page */}
            <div className="flex items-center">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-1.5 text-muted-foreground/50">•••</span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => goToPage(page as number)}
                      className={cn(
                        'h-8 min-w-[32px] px-2 font-medium',
                        page === paginationInfo.currentPage
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Page suivante */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={!paginationInfo.hasNextPage}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dernière page */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => goToPage(paginationInfo.totalPages)}
              disabled={paginationInfo.currentPage === paginationInfo.totalPages}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Dernière page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
