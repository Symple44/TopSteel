import { Suspense } from 'react'
import { SearchResults } from './search-results'

interface SearchPageProps {
  params: Promise<{
    tenant: string
  }>
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
    page?: string
  }>
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  return (
    <div className="container-marketplace py-8">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults
          tenant={resolvedParams.tenant}
          query={resolvedSearchParams.q}
          category={resolvedSearchParams.category}
          sort={resolvedSearchParams.sort}
          page={resolvedSearchParams.page}
        />
      </Suspense>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-4 bg-muted rounded w-48 animate-pulse" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`search-page-filter-skeleton-${Date.now()}-${i}`}
            className="h-10 bg-muted rounded w-24 flex-shrink-0 animate-pulse"
          />
        ))}
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`search-page-product-skeleton-${Date.now()}-${i}`}
            className="border rounded-lg p-4 space-y-4"
          >
            <div className="aspect-square bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
