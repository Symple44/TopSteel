'use client'

import { Filter, Grid, List, Loader2, Package, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Pagination } from '../common/Pagination'
import { type Product, ProductCard } from '../products/ProductCard'
import { type ActiveFilter, SearchFilters } from './SearchFilters'

interface SearchResultsProps {
  query?: string
  initialFilters?: ActiveFilter[]
  className?: string
}

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'bestselling'
type ViewMode = 'grid' | 'list'

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Heavy Duty Steel Beam - 10m',
    slug: 'heavy-duty-steel-beam-10m',
    description: 'High-quality structural steel beam for construction',
    price: 249.99,
    originalPrice: 299.99,
    currency: 'EUR',
    images: ['/images/steel-beam.jpg'],
    category: 'Steel Beams',
    brand: 'ArcelorMittal',
    rating: 4.5,
    reviewCount: 128,
    stockQuantity: 45,
    // badges: ['Sale', 'Best Seller'],
    // specifications: {
    //   length: '10m',
    //   weight: '150kg',
    //   grade: 'S355',
    // },
  },
  {
    id: '2',
    name: 'Professional Welding Machine',
    slug: 'professional-welding-machine',
    description: 'Industrial grade MIG/TIG welding equipment',
    price: 1899.0,
    currency: 'EUR',
    images: ['/images/welding-machine.jpg'],
    category: 'Welding Equipment',
    brand: 'Lincoln Electric',
    rating: 4.8,
    reviewCount: 89,
    stockQuantity: 12,
    // badges: ['New'],
    // specifications: {
    //   power: '250A',
    //   voltage: '220V',
    //   weight: '45kg',
    // },
  },
  {
    id: '3',
    name: 'Galvanized Steel Sheet - 2mm',
    slug: 'galvanized-steel-sheet-2mm',
    description: 'Corrosion-resistant steel sheet for various applications',
    price: 89.99,
    currency: 'EUR',
    images: ['/images/steel-sheet.jpg'],
    category: 'Metal Sheets',
    brand: 'Tata Steel',
    rating: 4.2,
    reviewCount: 56,
    stockQuantity: 200,
    // specifications: {
    //   thickness: '2mm',
    //   size: '2m x 1m',
    //   coating: 'Zinc',
    // },
  },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'bestselling', label: 'Best Selling' },
]

export const SearchResults: React.FC<SearchResultsProps> = ({
  query = '',
  initialFilters = [],
  className,
}) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(initialFilters)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(10)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 24

  const loadProducts = useCallback(async () => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Apply filters and sorting to mock data
      const filtered = [...mockProducts]

      // Apply sorting
      switch (sortBy) {
        case 'price-asc':
          filtered?.sort((a, b) => a.price - b.price)
          break
        case 'price-desc':
          filtered?.sort((a, b) => b.price - a.price)
          break
        case 'rating':
          filtered?.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          break
        // Add more sorting logic as needed
      }

      // Duplicate products to simulate pagination
      const allProducts = Array(10).fill(filtered).flat()
      setProducts(allProducts?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
      setTotalResults(allProducts?.length)
      setTotalPages(Math.ceil(allProducts.length / itemsPerPage))
    } catch (_error) {
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, currentPage])

  // Simulate loading products
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters)
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setActiveFilters([])
    setCurrentPage(1)
  }

  const handleAddToCart = (_product: Product) => {}

  const handleAddToWishlist = (_product: Product) => {}

  const handleQuickView = (_product: Product) => {}

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Search results for "{query}"</h1>
            <p className="text-gray-600 mt-1">{totalResults} products found</p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <SearchFilters
                filters={[]}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearAll={clearAllFilters}
                productCount={totalResults}
                className="rounded-lg shadow-sm border border-gray-200"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded',
                      viewMode === 'grid'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded',
                      viewMode === 'list'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e?.target?.value as SortOption)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOptions?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}

            {/* No Results */}
            {!isLoading && products.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                {activeFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Product Grid/List */}
            {!isLoading && products.length > 0 && (
              <>
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'space-y-4'
                  )}
                >
                  {products?.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={viewMode}
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={handleAddToWishlist}
                      onQuickView={handleQuickView}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileFilters(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setShowMobileFilters(false)
              }
            }}
            aria-label="Close filters"
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto h-full pb-20">
              <SearchFilters
                filters={[]}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearAll={clearAllFilters}
                productCount={totalResults}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
