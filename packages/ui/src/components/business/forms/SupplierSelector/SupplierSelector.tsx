'use client'
import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Search, Plus, Truck, Package, Star, AlertCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Button } from '../../../primitives/button/Button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../navigation'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../primitives'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
export interface Supplier {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  vatNumber?: string
  status: 'active' | 'inactive' | 'blocked'
  rating?: number // 1-5
  categories?: string[]
  leadTime?: number // in days
  minimumOrder?: number
  paymentTerms?: string
  certifications?: string[]
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  performance?: {
    onTimeDelivery: number // percentage
    qualityScore: number // percentage
    responseTime: number // hours
  }
}
interface SupplierSelectorProps {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  onSupplierCreate?: () => void
  suppliers?: Supplier[]
  loading?: boolean
  error?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  showRating?: boolean
  showPerformance?: boolean
  showCreateButton?: boolean
  filterByStatus?: Supplier['status'][]
  filterByCategories?: string[]
  minRating?: number
  maxSelections?: number
  className?: string
}
export function SupplierSelector({
  value,
  onChange,
  onSupplierCreate,
  suppliers = [],
  loading = false,
  error,
  multiple = false,
  required = false,
  disabled = false,
  placeholder = "Sélectionner un fournisseur...",
  label,
  helperText,
  showRating = true,
  showPerformance = false,
  showCreateButton = true,
  filterByStatus,
  filterByCategories,
  minRating,
  maxSelections,
  className,
}: SupplierSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  )
  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      setSelectedSuppliers(value)
    } else if (!multiple && typeof value === 'string') {
      setSelectedSuppliers(value ? [value] : [])
    }
  }, [value, multiple])
  const filteredSuppliers = suppliers.filter(supplier => {
    if (filterByStatus && !filterByStatus.includes(supplier.status)) return false
    if (filterByCategories && supplier.categories) {
      const hasCategory = filterByCategories.some(cat => 
        supplier.categories?.includes(cat)
      )
      if (!hasCategory) return false
    }
    if (minRating && supplier.rating && supplier.rating < minRating) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      supplier.name.toLowerCase().includes(query) ||
      supplier.code.toLowerCase().includes(query) ||
      supplier.email?.toLowerCase().includes(query) ||
      supplier.categories?.some(cat => cat.toLowerCase().includes(query))
    )
  })
  const handleSelect = useCallback((supplierId: string) => {
    if (multiple) {
      const newSelection = selectedSuppliers.includes(supplierId)
        ? selectedSuppliers.filter(id => id !== supplierId)
        : [...selectedSuppliers, supplierId]
      if (maxSelections && newSelection.length > maxSelections) {
        return
      }
      setSelectedSuppliers(newSelection)
      onChange?.(newSelection)
    } else {
      setSelectedSuppliers([supplierId])
      onChange?.(supplierId)
      setOpen(false)
    }
  }, [selectedSuppliers, multiple, maxSelections, onChange])
  const getSelectedSuppliersDisplay = () => {
    if (selectedSuppliers.length === 0) return placeholder
    if (multiple) {
      if (selectedSuppliers.length === 1) {
        const supplier = suppliers.find(s => s.id === selectedSuppliers[0])
        return supplier?.name || 'Fournisseur sélectionné'
      }
      return `${selectedSuppliers.length} fournisseurs sélectionnés`
    } else {
      const supplier = suppliers.find(s => s.id === selectedSuppliers[0])
      return supplier?.name || 'Fournisseur sélectionné'
    }
  }
  const getStatusBadge = (status: Supplier['status']) => {
    const variants = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-800' },
      blocked: { label: 'Bloqué', className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[status]
    return <Badge className={`${variant.className} text-xs`}>{variant.label}</Badge>
  }
  const renderRating = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3 w-3',
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            )}
          />
        ))}
      </div>
    )
  }
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    // Sort by rating first if available
    if (a.rating && b.rating) {
      return b.rating - a.rating
    }
    // Then by name
    return a.name.localeCompare(b.name)
  })
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="supplier-selector">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="supplier-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              error && 'border-red-500',
              !selectedSuppliers.length && 'text-muted-foreground'
            )}
          >
            <span className="truncate">{getSelectedSuppliersDisplay()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Rechercher un fournisseur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm">
                Aucun fournisseur trouvé.
                {showCreateButton && onSupplierCreate && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setOpen(false)
                      onSupplierCreate()
                    }}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un nouveau fournisseur
                  </Button>
                )}
              </CommandEmpty>
              {loading ? (
                <div className="py-6 text-center text-sm">
                  <div className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  <p className="mt-2">Chargement des fournisseurs...</p>
                </div>
              ) : (
                <CommandGroup>
                  {sortedSuppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.id}
                      onSelect={() => handleSelect(supplier.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {supplier.code}
                              {supplier.categories && supplier.categories.length > 0 && (
                                <> • {supplier.categories.slice(0, 2).join(', ')}</>  
                              )}
                            </div>
                            {supplier.leadTime && (
                              <div className="text-xs text-muted-foreground">
                                Délai: {supplier.leadTime} jours
                                {supplier.minimumOrder && (
                                  <> • Min: {supplier.minimumOrder}€</>
                                )}
                              </div>
                            )}
                            {showPerformance && supplier.performance && (
                              <div className="flex gap-3 mt-1 text-xs">
                                <span className="text-green-600">
                                  Ponctualité: {supplier.performance.onTimeDelivery}%
                                </span>
                                <span className="text-blue-600">
                                  Qualité: {supplier.performance.qualityScore}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {showRating && renderRating(supplier.rating)}
                          {getStatusBadge(supplier.status)}
                          {selectedSuppliers.includes(supplier.id) && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            {showCreateButton && onSupplierCreate && (
              <div className="border-t p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    onSupplierCreate()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un nouveau fournisseur
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      {helperText && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {multiple && maxSelections && (
        <p className="text-xs text-muted-foreground">
          {selectedSuppliers.length}/{maxSelections} sélections maximum
        </p>
      )}
    </div>
  )
}
