'use client'
import { useState, useCallback, useEffect } from 'react'
import { Filter, X, Users, Building, MapPin, Star, Calendar, Euro } from 'lucide-react'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { cn } from '../../../../lib/utils'
export type ClientType = 'individual' | 'company' | 'government' | 'nonprofit'
export type ClientStatus = 'active' | 'inactive' | 'pending' | 'blocked'
export type ClientSegment = 'small' | 'medium' | 'large' | 'enterprise'
export type PaymentTerms = 'immediate' | '15_days' | '30_days' | '45_days' | '60_days' | '90_days'
export interface ClientFiltersState {
  search?: string
  types: ClientType[]
  statuses: ClientStatus[]
  segments: ClientSegment[]
  paymentTerms: PaymentTerms[]
  cities: string[]
  regions: string[]
  countries: string[]
  createdDateRange?: {
    from?: string
    to?: string
  }
  lastOrderDateRange?: {
    from?: string
    to?: string
  }
  totalOrdersRange?: {
    min?: number
    max?: number
  }
  totalRevenueRange?: {
    min?: number
    max?: number
  }
  tags: string[]
  hasActiveProjects?: boolean
  hasOutstandingInvoices?: boolean
  creditLimitRange?: {
    min?: number
    max?: number
  }
}
interface ClientFiltersProps {
  value?: ClientFiltersState
  onChange?: (filters: ClientFiltersState) => void
  onApply?: (filters: ClientFiltersState) => void
  disabled?: boolean
  showAdvanced?: boolean
  availableRegions?: string[]
  availableCities?: string[]
  availableCountries?: string[]
  availableTags?: string[]
  className?: string
}
const clientTypeOptions = [
  { value: 'individual', label: 'Particulier', icon: Users },
  { value: 'company', label: 'Entreprise', icon: Building },
  { value: 'government', label: 'Gouvernement', icon: Building },
  { value: 'nonprofit', label: 'Association', icon: Users },
]
const clientStatusOptions = [
  { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactif', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'blocked', label: 'Bloqué', color: 'bg-red-100 text-red-800' },
]
const clientSegmentOptions = [
  { value: 'small', label: 'Petit', description: '< 10 employés' },
  { value: 'medium', label: 'Moyen', description: '10-100 employés' },
  { value: 'large', label: 'Grande', description: '100-1000 employés' },
  { value: 'enterprise', label: 'Entreprise', description: '> 1000 employés' },
]
const paymentTermsOptions = [
  { value: 'immediate', label: 'Immédiat' },
  { value: '15_days', label: '15 jours' },
  { value: '30_days', label: '30 jours' },
  { value: '45_days', label: '45 jours' },
  { value: '60_days', label: '60 jours' },
  { value: '90_days', label: '90 jours' },
]
export function ClientFilters({
  value,
  onChange,
  onApply,
  disabled = false,
  showAdvanced = false,
  availableRegions = [],
  availableCities = [],
  availableCountries = [],
  availableTags = [],
  className,
}: ClientFiltersProps) {
  const [filters, setFilters] = useState<ClientFiltersState>(value || {
    types: [],
    statuses: [],
    segments: [],
    paymentTerms: [],
    cities: [],
    regions: [],
    countries: [],
    tags: [],
  })
  const [isExpanded, setIsExpanded] = useState(showAdvanced)
  useEffect(() => {
    setFilters(value || {
      types: [],
      statuses: [],
      segments: [],
      paymentTerms: [],
      cities: [],
      regions: [],
      countries: [],
      tags: [],
    })
  }, [value])
  const updateFilters = useCallback((updates: Partial<ClientFiltersState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onChange?.(newFilters)
  }, [filters, onChange])
  const toggleArrayValue = useCallback(<T,>(array: T[], value: T): T[] => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value]
  }, [])
  const handleTypeToggle = useCallback((type: ClientType) => {
    updateFilters({ types: toggleArrayValue(filters.types, type) })
  }, [filters.types, toggleArrayValue, updateFilters])
  const handleStatusToggle = useCallback((status: ClientStatus) => {
    updateFilters({ statuses: toggleArrayValue(filters.statuses, status) })
  }, [filters.statuses, toggleArrayValue, updateFilters])
  const handleSegmentToggle = useCallback((segment: ClientSegment) => {
    updateFilters({ segments: toggleArrayValue(filters.segments, segment) })
  }, [filters.segments, toggleArrayValue, updateFilters])
  const handlePaymentTermsToggle = useCallback((terms: PaymentTerms) => {
    updateFilters({ paymentTerms: toggleArrayValue(filters.paymentTerms, terms) })
  }, [filters.paymentTerms, toggleArrayValue, updateFilters])
  const handleLocationChange = useCallback((type: 'cities' | 'regions' | 'countries', value: string) => {
    if (value && !filters[type].includes(value)) {
      updateFilters({ [type]: [...filters[type], value] })
    }
  }, [filters, updateFilters])
  const removeLocationFilter = useCallback((type: 'cities' | 'regions' | 'countries', value: string) => {
    updateFilters({ [type]: filters[type].filter(item => item !== value) })
  }, [filters, updateFilters])
  const handleTagChange = useCallback((tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      updateFilters({ tags: [...filters.tags, tag] })
    }
  }, [filters.tags, updateFilters])
  const removeTag = useCallback((tag: string) => {
    updateFilters({ tags: filters.tags.filter(item => item !== tag) })
  }, [filters.tags, updateFilters])
  const clearAllFilters = useCallback(() => {
    const clearedFilters: ClientFiltersState = {
      types: [],
      statuses: [],
      segments: [],
      paymentTerms: [],
      cities: [],
      regions: [],
      countries: [],
      tags: [],
    }
    setFilters(clearedFilters)
    onChange?.(clearedFilters)
  }, [onChange])
  const getActiveFiltersCount = useCallback(() => {
    return (
      filters.types.length +
      filters.statuses.length +
      filters.segments.length +
      filters.paymentTerms.length +
      filters.cities.length +
      filters.regions.length +
      filters.countries.length +
      filters.tags.length +
      (filters.search ? 1 : 0) +
      (filters.hasActiveProjects !== undefined ? 1 : 0) +
      (filters.hasOutstandingInvoices !== undefined ? 1 : 0) +
      (filters.createdDateRange?.from || filters.createdDateRange?.to ? 1 : 0) +
      (filters.lastOrderDateRange?.from || filters.lastOrderDateRange?.to ? 1 : 0) +
      (filters.totalOrdersRange?.min || filters.totalOrdersRange?.max ? 1 : 0) +
      (filters.totalRevenueRange?.min || filters.totalRevenueRange?.max ? 1 : 0) +
      (filters.creditLimitRange?.min || filters.creditLimitRange?.max ? 1 : 0)
    )
  }, [filters])
  const activeFiltersCount = getActiveFiltersCount()
  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Toggle & Summary */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres clients
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            Effacer tout
          </Button>
        )}
      </div>
      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-6 bg-background">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recherche</Label>
            <Input
              type="text"
              placeholder="Nom, email, téléphone, référence..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Client Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Type de client
              </Label>
              <div className="space-y-2">
                {clientTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={filters.types.includes(option.value as ClientType)}
                      onCheckedChange={() => handleTypeToggle(option.value as ClientType)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`type-${option.value}`} className="text-sm flex items-center gap-2">
                      <option.icon className="h-3 w-3" />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {/* Client Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Statut</Label>
              <div className="space-y-2">
                {clientStatusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.statuses.includes(option.value as ClientStatus)}
                      onCheckedChange={() => handleStatusToggle(option.value as ClientStatus)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm">
                      <span className={cn('px-2 py-1 rounded text-xs', option.color)}>
                        {option.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {/* Client Segment */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Segment</Label>
              <div className="space-y-2">
                {clientSegmentOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`segment-${option.value}`}
                      checked={filters.segments.includes(option.value as ClientSegment)}
                      onCheckedChange={() => handleSegmentToggle(option.value as ClientSegment)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`segment-${option.value}`} className="text-sm">
                      <div>
                        <div>{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Location Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localisation
            </Label>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs">Pays</Label>
                <Select onValueChange={(value) => handleLocationChange('countries', value)} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pays..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                  {filters.countries.map((country) => (
                    <Badge key={country} variant="secondary" className="text-xs">
                      {country}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeLocationFilter('countries', country)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Région</Label>
                <Select onValueChange={(value) => handleLocationChange('regions', value)} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une région..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                  {filters.regions.map((region) => (
                    <Badge key={region} variant="secondary" className="text-xs">
                      {region}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeLocationFilter('regions', region)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Ville</Label>
                <Select onValueChange={(value) => handleLocationChange('cities', value)} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ville..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                  {filters.cities.map((city) => (
                    <Badge key={city} variant="secondary" className="text-xs">
                      {city}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeLocationFilter('cities', city)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Payment Terms */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Conditions de paiement
            </Label>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
              {paymentTermsOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`payment-${option.value}`}
                    checked={filters.paymentTerms.includes(option.value as PaymentTerms)}
                    onCheckedChange={() => handlePaymentTermsToggle(option.value as PaymentTerms)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`payment-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          {/* Date Ranges */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de création
              </Label>
              <div className="grid gap-2 grid-cols-2">
                <div>
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={filters.createdDateRange?.from || ''}
                    onChange={(e) => updateFilters({
                      createdDateRange: { ...filters.createdDateRange, from: e.target.value }
                    })}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label className="text-xs">À</Label>
                  <Input
                    type="date"
                    value={filters.createdDateRange?.to || ''}
                    onChange={(e) => updateFilters({
                      createdDateRange: { ...filters.createdDateRange, to: e.target.value }
                    })}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Dernière commande</Label>
              <div className="grid gap-2 grid-cols-2">
                <div>
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={filters.lastOrderDateRange?.from || ''}
                    onChange={(e) => updateFilters({
                      lastOrderDateRange: { ...filters.lastOrderDateRange, from: e.target.value }
                    })}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label className="text-xs">À</Label>
                  <Input
                    type="date"
                    value={filters.lastOrderDateRange?.to || ''}
                    onChange={(e) => updateFilters({
                      lastOrderDateRange: { ...filters.lastOrderDateRange, to: e.target.value }
                    })}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Special Conditions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Conditions spéciales</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-active-projects"
                  checked={filters.hasActiveProjects === true}
                  onCheckedChange={(checked) => updateFilters({ 
                    hasActiveProjects: checked ? true : undefined 
                  })}
                  disabled={disabled}
                />
                <Label htmlFor="has-active-projects" className="text-sm">
                  A des projets actifs
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-outstanding-invoices"
                  checked={filters.hasOutstandingInvoices === true}
                  onCheckedChange={(checked) => updateFilters({ 
                    hasOutstandingInvoices: checked ? true : undefined 
                  })}
                  disabled={disabled}
                />
                <Label htmlFor="has-outstanding-invoices" className="text-sm">
                  A des factures impayées
                </Label>
              </div>
            </div>
          </div>
          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Tags
              </Label>
              <Select onValueChange={handleTagChange} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Ajouter un tag..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTags
                    .filter(tag => !filters.tags.includes(tag))
                    .map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1">
                {filters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {/* Apply Button */}
          {onApply && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => onApply(filters)}
                disabled={disabled}
              >
                Appliquer les filtres
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
