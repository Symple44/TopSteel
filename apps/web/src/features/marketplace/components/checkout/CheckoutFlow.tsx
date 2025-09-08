'use client'

import { Check, CreditCard, MapPin, Shield, Truck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { cn } from '@/lib/utils'
import { clearCart, selectCartItems, selectCartTotal } from '../../store/cartSlice'
import type { CheckoutData, CheckoutStep } from '../../types/checkout.types'
import { CartSummary } from '../cart/CartSummary'
import { BillingStep } from './steps/BillingStep'
import { PaymentStep } from './steps/PaymentStep'
import { ReviewStep } from './steps/ReviewStep'
import { ShippingStep } from './steps/ShippingStep'

const steps: Array<{
  id: CheckoutStep
  title: string
  description: string
  icon: React.ElementType
}> = [
  {
    id: 'shipping',
    title: 'Shipping',
    description: 'Delivery address',
    icon: MapPin,
  },
  {
    id: 'billing',
    title: 'Billing',
    description: 'Billing information',
    icon: User,
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Payment method',
    icon: CreditCard,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review & confirm',
    icon: Check,
  },
]

interface CheckoutFlowProps {
  className?: string
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ className }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)
  const cartTotal = useSelector(selectCartTotal)

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping')
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    shipping: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'FR',
      saveAddress: true,
    },
    billing: {
      sameAsShipping: true,
    },
    shippingMethod: {
      id: 'standard',
      name: 'Standard Shipping',
      cost: 9.99,
      estimatedDays: 5,
    },
    payment: {
      method: 'card',
      saveCard: false,
    },
    agreeToTerms: false,
    subscribeNewsletter: false,
  })

  useEffect(() => {
    // Redirect if cart is empty
    if (cartItems?.length === 0 && !isProcessing) {
      router?.push('/marketplace/cart')
    }
  }, [cartItems, router, isProcessing])

  const getCurrentStepIndex = () => {
    return steps?.findIndex((step) => step.id === currentStep)
  }

  const handleStepClick = (stepId: CheckoutStep) => {
    const clickedStepIndex = steps?.findIndex((step) => step.id === stepId)
    const currentStepIndex = getCurrentStepIndex()

    // Allow going back to previous steps or completed steps
    if (clickedStepIndex < currentStepIndex || completedSteps?.has(stepId)) {
      setCurrentStep(stepId)
    }
  }

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex()

    // Mark current step as completed
    setCompletedSteps((prev) => new Set(prev).add(currentStep))

    // Move to next step
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps?.[currentIndex + 1]?.id)
    }
  }

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(steps?.[currentIndex - 1]?.id)
    }
  }

  const handleUpdateData = (stepData: Partial<CheckoutData>) => {
    setCheckoutData((prev) => ({
      ...prev,
      ...stepData,
    }))
  }

  const validateStep = (step: CheckoutStep): boolean => {
    switch (step) {
      case 'shipping': {
        const s = checkoutData.shipping
        return !!(
          s?.firstName &&
          s?.lastName &&
          s?.email &&
          s?.phone &&
          s?.address &&
          s?.city &&
          s?.postalCode &&
          s?.country
        )
      }

      case 'billing': {
        if (checkoutData?.billing?.sameAsShipping) return true
        const b = checkoutData.billing
        return !!(
          b?.firstName &&
          b?.lastName &&
          b?.address &&
          b?.city &&
          b?.postalCode &&
          b?.country
        )
      }

      case 'payment': {
        const p = checkoutData.payment
        if (p?.method === 'card') {
          return !!(p?.cardNumber && p?.cardHolder && p?.expiryDate && p?.cvv)
        }
        return true
      }

      case 'review':
        return checkoutData.agreeToTerms

      default:
        return false
    }
  }

  const handlePlaceOrder = async () => {
    if (!validateStep('review')) {
      setError('Please agree to the terms and conditions')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create order payload
      const orderPayload = {
        items: cartItems?.map((item) => ({
          productId: item?.product?.id,
          quantity: item.quantity,
          price: item?.product?.price,
          options: item.selectedOptions,
        })),
        shipping: checkoutData.shipping,
        billing: checkoutData?.billing?.sameAsShipping
          ? checkoutData.shipping
          : checkoutData.billing,
        shippingMethod: checkoutData.shippingMethod,
        payment: {
          method: checkoutData?.payment?.method,
          // Don't send sensitive card data directly
          ...(checkoutData?.payment?.method === 'card' && {
            last4: checkoutData.payment.cardNumber?.slice(-4),
          }),
        },
        total: cartTotal,
        notes: checkoutData.orderNotes,
        subscribeNewsletter: checkoutData.subscribeNewsletter,
      }

      // Submit order to backend
      const response = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (!response?.ok) {
        throw new Error('Failed to place order')
      }

      const order = await response?.json()

      // Process payment if card
      if (checkoutData?.payment?.method === 'card') {
        const paymentResponse = await fetch('/api/marketplace/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: cartTotal,
            currency: 'EUR',
            paymentMethod: {
              type: 'card',
              // In production, use Stripe Elements or similar
              token: 'tok_visa', // Mock token for demo
            },
          }),
        })

        if (!paymentResponse?.ok) {
          throw new Error('Payment failed')
        }
      }

      // Clear cart
      dispatch(clearCart())

      // Redirect to success page
      router?.push(`/marketplace/order-confirmation/${order?.id}`)
    } catch (_error) {
      setError('An error occurred while processing your order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'shipping':
        return (
          <ShippingStep
            data={checkoutData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
            isValid={validateStep('shipping')}
          />
        )

      case 'billing':
        return (
          <BillingStep
            data={checkoutData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
            onBack={handleBack}
            isValid={validateStep('billing')}
          />
        )

      case 'payment':
        return (
          <PaymentStep
            data={checkoutData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
            onBack={handleBack}
            isValid={validateStep('payment')}
            total={cartTotal}
          />
        )

      case 'review':
        return (
          <ReviewStep
            data={checkoutData}
            cartItems={cartItems}
            total={cartTotal}
            onUpdate={handleUpdateData}
            onBack={handleBack}
            onPlaceOrder={handlePlaceOrder}
            isProcessing={isProcessing}
            error={error}
          />
        )

      default:
        return null
    }
  }

  if (cartItems?.length === 0 && !isProcessing) {
    return null
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps?.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = completedSteps?.has(step.id)
              const isPending = !isActive && !isCompleted

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={isPending && !isCompleted}
                    className={cn(
                      'flex flex-col items-center flex-1 relative',
                      isPending && 'cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                        isActive && 'bg-blue-600 text-white',
                        isCompleted && 'bg-green-600 text-white',
                        isPending && 'bg-gray-200 text-gray-400'
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-sm font-medium',
                        isActive && 'text-blue-600',
                        isCompleted && 'text-green-600',
                        isPending && 'text-gray-400'
                      )}
                    >
                      {step.title}
                    </span>
                    <span
                      className={cn(
                        'text-xs mt-1',
                        isActive || isCompleted ? 'text-gray-600' : 'text-gray-400'
                      )}
                    >
                      {step.description}
                    </span>
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 bg-gray-200 mx-4 relative top-6',
                        completedSteps?.has(steps?.[index + 1]?.id) && 'bg-green-600'
                      )}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">{renderStepContent()}</div>

            {/* Security Badge */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Secure Checkout</p>
                  <p className="text-xs text-gray-600">
                    Your information is protected by 256-bit SSL encryption
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <CartSummary showDetails={true} />

              {/* Delivery Info */}
              {checkoutData.shippingMethod && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Estimated delivery:</span>
                    <span className="text-gray-600">
                      {checkoutData?.shippingMethod?.estimatedDays} business days
                    </span>
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Need help? Contact our support team</p>
                <a href="tel:+33123456789" className="text-sm text-blue-600 hover:underline">
                  +33 1 23 45 67 89
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
