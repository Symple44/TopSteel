'use client'
import { useState, useEffect, useCallback } from 'react'
import { MapPin, Building, Navigation, Crosshair, AlertCircle, Search, Plus, Eye, EyeOff } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Input } from '../../../primitives/input/Input'
import { Button } from '../../../primitives/button/Button'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../primitives/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
}
export interface WarehouseLocation {
  warehouseId: string
  warehouseName: string
  zone?: string
  aisle?: string
  rack?: string
  shelf?: string
  bin?: string
  level?: number
}
export interface LocationAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  region?: string
}
export interface LocationValue {
  warehouse?: WarehouseLocation
  address?: LocationAddress
  gps?: GPSCoordinates
  description?: string
  type: 'warehouse' | 'address' | 'gps' | 'mixed'
}
export interface LocationSuggestion {
  id: string
  label: string
  value: Partial<LocationValue>
  type: 'warehouse' | 'address' | 'recent'
  score?: number
}
export interface LocationValidation {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
  suggestions?: LocationSuggestion[]
}
interface LocationInputProps {
  value?: Partial<LocationValue>
  onChange?: (value: Partial<LocationValue>) => void
  onValidate?: (location: Partial<LocationValue>) => Promise<LocationValidation>
  onGPSDetect?: () => Promise<GPSCoordinates>
  onLocationSearch?: (query: string) => Promise<LocationSuggestion[]>
  onWarehouseSearch?: (query: string) => Promise<WarehouseLocation[]>
  locationType?: LocationValue['type']
  warehouses?: WarehouseLocation[]
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  showGPSDetector?: boolean
  showMap?: boolean
  showValidator?: boolean
  showSuggestions?: boolean
  showRecentLocations?: boolean
  allowCustomWarehouse?: boolean
  maxSuggestions?: number
  recentLocations?: LocationSuggestion[]
  className?: string
}
export function LocationInput({
  value = { type: 'warehouse' },
  onChange,
  onValidate,
  onGPSDetect,
  onLocationSearch,
  onWarehouseSearch,
  locationType = 'warehouse',
  warehouses = [],
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  showGPSDetector = false,
  showMap = false,
  showValidator = true,
  showSuggestions = true,
  showRecentLocations = false,
  allowCustomWarehouse = false,
  maxSuggestions = 5,
  recentLocations = [],
  className,
}: LocationInputProps) {
  const [location, setLocation] = useState<Partial<LocationValue>>(value)
  const [validation, setValidation] = useState<LocationValidation>({ isValid: true })
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isDetectingGPS, setIsDetectingGPS] = useState(false)
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMapPreview, setShowMapPreview] = useState(false)
  useEffect(() => {
    setLocation(value)
  }, [value])
  useEffect(() => {
    if (showValidator && onValidate) {
      performValidation()
    }
  }, [location, onValidate, showValidator])
  const performValidation = useCallback(async () => {
    if (!onValidate) return
    setIsValidating(true)
    try {
      const result = await onValidate(location)
      setValidation(result)
    } catch (error) {
      console.error('Error validating location:', error)
      setValidation({
        isValid: false,
        errors: ['Erreur de validation de la localisation']
      })
    } finally {
      setIsValidating(false)
    }
  }, [location, onValidate])
  const handleLocationChange = (field: keyof LocationValue, newValue: any) => {
    const updatedLocation = {
      ...location,
      [field]: newValue,
    }
    setLocation(updatedLocation)
    onChange?.(updatedLocation)
  }
  const handleWarehouseChange = (field: keyof WarehouseLocation, newValue: string) => {
    const updatedWarehouse = {
      ...location.warehouse,
      [field]: newValue,
    }
    const updatedLocation = {
      ...location,
      warehouse: updatedWarehouse,
    }
    setLocation(updatedLocation)
    onChange?.(updatedLocation)
  }
  const handleAddressChange = (field: keyof LocationAddress, newValue: string) => {
    const updatedAddress = {
      ...location.address,
      [field]: newValue,
    }
    const updatedLocation = {
      ...location,
      address: updatedAddress,
    }
    setLocation(updatedLocation)
    onChange?.(updatedLocation)
  }
  const handleGPSChange = (field: keyof GPSCoordinates, newValue: number) => {
    const updatedGPS = {
      ...location.gps,
      [field]: newValue,
    }
    const updatedLocation = {
      ...location,
      gps: updatedGPS,
    }
    setLocation(updatedLocation)
    onChange?.(updatedLocation)
  }
  const handleGPSDetection = useCallback(async () => {
    if (!onGPSDetect) return
    setIsDetectingGPS(true)
    try {
      const coordinates = await onGPSDetect()
      handleLocationChange('gps', coordinates)
    } catch (error) {
      console.error('Error detecting GPS:', error)
    } finally {
      setIsDetectingGPS(false)
    }
  }, [onGPSDetect])
  const handleLocationSearch = useCallback(async (query: string) => {
    if (!onLocationSearch || !query.trim()) {
      setSuggestions([])
      return
    }
    setIsSearching(true)
    try {
      const results = await onLocationSearch(query)
      setSuggestions(results.slice(0, maxSuggestions))
      setShowSuggestionsList(true)
    } catch (error) {
      console.error('Error searching locations:', error)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [onLocationSearch, maxSuggestions])
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    const updatedLocation = {
      ...location,
      ...suggestion.value,
    }
    setLocation(updatedLocation)
    onChange?.(updatedLocation)
    setShowSuggestionsList(false)
    setSearchQuery('')
  }
  const formatGPSCoordinate = (coord?: number) => {
    return coord?.toFixed(6) || ''
  }
  const getLocationSummary = () => {
    const parts: string[] = []
    if (location.warehouse) {
      const { warehouseName, zone, aisle, rack, shelf } = location.warehouse
      parts.push(warehouseName)
      if (zone) parts.push(`Zone ${zone}`)
      if (aisle) parts.push(`Allée ${aisle}`)
      if (rack) parts.push(`Rack ${rack}`)
      if (shelf) parts.push(`Étagère ${shelf}`)
    }
    if (location.address) {
      const { street, city, postalCode, country } = location.address
      if (street) parts.push(street)
      if (city && postalCode) parts.push(`${postalCode} ${city}`)
      else if (city) parts.push(city)
      if (country) parts.push(country)
    }
    if (location.gps) {
      const { latitude, longitude } = location.gps
      parts.push(`GPS: ${formatGPSCoordinate(latitude)}, ${formatGPSCoordinate(longitude)}`)
    }
    return parts.join(' • ') || 'Aucune localisation définie'
  }
  const renderWarehouseFields = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2">
        <Label className="text-sm">Entrepôt</Label>
        <Select
          value={location.warehouse?.warehouseId || ''}
          onValueChange={(value) => {
            const warehouse = warehouses.find(w => w.warehouseId === value)
            if (warehouse) {
              handleLocationChange('warehouse', warehouse)
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un entrepôt" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.warehouseId} value={warehouse.warehouseId}>
                {warehouse.warehouseName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Zone</Label>
        <Input
          value={location.warehouse?.zone || ''}
          onChange={(e) => handleWarehouseChange('zone', e.target.value)}
          placeholder="Zone..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Allée</Label>
        <Input
          value={location.warehouse?.aisle || ''}
          onChange={(e) => handleWarehouseChange('aisle', e.target.value)}
          placeholder="Allée..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Rack</Label>
        <Input
          value={location.warehouse?.rack || ''}
          onChange={(e) => handleWarehouseChange('rack', e.target.value)}
          placeholder="Rack..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Étagère</Label>
        <Input
          value={location.warehouse?.shelf || ''}
          onChange={(e) => handleWarehouseChange('shelf', e.target.value)}
          placeholder="Étagère..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Casier</Label>
        <Input
          value={location.warehouse?.bin || ''}
          onChange={(e) => handleWarehouseChange('bin', e.target.value)}
          placeholder="Casier..."
          disabled={disabled}
        />
      </div>
    </div>
  )
  const renderAddressFields = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-sm">Adresse</Label>
        <Input
          value={location.address?.street || ''}
          onChange={(e) => handleAddressChange('street', e.target.value)}
          placeholder="Rue, avenue..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Ville</Label>
        <Input
          value={location.address?.city || ''}
          onChange={(e) => handleAddressChange('city', e.target.value)}
          placeholder="Ville..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Code postal</Label>
        <Input
          value={location.address?.postalCode || ''}
          onChange={(e) => handleAddressChange('postalCode', e.target.value)}
          placeholder="Code postal..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Pays</Label>
        <Input
          value={location.address?.country || ''}
          onChange={(e) => handleAddressChange('country', e.target.value)}
          placeholder="Pays..."
          disabled={disabled}
        />
      </div>
    </div>
  )
  const renderGPSFields = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Coordonnées GPS</Label>
        {showGPSDetector && onGPSDetect && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGPSDetection}
            disabled={disabled || isDetectingGPS}
          >
            {isDetectingGPS ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            {isDetectingGPS ? 'Détection...' : 'Détecter'}
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm">Latitude</Label>
          <Input
            type="number"
            step="any"
            value={location.gps?.latitude || ''}
            onChange={(e) => handleGPSChange('latitude', parseFloat(e.target.value) || 0)}
            placeholder="Latitude..."
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Longitude</Label>
          <Input
            type="number"
            step="any"
            value={location.gps?.longitude || ''}
            onChange={(e) => handleGPSChange('longitude', parseFloat(e.target.value) || 0)}
            placeholder="Longitude..."
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex items-center gap-2">
            <Select
              value={location.type}
              onValueChange={(value) => handleLocationChange('type', value as LocationValue['type'])}
              disabled={disabled}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse">Entrepôt</SelectItem>
                <SelectItem value="address">Adresse</SelectItem>
                <SelectItem value="gps">GPS</SelectItem>
                <SelectItem value="mixed">Mixte</SelectItem>
              </SelectContent>
            </Select>
            {showMap && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMapPreview(!showMapPreview)}
              >
                {showMapPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                Carte
              </Button>
            )}
          </div>
        </div>
      )}
      {/* Search */}
      {showSuggestions && onLocationSearch && (
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleLocationSearch(e.target.value)
                }}
                placeholder="Rechercher une localisation..."
                disabled={disabled}
                className="pl-10"
              />
            </div>
            {isSearching && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            )}
          </div>
          {/* Suggestions dropdown */}
          {showSuggestionsList && (suggestions.length > 0 || recentLocations.length > 0) && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div className="flex items-center gap-2">
                        {suggestion.type === 'warehouse' && <Building className="h-4 w-4" />}
                        {suggestion.type === 'address' && <MapPin className="h-4 w-4" />}
                        <span>{suggestion.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showRecentLocations && recentLocations.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                    Récemment utilisées
                  </div>
                  {recentLocations.map((recent) => (
                    <button
                      key={recent.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => handleSuggestionSelect(recent)}
                    >
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        <span>{recent.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Location fields based on type */}
      <div className="space-y-4">
        {(location.type === 'warehouse' || location.type === 'mixed') && renderWarehouseFields()}
        {(location.type === 'address' || location.type === 'mixed') && renderAddressFields()}
        {(location.type === 'gps' || location.type === 'mixed') && renderGPSFields()}
        {/* Description field for all types */}
        <div className="space-y-2">
          <Label className="text-sm">Description (optionnel)</Label>
          <Input
            value={location.description || ''}
            onChange={(e) => handleLocationChange('description', e.target.value)}
            placeholder="Description de la localisation..."
            disabled={disabled}
          />
        </div>
      </div>
      {/* Map preview placeholder */}
      {showMapPreview && location.gps && (
        <div className="p-4 bg-muted rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Aperçu carte</span>
          </div>
          <div className="aspect-video bg-background rounded border flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Carte à {formatGPSCoordinate(location.gps.latitude)}, {formatGPSCoordinate(location.gps.longitude)}</p>
              <p className="text-xs text-muted-foreground mt-1">Intégration carte nécessaire</p>
            </div>
          </div>
        </div>
      )}
      {/* Location summary */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Résumé de la localisation</span>
        </div>
        <p className="text-sm text-muted-foreground">{getLocationSummary()}</p>
      </div>
      {/* Validation status */}
      {showValidator && (
        <div className="space-y-2">
          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
              Validation de la localisation...
            </div>
          )}
          {!isValidating && !validation.isValid && validation.errors && (
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              ))}
            </div>
          )}
          {!isValidating && validation.warnings && validation.warnings.length > 0 && (
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
