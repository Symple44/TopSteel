'use client'

import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface PriceRange {
  min: number
  max: number
}

interface ProductFiltersProps {
  categories?: FilterOption[]
  brands?: FilterOption[]
  onFilterChange?: (filters: {
    categories: string[]
    brands: string[]
    priceRange: PriceRange
    rating: number | null
    inStock: boolean
    onSale: boolean
    tags: string[]
  }) => void
  className?: string
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories = [],
  brands = [],
  onFilterChange,
  className,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['category', 'price', 'brand'])
  )
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 1000 })
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [inStock, setInStock] = useState(false)
  const [onSale, setOnSale] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  // Sample data - replace with actual data
  const sampleCategories: FilterOption[] =
    categories.length > 0
      ? categories
      : [
          { value: 'steel-products', label: 'Steel Products', count: 245 },
          { value: 'tools', label: 'Tools & Equipment', count: 189 },
          { value: 'fasteners', label: 'Fasteners', count: 156 },
          { value: 'safety', label: 'Safety Equipment', count: 98 },
          { value: 'welding', label: 'Welding Supplies', count: 76 },
          { value: 'construction', label: 'Construction Materials', count: 134 },
        ]

  const sampleBrands: FilterOption[] =
    brands.length > 0
      ? brands
      : [
          { value: 'topsteel', label: 'TopSteel', count: 89 },
          { value: 'steelmax', label: 'SteelMax', count: 67 },
          { value: 'protools', label: 'ProTools', count: 54 },
          { value: 'safeguard', label: 'SafeGuard', count: 43 },
          { value: 'weldpro', label: 'WeldPro', count: 38 },
        ]

  const popularTags = [
    'Industrial',
    'Heavy Duty',
    'Premium',
    'Eco-Friendly',
    'Certified',
    'Professional',
    'Bulk Available',
  ]

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleCategoryChange = (category: string) => {
    const newCategories = new Set(selectedCategories)
    if (newCategories.has(category)) {
      newCategories.delete(category)
    } else {
      newCategories.add(category)
    }
    setSelectedCategories(newCategories)
    applyFilters({ categories: newCategories })
  }

  const handleBrandChange = (brand: string) => {
    const newBrands = new Set(selectedBrands)
    if (newBrands.has(brand)) {
      newBrands.delete(brand)
    } else {
      newBrands.add(brand)
    }
    setSelectedBrands(newBrands)
    applyFilters({ brands: newBrands })
  }

  const handlePriceChange = () => {
    const min = parseFloat(minPrice) || 0
    const max = parseFloat(maxPrice) || 1000
    setPriceRange({ min, max })
    applyFilters({ priceRange: { min, max } })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(selectedTags)
    if (newTags.has(tag)) {
      newTags.delete(tag)
    } else {
      newTags.add(tag)
    }
    setSelectedTags(newTags)
    applyFilters({ tags: newTags })
  }

  const applyFilters = (updates: any = {}) => {
    onFilterChange?.({
      categories: Array.from(updates.categories || selectedCategories),
      brands: Array.from(updates.brands || selectedBrands),
      priceRange: updates.priceRange || priceRange,
      rating: updates.rating !== undefined ? updates.rating : selectedRating,
      inStock: updates.inStock !== undefined ? updates.inStock : inStock,
      onSale: updates.onSale !== undefined ? updates.onSale : onSale,
      tags: Array.from(updates.tags || selectedTags),
    })
  }

  const clearAllFilters = () => {
    setSelectedCategories(new Set())
    setSelectedBrands(new Set())
    setPriceRange({ min: 0, max: 1000 })
    setMinPrice('')
    setMaxPrice('')
    setSelectedRating(null)
    setInStock(false)
    setOnSale(false)
    setSelectedTags(new Set())

    onFilterChange?.({
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
      rating: null,
      inStock: false,
      onSale: false,
      tags: [],
    })
  }

  const hasActiveFilters =
    selectedCategories.size > 0 ||
    selectedBrands.size > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    selectedRating !== null ||
    inStock ||
    onSale ||
    selectedTags.size > 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-sm text-blue-600 hover:text-blue-700">
            Clear all
          </button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Array.from(selectedCategories).map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
            >
              {sampleCategories.find((c) => c.value === cat)?.label}
              <button onClick={() => handleCategoryChange(cat)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {Array.from(selectedBrands).map((brand) => (
            <span
              key={brand}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
            >
              {sampleBrands.find((b) => b.value === brand)?.label}
              <button onClick={() => handleBrandChange(brand)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Categories</span>
          {expandedSections.has('category') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.has('category') && (
          <div className="mt-3 space-y-2">
            {sampleCategories.map((category) => (
              <label key={category.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.has(category.value)}
                  onChange={() => handleCategoryChange(category.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{category.label}</span>
                {category.count !== undefined && (
                  <span className="text-xs text-gray-500">({category.count})</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Price Range</span>
          {expandedSections.has('price') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.has('price') && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handlePriceChange}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Brands */}
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection('brand')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Brands</span>
          {expandedSections.has('brand') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.has('brand') && (
          <div className="mt-3 space-y-2">
            {sampleBrands.map((brand) => (
              <label key={brand.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.has(brand.value)}
                  onChange={() => handleBrandChange(brand.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{brand.label}</span>
                {brand.count !== undefined && (
                  <span className="text-xs text-gray-500">({brand.count})</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Customer Rating</span>
          {expandedSections.has('rating') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.has('rating') && (
          <div className="mt-3 space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === rating}
                  onChange={() => {
                    setSelectedRating(rating)
                    applyFilters({ rating })
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700">{rating}+ stars</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        )}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection('availability')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Availability</span>
          {expandedSections.has('availability') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.has('availability') && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked)
                  applyFilters({ inStock: e.target.checked })
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onSale}
                onChange={(e) => {
                  setOnSale(e.target.checked)
                  applyFilters({ onSale: e.target.checked })
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">On Sale</span>
            </label>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <button
          onClick={() => toggleSection('tags')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Tags</span>
          {expandedSections.has('tags') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.has('tags') && (
          <div className="mt-3 flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={cn(
                  'px-3 py-1 text-sm rounded-full border transition-colors',
                  selectedTags.has(tag)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
