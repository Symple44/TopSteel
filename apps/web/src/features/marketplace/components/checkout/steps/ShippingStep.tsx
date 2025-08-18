'use client'

import { Check, Plus } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CheckoutData } from '../CheckoutFlow'

interface ShippingStepProps {
  data: CheckoutData
  onUpdate: (data: Partial<CheckoutData>) => void
  onNext: () => void
  isValid: boolean
}

const countries = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BE', name: 'Belgium' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
]

const shippingMethods = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    cost: 9.99,
    estimatedDays: 5,
    description: 'Delivered in 3-5 business days',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    cost: 19.99,
    estimatedDays: 2,
    description: 'Delivered in 1-2 business days',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    cost: 39.99,
    estimatedDays: 1,
    description: 'Delivered next business day',
  },
]

export const ShippingStep: React.FC<ShippingStepProps> = ({ data, onUpdate, onNext, isValid }) => {
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load saved addresses from API or localStorage
    loadSavedAddresses()
  }, [
    // Load saved addresses from API or localStorage
    loadSavedAddresses,
  ])

  const loadSavedAddresses = async () => {
    try {
      // Mock saved addresses - replace with API call
      const addresses = [
        {
          id: 'addr_1',
          label: 'Home',
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR',
        },
        {
          id: 'addr_2',
          label: 'Office',
          firstName: 'John',
          lastName: 'Doe',
          address: '456 Business Ave',
          city: 'Lyon',
          postalCode: '69001',
          country: 'FR',
        },
      ]
      setSavedAddresses(addresses)
    } catch (_error) {}
  }

  const handleInputChange = (field: string, value: string) => {
    onUpdate({
      shipping: {
        ...data.shipping,
        [field]: value,
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

  const handleShippingMethodChange = (method: (typeof shippingMethods)[0]) => {
    onUpdate({
      shippingMethod: {
        id: method.id,
        name: method.name,
        cost: method.cost,
        estimatedDays: method.estimatedDays,
      },
    })
  }

  const handleSelectSavedAddress = (address: any) => {
    setSelectedAddress(address.id)
    setShowNewAddress(false)
    onUpdate({
      shipping: {
        ...data.shipping,
        firstName: address.firstName,
        lastName: address.lastName,
        address: address.address,
        address2: address.address2 || '',
        city: address.city,
        state: address.state || '',
        postalCode: address.postalCode,
        country: address.country,
      },
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const s = data.shipping

    if (!s.firstName?.trim()) newErrors.firstName = 'First name is required'
    if (!s.lastName?.trim()) newErrors.lastName = 'Last name is required'
    if (!s.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!s.phone?.trim()) newErrors.phone = 'Phone number is required'
    if (!s.address?.trim()) newErrors.address = 'Address is required'
    if (!s.city?.trim()) newErrors.city = 'City is required'
    if (!s.postalCode?.trim()) newErrors.postalCode = 'Postal code is required'
    if (!s.country) newErrors.country = 'Country is required'

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
        <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Addresses</h3>
            <div className="space-y-2">
              {savedAddresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => handleSelectSavedAddress(address)}
                  className={cn(
                    'w-full p-4 text-left border rounded-lg transition-colors',
                    selectedAddress === address.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{address.label}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.firstName} {address.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.address}, {address.city} {address.postalCode}
                      </p>
                    </div>
                    {selectedAddress === address.id && (
                      <div className="ml-4">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  setShowNewAddress(true)
                  setSelectedAddress(null)
                }}
                className="w-full p-4 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* New Address Form */}
        {showNewAddress && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={data.shipping.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={data.shipping.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={data.shipping.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={data.shipping.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                value={data.shipping.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.address ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}

              <input
                type="text"
                value={data.shipping.address2 || ''}
                onChange={(e) => handleInputChange('address2', e.target.value)}
                placeholder="Apartment, suite, etc. (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={data.shipping.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State/Region</label>
                <input
                  type="text"
                  value={data.shipping.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={data.shipping.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <select
                value={data.shipping.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.country ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.shipping.saveAddress}
                onChange={(e) => handleInputChange('saveAddress', e.target.checked.toString())}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Save this address for future orders</span>
            </label>
          </div>
        )}
      </div>

      {/* Shipping Methods */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>
        <div className="space-y-3">
          {shippingMethods.map((method) => (
            <label
              key={method.id}
              className={cn(
                'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                data.shippingMethod.id === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={data.shippingMethod.id === method.id}
                  onChange={() => handleShippingMethodChange(method)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(method.cost)}</p>
                <p className="text-xs text-gray-500">
                  {method.estimatedDays} day{method.estimatedDays > 1 ? 's' : ''}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue to Billing
        </button>
      </div>
    </div>
  )
}
