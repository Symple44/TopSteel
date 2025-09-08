'use client'
import { AlertCircle, Check, ChevronsUpDown, Package, Plus, Search, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFormFieldIds } from '../../../../hooks/useFormFieldIds'
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
  id: string
  name: string
  value: string | number
  unit?: string
  required?: boolean
  category?: 'mechanical' | 'chemical' | 'thermal' | 'physical'
}
export interface MaterialCategory {
  id: string
  name: string
  description?: string
  parentId?: string
  level: number
}
export interface Material {
  id: string
  name: string
  code: string
  description?: string
  categoryId: string
  categoryPath?: string[]
  specifications: MaterialSpecification[]
  properties: {
    density?: number
    strength?: number
    hardness?: number
    corrosionResistance?: number
    temperature?: { min: number; max: number }
    certifications?: string[]
  }
  availability: {
    inStock: boolean
    quantity?: number
    unit?: string
    leadTime?: number
    minimumOrder?: number
  }
  pricing: {
    basePrice?: number
    currency?: string
    pricePerUnit?: string
  }
  qualityGrade?: string
  isHazardous?: boolean
  isFavorite?: boolean
  tags?: string[]
  supplier?: string
  imageUrl?: string
}
export interface MaterialSelectorProps {
  value?: string | string[]
  onChange?: (value: string | string[] | undefined) => void
  onMaterialSelect?: (material: Material) => void
  materials?: Material[]
  categories?: MaterialCategory[]
  multiple?: boolean
  searchable?: boolean
  filterable?: boolean
  required?: boolean
  disabled?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  error?: string
  showSpecifications?: boolean
  showAvailability?: boolean
  showPricing?: boolean
  showFavorites?: boolean
  allowCustomEntry?: boolean
  onCustomAdd?: (materialData: Partial<Material>) => Promise<Material>
  filterByCategory?: string
  filterByAvailability?: boolean
  sortBy?: 'name' | 'category' | 'availability' | 'price'
  groupBy?: 'category' | 'supplier' | 'availability'
  className?: string
  maxHeight?: string
}
const MOCK_CATEGORIES: MaterialCategory[] = [
  { id: '1', name: 'Aciers', level: 0, description: "Tous types d'aciers" },
  { id: '1.1', name: 'Aciers au carbone', parentId: '1', level: 1 },
  { id: '1.2', name: 'Aciers inoxydables', parentId: '1', level: 1 },
  { id: '1.3', name: 'Aciers alliés', parentId: '1', level: 1 },
  { id: '2', name: 'Aluminium', level: 0, description: "Alliages d'aluminium" },
  { id: '2.1', name: 'Série 1000', parentId: '2', level: 1 },
  { id: '2.2', name: 'Série 6000', parentId: '2', level: 1 },
  { id: '3', name: 'Cuivre', level: 0, description: 'Cuivre et alliages' },
  { id: '4', name: 'Plastiques', level: 0, description: 'Matériaux plastiques' },
]
const MOCK_MATERIALS: Material[] = [
  {
    id: '1',
    name: 'Acier S235JR',
    code: 'S235JR',
    description: 'Acier de construction non allié',
    categoryId: '1.1',
    categoryPath: ['Aciers', 'Aciers au carbone'],
    specifications: [
      {
        id: '1',
        name: 'Limite élastique',
        value: 235,
        unit: 'MPa',
        category: 'mechanical',
        required: true,
      },
      {
        id: '2',
        name: 'Résistance à la traction',
        value: 340,
        unit: 'MPa',
        category: 'mechanical',
      },
      { id: '3', name: 'Carbone', value: 0.17, unit: '%', category: 'chemical' },
    ],
    properties: {
      density: 7850,
      strength: 340,
      certifications: ['EN 10025-2', 'CE'],
      temperature: { min: -20, max: 350 },
    },
    availability: {
      inStock: true,
      quantity: 2500,
      unit: 'kg',
      leadTime: 2,
      minimumOrder: 100,
    },
    pricing: {
      basePrice: 0.85,
      currency: 'EUR',
      pricePerUnit: '€/kg',
    },
    qualityGrade: 'Standard',
    isHazardous: false,
    isFavorite: true,
    tags: ['construction', 'soudable'],
    supplier: 'ArcelorMittal',
  },
  {
    id: '2',
    name: 'Inox 316L',
    code: '316L',
    description: 'Acier inoxydable austénitique',
    categoryId: '1.2',
    categoryPath: ['Aciers', 'Aciers inoxydables'],
    specifications: [
      { id: '1', name: 'Limite élastique', value: 205, unit: 'MPa', category: 'mechanical' },
      { id: '2', name: 'Chrome', value: 17, unit: '%', category: 'chemical' },
      { id: '3', name: 'Nickel', value: 10, unit: '%', category: 'chemical' },
    ],
    properties: {
      density: 8000,
      strength: 515,
      corrosionResistance: 95,
      certifications: ['EN 10088-2', 'AISI 316L'],
      temperature: { min: -196, max: 800 },
    },
    availability: {
      inStock: true,
      quantity: 750,
      unit: 'kg',
      leadTime: 5,
      minimumOrder: 50,
    },
    pricing: {
      basePrice: 8.5,
      currency: 'EUR',
      pricePerUnit: '€/kg',
    },
    qualityGrade: 'Premium',
    isHazardous: false,
    isFavorite: false,
    tags: ['alimentaire', 'résistant corrosion'],
    supplier: 'Outokumpu',
  },
]
export function MaterialSelector({
  value,
  onChange,
  onMaterialSelect,
  materials = MOCK_MATERIALS,
  categories = MOCK_CATEGORIES,
  multiple = false,
  searchable = true,
  filterable = true,
  required = false,
  disabled = false,
  placeholder = multiple ? 'Sélectionner des matériaux...' : 'Sélectionner un matériau...',
  label,
  helperText,
  error,
  showSpecifications = true,
  showAvailability = true,
  showPricing = false,
  showFavorites = true,
  allowCustomEntry = false,
  onCustomAdd,
  filterByCategory,
  filterByAvailability = false,
  sortBy = 'name',
  groupBy,
  className,
  maxHeight = '400px',
}: MaterialSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(filterByCategory || '')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(filterByAvailability)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const ids = useFormFieldIds(['availableOnly', 'favoritesOnly'])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    multiple && Array.isArray(value) ? value : !multiple && typeof value === 'string' ? [value] : []
  )
  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      setSelectedMaterials(value)
    } else if (!multiple && typeof value === 'string') {
      setSelectedMaterials([value])
    }
  }, [value, multiple])
  const filteredMaterials = useMemo(() => {
    const filtered = materials.filter((material) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          material.name.toLowerCase().includes(searchLower) ||
          material.code.toLowerCase().includes(searchLower) ||
          material.description?.toLowerCase().includes(searchLower) ||
          material.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }
      // Category filter
      if (selectedCategory && material.categoryId !== selectedCategory) {
        return false
      }
      // Availability filter
      if (showOnlyAvailable && !material.availability.inStock) {
        return false
      }
      // Favorites filter
      if (showOnlyFavorites && !material.isFavorite) {
        return false
      }
      return true
    })
    // Sort materials
    switch (sortBy) {
      case 'category':
        filtered.sort((a, b) => a.categoryId.localeCompare(b.categoryId))
        break
      case 'availability':
        filtered.sort((a, b) => {
          if (a.availability.inStock && !b.availability.inStock) return -1
          if (!a.availability.inStock && b.availability.inStock) return 1
          return 0
        })
        break
      case 'price':
        filtered.sort((a, b) => (a.pricing.basePrice || 0) - (b.pricing.basePrice || 0))
        break
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
    }
    return filtered
  }, [materials, searchTerm, selectedCategory, showOnlyAvailable, showOnlyFavorites, sortBy])
  const groupedMaterials = useMemo(() => {
    if (!groupBy) return { '': filteredMaterials }
    const grouped: Record<string, Material[]> = {}
    filteredMaterials.forEach((material) => {
      let groupKey = ''
      switch (groupBy) {
        case 'category':
          groupKey = material.categoryPath?.[0] || 'Sans catégorie'
          break
        case 'supplier':
          groupKey = material.supplier || 'Sans fournisseur'
          break
        case 'availability':
          groupKey = material.availability.inStock ? 'En stock' : 'Non disponible'
          break
      }
      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(material)
    })
    return grouped
  }, [filteredMaterials, groupBy])
  const handleMaterialToggle = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId)
    if (!material) return
    if (multiple) {
      const newSelection = selectedMaterials.includes(materialId)
        ? selectedMaterials.filter((id) => id !== materialId)
        : [...selectedMaterials, materialId]
      setSelectedMaterials(newSelection)
      onChange?.(newSelection)
    } else {
      const newSelection = selectedMaterials.includes(materialId) ? [] : [materialId]
      setSelectedMaterials(newSelection)
      onChange?.(newSelection[0])
      setIsOpen(false)
    }
    onMaterialSelect?.(material)
  }
  const getSelectedMaterialsDisplay = () => {
    if (selectedMaterials.length === 0) return placeholder
    if (multiple) {
      if (selectedMaterials.length === 1) {
        const material = materials.find((m) => m.id === selectedMaterials[0])
        return material?.name || 'Matériau sélectionné'
      }
      return `${selectedMaterials.length} matériaux sélectionnés`
    } else {
      const material = materials.find((m) => m.id === selectedMaterials[0])
      return material?.name || placeholder
    }
  }
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || categoryId
  }
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            'w-full justify-between',
            error && 'border-red-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="truncate">{getSelectedMaterialsDisplay()}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg"
            style={{ maxHeight }}
          >
            <div className="p-3 space-y-3 border-b">
              {/* Search */}
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un matériau..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              )}
              {/* Filters */}
              {filterable && (
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span style={{ paddingLeft: `${category.level * 12}px` }}>
                            {category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={ids.availableOnly}
                      checked={showOnlyAvailable}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          setShowOnlyAvailable(checked)
                        }
                      }}
                    />
                    <Label htmlFor={ids.availableOnly} className="text-sm">
                      En stock
                    </Label>
                  </div>
                  {showFavorites && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={ids.favoritesOnly}
                        checked={showOnlyFavorites}
                        onCheckedChange={(checked) => {
                          if (typeof checked === 'boolean') {
                            setShowOnlyFavorites(checked)
                          }
                        }}
                      />
                      <Label htmlFor={ids.favoritesOnly} className="text-sm">
                        Favoris
                      </Label>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Materials List */}
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(groupedMaterials).map(([groupName, groupMaterials]) => (
                <div key={groupName}>
                  {groupBy && (
                    <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                      {groupName}
                    </div>
                  )}
                  {groupMaterials.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      className={cn(
                        'flex items-start gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 w-full text-left',
                        selectedMaterials.includes(material.id) && 'bg-blue-50'
                      )}
                      onClick={() => handleMaterialToggle(material.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleMaterialToggle(material.id)
                        }
                      }}
                    >
                      <div className="flex items-center mt-0.5">
                        {multiple ? (
                          <Checkbox
                            checked={selectedMaterials.includes(material.id)}
                            disabled
                            aria-readonly="true"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full border flex items-center justify-center">
                            {selectedMaterials.includes(material.id) && (
                              <Check className="w-3 h-3 text-blue-600" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{material.name}</span>
                          <span className="text-sm text-muted-foreground">({material.code})</span>
                          {material.isFavorite && showFavorites && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                          {material.qualityGrade === 'Premium' && (
                            <Badge variant="secondary" className="text-xs">
                              Premium
                            </Badge>
                          )}
                          {material.isHazardous && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Danger
                            </Badge>
                          )}
                        </div>
                        {material.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {material.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{getCategoryName(material.categoryId)}</Badge>
                          {material.supplier && (
                            <Badge variant="outline">{material.supplier}</Badge>
                          )}
                          {material.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {/* Availability Info */}
                        {showAvailability && (
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                material.availability.inStock ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  material.availability.inStock ? 'bg-green-500' : 'bg-red-500'
                                )}
                              />
                              {material.availability.inStock ? 'En stock' : 'Non disponible'}
                              {material.availability.quantity && (
                                <span className="text-muted-foreground">
                                  ({material.availability.quantity} {material.availability.unit})
                                </span>
                              )}
                            </div>
                            {material.availability.leadTime && (
                              <span className="text-muted-foreground">
                                Délai: {material.availability.leadTime}j
                              </span>
                            )}
                          </div>
                        )}
                        {/* Pricing */}
                        {showPricing && material.pricing.basePrice && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Prix: {material.pricing.basePrice} {material.pricing.pricePerUnit}
                          </div>
                        )}
                        {/* Key Specifications */}
                        {showSpecifications && material.specifications.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="text-muted-foreground">Spécs clés: </span>
                            {material.specifications.slice(0, 2).map((spec, idx) => (
                              <span key={spec.id} className="text-muted-foreground">
                                {idx > 0 && ', '}
                                {spec.name}: {spec.value}
                                {spec.unit}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              {filteredMaterials.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun matériau trouvé</p>
                </div>
              )}
            </div>
            {/* Custom Entry */}
            {allowCustomEntry && onCustomAdd && (
              <div className="p-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un nouveau matériau
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {/* Selected Materials Summary */}
      {multiple && selectedMaterials.length > 0 && (
        <div className="mt-2 space-y-1">
          <Label className="text-sm">Matériaux sélectionnés:</Label>
          <div className="flex flex-wrap gap-1">
            {selectedMaterials.map((materialId) => {
              const material = materials.find((m) => m.id === materialId)
              if (!material) return null
              return (
                <Badge key={materialId} variant="secondary" className="text-xs">
                  {material.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMaterialToggle(materialId)
                    }}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
