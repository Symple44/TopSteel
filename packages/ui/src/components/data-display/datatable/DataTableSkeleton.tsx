'use client'

import { cn } from '../../../lib/utils'

interface DataTableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function DataTableSkeleton({ rows = 5, columns = 4, className }: DataTableSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Skeleton pour la barre d'outils */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          {/* Search skeleton */}
          <div className="h-9 w-64 bg-gray-200 rounded-md animate-pulse" />
          {/* Action button skeleton */}
          <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          {/* Export button skeleton */}
          <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse" />
          {/* Columns button skeleton */}
          <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Skeleton pour le tableau */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50">
          {/* Header skeleton */}
          <div className="flex">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 p-3 border-r last:border-r-0">
                <div className="h-4 bg-gray-300 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Rows skeleton */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex border-t">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 p-3 border-r last:border-r-0">
                <div
                  className="h-4 bg-gray-200 rounded animate-pulse"
                  style={{
                    width: `${Math.random() * 40 + 60}%`,
                    animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Skeleton pour la pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default DataTableSkeleton
