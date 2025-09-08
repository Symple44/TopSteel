'use client'

import { CreditCard, Info, Lock, Shield } from 'lucide-react'
import type React from 'react'
import { useId, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CheckoutData } from '../../../types/checkout.types'

interface PaymentStepProps {
  data: CheckoutData
  onUpdate: (data: Partial<CheckoutData>) => void
  onNext: () => void
  onBack: () => void
  isValid: boolean
  total: number
}

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: CreditCard,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: Shield,
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer (3-5 business days)',
    icon: Lock,
  },
]

export const PaymentStep: React.FC<PaymentStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
  isValid,
  total,
}) => {
  const cardNumberId = useId()
  const cardHolderNameId = useId()
  const expiryDateId = useId()
  const cvvId = useId()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cardType, setCardType] = useState<string>('')

  const handlePaymentMethodChange = (method: 'card' | 'paypal' | 'bank_transfer') => {
    onUpdate({
      payment: {
        ...data.payment,
        method,
        // Clear card details when switching methods
        ...(method !== 'card' && {
          cardNumber: undefined,
          cardHolder: undefined,
          expiryDate: undefined,
          cvv: undefined,
        }),
      },
    })
    setErrors({})
  }

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value

    // Format card number with spaces
    if (field === 'cardNumber') {
      processedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()

      // Detect card type
      const cardNumber = value?.replace(/\s/g, '')
      if (cardNumber?.startsWith('4')) {
        setCardType('Visa')
      } else if (cardNumber?.startsWith('5')) {
        setCardType('Mastercard')
      } else if (cardNumber?.startsWith('3')) {
        setCardType('American Express')
      } else {
        setCardType('')
      }
    }

    // Format expiry date
    if (field === 'expiryDate') {
      processedValue = value?.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2')
    }

    // Limit CVV to numbers only
    if (field === 'cvv') {
      processedValue = value?.replace(/\D/g, '').slice(0, 4)
    }

    onUpdate({
      payment: {
        ...data.payment,
        [field]: processedValue,
      },
    })

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const p = data.payment

    if (p?.method === 'card') {
      if (!p?.cardNumber?.trim()) {
        newErrors.cardNumber = 'Card number is required'
      } else if (p?.cardNumber?.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Invalid card number'
      }

      if (!p?.cardHolder?.trim()) {
        newErrors.cardHolder = 'Cardholder name is required'
      }

      if (p?.expiryDate?.trim()) {
        const parts = p?.expiryDate?.split('/') || []
        const [month, year] = parts
        const currentYear = new Date().getFullYear() % 100
        const currentMonth = new Date().getMonth() + 1

        if (parseInt(month, 10) > 12 || parseInt(month, 10) < 1) {
          newErrors.expiryDate = 'Invalid month'
        } else if (
          parseInt(year, 10) < currentYear ||
          (parseInt(year, 10) === currentYear && parseInt(month, 10) < currentMonth)
        ) {
          newErrors.expiryDate = 'Card has expired'
        }
      } else {
        newErrors.expiryDate = 'Expiry date is required'
      }

      if (!p?.cvv?.trim()) {
        newErrors.cvv = 'CVV is required'
      } else if (p?.cvv?.length < 3) {
        newErrors.cvv = 'Invalid CVV'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          {paymentMethods?.map((method) => {
            const Icon = method.icon
            return (
              <label
                key={method.id}
                className={cn(
                  'flex items-center p-4 border rounded-lg cursor-pointer transition-colors',
                  data?.payment?.method === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={data?.payment?.method === method.id}
                  onChange={() => handlePaymentMethodChange(method.id as unknown)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <p className="font-medium">{method.name}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                </div>
              </label>
            )
          })}
        </div>

        {/* Card Details Form */}
        {data?.payment?.method === 'card' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label
                htmlFor={cardNumberId}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Card Number *
              </label>
              <div className="relative">
                <input
                  id={cardNumberId}
                  type="text"
                  value={data?.payment?.cardNumber || ''}
                  onChange={(e) => handleInputChange('cardNumber', e?.target?.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={cn(
                    'w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {cardType && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {cardType}
                  </span>
                )}
              </div>
              {errors.cardNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={cardHolderNameId}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cardholder Name *
              </label>
              <input
                id={cardHolderNameId}
                type="text"
                value={data?.payment?.cardHolder || ''}
                onChange={(e) => handleInputChange('cardHolder', e?.target?.value)}
                placeholder="John Doe"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.cardHolder ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.cardHolder && (
                <p className="text-xs text-red-500 mt-1">{errors.cardHolder}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={expiryDateId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expiry Date *
                </label>
                <input
                  id={expiryDateId}
                  type="text"
                  value={data?.payment?.expiryDate || ''}
                  onChange={(e) => handleInputChange('expiryDate', e?.target?.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.expiryDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label htmlFor={cvvId} className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  id={cvvId}
                  type="text"
                  value={data?.payment?.cvv || ''}
                  onChange={(e) => handleInputChange('cvv', e?.target?.value)}
                  placeholder="123"
                  maxLength={4}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data?.payment?.saveCard}
                onChange={(e) => handleInputChange('saveCard', e?.target?.checked?.toString())}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Save this card for future purchases</span>
            </label>

            {/* Security Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium">
                    Your payment information is secure
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We use industry-standard encryption to protect your payment details. Your card
                    information is never stored on our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PayPal */}
        {data?.payment?.method === 'paypal' && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">PayPal Checkout</p>
                <p className="text-sm text-gray-600">
                  You will be redirected to PayPal to complete your payment
                </p>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                After clicking "Continue", you'll be redirected to PayPal's secure checkout to log
                in and confirm your payment of {formatPrice(total)}.
              </p>
            </div>
          </div>
        )}

        {/* Bank Transfer */}
        {data?.payment?.method === 'bank_transfer' && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-gray-600" />
              <div>
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-gray-600">
                  Transfer funds directly from your bank account
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Bank Details will be provided after order confirmation:
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Bank: TopSteel Banking Partner</p>
                  <p>IBAN: Will be provided via email</p>
                  <p>Reference: Your order number</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Your order will be processed once payment is received
                  (typically 3-5 business days).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Accepted Cards */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">We accept:</p>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-white border border-gray-200 rounded">
              <span className="text-sm font-medium">Visa</span>
            </div>
            <div className="px-3 py-1 bg-white border border-gray-200 rounded">
              <span className="text-sm font-medium">Mastercard</span>
            </div>
            <div className="px-3 py-1 bg-white border border-gray-200 rounded">
              <span className="text-sm font-medium">Amex</span>
            </div>
            <div className="px-3 py-1 bg-white border border-gray-200 rounded">
              <span className="text-sm font-medium">PayPal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Back to Billing
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Review Order
        </button>
      </div>
    </div>
  )
}
