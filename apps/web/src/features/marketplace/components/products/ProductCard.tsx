'use client'

import { Eye, Heart, Package, ShoppingCart, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type React from 'react'
import { cn } from '@/lib/utils'

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  originalPrice?: number
  currency: string
  images: string[]
  category: string
  subcategory?: string
  brand?: string
  rating?: number
  reviewCount?: number
  stockQuantity: number
  isNew?: boolean
  isFeatured?: boolean
  discount?: number
  tags?: string[]
}

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list' | 'compact'
  showQuickView?: boolean
  showWishlist?: boolean
  showAddToCart?: boolean
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  onQuickView?: (product: Product) => void
  className?: string
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  showQuickView = true,
  showWishlist = true,
  showAddToCart = true,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  className,
}) => {
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: product.currency || 'EUR',
    }).format(price)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product)
    }
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onAddToWishlist) {
      onAddToWishlist(product)
    }
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onQuickView) {
      onQuickView(product)
    }
  }

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'group flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow',
          className
        )}
      >
        {/* Image */}
        <Link href={`/marketplace/products/${product.slug}`} className="relative flex-shrink-0">
          <div className="relative w-48 h-48 overflow-hidden rounded-lg">
            <Image
              src={product.images[0] || '/placeholder-product.jpg'}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.isNew && (
              <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
                NEW
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                -{discountPercentage}%
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <Link href={`/marketplace/products/${product.slug}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
            </Link>

            {product.brand && <p className="text-sm text-gray-500 mt-1">by {product.brand}</p>}

            {product.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
            )}

            {/* Rating */}
            {product.rating !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < Math.floor(product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.reviewCount || 0})</span>
              </div>
            )}

            {/* Stock Status */}
            <div className="mt-2">
              {isOutOfStock ? (
                <span className="text-sm text-red-600 font-medium">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-sm text-orange-600 font-medium">
                  Only {product.stockQuantity} left
                </span>
              ) : (
                <span className="text-sm text-green-600 font-medium">In Stock</span>
              )}
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex items-end justify-between mt-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {showWishlist && (
                <button
                  onClick={handleAddToWishlist}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Add to wishlist"
                >
                  <Heart className="w-5 h-5" />
                </button>
              )}
              {showQuickView && (
                <button
                  onClick={handleQuickView}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Quick view"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
              {showAddToCart && (
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid variant (default)
  return (
    <div
      className={cn(
        'group relative bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden',
        className
      )}
    >
      {/* Image */}
      <Link href={`/marketplace/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
                NEW
              </span>
            )}
            {product.isFeatured && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded">
                FEATURED
              </span>
            )}
          </div>

          {discountPercentage > 0 && (
            <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
              -{discountPercentage}%
            </span>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {showWishlist && (
              <button
                onClick={handleAddToWishlist}
                className="p-2 bg-white rounded-full text-gray-700 hover:text-red-500 transition-colors"
                title="Add to wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>
            )}
            {showQuickView && (
              <button
                onClick={handleQuickView}
                className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-500 transition-colors"
                title="Quick view"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            {showAddToCart && !isOutOfStock && (
              <button
                onClick={handleAddToCart}
                className="p-2 bg-white rounded-full text-gray-700 hover:text-green-500 transition-colors"
                title="Add to cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</p>

        {/* Name */}
        <Link href={`/marketplace/products/${product.slug}`}>
          <h3 className="mt-1 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Brand */}
        {product.brand && <p className="text-sm text-gray-500 mt-1">{product.brand}</p>}

        {/* Rating */}
        {product.rating !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < Math.floor(product.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-2 flex items-center gap-1">
          <Package className="w-3 h-3 text-gray-400" />
          {isOutOfStock ? (
            <span className="text-xs text-red-600 font-medium">Out of Stock</span>
          ) : isLowStock ? (
            <span className="text-xs text-orange-600 font-medium">
              Only {product.stockQuantity} left
            </span>
          ) : (
            <span className="text-xs text-green-600 font-medium">In Stock</span>
          )}
        </div>

        {/* Add to Cart Button (Mobile Friendly) */}
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              'w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 md:hidden',
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  )
}
