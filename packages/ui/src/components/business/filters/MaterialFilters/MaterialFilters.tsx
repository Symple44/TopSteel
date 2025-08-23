'use client'
import { useState, useCallback } from 'react'
import { Filter, Package, Wrench, Scale, Factory, X } from 'lucide-react'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { cn } from '../../../../lib/utils'
export type MaterialCategory = 'steel' | 'aluminum' | 'copper' | 'plastic' | 'composite' | 'tools' | 'consumables'
export type MaterialGrade = 'S235' | 'S355' | '316L' | '304' | 'A36' | 'A572' | 'custom'
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order'
export interface MaterialFiltersState {
  search?: string
  categories: MaterialCategory[]
  grades: MaterialGrade[]
  stockStatuses: StockStatus[]
  priceRange?: { min?: number; max?: number }
  weightRange?: { min?: number; max?: number }
  stockRange?: { min?: number; max?: number }
  supplierIds: string[]
  dimensions?: string
  hasSpecifications?: boolean
  isCertified?: boolean
  isHazardous?: boolean
}
interface MaterialFiltersProps {
  value?: MaterialFiltersState
  onChange?: (filters: MaterialFiltersState) => void
  onApply?: (filters: MaterialFiltersState) => void
  disabled?: boolean
  availableSuppliers?: { id: string; name: string }[]
  className?: string
}
const materialCategoryOptions = [
  { value: 'steel', label: 'Acier', icon: Factory },
  { value: 'aluminum', label: 'Aluminium', icon: Package },
  { value: 'copper', label: 'Cuivre', icon: Package },
  { value: 'plastic', label: 'Plastique', icon: Package },
  { value: 'composite', label: 'Composite', icon: Package },
  { value: 'tools', label: 'Outillage', icon: Wrench },
  { value: 'consumables', label: 'Consommables', icon: Package },
]
const materialGradeOptions = [
  { value: 'S235', label: 'S235 JR' },
  { value: 'S355', label: 'S355 JR' },
  { value: '316L', label: '316L (Inox)' },
  { value: '304', label: '304 (Inox)' },
  { value: 'A36', label: 'A36 (ASTM)' },
  { value: 'A572', label: 'A572 (ASTM)' },
  { value: 'custom', label: 'Personnalisé' },
]
const stockStatusOptions = [
  { value: 'in_stock', label: 'En stock', color: 'bg-green-100 text-green-800' },
  { value: 'low_stock', label: 'Stock faible', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'out_of_stock', label: 'Rupture', color: 'bg-red-100 text-red-800' },
  { value: 'on_order', label: 'En commande', color: 'bg-blue-100 text-blue-800' },
]
export function MaterialFilters({
  value,
  onChange,
  onApply,
  disabled = false,
  availableSuppliers = [],
  className,
}: MaterialFiltersProps) {
  const [filters, setFilters] = useState<MaterialFiltersState>(value || {
    categories: [],
    grades: [],
    stockStatuses: [],
    supplierIds: [],
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const updateFilters = useCallback((updates: Partial<MaterialFiltersState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onChange?.(newFilters)
  }, [filters, onChange])
  const toggleArrayValue = <T,>(array: T[], value: T): T[] => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value]
  }
  const handleCategoryToggle = (category: MaterialCategory) => {
    updateFilters({ categories: toggleArrayValue(filters.categories, category) })
  }
  const handleGradeToggle = (grade: MaterialGrade) => {
    updateFilters({ grades: toggleArrayValue(filters.grades, grade) })
  }
  const handleStockStatusToggle = (status: StockStatus) => {
    updateFilters({ stockStatuses: toggleArrayValue(filters.stockStatuses, status) })
  }
  const clearAllFilters = () => {
    const clearedFilters: MaterialFiltersState = {
      categories: [],
      grades: [],
      stockStatuses: [],
      supplierIds: [],
    }
    setFilters(clearedFilters)
    onChange?.(clearedFilters)
  }
  const getActiveFiltersCount = () => {
    return (
      filters.categories.length +
      filters.grades.length +
      filters.stockStatuses.length +
      filters.supplierIds.length +
      (filters.search ? 1 : 0) +
      (filters.priceRange?.min || filters.priceRange?.max ? 1 : 0) +
      (filters.weightRange?.min || filters.weightRange?.max ? 1 : 0) +
      (filters.stockRange?.min || filters.stockRange?.max ? 1 : 0) +
      (filters.dimensions ? 1 : 0) +
      (filters.hasSpecifications ? 1 : 0) +
      (filters.isCertified ? 1 : 0) +
      (filters.isHazardous ? 1 : 0)
    )
  }
  const activeFiltersCount = getActiveFiltersCount()
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres matériaux
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
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
            Effacer
          </Button>
        )}
      </div>
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-6 bg-background">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recherche</Label>
            <Input
              placeholder="Nom, code, description..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Categories */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Catégories
              </Label>
              <div className="space-y-2">
                {materialCategoryOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${option.value}`}
                      checked={filters.categories.includes(option.value as MaterialCategory)}
                      onCheckedChange={() => handleCategoryToggle(option.value as MaterialCategory)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`category-${option.value}`} className="text-sm flex items-center gap-2">
                      <option.icon className="h-3 w-3" />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {/* Grades */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Nuances</Label>
              <div className="space-y-2">
                {materialGradeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${option.value}`}
                      checked={filters.grades.includes(option.value as MaterialGrade)}
                      onCheckedChange={() => handleGradeToggle(option.value as MaterialGrade)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`grade-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {/* Stock Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Statut stock
              </Label>
              <div className="space-y-2">
                {stockStatusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stock-${option.value}`}
                      checked={filters.stockStatuses.includes(option.value as StockStatus)}
                      onCheckedChange={() => handleStockStatusToggle(option.value as StockStatus)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`stock-${option.value}`} className="text-sm">
                      <span className={cn('px-2 py-1 rounded text-xs', option.color)}>
                        {option.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Ranges */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Prix (€)</Label>
              <div className="grid gap-2 grid-cols-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => updateFilters({
                    priceRange: { ...filters.priceRange, min: parseFloat(e.target.value) || undefined }
                  })}
                  disabled={disabled}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => updateFilters({
                    priceRange: { ...filters.priceRange, max: parseFloat(e.target.value) || undefined }
                  })}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Poids (kg)</Label>
              <div className="grid gap-2 grid-cols-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.weightRange?.min || ''}
                  onChange={(e) => updateFilters({
                    weightRange: { ...filters.weightRange, min: parseFloat(e.target.value) || undefined }
                  })}
                  disabled={disabled}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.weightRange?.max || ''}
                  onChange={(e) => updateFilters({
                    weightRange: { ...filters.weightRange, max: parseFloat(e.target.value) || undefined }
                  })}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Stock</Label>
              <div className="grid gap-2 grid-cols-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.stockRange?.min || ''}
                  onChange={(e) => updateFilters({
                    stockRange: { ...filters.stockRange, min: parseFloat(e.target.value) || undefined }
                  })}
                  disabled={disabled}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.stockRange?.max || ''}
                  onChange={(e) => updateFilters({
                    stockRange: { ...filters.stockRange, max: parseFloat(e.target.value) || undefined }
                  })}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
          {/* Dimensions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dimensions</Label>
            <Input
              placeholder="ex: 100x50x5, Ø 20mm, 2000x1000..."
              value={filters.dimensions || ''}
              onChange={(e) => updateFilters({ dimensions: e.target.value })}
              disabled={disabled}
            />
          </div>
          {/* Special Properties */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Propriétés spéciales</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-specifications"
                  checked={filters.hasSpecifications === true}
                  onCheckedChange={(checked) => updateFilters({ hasSpecifications: checked ? true : undefined })}
                  disabled={disabled}
                />
                <Label htmlFor="has-specifications" className="text-sm">Avec spécifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-certified"
                  checked={filters.isCertified === true}
                  onCheckedChange={(checked) => updateFilters({ isCertified: checked ? true : undefined })}
                  disabled={disabled}
                />
                <Label htmlFor="is-certified" className="text-sm">Certifié</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-hazardous"
                  checked={filters.isHazardous === true}
                  onCheckedChange={(checked) => updateFilters({ isHazardous: checked ? true : undefined })}
                  disabled={disabled}
                />
                <Label htmlFor="is-hazardous" className="text-sm">Dangereux</Label>
              </div>
            </div>
          </div>
          {onApply && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => onApply(filters)} disabled={disabled}>
                Appliquer les filtres
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
