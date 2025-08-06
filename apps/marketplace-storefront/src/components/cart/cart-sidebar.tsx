'use client'

import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { cn, formatPrice } from '@/lib/utils'
import { useCart } from '@/stores/cart-store'

interface CartSidebarProps {
  tenant: string
}

export function CartSidebar({ tenant }: CartSidebarProps) {
  const {
    items,
    isOpen,
    totalItems,
    totalPrice,
    toggleCart,
    updateQuantity,
    removeItem,
    setTenant,
  } = useCart()

  // Set tenant when component mounts
  useEffect(() => {
    setTenant(tenant)
  }, [tenant, setTenant])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleCart}
          onKeyDown={(e) => e.key === 'Escape' && toggleCart()}
          aria-label="Fermer le panier"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Panier ({totalItems})
          </h2>
          <button
            type="button"
            onClick={toggleCart}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-80px)]">
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                    onRemove={() => removeItem(item.id)}
                    tenant={tenant}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="border-t p-4 space-y-4">
                {/* Total */}
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href={`/${tenant}/checkout`}
                    className="w-full btn-primary py-3 text-center block"
                    onClick={toggleCart}
                  >
                    Passer commande
                  </Link>
                  <Link
                    href={`/${tenant}/cart`}
                    className="w-full btn-outline py-2 text-center block"
                    onClick={toggleCart}
                  >
                    Voir le panier
                  </Link>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Frais de livraison calculés à l'étape suivante
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function EmptyCart() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Votre panier est vide</h3>
          <p className="text-muted-foreground text-sm">
            Ajoutez des produits pour commencer vos achats
          </p>
        </div>
      </div>
    </div>
  )
}

interface CartItemProps {
  item: {
    id: string
    product: {
      id: string
      designation: string
      reference: string
      basePrice?: number
      calculatedPrice?: number
      stockDisponible?: number
      images: Array<{ url: string; isMain?: boolean }>
    }
    quantity: number
    unitPrice: number
    totalPrice: number
  }
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
  tenant: string
}

function CartItem({ item, onUpdateQuantity, onRemove, tenant }: CartItemProps) {
  const { product, quantity, unitPrice, totalPrice } = item
  const mainImage = product.images.find((img) => img.isMain) || product.images[0]

  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      {/* Image */}
      <div className="relative w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
        {mainImage ? (
          <Image src={mainImage.url} alt={product.designation} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          <Link
            href={`/${tenant}/products/${product.id}`}
            className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
            title={product.designation}
          >
            {product.designation}
          </Link>

          <p className="text-xs text-muted-foreground font-mono">Réf: {product.reference}</p>

          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{formatPrice(totalPrice)}</div>

            {unitPrice !== (product.calculatedPrice || product.basePrice) && (
              <div className="text-xs text-muted-foreground">
                Prix unitaire: {formatPrice(unitPrice)}
              </div>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border rounded">
            <button
              type="button"
              onClick={() => onUpdateQuantity(quantity - 1)}
              className="p-1 hover:bg-muted transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 py-1 text-sm min-w-[2rem] text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(quantity + 1)}
              className="p-1 hover:bg-muted transition-colors"
              disabled={quantity >= (product.stockDisponible || 999)}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
