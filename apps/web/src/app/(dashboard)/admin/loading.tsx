'use client'

import { CardSkeleton, SkeletonLoader } from '@erp/ui'

/**
 * Loading state pour les pages admin
 * Automatiquement utilise par Next.js comme Suspense fallback
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLoader variant="text" width={200} height={28} />
          <SkeletonLoader variant="text" width={300} height={16} />
        </div>
        <div className="flex gap-2">
          <SkeletonLoader variant="rounded" width={100} height={36} />
          <SkeletonLoader variant="rounded" width={100} height={36} />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
