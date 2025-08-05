'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Grid, List, SortAsc } from 'lucide-react'
import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getProducts, type ProductFilters } from '@/lib/api/storefront'
import { cn } from '@/lib/utils'
import { ProductCard } from './product-card'

interface ProductsGridProps {
  tenant: string
  searchParams: { [key: string]: string | string[] | undefined }
}

export function ProductsGrid({ tenant, searchParams }: ProductsGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Construire les filtres depuis les searchParams
  const filters: ProductFilters = {
    search: typeof searchParams.search === 'string' ? searchParams.search : undefined,
    category: typeof searchParams.category === 'string' ? searchParams.category : undefined,
    tags: typeof searchParams.tags === 'string' ? searchParams.tags.split(',') : undefined,
    minPrice:
      typeof searchParams.minPrice === 'string' ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice:
      typeof searchParams.maxPrice === 'string' ? parseFloat(searchParams.maxPrice) : undefined,
    inStock: searchParams.inStock === 'true',
    featured: searchParams.featured === 'true',
    page: currentPage,
    limit: itemsPerPage,
    sortBy: sortBy as any,
    sortOrder,
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', tenant, filters],
    queryFn: () => getProducts(tenant, filters),
  })

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(newSortBy)
      setSortOrder('ASC')
    }
    setCurrentPage(1)
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Erreur lors du chargement des produits. Veuillez réessayer.
        </p>
      </div>
    )
  }

  if (!data?.products.length) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Grid className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Aucun produit trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos critères de recherche ou de navigation.
          </p>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(data.total / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {data.total} produit{data.total > 1 ? 's' : ''} trouvé{data.total > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trier par:</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleSortChange('name')}
                className={cn(
                  'px-3 py-1 text-sm rounded transition-colors',
                  sortBy === 'name'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                Nom {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('price')}
                className={cn(
                  'px-3 py-1 text-sm rounded transition-colors',
                  sortBy === 'price'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                Prix {sortBy === 'price' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border rounded">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div
        className={cn(
          'grid gap-6',
          viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}
      >
        {data.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tenant={tenant}
            className={viewMode === 'list' ? 'flex flex-row' : ''}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'px-3 py-2 text-sm rounded transition-colors',
                    currentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  {page}
                </button>
              )
            })}

            {totalPages > 5 && (
              <>
                <span className="px-2 py-2 text-sm">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    'px-3 py-2 text-sm rounded transition-colors',
                    currentPage === totalPages
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Load More Button (Alternative to pagination) */}
      {data.hasMore && (
        <div className="text-center pt-8">
          <button onClick={() => setCurrentPage(currentPage + 1)} className="btn-outline px-6 py-2">
            Voir plus de produits
          </button>
        </div>
      )}
    </div>
  )
}
