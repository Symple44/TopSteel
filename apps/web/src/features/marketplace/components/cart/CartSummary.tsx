'use client'

import { CreditCard, Shield, Tag, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type React from 'react'
import { useSelector } from 'react-redux'
import { cn } from '@/lib/utils'
import {
  selectAppliedCoupon,
  selectCartDiscount,
  selectCartItems,
  selectCartSubtotal,
  selectCartTotal,
  selectShippingCost,
  selectShippingMethod,
} from '../../store/cartSlice'

interface CartSummaryProps {
  showDetails?: boolean
  showEditButton?: boolean
  className?: string
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  showDetails = true,
  showEditButton = false,
  className,
}) => {
  const items = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const discount = useSelector(selectCartDiscount)
  const shipping = useSelector(selectShippingCost)
  const total = useSelector(selectCartTotal)
  const appliedCoupon = useSelector(selectAppliedCoupon)
  const shippingMethod = useSelector(selectShippingMethod)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const calculateTax = (amount: number, rate: number = 0.2) => {
    return amount * rate
  }

  const tax = calculateTax(subtotal - discount)

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          {showEditButton && (
            <Link href="/marketplace/cart" className="text-sm text-blue-600 hover:text-blue-700">
              Edit Cart
            </Link>
          )}
        </div>
      </div>

      {/* Items List */}
      {showDetails && (
        <div className="p-6 border-b max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${JSON.stringify(item.selectedOptions)}`}
                className="flex gap-3"
              >
                {/* Product Image */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={item.product.images[0] || '/placeholder-product.jpg'}
                    alt={item.product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                  {/* Quantity Badge */}
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                    {item.product.name}
                  </h4>
                  {item.selectedOptions && Object.entries(item.selectedOptions).length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Object.entries(item.selectedOptions).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {value}
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(item.product.price)} × {item.quantity}
                  </p>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="p-6 space-y-3">
        <div className="space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({items.length} items)</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <Tag className="w-3 h-3" />
                <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
              </div>
              <span className="text-green-600 font-medium">-{formatPrice(discount)}</span>
            </div>
          )}

          {/* Tax */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (20%)</span>
            <span>{formatPrice(tax)}</span>
          </div>

          {/* Shipping */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Truck className="w-3 h-3" />
              <span>Shipping {shippingMethod && `(${shippingMethod.name})`}</span>
            </div>
            <span>{shipping > 0 ? formatPrice(shipping) : 'FREE'}</span>
          </div>
        </div>

        {/* Total */}
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(total + tax)}</p>
              <p className="text-xs text-gray-500 mt-1">
                or 4 × {formatPrice((total + tax) / 4)} interest-free
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security and Trust Badges */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>

      {/* Promotional Message */}
      {subtotal < 100 && (
        <div className="px-6 pb-6">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <p className="font-medium">Add {formatPrice(100 - subtotal)} more for FREE shipping!</p>
            <div className="mt-1 bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all"
                style={{ width: `${(subtotal / 100) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
