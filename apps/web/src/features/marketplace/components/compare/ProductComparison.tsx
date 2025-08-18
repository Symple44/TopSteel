'use client'

import { Check, Package, Plus, Star, X } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Product } from '../products/ProductCard'

interface ProductComparisonProps {
  products: Product[]
  onRemoveProduct: (productId: string) => void
  onAddProduct?: () => void
  onClearAll?: () => void
  maxProducts?: number
  className?: string
}

interface ComparisonRow {
  label: string
  key: string
  type: 'text' | 'price' | 'rating' | 'boolean' | 'list'
  category?: string
}

const comparisonRows: ComparisonRow[] = [
  // Basic Info
  { label: 'Price', key: 'price', type: 'price', category: 'Basic' },
  { label: 'Original Price', key: 'originalPrice', type: 'price', category: 'Basic' },
  { label: 'Rating', key: 'rating', type: 'rating', category: 'Basic' },
  { label: 'Reviews', key: 'reviewCount', type: 'text', category: 'Basic' },
  { label: 'Brand', key: 'brand', type: 'text', category: 'Basic' },
  { label: 'Category', key: 'category', type: 'text', category: 'Basic' },
  { label: 'Stock', key: 'stock', type: 'text', category: 'Availability' },

  // Specifications
  { label: 'Length', key: 'specifications.length', type: 'text', category: 'Specifications' },
  { label: 'Weight', key: 'specifications.weight', type: 'text', category: 'Specifications' },
  { label: 'Grade', key: 'specifications.grade', type: 'text', category: 'Specifications' },
  { label: 'Power', key: 'specifications.power', type: 'text', category: 'Specifications' },
  { label: 'Voltage', key: 'specifications.voltage', type: 'text', category: 'Specifications' },
  { label: 'Thickness', key: 'specifications.thickness', type: 'text', category: 'Specifications' },
  { label: 'Size', key: 'specifications.size', type: 'text', category: 'Specifications' },
  { label: 'Coating', key: 'specifications.coating', type: 'text', category: 'Specifications' },

  // Features
  { label: 'Warranty', key: 'warranty', type: 'text', category: 'Features' },
  { label: 'Free Shipping', key: 'freeShipping', type: 'boolean', category: 'Features' },
  { label: 'Express Delivery', key: 'expressDelivery', type: 'boolean', category: 'Features' },
  { label: 'Returns', key: 'returnsAllowed', type: 'boolean', category: 'Features' },
]

export const ProductComparison: React.FC<ProductComparisonProps> = ({
  products,
  onRemoveProduct,
  onAddProduct,
  onClearAll,
  maxProducts = 4,
  className,
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    'all',
    ...Array.from(new Set(comparisonRows.map((r) => r.category).filter(Boolean))),
  ]

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const formatValue = (value: any, type: string): React.ReactNode => {
    if (value === undefined || value === null) {
      return <span className="text-gray-400">—</span>
    }

    switch (type) {
      case 'price':
        return <span className="font-semibold text-lg">€{value.toFixed(2)}</span>

      case 'rating':
        return (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-medium">{value}</span>
          </div>
        )

      case 'boolean':
        return value ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <X className="w-5 h-5 text-red-600" />
        )

      case 'list':
        return Array.isArray(value) ? (
          <ul className="text-sm space-y-1">
            {value.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        ) : (
          value
        )

      default:
        return <span>{value}</span>
    }
  }

  const areValuesDifferent = (row: ComparisonRow): boolean => {
    if (products.length < 2) return false

    const values = products.map((p) => getNestedValue(p, row.key))
    const firstValue = JSON.stringify(values[0])

    return values.some((v) => JSON.stringify(v) !== firstValue)
  }

  const getBestValue = (row: ComparisonRow): any => {
    const values = products
      .map((p) => getNestedValue(p, row.key))
      .filter((v) => v !== undefined && v !== null)

    if (values.length === 0) return null

    switch (row.type) {
      case 'price':
        return Math.min(...values)
      case 'rating':
        return Math.max(...values)
      case 'boolean':
        return true
      default:
        return null
    }
  }

  const filteredRows =
    selectedCategory === 'all'
      ? comparisonRows
      : comparisonRows.filter((r) => r.category === selectedCategory)

  const emptySlots = Math.max(0, maxProducts - products.length)

  return (
    <div className={cn('bg-white rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Comparison</h2>
            <p className="text-gray-600 mt-1">Compare up to {maxProducts} products side by side</p>
          </div>
          {products.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={highlightDifferences}
              onChange={(e) => setHighlightDifferences(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Highlight differences</span>
          </label>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Product Headers */}
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4 text-left text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                Feature
              </th>
              {products.map((product) => (
                <th key={product.id} className="p-4 text-center min-w-[200px]">
                  <div className="relative">
                    <button
                      onClick={() => onRemoveProduct(product.id)}
                      className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full hover:bg-red-50 hover:border-red-300"
                    >
                      <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                    </button>

                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-600">{product.brand}</p>
                  </div>
                </th>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: emptySlots }).map((_, index) => (
                <th key={`empty-${index}`} className="p-4 text-center min-w-[200px]">
                  <button
                    onClick={onAddProduct}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg mx-auto mb-3 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-8 h-8 text-gray-400" />
                  </button>
                  <p className="text-sm text-gray-500">Add Product</p>
                </th>
              ))}
            </tr>
          </thead>

          {/* Comparison Rows */}
          <tbody>
            {filteredRows.map((row, rowIndex) => {
              const isDifferent = highlightDifferences && areValuesDifferent(row)
              const bestValue = getBestValue(row)

              return (
                <tr
                  key={row.key}
                  className={cn(
                    'border-b border-gray-200',
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  )}
                >
                  <td className="p-4 text-sm font-medium text-gray-700 sticky left-0 z-10 bg-inherit">
                    {row.label}
                  </td>

                  {products.map((product) => {
                    const value = getNestedValue(product, row.key)
                    const isBest =
                      bestValue !== null && JSON.stringify(value) === JSON.stringify(bestValue)

                    return (
                      <td
                        key={product.id}
                        className={cn(
                          'p-4 text-center text-sm',
                          isDifferent && 'bg-yellow-50',
                          isBest && 'font-semibold text-green-700'
                        )}
                      >
                        {formatValue(value, row.type)}
                        {isBest && row.type === 'price' && (
                          <span className="block text-xs text-green-600 mt-1">Best Price</span>
                        )}
                      </td>
                    )
                  })}

                  {/* Empty Slots */}
                  {Array.from({ length: emptySlots }).map((_, index) => (
                    <td key={`empty-${index}`} className="p-4 text-center">
                      <span className="text-gray-300">—</span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>

          {/* Action Row */}
          <tfoot>
            <tr className="bg-gray-50">
              <td className="p-4 text-sm font-medium text-gray-700 sticky left-0 z-10 bg-gray-50">
                Actions
              </td>
              {products.map((product) => (
                <td key={product.id} className="p-4 text-center">
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      Add to Cart
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                      View Details
                    </button>
                  </div>
                </td>
              ))}
              {Array.from({ length: emptySlots }).map((_, index) => (
                <td key={`empty-${index}`} className="p-4" />
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      {highlightDifferences && products.length > 1 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded" />
              <span className="text-gray-600">Different values</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-700">Green</span>
              <span className="text-gray-600">Best value</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
