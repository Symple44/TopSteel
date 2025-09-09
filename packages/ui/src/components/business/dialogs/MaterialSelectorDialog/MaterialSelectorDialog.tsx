'use client'
import { Check, Filter, Package, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useUniqueId } from '../../../../hooks/useFormFieldIds'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'

interface Material {
  id: string
  reference: string
  name: string
  description?: string
  category: string
  type: string
  grade?: string
  unit: string
  unitPrice: number
  stockQuantity: number
  minStock: number
  supplier?: string
  location?: string
  isActive: boolean
  properties: {
    tensileStrength?: number
    yieldStrength?: number
    corrosionResistance?: string
  }
}
interface MaterialSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (materials: Material[]) => void
  multiSelect?: boolean
  materials?: Material[]
  selectedMaterialIds?: string[]
  title?: string
  allowQuantitySelection?: boolean
}
interface MaterialSelection {
  material: Material
  quantity: number
}
export function MaterialSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  multiSelect = false,
  materials = [],
  selectedMaterialIds = [],
  title = 'Sélectionner un matériau',
  allowQuantitySelection = false,
}: MaterialSelectorDialogProps) {
  // Generate unique IDs for checkboxes
  const inStockCheckboxId = useUniqueId('inStock')
  const activeCheckboxId = useUniqueId('active')

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [showOnlyActive, setShowOnlyActive] = useState(true)
  const [selected, setSelected] = useState<MaterialSelection[]>([])
  // Mock data for demonstration
  const mockMaterials: Material[] = useMemo(
    () => [
      {
        id: '1',
        reference: 'ACR-S235-001',
        name: 'Barre ronde acier S235',
        description: 'Barre ronde en acier de construction',
        category: 'acier',
        type: 'barre',
        grade: 'S235JR',
        unit: 'kg',
        unitPrice: 1.25,
        stockQuantity: 500,
        minStock: 50,
        supplier: 'ArcelorMittal',
        location: 'A-1-01',
        isActive: true,
        properties: {
          tensileStrength: 360,
          yieldStrength: 235,
          corrosionResistance: 'faible',
        },
      },
      {
        id: '2',
        reference: 'INX-316L-002',
        name: 'Tôle inox 316L',
        description: 'Tôle en acier inoxydable 316L',
        category: 'inox',
        type: 'tole',
        grade: '316L',
        unit: 'm2',
        unitPrice: 15.8,
        stockQuantity: 25,
        minStock: 10,
        supplier: 'Outokumpu',
        location: 'B-2-03',
        isActive: true,
        properties: {
          tensileStrength: 520,
          yieldStrength: 210,
          corrosionResistance: 'tres-elevee',
        },
      },
      {
        id: '3',
        reference: 'ALU-6061-003',
        name: 'Tube aluminium 6061',
        description: 'Tube rond en aluminium 6061-T6',
        category: 'aluminium',
        type: 'tube',
        grade: '6061-T6',
        unit: 'm',
        unitPrice: 8.5,
        stockQuantity: 0,
        minStock: 20,
        supplier: 'Hydro',
        location: 'C-1-02',
        isActive: true,
        properties: {
          tensileStrength: 310,
          yieldStrength: 270,
          corrosionResistance: 'elevee',
        },
      },
    ],
    []
  )
  const availableMaterials = materials.length > 0 ? materials : mockMaterials
  // Initialize selected materials
  useEffect(() => {
    if (open && selectedMaterialIds.length > 0) {
      const initialSelected = selectedMaterialIds
        .map((id) => availableMaterials.find((m) => m.id === id))
        .filter((m): m is Material => m !== undefined)
        .map((material) => ({ material, quantity: 1 }))
      setSelected(initialSelected)
    } else if (open) {
      setSelected([])
    }
  }, [open, selectedMaterialIds, availableMaterials])
  // Filter materials based on search and filters
  const filteredMaterials = useMemo(() => {
    return availableMaterials.filter((material) => {
      const matchesSearch =
        searchTerm === '' ||
        material.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory
      const matchesType = selectedType === 'all' || material.type === selectedType
      const matchesStock = !showOnlyInStock || material.stockQuantity > 0
      const matchesActive = !showOnlyActive || material.isActive
      return matchesSearch && matchesCategory && matchesType && matchesStock && matchesActive
    })
  }, [
    availableMaterials,
    searchTerm,
    selectedCategory,
    selectedType,
    showOnlyInStock,
    showOnlyActive,
  ])
  // Get unique categories and types
  const categories = useMemo(() => {
    const cats = [...new Set(availableMaterials.map((m) => m.category))]
    return cats.map((cat) => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
  }, [availableMaterials])
  const types = useMemo(() => {
    const typeList = [...new Set(availableMaterials.map((m) => m.type))]
    return typeList.map((type) => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    }))
  }, [availableMaterials])
  const handleMaterialToggle = (material: Material) => {
    if (multiSelect) {
      setSelected((prev) => {
        const existing = prev.find((s) => s.material.id === material.id)
        if (existing) {
          return prev.filter((s) => s.material.id !== material.id)
        } else {
          return [...prev, { material, quantity: 1 }]
        }
      })
    } else {
      const isSelected = selected.some((s) => s.material.id === material.id)
      if (isSelected) {
        setSelected([])
      } else {
        setSelected([{ material, quantity: 1 }])
      }
    }
  }
  const handleQuantityChange = (materialId: string, quantity: number) => {
    setSelected((prev) =>
      prev.map((s) =>
        s.material.id === materialId ? { ...s, quantity: Math.max(1, quantity) } : s
      )
    )
  }
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const materialsToReturn = allowQuantitySelection ? selected : selected.map((s) => s.material)
      await onSelect?.(materialsToReturn as any)
      onOpenChange(false)
      setSelected([])
      setSearchTerm('')
      setSelectedCategory('all')
      setSelectedType('all')
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    if (!loading) {
      setSelected([])
      setSearchTerm('')
      setSelectedCategory('all')
      setSelectedType('all')
      onOpenChange(false)
    }
  }
  const isSelected = (materialId: string) => {
    return selected.some((s) => s.material.id === materialId)
  }
  const getStockStatusColor = (material: Material) => {
    if (material.stockQuantity === 0) return 'text-red-600 bg-red-50'
    if (material.stockQuantity <= material.minStock) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        {/* Search and Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par référence, nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={inStockCheckboxId}
                checked={showOnlyInStock}
                onCheckedChange={(checked) => setShowOnlyInStock(!!checked)}
              />
              <Label htmlFor={inStockCheckboxId} className="text-sm">
                En stock uniquement
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={activeCheckboxId}
                checked={showOnlyActive}
                onCheckedChange={(checked) => setShowOnlyActive(!!checked)}
              />
              <Label htmlFor={activeCheckboxId} className="text-sm">
                Actifs uniquement
              </Label>
            </div>
          </div>
        </div>
        {/* Selected materials summary */}
        {selected.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selected.length} matériau{selected.length > 1 ? 'x' : ''} sélectionné
                {selected.length > 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected([])}
                className="text-blue-700 hover:text-blue-900"
              >
                <X className="w-4 h-4 mr-1" />
                Tout déselectionner
              </Button>
            </div>
          </div>
        )}
        {/* Materials list */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-3">
            {filteredMaterials.map((material) => (
              // biome-ignore lint/a11y/noStaticElementInteractions: This div implements full keyboard navigation, ARIA role button, and tabIndex for complex material selection with nested interactive elements
              // biome-ignore lint/a11y/useSemanticElements: This div uses role="button" with complex nested content including checkboxes and input fields. Using a button element would interfere with nested form controls.
              <div
                key={material.id}
                role="button"
                tabIndex={0}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected(material.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMaterialToggle(material)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleMaterialToggle(material)
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected(material.id)}
                    onChange={() => handleMaterialToggle(material)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{material.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Réf: {material.reference}
                          {material.grade && ` • ${material.grade}`}
                        </p>
                        {material.description && (
                          <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {material.unitPrice.toFixed(2)} €/{material.unit}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {material.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {material.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(material)}`}
                        >
                          Stock: {material.stockQuantity} {material.unit}
                        </span>
                        {material.supplier && (
                          <span className="text-gray-500">Fournisseur: {material.supplier}</span>
                        )}
                        {material.location && (
                          <span className="text-gray-500">Emplacement: {material.location}</span>
                        )}
                      </div>
                      {allowQuantitySelection && isSelected(material.id) && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Quantité:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={
                              selected.find((s) => s.material.id === material.id)?.quantity || 1
                            }
                            onChange={(e) =>
                              handleQuantityChange(material.id, parseInt(e.target.value, 10) || 1)
                            }
                            className="w-20"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                    {/* Technical properties */}
                    {material.properties && (
                      <div className="mt-2 text-xs text-gray-500 flex gap-4">
                        {material.properties.tensileStrength && (
                          <span>Résistance: {material.properties.tensileStrength} MPa</span>
                        )}
                        {material.properties.yieldStrength && (
                          <span>Limite élasticité: {material.properties.yieldStrength} MPa</span>
                        )}
                        {material.properties.corrosionResistance && (
                          <span>Corrosion: {material.properties.corrosionResistance}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredMaterials.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun matériau ne correspond aux critères de recherche</p>
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selected.length === 0}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {loading
              ? 'Sélection en cours...'
              : `Sélectionner ${selected.length > 0 ? `(${selected.length})` : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
