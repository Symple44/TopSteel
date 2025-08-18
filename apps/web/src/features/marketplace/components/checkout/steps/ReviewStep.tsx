'use client'

import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Edit2,
  FileText,
  Loader2,
  MapPin,
  Package,
  Truck,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { CartItem } from '../../store/cartSlice'
import type { CheckoutData } from '../CheckoutFlow'

interface ReviewStepProps {
  data: CheckoutData
  cartItems: CartItem[]
  total: number
  onUpdate: (data: Partial<CheckoutData>) => void
  onBack: () => void
  onPlaceOrder: () => void
  isProcessing: boolean
  error: string | null
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  data,
  cartItems,
  total,
  onUpdate,
  onBack,
  onPlaceOrder,
  isProcessing,
  error,
}) => {
  const [showOrderNotes, setShowOrderNotes] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = data.shippingMethod.cost
  const tax = subtotal * 0.2 // 20% VAT
  const finalTotal = subtotal + shipping + tax

  const handleOrderNotesChange = (notes: string) => {
    onUpdate({ orderNotes: notes })
  }

  const handleTermsChange = (checked: boolean) => {
    onUpdate({ agreeToTerms: checked })
  }

  const handleNewsletterChange = (checked: boolean) => {
    onUpdate({ subscribeNewsletter: checked })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>
        <p className="text-gray-600 mb-6">
          Please review your order details before completing your purchase.
        </p>

        {/* Order Items */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Items ({cartItems.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <div key={item.product.id} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-gray-600">{item.product.description}</p>
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <div className="mt-1">
                      {Object.entries(item.selectedOptions).map(([key, value]) => (
                        <span key={key} className="text-xs text-gray-500 mr-2">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(item.product.price)}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shipping Address
            </h3>
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">
                  {data.shipping.firstName} {data.shipping.lastName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {data.shipping.address}
                  {data.shipping.address2 && `, ${data.shipping.address2}`}
                </p>
                <p className="text-sm text-gray-600">
                  {data.shipping.city}, {data.shipping.state} {data.shipping.postalCode}
                </p>
                <p className="text-sm text-gray-600">{data.shipping.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {data.shipping.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {data.shipping.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing & Payment
            </h3>
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Billing Address</h4>
                {data.billing.sameAsShipping ? (
                  <p className="text-sm text-gray-600">Same as shipping address</p>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p>
                      {data.billing.firstName} {data.billing.lastName}
                    </p>
                    <p>{data.billing.address}</p>
                    <p>
                      {data.billing.city}, {data.billing.state} {data.billing.postalCode}
                    </p>
                    <p>{data.billing.country}</p>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Payment Method</h4>
                <div className="text-sm text-gray-600">
                  {data.payment.method === 'card' && (
                    <p>Credit Card ending in {data.payment.cardNumber?.slice(-4)}</p>
                  )}
                  {data.payment.method === 'paypal' && <p>PayPal</p>}
                  {data.payment.method === 'bank_transfer' && <p>Bank Transfer</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Method */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Shipping Method
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{data.shippingMethod.name}</p>
                <p className="text-sm text-gray-600">
                  Estimated delivery: {data.shippingMethod.estimatedDays} business days
                </p>
              </div>
              <p className="font-medium">{formatPrice(data.shippingMethod.cost)}</p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium">Order Summary</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (20%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Notes */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Order Notes
            </h3>
            <button
              onClick={() => setShowOrderNotes(!showOrderNotes)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {showOrderNotes ? 'Hide' : 'Add Notes'}
            </button>
          </div>
          {showOrderNotes && (
            <div className="p-4">
              <textarea
                value={data.orderNotes || ''}
                onChange={(e) => handleOrderNotesChange(e.target.value)}
                placeholder="Add any special instructions for your order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Agreement Checkboxes */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.agreeToTerms}
              onChange={(e) => handleTermsChange(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="text-sm">
                I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
                <span className="text-red-500 ml-1">*</span>
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.subscribeNewsletter}
              onChange={(e) => handleNewsletterChange(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="text-sm">
                Subscribe to our newsletter for exclusive offers and updates
              </p>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message for Non-Card Payments */}
        {(data.payment.method === 'paypal' || data.payment.method === 'bank_transfer') && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-blue-900 font-medium">
                  {data.payment.method === 'paypal'
                    ? 'PayPal Payment'
                    : 'Bank Transfer Instructions'}
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  {data.payment.method === 'paypal'
                    ? 'You will be redirected to PayPal after placing your order.'
                    : 'Bank details will be sent to your email after order confirmation.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
        >
          Back to Payment
        </button>
        <button
          onClick={onPlaceOrder}
          disabled={!data.agreeToTerms || isProcessing}
          className={cn(
            'px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors',
            data.agreeToTerms && !isProcessing
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Place Order
            </>
          )}
        </button>
      </div>
    </div>
  )
}
