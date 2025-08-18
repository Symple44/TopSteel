'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import type React from 'react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
  className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 7,
  className,
}) => {
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const halfVisible = Math.floor(maxVisiblePages / 2)
    const pages: (number | string)[] = []

    // Always show first page
    pages.push(1)

    // Calculate start and end of visible pages
    let start = Math.max(2, currentPage - halfVisible + 1)
    let end = Math.min(totalPages - 1, currentPage + halfVisible - 1)

    // Adjust if we're near the beginning
    if (currentPage <= halfVisible) {
      end = Math.min(totalPages - 1, maxVisiblePages - 2)
    }

    // Adjust if we're near the end
    if (currentPage > totalPages - halfVisible) {
      start = Math.max(2, totalPages - maxVisiblePages + 2)
    }

    // Add ellipsis if needed at the beginning
    if (start > 2) {
      pages.push('...')
    }

    // Add visible page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis if needed at the end
    if (end < totalPages - 1) {
      pages.push('...')
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers()

  return (
    <nav className={cn('flex items-center justify-center', className)}>
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={cn(
                  'min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
