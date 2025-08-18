'use client'

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  ZoomIn,
} from 'lucide-react'
import Image from 'next/image'
import type React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Product } from './ProductCard'

interface ProductDetailProps {
  product: Product & {
    longDescription?: string
    specifications?: Record<string, any>
    features?: string[]
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    warranty?: string
    returnPolicy?: string
    shippingInfo?: string
    relatedProducts?: Product[]
  }
  onAddToCart?: (product: Product, quantity: number) => void
  onAddToWishlist?: (product: Product) => void
  onShare?: (product: Product) => void
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onAddToCart,
  onAddToWishlist,
  onShare,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedTab, setSelectedTab] = useState<
    'description' | 'specifications' | 'reviews' | 'shipping'
  >('description')
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })

  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: product.currency || 'EUR',
    }).format(price)
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.stockQuantity) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product, quantity)
    }
  }

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    const totalImages = product.images.length
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => (prev - 1 + totalImages) % totalImages)
    } else {
      setSelectedImageIndex((prev) => (prev + 1) % totalImages)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/marketplace" className="hover:text-gray-700">
          Marketplace
        </a>
        <span>/</span>
        <a href={`/marketplace/category/${product.category}`} className="hover:text-gray-700">
          {product.category}
        </a>
        {product.subcategory && (
          <>
            <span>/</span>
            <a
              href={`/marketplace/category/${product.category}/${product.subcategory}`}
              className="hover:text-gray-700"
            >
              {product.subcategory}
            </a>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={product.images[selectedImageIndex] || '/placeholder-product.jpg'}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-transform duration-300',
                isZoomed && 'scale-150'
              )}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : {}
              }
            />

            {/* Image Navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => handleImageNavigation('prev')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleImageNavigation('next')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Zoom Indicator */}
            {!isZoomed && (
              <div className="absolute bottom-2 right-2 p-2 bg-white/80 rounded-full">
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && (
                <span className="px-3 py-1 text-sm font-semibold text-white bg-green-500 rounded">
                  NEW
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="px-3 py-1 text-sm font-semibold text-white bg-red-500 rounded">
                  -{discountPercentage}%
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
                    selectedImageIndex === index
                      ? 'border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Section */}
        <div className="space-y-6">
          {/* Title and Brand */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.brand && <p className="text-lg text-gray-600 mt-1">by {product.brand}</p>}
          </div>

          {/* Rating and Reviews */}
          {product.rating !== undefined && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Math.floor(product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="ml-2 text-lg font-medium">{product.rating}</span>
              </div>
              <button className="text-blue-600 hover:underline">
                {product.reviewCount || 0} reviews
              </button>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="px-2 py-1 text-sm font-semibold text-green-600 bg-green-100 rounded">
                  Save {formatPrice(product.originalPrice! - product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Short Description */}
          {product.description && <p className="text-gray-600">{product.description}</p>}

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            {isOutOfStock ? (
              <span className="text-lg text-red-600 font-medium">Out of Stock</span>
            ) : isLowStock ? (
              <span className="text-lg text-orange-600 font-medium">
                Only {product.stockQuantity} left in stock - order soon!
              </span>
            ) : (
              <span className="text-lg text-green-600 font-medium">In Stock</span>
            )}
          </div>

          {/* Quantity Selector and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (!Number.isNaN(val) && val >= 1 && val <= product.stockQuantity) {
                      setQuantity(val)
                    }
                  }}
                  className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                  min="1"
                  max={product.stockQuantity}
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stockQuantity}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  'flex-1 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2',
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={() => onAddToWishlist?.(product)}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Add to wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>

              <button
                onClick={() => onShare?.(product)}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Free shipping over €100</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">30-day returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">2-year warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Secure payment</span>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {(['description', 'specifications', 'reviews', 'shipping'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors',
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {selectedTab === 'description' && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Product Description</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {product.longDescription || product.description}
              </p>

              {product.features && product.features.length > 0 && (
                <>
                  <h4 className="text-lg font-semibold mt-6 mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {selectedTab === 'specifications' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
              {product.specifications ? (
                <table className="w-full">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value], index) => (
                      <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="px-4 py-3 text-gray-700 font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No specifications available.</p>
              )}
            </div>
          )}

          {selectedTab === 'reviews' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            </div>
          )}

          {selectedTab === 'shipping' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Shipping & Returns</h3>

              <div>
                <h4 className="font-semibold mb-2">Shipping Information</h4>
                <p className="text-gray-600">
                  {product.shippingInfo ||
                    'Standard shipping available. Free shipping on orders over €100. Express shipping available at checkout.'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Return Policy</h4>
                <p className="text-gray-600">
                  {product.returnPolicy ||
                    '30-day return policy. Items must be unused and in original packaging. Contact customer service to initiate a return.'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Warranty</h4>
                <p className="text-gray-600">
                  {product.warranty ||
                    '2-year manufacturer warranty included. Extended warranty available at checkout.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
