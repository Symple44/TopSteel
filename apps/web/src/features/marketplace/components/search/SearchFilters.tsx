'use client'

import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package,
  Shield,
  SlidersHorizontal,
  Star,
  Tag,
  Truck,
  X,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// Generic filter value type for different filter types
type FilterValue = string | number | string[] | { min: number; max: number } | boolean

export interface FilterOption {
  id: string
  label: string
  count?: number
  value?: FilterValue
}

export interface FilterGroup {
  id: string
  label: string
  icon?: React.ElementType
  type: 'checkbox' | 'radio' | 'range' | 'color' | 'size'
  options?: FilterOption[]
  min?: number
  max?: number
  step?: number
  unit?: string
}

export interface ActiveFilter {
  groupId: string
  optionId?: string
  value?: FilterValue
  label: string
}

interface SearchFiltersProps {
  filters: FilterGroup[]
  activeFilters: ActiveFilter[]
  onFilterChange: (filters: ActiveFilter[]) => void
  onClearAll?: () => void
  productCount?: number
  className?: string
  isMobile?: boolean
}

const defaultFilters: FilterGroup[] = [
  {
    id: 'category',
    label: 'Category',
    icon: Package,
    type: 'checkbox',
    options: [
      { id: 'steel-beams', label: 'Steel Beams', count: 156 },
      { id: 'metal-sheets', label: 'Metal Sheets', count: 98 },
      { id: 'welding', label: 'Welding Equipment', count: 234 },
      { id: 'tools', label: 'Tools & Machinery', count: 412 },
      { id: 'safety', label: 'Safety Equipment', count: 67 },
      { id: 'fasteners', label: 'Fasteners & Fixings', count: 189 },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    icon: Tag,
    type: 'checkbox',
    options: [
      { id: 'arcelor', label: 'ArcelorMittal', count: 89 },
      { id: 'voestalpine', label: 'Voestalpine', count: 76 },
      { id: 'thyssenkrupp', label: 'ThyssenKrupp', count: 112 },
      { id: 'tata', label: 'Tata Steel', count: 94 },
      { id: 'nucor', label: 'Nucor', count: 58 },
    ],
  },
  {
    id: 'price',
    label: 'Price Range',
    icon: DollarSign,
    type: 'range',
    min: 0,
    max: 10000,
    step: 100,
    unit: '€',
  },
  {
    id: 'rating',
    label: 'Customer Rating',
    icon: Star,
    type: 'radio',
    options: [
      { id: '4plus', label: '4★ & above', count: 234 },
      { id: '3plus', label: '3★ & above', count: 412 },
      { id: '2plus', label: '2★ & above', count: 567 },
      { id: 'all', label: 'All ratings', count: 891 },
    ],
  },
  {
    id: 'availability',
    label: 'Availability',
    icon: Truck,
    type: 'checkbox',
    options: [
      { id: 'in-stock', label: 'In Stock', count: 678 },
      { id: 'ready-24h', label: 'Ready in 24h', count: 234 },
      { id: 'ready-week', label: 'Ready in 1 week', count: 456 },
      { id: 'pre-order', label: 'Pre-order', count: 89 },
    ],
  },
  {
    id: 'condition',
    label: 'Condition',
    icon: Shield,
    type: 'checkbox',
    options: [
      { id: 'new', label: 'New', count: 789 },
      { id: 'refurbished', label: 'Refurbished', count: 123 },
      { id: 'used', label: 'Used', count: 234 },
    ],
  },
]

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters = defaultFilters,
  activeFilters,
  onFilterChange,
  onClearAll,
  productCount,
  className,
  isMobile = false,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filters?.map((f) => f.id))
  )
  const [_priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 10000])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet?.has(groupId)) {
        newSet?.delete(groupId)
      } else {
        newSet?.add(groupId)
      }
      return newSet
    })
  }

  const handleCheckboxChange = (groupId: string, optionId: string, label: string) => {
    const existing = activeFilters?.find((f) => f.groupId === groupId && f.optionId === optionId)

    let newFilters: ActiveFilter[]
    if (existing) {
      newFilters = activeFilters?.filter((f) => !(f.groupId === groupId && f.optionId === optionId))
    } else {
      newFilters = [...activeFilters, { groupId, optionId, label }]
    }

    onFilterChange(newFilters)
  }

  const handleRadioChange = (groupId: string, optionId: string, label: string) => {
    const newFilters = activeFilters?.filter((f) => f.groupId !== groupId)
    newFilters?.push({ groupId, optionId, label })
    onFilterChange(newFilters)
  }

  const handlePriceChange = (value: [number, number]) => {
    setTempPriceRange(value)
  }

  const applyPriceFilter = () => {
    setPriceRange(tempPriceRange)
    const newFilters = activeFilters?.filter((f) => f.groupId !== 'price')
    if (tempPriceRange?.[0] > 0 || tempPriceRange?.[1] < 10000) {
      newFilters?.push({
        groupId: 'price',
        value: { min: tempPriceRange?.[0], max: tempPriceRange?.[1] },
        label: `€${tempPriceRange?.[0]} - €${tempPriceRange?.[1]}`,
      })
    }
    onFilterChange(newFilters)
  }

  const removeFilter = (filter: ActiveFilter) => {
    const newFilters = activeFilters?.filter(
      (f) => !(f.groupId === filter.groupId && f.optionId === filter.optionId)
    )
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    onFilterChange([])
    setPriceRange([0, 10000])
    setTempPriceRange([0, 10000])
    onClearAll?.()
  }

  const isFilterActive = (groupId: string, optionId?: string): boolean => {
    return activeFilters?.some(
      (f) => f.groupId === groupId && (!optionId || f.optionId === optionId)
    )
  }

  return (
    <div className={cn('bg-white', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
            {productCount !== undefined && (
              <span className="text-sm text-gray-500">({productCount})</span>
            )}
          </div>
          {activeFilters.length > 0 && (
            <button onClick={clearAllFilters} className="text-sm text-blue-600 hover:text-blue-700">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {activeFilters?.map((filter, index) => (
              <span
                key={`${filter.groupId}-${filter.optionId}-${index}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(filter)}
                  className="p-0.5 hover:bg-blue-100 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Groups */}
      <div className="divide-y divide-gray-200">
        {filters?.map((group) => {
          const Icon = group.icon
          const isExpanded = expandedGroups?.has(group.id)

          return (
            <div key={group.id} className="p-4">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                  <h3 className="font-medium text-gray-900">{group.label}</h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-2">
                  {/* Checkbox Options */}
                  {group.type === 'checkbox' &&
                    group.options?.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isFilterActive(group.id, option.id)}
                          onChange={() => handleCheckboxChange(group.id, option.id, option.label)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-sm text-gray-700">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-gray-500">({option.count})</span>
                        )}
                      </label>
                    ))}

                  {/* Radio Options */}
                  {group.type === 'radio' &&
                    group.options?.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded"
                      >
                        <input
                          type="radio"
                          name={group.id}
                          checked={isFilterActive(group.id, option.id)}
                          onChange={() => handleRadioChange(group.id, option.id, option.label)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-sm text-gray-700">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-gray-500">({option.count})</span>
                        )}
                      </label>
                    ))}

                  {/* Range Slider */}
                  {group.type === 'range' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {group.unit}
                          {tempPriceRange?.[0]}
                        </span>
                        <span className="text-sm text-gray-600">
                          {group.unit}
                          {tempPriceRange?.[1]}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={group.min}
                          max={group.max}
                          step={group.step}
                          value={tempPriceRange?.[0]}
                          onChange={(e) =>
                            handlePriceChange([parseInt(e?.target?.value, 10), tempPriceRange?.[1]])
                          }
                          className="w-full"
                        />
                        <input
                          type="range"
                          min={group.min}
                          max={group.max}
                          step={group.step}
                          value={tempPriceRange?.[1]}
                          onChange={(e) =>
                            handlePriceChange([tempPriceRange?.[0], parseInt(e?.target?.value, 10)])
                          }
                          className="w-full"
                        />
                      </div>
                      <button
                        onClick={applyPriceFilter}
                        className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Apply Price Filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile Apply Button */}
      {isMobile && (
        <div className="sticky bottom-0 p-4 bg-white border-t border-gray-200">
          <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Apply Filters
            {productCount !== undefined && ` (${productCount})`}
          </button>
        </div>
      )}
    </div>
  )
}
