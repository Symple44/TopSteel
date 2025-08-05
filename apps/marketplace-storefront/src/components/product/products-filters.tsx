'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Filter, Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { getCategories } from '@/lib/api/storefront'
import { cn } from '@/lib/utils'

interface ProductsFiltersProps {
  tenant: string
}

export function ProductsFilters({ tenant }: ProductsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true')
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === 'true')
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories', tenant],
    queryFn: () => getCategories(tenant),
  })

  const updateFilters = (updates: Record<string, string | boolean | null>) => {
    const current = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        current.delete(key)
      } else {
        current.set(key, String(value))
      }
    })

    router.push(`?${current.toString()}`)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setFeaturedOnly(false)
    router.push(window.location.pathname)
  }

  const hasActiveFilters =
    searchQuery || selectedCategory || minPrice || maxPrice || inStockOnly || featuredOnly

  return (
    <div className="space-y-6">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 border rounded-lg"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Actifs
              </span>
            )}
          </span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
        </button>
      </div>

      <div
        className={cn(
          'space-y-6',
          'lg:block', // Always visible on desktop
          isExpanded ? 'block' : 'hidden' // Toggle on mobile
        )}
      >
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateFilters({ search: searchQuery })
                }
              }}
              className="input-marketplace pl-10 w-full"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                updateFilters({ search: null })
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Effacer la recherche
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Catégories</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedCategory('')
                updateFilters({ category: null })
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded transition-colors',
                selectedCategory ? 'hover:bg-muted' : 'bg-primary text-primary-foreground'
              )}
            >
              Toutes les catégories
            </button>

            {categories?.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  updateFilters({ category })
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded transition-colors',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fourchette de prix</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Prix min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={() => updateFilters({ minPrice: minPrice || null })}
                className="input-marketplace w-full"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Prix max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => updateFilters({ maxPrice: maxPrice || null })}
                className="input-marketplace w-full"
              />
            </div>
          </div>

          {/* Quick Price Filters */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => {
                setMinPrice('0')
                setMaxPrice('100')
                updateFilters({ minPrice: '0', maxPrice: '100' })
              }}
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded"
            >
              Moins de 100€
            </button>
            <button
              onClick={() => {
                setMinPrice('100')
                setMaxPrice('500')
                updateFilters({ minPrice: '100', maxPrice: '500' })
              }}
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded"
            >
              100€ - 500€
            </button>
            <button
              onClick={() => {
                setMinPrice('500')
                setMaxPrice('')
                updateFilters({ minPrice: '500', maxPrice: null })
              }}
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded"
            >
              Plus de 500€
            </button>
            <button
              onClick={() => {
                setMinPrice('')
                setMaxPrice('')
                updateFilters({ minPrice: null, maxPrice: null })
              }}
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded"
            >
              Tous les prix
            </button>
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Disponibilité</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked)
                  updateFilters({ inStock: e.target.checked })
                }}
                className="rounded"
              />
              <span className="text-sm">En stock uniquement</span>
            </label>
          </div>
        </div>

        {/* Featured */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sélection</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => {
                  setFeaturedOnly(e.target.checked)
                  updateFilters({ featured: e.target.checked })
                }}
                className="rounded"
              />
              <span className="text-sm">Produits vedettes</span>
            </label>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <button
              onClick={clearAllFilters}
              className="w-full btn-outline py-2 text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Effacer tous les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
