'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../../../../primitives/button'
import { Select } from '../../../../primitives/select'
import { useDataTableContext } from '../../contexts/DataTableContext'
import { cn } from '../../../../../lib/utils'

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
  const {
    state,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    clearSelection,
  } = useDataTableContext()

  const { paginationInfo, selection, processedData, data } = state

  // Générer les numéros de page
  const getPageNumbers = () => {
    if (!paginationInfo) return []
    
    const { currentPage, totalPages } = paginationInfo
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Toujours afficher la première page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // Pages autour de la page courante
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // Toujours afficher la dernière page
      pages.push(totalPages)
    }
    
    return pages
  }

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3 border-t bg-background',
      className
    )}>
      {/* Infos de sélection et résumé */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {showSelection && selection.selectedRows.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {selection.selectedRows.size} sélectionné{selection.selectedRows.size > 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7 text-xs"
            >
              Désélectionner
            </Button>
          </div>
        )}
        
        {/* Résumé des données */}
        <div>
          {state.isFiltered ? (
            <span>
              {processedData.length} résultat{processedData.length > 1 ? 's' : ''} sur {data.length}
            </span>
          ) : paginationInfo ? (
            <span>
              {paginationInfo.startIndex} - {paginationInfo.endIndex} sur {paginationInfo.totalItems}
            </span>
          ) : (
            <span>
              {data.length} ligne{data.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Pagination */}
      {showPagination && paginationInfo && (
        <div className="flex items-center gap-2">
          {/* Sélecteur de taille de page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Lignes par page:</span>
            <Select
              value={String(paginationInfo.pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-1">
            {/* Première page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={paginationInfo.currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Page précédente */}
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={!paginationInfo.hasPrevPage}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Numéros de page */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      variant={page === paginationInfo.currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(page as number)}
                      className="h-8 min-w-[32px] px-2"
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Page suivante */}
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!paginationInfo.hasNextPage}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dernière page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(paginationInfo.totalPages)}
              disabled={paginationInfo.currentPage === paginationInfo.totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}