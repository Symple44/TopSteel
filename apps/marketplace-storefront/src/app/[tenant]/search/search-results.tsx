'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Grid, List, ChevronDown } from 'lucide-react'
import { ProductCard } from '@/components/product/product-card'
import { api } from '@/lib/api/storefront'
import { Product } from '@/lib/api/storefront'
import { cn } from '@/lib/utils'

interface SearchResultsProps {
  tenant: string
  query?: string
  category?: string
  sort?: string
  page?: string
}

export function SearchResults({ tenant, query, category, sort = 'relevance', page = '1' }: SearchResultsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState({
    category: category || '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
  })
  const [sortBy, setSortBy] = useState(sort)
  const [showFilters, setShowFilters] = useState(false)

  const currentPage = parseInt(page)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  useEffect(() => {
    loadResults()
  }, [tenant, query, category, sortBy, currentPage])

  const loadResults = async () => {
    setLoading(true)
    try {
      // Simulate API call
      const mockProducts: Product[] = [
        {
          id: '1',
          erpArticleId: 'ERP-001',
          reference: 'PROD-001',
          designation: 'Profilé acier inoxydable 304L',
          shortDescription: 'Profilé haute qualité pour applications industrielles',
          description: 'Profilé en acier inoxydable 304L de haute qualité, idéal pour les applications industrielles nécessitant une résistance à la corrosion.',
          basePrice: 125.00,
          calculatedPrice: 115.00,
          inStock: true,
          stockDisponible: 50,
          categories: ['Acier inoxydable', 'Profilés'],
          tags: ['304L', 'industriel', 'résistant'],
          images: [
            { url: '/placeholder-product.jpg', alt: 'Profilé acier', isMain: true }
          ],
          isActive: true,
          isFeatured: true,
          seo: {
            title: 'Profilé acier inoxydable 304L',
            description: 'Profilé haute qualité pour applications industrielles',
            slug: 'profile-acier-inoxydable-304l'
          }
        },
        // Add more mock products...
      ]

      // Filter products based on search query
      let filteredProducts = mockProducts
      if (query) {
        const searchTerm = query.toLowerCase()
        filteredProducts = mockProducts.filter(product =>
          product.designation.toLowerCase().includes(searchTerm) ||
          product.shortDescription?.toLowerCase().includes(searchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          product.categories.some(cat => cat.toLowerCase().includes(searchTerm))
        )
      }

      if (filters.category) {
        filteredProducts = filteredProducts.filter(product =>
          product.categories.includes(filters.category)
        )
      }

      if (filters.inStock) {
        filteredProducts = filteredProducts.filter(product => product.inStock)
      }

      if (filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice)
        filteredProducts = filteredProducts.filter(product =>
          (product.calculatedPrice || product.basePrice) >= minPrice
        )
      }

      if (filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice)
        filteredProducts = filteredProducts.filter(product =>
          (product.calculatedPrice || product.basePrice) <= maxPrice
        )
      }

      // Sort products
      switch (sortBy) {
        case 'price_asc':
          filteredProducts.sort((a, b) => 
            (a.calculatedPrice || a.basePrice) - (b.calculatedPrice || b.basePrice)
          )
          break
        case 'price_desc':
          filteredProducts.sort((a, b) => 
            (b.calculatedPrice || b.basePrice) - (a.calculatedPrice || a.basePrice)
          )
          break
        case 'name_asc':
          filteredProducts.sort((a, b) => a.designation.localeCompare(b.designation))
          break
        case 'name_desc':
          filteredProducts.sort((a, b) => b.designation.localeCompare(a.designation))
          break
        case 'newest':
          // Since Product doesn't have createdAt, use id for sorting
          filteredProducts.sort((a, b) => b.id.localeCompare(a.id))
          break
        default: // relevance
          // Keep original order for relevance
          break
      }

      setProducts(filteredProducts)
      setTotalResults(filteredProducts.length)
      setTotalPages(Math.ceil(filteredProducts.length / 12))

      // Extract unique categories
      const allCategories = Array.from(new Set(
        mockProducts.flatMap(product => product.categories)
      ))
      setCategories(allCategories)

    } catch (error) {
      console.error('Error loading search results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    loadResults()
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    // Update URL params
    const params = new URLSearchParams(window.location.search)
    params.set('sort', newSort)
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }

  if (loading) {
    return <SearchSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              {query ? `Résultats pour "${query}"` : 'Recherche'}
            </h1>
            <p className="text-muted-foreground">
              {totalResults} produit{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
              {category && ` dans "${category}"`}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded border',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded border',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtres
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              showFilters && 'rotate-180'
            )} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="input-marketplace text-sm"
            >
              <option value="relevance">Pertinence</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="name_asc">Nom A-Z</option>
              <option value="name_desc">Nom Z-A</option>
              <option value="newest">Plus récent</option>
            </select>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-muted/30 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange({...filters, category: e.target.value})}
                  className="input-marketplace w-full text-sm"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prix min.</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange({...filters, minPrice: e.target.value})}
                  className="input-marketplace w-full text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prix max.</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange({...filters, maxPrice: e.target.value})}
                  className="input-marketplace w-full text-sm"
                  placeholder="1000"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange({...filters, inStock: e.target.checked})}
                    className="rounded border-input"
                  />
                  <span className="text-sm">En stock uniquement</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {products.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Search className="w-16 h-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche ou parcourez nos catégories.
            </p>
          </div>
          <Link
            href={`/${tenant}/products`}
            className="btn-primary inline-flex items-center gap-2"
          >
            Voir tous les produits
          </Link>
        </div>
      ) : (
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        )}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tenant={tenant}
              variant={viewMode === 'list' ? 'list' : 'grid'}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/${tenant}/search?${new URLSearchParams({
                ...(query && { q: query }),
                ...(category && { category }),
                sort: sortBy,
                page: pageNum.toString(),
              })}`}
              className={cn(
                'px-3 py-2 rounded border text-sm',
                pageNum === currentPage
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted'
              )}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}
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
          <div key={i} className="h-10 bg-muted rounded w-24 flex-shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-4">
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