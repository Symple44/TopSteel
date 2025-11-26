'use client'

import { SkeletonLoader, TableSkeleton } from '@erp/ui'

/**
 * Loading state pour la page utilisateurs
 * Affiche un skeleton de table pendant le chargement
 */
export default function UsersLoading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLoader variant="text" width={180} height={28} />
          <SkeletonLoader variant="text" width={280} height={16} />
        </div>
        <SkeletonLoader variant="rounded" width={140} height={36} />
      </div>

      {/* Table skeleton */}
      <TableSkeleton rows={8} columns={5} showToolbar showPagination />
    </div>
  )
}
