'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
} from 'lucide-react'
import { Product } from '@/lib/api/storefront'
import { formatPrice, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCart } from '@/stores/cart-store'

interface ProductDetailProps {
  product: Product
  tenant: string
}

export function ProductDetail({ product, tenant }: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addItem, hasItem, getItemCount } = useCart()

  const images =
    product.images.length > 0
      ? product.images
      : [{ url: '/placeholder-product.jpg', alt: product.designation, isMain: true }]

  const hasDiscount = product.calculatedPrice && product.calculatedPrice < product.basePrice

  const handleAddToCart = async () => {
    setIsAddingToCart(true)

    try {
      addItem(product, quantity)

      toast.success('Produit ajouté au panier', {
        description: `${quantity} × ${product.designation}`,
      })
    } catch (error) {
      toast.error("Erreur lors de l'ajout au panier")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.designation,
          text: product.shortDescription,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié dans le presse-papiers')
    }
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${tenant}`} className="hover:text-foreground">
          Accueil
        </Link>
        <span>/</span>
        <Link href={`/${tenant}/products`} className="hover:text-foreground">
          Produits
        </Link>
        {product.categories.length > 0 && (
          <>
            <span>/</span>
            <Link
              href={`/${tenant}/products?category=${encodeURIComponent(product.categories[0])}`}
              className="hover:text-foreground"
            >
              {product.categories[0]}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.designation}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <Image
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].alt || product.designation}
              fill
              className="object-cover"
              priority
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isFeatured && (
                <span className="bg-accent text-accent-foreground px-3 py-1 text-sm font-medium rounded">
                  Vedette
                </span>
              )}
              {hasDiscount && (
                <span className="bg-destructive text-destructive-foreground px-3 py-1 text-sm font-medium rounded">
                  Promo
                </span>
              )}
              {!product.inStock && (
                <span className="bg-muted text-muted-foreground px-3 py-1 text-sm font-medium rounded">
                  Rupture
                </span>
              )}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors"
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors"
                  disabled={selectedImageIndex === images.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded border-2 transition-colors',
                    selectedImageIndex === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground'
                  )}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${product.designation} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono">Réf: {product.reference}</p>
              <button
                onClick={handleShare}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Partager"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-3xl font-bold">{product.designation}</h1>

            {/* Categories */}
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category) => (
                  <Link
                    key={category}
                    href={`/${tenant}/products?category=${encodeURIComponent(category)}`}
                    className="text-sm bg-muted text-muted-foreground hover:bg-muted/80 px-3 py-1 rounded transition-colors"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(product.calculatedPrice!)}
                  </span>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.basePrice)}
                  </span>
                  <span className="bg-destructive text-destructive-foreground px-2 py-1 text-sm font-medium rounded">
                    -
                    {Math.round(
                      ((product.basePrice - product.calculatedPrice!) / product.basePrice) * 100
                    )}
                    %
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold">
                  {formatPrice(product.calculatedPrice || product.basePrice)}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">Prix TTC, hors frais de livraison</p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                product.inStock ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span
              className={cn('font-medium', product.inStock ? 'text-green-600' : 'text-red-600')}
            >
              {product.inStock ? 'En stock' : 'Rupture de stock'}
            </span>
            {product.stockDisponible !== undefined && product.inStock && (
              <span className="text-muted-foreground text-sm">
                ({product.stockDisponible} disponible{product.stockDisponible > 1 ? 's' : ''})
              </span>
            )}
          </div>

          {/* Add to Cart */}
          {product.inStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-muted transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stockDisponible || 999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center py-2 border-0 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stockDisponible || 999, quantity + 1))
                    }
                    className="p-2 hover:bg-muted transition-colors"
                    disabled={quantity >= (product.stockDisponible || 999)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Ajouter au panier
                    </>
                  )}
                </button>

                <button
                  className="p-3 border hover:bg-muted rounded transition-colors"
                  title="Ajouter aux favoris"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Total: {formatPrice((product.calculatedPrice || product.basePrice) * quantity)}
              </p>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Livraison rapide</p>
                <p className="text-xs text-muted-foreground">Expédition sous 24h</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Garantie qualité</p>
                <p className="text-xs text-muted-foreground">Produits certifiés</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Retour gratuit</p>
                <p className="text-xs text-muted-foreground">Sous 30 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description and Details */}
      <div className="space-y-8">
        <div className="border-t pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Description */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                {product.description ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    Aucune description disponible pour ce produit.
                  </p>
                )}
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-muted text-muted-foreground px-2 py-1 text-sm rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div>
              <h3 className="font-semibold mb-4">Détails du produit</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Référence:</dt>
                  <dd className="font-mono">{product.reference}</dd>
                </div>
                {product.categories.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Catégorie:</dt>
                    <dd>{product.categories[0]}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Disponibilité:</dt>
                  <dd className={product.inStock ? 'text-green-600' : 'text-red-600'}>
                    {product.inStock ? 'En stock' : 'Rupture'}
                  </dd>
                </div>
                {product.stockDisponible !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Quantité:</dt>
                    <dd>{product.stockDisponible}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
