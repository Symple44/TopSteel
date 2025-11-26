'use client'

import { cn } from '../../../lib/utils'
import { SkeletonLoader } from './SkeletonLoader'

export interface TableSkeletonProps {
  /** Nombre de lignes a afficher */
  rows?: number
  /** Nombre de colonnes */
  columns?: number
  /** Afficher le header */
  showHeader?: boolean
  /** Afficher la toolbar (recherche, boutons) */
  showToolbar?: boolean
  /** Afficher la pagination */
  showPagination?: boolean
  /** Classes CSS additionnelles */
  className?: string
}

/**
 * Composant TableSkeleton pour afficher un placeholder de table pendant le chargement
 * Correspond au design du DataTable de l'application
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  showToolbar = true,
  showPagination = true,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn('w-full space-y-4', className)}
      role="status"
      aria-busy="true"
      aria-label="Chargement du tableau"
    >
      {/* Toolbar skeleton */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-4">
          <SkeletonLoader variant="rounded" width={240} height={36} />
          <div className="flex gap-2">
            <SkeletonLoader variant="rounded" width={100} height={36} />
            <SkeletonLoader variant="rounded" width={100} height={36} />
          </div>
        </div>
      )}

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          {/* Header */}
          {showHeader && (
            <thead className="bg-muted/50">
              <tr>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <th key={colIndex} className="px-4 py-3 text-left">
                    <SkeletonLoader
                      variant="text"
                      width={colIndex === 0 ? '40%' : '60%'}
                      height={16}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Body */}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-t border-border',
                  rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
                style={{
                  animationDelay: `${rowIndex * 50}ms`,
                }}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <SkeletonLoader
                      variant="text"
                      width={getColumnWidth(colIndex, columns)}
                      height={14}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <SkeletonLoader variant="text" width={150} height={14} />
          <div className="flex gap-2">
            <SkeletonLoader variant="rounded" width={32} height={32} />
            <SkeletonLoader variant="rounded" width={32} height={32} />
            <SkeletonLoader variant="rounded" width={32} height={32} />
          </div>
        </div>
      )}

      <span className="sr-only">Chargement du tableau en cours...</span>
    </div>
  )
}

/**
 * Retourne une largeur variee pour simuler des donnees reelles
 */
function getColumnWidth(colIndex: number, totalColumns: number): string {
  const widths = ['70%', '85%', '60%', '90%', '75%', '80%']
  return widths[colIndex % widths.length]
}

export default TableSkeleton
