'use client'

import { Eye, Package, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Product } from '@/lib/api/storefront'
import { cn, formatPrice, truncateText } from '@/lib/utils'
import { useCart } from '@/stores/cart-store'

interface ProductCardProps {
  product: Product
  tenant: string
  className?: string
  variant?: 'grid' | 'list'
}

export function ProductCard({ product, tenant, className, variant = 'grid' }: ProductCardProps) {
  const mainImage = product.images.find((img) => img.isMain) || product.images[0]
  const hasDiscount = product.calculatedPrice && product.calculatedPrice < product.basePrice
  const { addItem } = useCart()

  const handleAddToCart = () => {
    try {
      addItem(product, 1)
      toast.success('Produit ajouté au panier', {
        description: product.designation,
      })
    } catch (_error) {
      toast.error("Erreur lors de l'ajout au panier")
    }
  }

  if (variant === 'list') {
    return (
      <div className={cn('product-card card-marketplace p-4 overflow-hidden group', className)}>
        <div className="flex gap-4">
          {/* Image Container */}
          <div className="relative w-24 h-24 overflow-hidden bg-muted rounded flex-shrink-0">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.alt || product.designation}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-1 left-1 flex flex-col gap-1">
              {product.isFeatured && (
                <span className="bg-accent text-accent-foreground px-1 py-0.5 text-xs font-medium rounded">
                  Vedette
                </span>
              )}
              {hasDiscount && (
                <span className="bg-destructive text-destructive-foreground px-1 py-0.5 text-xs font-medium rounded">
                  Promo
                </span>
              )}
              {!product.inStock && (
                <span className="bg-muted text-muted-foreground px-1 py-0.5 text-xs font-medium rounded">
                  Rupture
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="text-xs text-muted-foreground font-mono">
                  Réf: {product.reference}
                </div>

                <Link href={`/${tenant}/products/${product.id}`} className="block group/title">
                  <h3 className="font-semibold text-base group-hover/title:text-primary transition-colors line-clamp-2">
                    {product.designation}
                  </h3>
                </Link>

                {product.shortDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {truncateText(product.shortDescription, 120)}
                  </p>
                )}

                {/* Categories */}
                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.categories.slice(0, 3).map((category) => (
                      <Link
                        key={category}
                        href={`/${tenant}/products?category=${encodeURIComponent(category)}`}
                        className="text-xs bg-muted text-muted-foreground hover:bg-muted/80 px-2 py-1 rounded transition-colors"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right space-y-2 ml-4">
                {/* Price */}
                <div className="space-y-1">
                  {hasDiscount ? (
                    <>
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(product.calculatedPrice!)}
                      </div>
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.basePrice)}
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-bold">
                      {formatPrice(product.calculatedPrice || product.basePrice)}
                    </div>
                  )}
                </div>

                {/* Stock Status */}
                <div className="text-xs text-right">
                  <div
                    className={cn(
                      'font-medium',
                      product.inStock ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {product.inStock ? 'En stock' : 'Rupture de stock'}
                  </div>

                  {product.stockDisponible !== undefined && product.inStock && (
                    <div className="text-muted-foreground">
                      {product.stockDisponible} disponible(s)
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/${tenant}/products/${product.id}`}
                    className="btn-outline px-3 py-1 text-xs flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Voir
                  </Link>

                  {product.inStock && (
                    <button
                      onClick={handleAddToCart}
                      className="btn-primary px-3 py-1 text-xs flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Ajouter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('product-card card-marketplace p-0 overflow-hidden group', className)}>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={mainImage.alt || product.designation}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <span className="bg-accent text-accent-foreground px-2 py-1 text-xs font-medium rounded">
              Vedette
            </span>
          )}
          {hasDiscount && (
            <span className="bg-destructive text-destructive-foreground px-2 py-1 text-xs font-medium rounded">
              Promo
            </span>
          )}
          {!product.inStock && (
            <span className="bg-muted text-muted-foreground px-2 py-1 text-xs font-medium rounded">
              Rupture
            </span>
          )}
        </div>

        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <Link
              href={`/${tenant}/products/${product.id}`}
              className="w-10 h-10 bg-background/90 hover:bg-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              title="Voir le détail"
            >
              <Eye className="w-4 h-4" />
            </Link>

            {product.inStock && (
              <button
                className="w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                title="Ajouter au panier"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Product Reference */}
        <div className="text-xs text-muted-foreground font-mono">Réf: {product.reference}</div>

        {/* Title */}
        <Link href={`/${tenant}/products/${product.id}`} className="block group/title">
          <h3 className="font-semibold text-sm group-hover/title:text-primary transition-colors line-clamp-2">
            {product.designation}
          </h3>
        </Link>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncateText(product.shortDescription, 80)}
          </p>
        )}

        {/* Categories */}
        {product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.categories.slice(0, 2).map((category) => (
              <Link
                key={category}
                href={`/${tenant}/products?category=${encodeURIComponent(category)}`}
                className="text-xs bg-muted text-muted-foreground hover:bg-muted/80 px-2 py-1 rounded transition-colors"
              >
                {category}
              </Link>
            ))}
            {product.categories.length > 2 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{product.categories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              {hasDiscount ? (
                <>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.calculatedPrice!)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.basePrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold">
                  {formatPrice(product.calculatedPrice || product.basePrice)}
                </span>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn('font-medium', product.inStock ? 'text-green-600' : 'text-destructive')}
            >
              {product.inStock ? 'En stock' : 'Rupture de stock'}
            </span>

            {product.stockDisponible !== undefined && product.inStock && (
              <span className="text-muted-foreground">{product.stockDisponible} disponible(s)</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button (Mobile) */}
        {product.inStock && (
          <button className="w-full btn-primary py-2 text-sm md:hidden" onClick={handleAddToCart}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ajouter au panier
          </button>
        )}
      </div>
    </div>
  )
}
