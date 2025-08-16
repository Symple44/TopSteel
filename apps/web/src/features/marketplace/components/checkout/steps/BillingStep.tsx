'use client';

import React, { useState } from 'react';
import { CheckoutData } from '../CheckoutFlow';
import { cn } from '@/lib/utils';

interface BillingStepProps {
  data: CheckoutData;
  onUpdate: (data: Partial<CheckoutData>) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

const countries = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BE', name: 'Belgium' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }
];

export const BillingStep: React.FC<BillingStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
  isValid
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSameAsShippingChange = (checked: boolean) => {
    onUpdate({
      billing: {
        ...data.billing,
        sameAsShipping: checked
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    onUpdate({
      billing: {
        ...data.billing,
        [field]: value
      }
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (data.billing.sameAsShipping) {
      return true;
    }

    const newErrors: Record<string, string> = {};
    const b = data.billing;

    if (!b.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!b.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!b.address?.trim()) newErrors.address = 'Address is required';
    if (!b.city?.trim()) newErrors.city = 'City is required';
    if (!b.postalCode?.trim()) newErrors.postalCode = 'Postal code is required';
    if (!b.country) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Billing Information</h2>

        {/* Same as Shipping */}
        <div className="mb-6">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={data.billing.sameAsShipping}
              onChange={(e) => handleSameAsShippingChange(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium">Same as shipping address</p>
              <p className="text-sm text-gray-600">
                Use the shipping address for billing
              </p>
            </div>
          </label>
        </div>

        {/* Billing Form */}
        {!data.billing.sameAsShipping && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={data.billing.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={data.billing.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                value={data.billing.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.address ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address}</p>
              )}

              <input
                type="text"
                value={data.billing.address2 || ''}
                onChange={(e) => handleInputChange('address2', e.target.value)}
                placeholder="Apartment, suite, etc. (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={data.billing.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.city ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.city && (
                  <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Region
                </label>
                <input
                  type="text"
                  value={data.billing.state || ''}
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
                  value={data.billing.postalCode || ''}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.postalCode ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                value={data.billing.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.country ? "border-red-500" : "border-gray-300"
                )}
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="text-xs text-red-500 mt-1">{errors.country}</p>
              )}
            </div>
          </div>
        )}

        {/* Tax Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Tax Information</h3>
          <p className="text-sm text-gray-600">
            Tax will be calculated based on your billing address
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">Estimated Tax (20%)</span>
            <span className="font-medium">Calculated at payment</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Back to Shipping
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};