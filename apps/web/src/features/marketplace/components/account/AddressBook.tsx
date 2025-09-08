'use client'

import { Building, Check, Edit2, Heart, Home, MapPin, Plus, Trash2 } from 'lucide-react'
import type React from 'react'
import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

interface Address {
  id: string
  label: string
  type: 'home' | 'work' | 'other'
  isDefault: boolean
  firstName: string
  lastName: string
  company?: string
  address: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

interface AddressBookProps {
  className?: string
}

const mockAddresses: Address[] = [
  {
    id: '1',
    label: 'Home',
    type: 'home',
    isDefault: true,
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main Street',
    address2: 'Apartment 4B',
    city: 'Paris',
    state: 'Île-de-France',
    postalCode: '75001',
    country: 'France',
    phone: '+33 1 23 45 67 89',
  },
  {
    id: '2',
    label: 'Office',
    type: 'work',
    isDefault: false,
    firstName: 'John',
    lastName: 'Doe',
    company: 'TopSteel Industries',
    address: '456 Business Avenue',
    city: 'Lyon',
    state: 'Auvergne-Rhône-Alpes',
    postalCode: '69001',
    country: 'France',
    phone: '+33 4 56 78 90 12',
  },
  {
    id: '3',
    label: 'Parents House',
    type: 'other',
    isDefault: false,
    firstName: 'John',
    lastName: 'Doe',
    address: '789 Family Road',
    city: 'Marseille',
    state: "Provence-Alpes-Côte d'Azur",
    postalCode: '13001',
    country: 'France',
  },
]

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

export const AddressBook: React.FC<AddressBookProps> = ({ className }) => {
  const addressLabelId = useId()
  const addressTypeId = useId()
  const firstNameId = useId()
  const lastNameId = useId()
  const companyId = useId()
  const streetAddressId = useId()
  const address2Id = useId()
  const cityId = useId()
  const stateId = useId()
  const postalCodeId = useId()
  const countryId = useId()
  const phoneId = useId()

  const [addresses, setAddresses] = useState<Address[]>(mockAddresses)
  const [isEditing, setIsEditing] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState<Partial<Address>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return Home
      case 'work':
        return Building
      default:
        return Heart
    }
  }

  const handleAddNew = () => {
    setEditingAddress(null)
    setFormData({
      label: '',
      type: 'home',
      isDefault: false,
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'FR',
    })
    setIsEditing(true)
    setErrors({})
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({ ...address })
    setIsEditing(true)
    setErrors({})
  }

  const handleDelete = (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setAddresses((prev) => prev?.filter((addr) => addr.id !== addressId))
    }
  }

  const handleSetDefault = (addressId: string) => {
    setAddresses((prev) =>
      prev?.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

    if (!formData.label?.trim()) {
      newErrors.label = 'Label is required'
    }
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.city?.trim()) {
      newErrors.city = 'City is required'
    }
    if (!formData.postalCode?.trim()) {
      newErrors.postalCode = 'Postal code is required'
    }
    if (!formData.country) {
      newErrors.country = 'Country is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    const addressData = {
      ...formData,
      id: editingAddress?.id || Date.now().toString(),
    } as Address

    if (editingAddress) {
      setAddresses((prev) =>
        prev?.map((addr) => (addr.id === editingAddress.id ? addressData : addr))
      )
    } else {
      setAddresses((prev) => [...prev, addressData])
    }

    setIsEditing(false)
    setEditingAddress(null)
    setFormData({})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingAddress(null)
    setFormData({})
    setErrors({})
  }

  if (isEditing) {
    return (
      <div className={cn('p-6', className)}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h2>
          <p className="text-gray-600">
            {editingAddress
              ? 'Update your address information'
              : 'Add a new shipping or billing address'}
          </p>
        </div>

        <div className="max-w-2xl">
          <div className="space-y-6">
            {/* Address Label and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={addressLabelId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address Label *
                </label>
                <input
                  id={addressLabelId}
                  type="text"
                  value={formData.label || ''}
                  onChange={(e) => handleInputChange('label', e?.target?.value)}
                  placeholder="e.g., Home, Office, Parents"
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.label ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
              </div>

              <div>
                <label
                  htmlFor={addressTypeId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address Type
                </label>
                <select
                  id={addressTypeId}
                  value={formData.type || 'home'}
                  onChange={(e) => handleInputChange('type', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={firstNameId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name *
                </label>
                <input
                  id={firstNameId}
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e?.target?.value)}
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
                <label
                  htmlFor={lastNameId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name *
                </label>
                <input
                  id={lastNameId}
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e?.target?.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Company */}
            <div>
              <label htmlFor={companyId} className="block text-sm font-medium text-gray-700 mb-1">
                Company (Optional)
              </label>
              <input
                id={companyId}
                type="text"
                value={formData.company || ''}
                onChange={(e) => handleInputChange('company', e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address Fields */}
            <div>
              <label
                htmlFor={streetAddressId}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Street Address *
              </label>
              <input
                id={streetAddressId}
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
                placeholder="Street address"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.address ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}

              <div className="mt-2">
                <label htmlFor={address2Id} className="sr-only">
                  Address Line 2 (Optional)
                </label>
                <input
                  id={address2Id}
                  type="text"
                  value={formData.address2 || ''}
                  onChange={(e) => handleInputChange('address2', e?.target?.value)}
                  placeholder="Apartment, suite, etc. (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* City, State, Postal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor={cityId} className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id={cityId}
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e?.target?.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor={stateId} className="block text-sm font-medium text-gray-700 mb-1">
                  State/Region
                </label>
                <input
                  id={stateId}
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor={postalCodeId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Postal Code *
                </label>
                <input
                  id={postalCodeId}
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => handleInputChange('postalCode', e?.target?.value)}
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

            {/* Country */}
            <div>
              <label htmlFor={countryId} className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                id={countryId}
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e?.target?.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.country ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">Select a country</option>
                {countries?.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor={phoneId} className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                id={phoneId}
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Default Address */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault ?? false}
                  onChange={(e) => handleInputChange('isDefault', e?.target?.checked?.toString())}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingAddress ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Address Book</h2>
          <p className="text-gray-600">Manage your shipping and billing addresses</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {/* Address Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses?.map((address) => {
          const TypeIcon = getTypeIcon(address.type)

          return (
            <div
              key={address.id}
              className={cn(
                'border rounded-lg p-6 relative',
                address.isDefault
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:shadow-sm'
              )}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    Default
                  </span>
                </div>
              )}

              {/* Address Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    address.isDefault ? 'bg-blue-100' : 'bg-gray-100'
                  )}
                >
                  <TypeIcon
                    className={cn('w-5 h-5', address.isDefault ? 'text-blue-600' : 'text-gray-600')}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{address.label}</h3>
                  <p className="text-sm text-gray-600 capitalize">{address.type}</p>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p className="font-medium text-gray-900">
                  {address.firstName} {address.lastName}
                </p>
                {address.company && <p>{address.company}</p>}
                <p>{address.address}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
                {address.phone && <p>{address.phone}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {addresses.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-600 mb-4">
            Add your first address to make checkout faster and easier.
          </p>
          <button
            onClick={handleAddNew}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Address
          </button>
        </div>
      )}
    </div>
  )
}
