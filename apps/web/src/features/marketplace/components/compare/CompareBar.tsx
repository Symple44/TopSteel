'use client'

import { ChevronDown, ChevronUp, Layers, Package, Trash2, X } from 'lucide-react'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { cn } from '@/lib/utils'
import {
  clearCompare,
  removeFromCompare,
  selectCompareProducts,
  selectIsCompareOpen,
  selectMaxCompareProducts,
  setCompareOpen,
} from '../../store/compareSlice'

interface CompareBarProps {
  onViewComparison?: () => void
  className?: string
}

export const CompareBar: React.FC<CompareBarProps> = ({ onViewComparison, className }) => {
  const dispatch = useDispatch()
  const products = useSelector(selectCompareProducts)
  const _isOpen = useSelector(selectIsCompareOpen)
  const maxProducts = useSelector(selectMaxCompareProducts)
  const [isMinimized, setIsMinimized] = React.useState(false)

  if (products?.length === 0) return null

  const handleRemoveProduct = (productId: string) => {
    dispatch(removeFromCompare(productId))
  }

  const handleClearAll = () => {
    dispatch(clearCompare())
  }

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleViewComparison = () => {
    if (products?.length >= 2) {
      dispatch(setCompareOpen(true))
      onViewComparison?.()
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300',
        isMinimized && 'translate-y-[calc(100%-60px)]',
        className
      )}
    >
      <div className="bg-white border-t border-gray-200 shadow-lg">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-900 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5" />
              <span className="font-medium">
                Compare Products ({products?.length}/{maxProducts})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {products?.length >= 2 && (
                <button
                  onClick={handleViewComparison}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Compare Now
                </button>
              )}

              <button
                onClick={handleClearAll}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleMinimize}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        {!isMinimized && (
          <div className="p-4">
            <div className="flex gap-4 overflow-x-auto">
              {products?.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-48 bg-gray-50 rounded-lg p-3 relative group"
                >
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="w-3 h-3 text-gray-500 hover:text-red-600" />
                  </button>

                  <div className="flex gap-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                      <p className="text-xs text-gray-600">{product.brand}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        €{product?.price?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add more products slot */}
              {products?.length < maxProducts && (
                <div className="flex-shrink-0 w-48 border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center">
                  <div className="text-center">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">
                      Add {maxProducts - products?.length} more
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Hint */}
            {products?.length === 1 && (
              <p className="text-sm text-gray-600 mt-3 text-center">
                Add at least one more product to compare
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
