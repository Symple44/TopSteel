'use client'
import { AlertCircle, AlertTriangle, Info, Package, Search, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
export interface MaterialSpecification {
  property: string
  value: string | number
  unit?: string
  tolerance?: string
}
export interface Material {
  id: string
  code: string
  name: string
  category: string
  subcategory?: string
  description?: string
  specifications: MaterialSpecification[]
  stockQuantity: number
  availableQuantity: number
  reservedQuantity: number
  unit: string
  unitPrice?: number
  currency?: string
  supplier?: {
    id: string
    name: string
  }
  location?: {
    warehouse: string
    zone: string
    position: string
  }
  status: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued'
  quality: 'standard' | 'premium' | 'custom'
  certifications?: string[]
  dimensions?: {
    length?: number
    width?: number
    height?: number
    diameter?: number
    thickness?: number
    weight?: number
  }
  hazardous?: boolean
  minimumOrderQuantity?: number
  leadTime?: number
  lastUpdated: Date
}
export interface MaterialSelection {
  material: Material
  quantity: number
  notes?: string
}
interface MaterialsMultiSelectProps {
  value?: MaterialSelection[]
  onChange?: (value: MaterialSelection[]) => void
  materials?: Material[]
  onMaterialSearch?: (query: string) => Promise<Material[]>
  onQuantityValidate?: (materialId: string, quantity: number) => boolean
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  placeholder?: string
  showSearch?: boolean
  showSpecifications?: boolean
  showAvailability?: boolean
  showQuantityInput?: boolean
  showSupplierInfo?: boolean
  allowQuantityEdit?: boolean
  maxSelections?: number
  categories?: string[]
  statuses?: Material['status'][]
  qualities?: Material['quality'][]
  className?: string
}
export function MaterialsMultiSelect({
  value = [],
  onChange,
  materials = [],
  onMaterialSearch,
  onQuantityValidate,
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  placeholder = 'Sélectionner des matériaux...',
  showSearch = true,
  showSpecifications = true,
  showAvailability = true,
  showQuantityInput = true,
  showSupplierInfo = false,
  allowQuantityEdit = true,
  maxSelections,
  categories,
  statuses,
  qualities,
  className,
}: MaterialsMultiSelectProps) {
  const [selections, setSelections] = useState<MaterialSelection[]>(value)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Material[]>([])
  const [isSearching, setIsSearching] = useState(false)
  useEffect(() => {
    setSelections(value)
  }, [value])

  const searchMaterials = useCallback(
    async (query: string) => {
      if (!onMaterialSearch || !query.trim()) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const results = await onMaterialSearch(query)
        setSearchResults(results)
      } catch (_error) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [onMaterialSearch]
  )

  useEffect(() => {
    if (onMaterialSearch && searchQuery.trim()) {
      searchMaterials(searchQuery)
    }
  }, [searchQuery, onMaterialSearch, searchMaterials])

  const getFilteredMaterials = () => {
    let filteredMaterials = searchQuery ? searchResults : materials
    if (categories && selectedCategory !== 'all') {
      filteredMaterials = filteredMaterials.filter((m) => m.category === selectedCategory)
    }
    if (statuses && selectedStatus !== 'all') {
      filteredMaterials = filteredMaterials.filter((m) => m.status === selectedStatus)
    }
    // Filter out already selected materials
    const selectedIds = new Set(selections.map((s) => s.material.id))
    return filteredMaterials.filter((m) => !selectedIds.has(m.id))
  }
  const handleMaterialToggle = (material: Material) => {
    if (maxSelections && selections.length >= maxSelections) return
    const newSelection: MaterialSelection = {
      material,
      quantity: material.minimumOrderQuantity || 1,
    }
    const updatedSelections = [...selections, newSelection]
    setSelections(updatedSelections)
    onChange?.(updatedSelections)
  }
  const handleRemoveMaterial = (materialId: string) => {
    const updatedSelections = selections.filter((s) => s.material.id !== materialId)
    setSelections(updatedSelections)
    onChange?.(updatedSelections)
  }
  const handleQuantityChange = (materialId: string, newQuantity: number) => {
    if (onQuantityValidate && !onQuantityValidate(materialId, newQuantity)) {
      return
    }
    const updatedSelections = selections.map((selection) =>
      selection.material.id === materialId ? { ...selection, quantity: newQuantity } : selection
    )
    setSelections(updatedSelections)
    onChange?.(updatedSelections)
    setEditingQuantity(null)
  }
  const getStatusBadge = (status: Material['status']) => {
    const variants = {
      available: { label: 'Disponible', className: 'bg-green-100 text-green-800' },
      low_stock: { label: 'Stock faible', className: 'bg-orange-100 text-orange-800' },
      out_of_stock: { label: 'Rupture', className: 'bg-red-100 text-red-800' },
      discontinued: { label: 'Discontinué', className: 'bg-gray-100 text-gray-800' },
    }
    const variant = variants[status]
    return <Badge className={`${variant.className} text-xs`}>{variant.label}</Badge>
  }
  const getQualityBadge = (quality: Material['quality']) => {
    const variants = {
      standard: { label: 'Standard', className: 'bg-blue-100 text-blue-800' },
      premium: { label: 'Premium', className: 'bg-purple-100 text-purple-800' },
      custom: { label: 'Sur mesure', className: 'bg-yellow-100 text-yellow-800' },
    }
    const variant = variants[quality]
    return <Badge className={`${variant.className} text-xs`}>{variant.label}</Badge>
  }
  const formatPrice = (price?: number, currency = 'EUR') => {
    if (!price) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(price)
  }
  const getAvailabilityInfo = (material: Material) => {
    const { stockQuantity, availableQuantity, reservedQuantity } = material
    return {
      available: availableQuantity,
      reserved: reservedQuantity,
      total: stockQuantity,
      percentage: stockQuantity > 0 ? (availableQuantity / stockQuantity) * 100 : 0,
    }
  }
  const filteredMaterials = getFilteredMaterials()
  const displayText =
    selections.length === 0
      ? placeholder
      : selections.length === 1
        ? selections[0].material.name
        : `${selections.length} matériaux sélectionnés`
  const uniqueCategories = Array.from(new Set(materials.map((m) => m.category)))
  const availableStatuses: Material['status'][] = [
    'available',
    'low_stock',
    'out_of_stock',
    'discontinued',
  ]
  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {maxSelections && (
            <span className="text-sm text-muted-foreground">
              {selections.length}/{maxSelections}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between',
            error && 'border-red-500',
            selections.length === 0 && 'text-muted-foreground'
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <Package className="h-4 w-4" />
        </Button>
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-96 overflow-hidden">
            {/* Search and filters */}
            <div className="p-3 border-b space-y-3">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un matériau..."
                    className="pl-10 h-9"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'available'
                          ? 'Disponible'
                          : status === 'low_stock'
                            ? 'Stock faible'
                            : status === 'out_of_stock'
                              ? 'Rupture'
                              : 'Discontinué'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Materials list */}
            <div className="overflow-auto max-h-80">
              {filteredMaterials.length > 0 ? (
                <div className="p-2 space-y-2">
                  {filteredMaterials.map((material) => {
                    const availability = getAvailabilityInfo(material)
                    const canSelect =
                      !disabled && (!maxSelections || selections.length < maxSelections)
                    return (
                      <div
                        key={material.id}
                        className={cn(
                          'p-3 border rounded-lg hover:bg-muted transition-colors',
                          !canSelect && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox
                                checked={false}
                                onCheckedChange={() => canSelect && handleMaterialToggle(material)}
                                disabled={!canSelect}
                              />
                              <div>
                                <div className="font-medium text-sm">{material.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {material.code} • {material.category}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(material.status)}
                              {getQualityBadge(material.quality)}
                              {material.hazardous && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Dangereux
                                </Badge>
                              )}
                            </div>
                            {showAvailability && (
                              <div className="text-xs text-muted-foreground">
                                Stock: {availability.available}/{availability.total} {material.unit}
                                {material.unitPrice && (
                                  <span className="ml-2">
                                    • {formatPrice(material.unitPrice, material.currency)}/
                                    {material.unit}
                                  </span>
                                )}
                              </div>
                            )}
                            {showSupplierInfo && material.supplier && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Fournisseur: {material.supplier.name}
                              </div>
                            )}
                            {showSpecifications && material.specifications.length > 0 && (
                              <div className="mt-2">
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-muted-foreground">
                                    Spécifications ({material.specifications.length})
                                  </summary>
                                  <div className="mt-1 pl-4 space-y-1">
                                    {material.specifications.slice(0, 3).map((spec, index) => (
                                      <div key={index} className="flex justify-between">
                                        <span>{spec.property}:</span>
                                        <span>
                                          {spec.value}
                                          {spec.unit && ` ${spec.unit}`}
                                        </span>
                                      </div>
                                    ))}
                                    {material.specifications.length > 3 && (
                                      <div className="text-muted-foreground">
                                        +{material.specifications.length - 3} autres...
                                      </div>
                                    )}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  {searchQuery ? 'Aucun matériau trouvé' : 'Aucun matériau disponible'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Selected materials */}
      {selections.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Matériaux sélectionnés ({selections.length})
          </Label>
          <div className="space-y-2">
            {selections.map((selection) => {
              const { material, quantity } = selection
              const availability = getAvailabilityInfo(material)
              const isQuantityValid = quantity <= availability.available
              const isEditingQty = editingQuantity === material.id
              return (
                <div key={material.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4" />
                        <span className="font-medium text-sm">{material.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {material.code}
                        </Badge>
                        {getStatusBadge(material.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        {showQuantityInput && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Quantité:</Label>
                            {isEditingQty && allowQuantityEdit ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={material.minimumOrderQuantity || 1}
                                  max={availability.available}
                                  value={quantity}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value, 10) || 1
                                    handleQuantityChange(material.id, newQty)
                                  }}
                                  className="w-20 h-8"
                                  disabled={disabled}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {material.unit}
                                </span>
                              </div>
                            ) : (
                              <button
                                className={cn(
                                  'text-sm px-2 py-1 rounded border',
                                  allowQuantityEdit && 'hover:bg-muted cursor-pointer',
                                  !isQuantityValid && 'text-red-600 border-red-300'
                                )}
                                onClick={() => allowQuantityEdit && setEditingQuantity(material.id)}
                                disabled={disabled}
                              >
                                {quantity} {material.unit}
                              </button>
                            )}
                            {!isQuantityValid && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                Stock insuffisant
                              </div>
                            )}
                          </div>
                        )}
                        {showAvailability && (
                          <div className="text-xs text-muted-foreground">
                            Disponible: {availability.available} {material.unit}
                          </div>
                        )}
                        {material.unitPrice && (
                          <div className="text-xs text-muted-foreground">
                            Total: {formatPrice(material.unitPrice * quantity, material.currency)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMaterial(material.id)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Summary */}
      {selections.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Résumé</span>
          </div>
          <div className="grid gap-2 text-xs">
            <div>Matériaux sélectionnés: {selections.length}</div>
            {selections.some((s) => s.material.unitPrice) && (
              <div>
                Total estimé:{' '}
                {formatPrice(
                  selections.reduce(
                    (total, s) => total + (s.material.unitPrice || 0) * s.quantity,
                    0
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
