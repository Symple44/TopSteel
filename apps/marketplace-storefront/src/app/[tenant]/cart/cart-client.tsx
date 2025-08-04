'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'
import { useCart } from '@/stores/cart-store'
import { formatPrice } from '@/lib/utils'

interface CartClientProps {
  tenant: string
}

export default function CartClient({ tenant }: CartClientProps) {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    setTenant,
  } = useCart()

  useEffect(() => {
    setTenant(tenant)
  }, [tenant, setTenant])

  if (items.length === 0) {
    return (
      <div className="container-marketplace py-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Votre panier est vide</h1>
            <p className="text-muted-foreground">
              Découvrez nos produits et ajoutez-les à votre panier pour commencer vos achats.
            </p>
          </div>

          <Link
            href={`/${tenant}/products`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuer mes achats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-marketplace py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Mon panier</h1>
            <p className="text-muted-foreground">
              {totalItems} article{totalItems > 1 ? 's' : ''} dans votre panier
            </p>
          </div>
          
          <Link
            href={`/${tenant}/products`}
            className="btn-outline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuer mes achats
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                tenant={tenant}
                onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Résumé de la commande</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between text-muted-foreground">
                  <span>Frais de livraison</span>
                  <span>Calculés à l'étape suivante</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/${tenant}/checkout`}
                  className="w-full btn-primary py-3 text-center block"
                >
                  Passer commande
                </Link>
                
                <p className="text-xs text-muted-foreground text-center">
                  Taxes et frais de livraison calculés lors du paiement
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CartItemCardProps {
  item: any
  tenant: string
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}

function CartItemCard({ item, tenant, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { product, quantity, unitPrice, totalPrice } = item
  const mainImage = product.images.find((img: any) => img.isMain) || product.images[0]

  return (
    <div className="flex gap-6 p-6 border rounded-lg bg-background">
      {/* Image */}
      <div className="relative w-24 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.designation}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Link
              href={`/${tenant}/products/${product.id}`}
              className="font-semibold hover:text-primary transition-colors line-clamp-2"
            >
              {product.designation}
            </Link>
            
            <p className="text-sm text-muted-foreground font-mono">
              Réf: {product.reference}
            </p>

            {product.categories.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {product.categories[0]}
              </p>
            )}
          </div>

          <button
            onClick={onRemove}
            className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Supprimer du panier"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded">
              <button
                onClick={() => onUpdateQuantity(quantity - 1)}
                className="p-2 hover:bg-muted transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(quantity + 1)}
                className="p-2 hover:bg-muted transition-colors"
                disabled={quantity >= (product.stockDisponible || 999)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-muted-foreground">
              {formatPrice(unitPrice)} / unité
            </div>
          </div>

          <div className="text-lg font-semibold">
            {formatPrice(totalPrice)}
          </div>
        </div>

        {quantity >= (product.stockDisponible || 999) && (
          <p className="text-sm text-amber-600">
            Stock maximum atteint
          </p>
        )}
      </div>
    </div>
  )
}