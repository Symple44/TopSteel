'use client'

import { FileText, Package, Plus, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../primitives/button'
import { HierarchicalDataTable } from './HierarchicalDataTable'
import type { ColumnConfig } from './types'
import { useHierarchicalPreferences } from './use-hierarchical-preferences'
import type { HierarchicalDatatableConfig, HierarchicalItem } from './use-hierarchical-reorder'

// Interface pour les éléments de devis hiérarchiques
interface QuotationItem extends HierarchicalItem {
  id: string
  parent_id?: string | null
  level?: number
  display_order?: number
  children?: QuotationItem[]

  // Données métier
  code: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  category: 'material' | 'labor' | 'equipment' | 'service'
  notes?: string
  is_optional: boolean
}

// Données d'exemple pour un devis hiérarchique
const mockQuotationData: QuotationItem[] = [
  {
    id: 'item-1',
    parent_id: null,
    level: 0,
    display_order: 1,
    code: 'STRUCT-001',
    description: 'Structure principale',
    quantity: 1,
    unit: 'ens',
    unit_price: 25000,
    total_price: 25000,
    category: 'material',
    is_optional: false,
    children: [],
  },
  {
    id: 'item-1-1',
    parent_id: 'item-1',
    level: 1,
    display_order: 1,
    code: 'BEAM-001',
    description: 'Poutres principales IPE 300',
    quantity: 12,
    unit: 'ml',
    unit_price: 85,
    total_price: 1020,
    category: 'material',
    is_optional: false,
    children: [],
  },
  {
    id: 'item-1-2',
    parent_id: 'item-1',
    level: 1,
    display_order: 2,
    code: 'COLUMN-001',
    description: 'Colonnes HEA 200',
    quantity: 8,
    unit: 'ml',
    unit_price: 120,
    total_price: 960,
    category: 'material',
    is_optional: false,
    children: [],
  },
  {
    id: 'item-1-2-1',
    parent_id: 'item-1-2',
    level: 2,
    display_order: 1,
    code: 'ANCR-001',
    description: 'Ancrages chimiques',
    quantity: 32,
    unit: 'u',
    unit_price: 15,
    total_price: 480,
    category: 'material',
    is_optional: false,
    children: [],
  },
  {
    id: 'item-2',
    parent_id: null,
    level: 0,
    display_order: 2,
    code: 'WELD-001',
    description: 'Soudure et assemblage',
    quantity: 1,
    unit: 'ens',
    unit_price: 8500,
    total_price: 8500,
    category: 'labor',
    is_optional: false,
    children: [],
  },
  {
    id: 'item-2-1',
    parent_id: 'item-2',
    level: 1,
    display_order: 1,
    code: 'WELD-STRUCT',
    description: 'Soudure structure principale',
    quantity: 45,
    unit: 'h',
    unit_price: 85,
    total_price: 3825,
    category: 'labor',
    is_optional: false,
    children: [],
  },
  {
    id: 'item-3',
    parent_id: null,
    level: 0,
    display_order: 3,
    code: 'PAINT-001',
    description: 'Traitement de surface',
    quantity: 1,
    unit: 'ens',
    unit_price: 3200,
    total_price: 3200,
    category: 'service',
    is_optional: true,
    children: [],
  },
]

// Configuration des colonnes pour le devis
const quotationColumns: ColumnConfig<QuotationItem>[] = [
  {
    id: 'code',
    key: 'code',
    title: 'Code',
    type: 'text',
    width: 120,
    sortable: true,
    searchable: true,
    visible: true,
  },
  {
    id: 'description',
    key: 'description',
    title: 'Description',
    type: 'text',
    sortable: true,
    searchable: true,
    visible: true,
    editable: true,
  },
  {
    id: 'category',
    key: 'category',
    title: 'Catégorie',
    type: 'select',
    width: 120,
    options: [
      { value: 'material', label: 'Matériau' },
      { value: 'labor', label: "Main d'œuvre" },
      { value: 'equipment', label: 'Équipement' },
      { value: 'service', label: 'Service' },
    ],
    visible: true,
    editable: true,
    getValue: (item) => {
      const categoryMap = {
        material: 'Matériau',
        labor: "Main d'œuvre",
        equipment: 'Équipement',
        service: 'Service',
      }
      return categoryMap[item.category] || item.category
    },
  },
  {
    id: 'quantity',
    key: 'quantity',
    title: 'Quantité',
    type: 'number',
    width: 100,
    sortable: true,
    visible: true,
    editable: true,
  },
  {
    id: 'unit',
    key: 'unit',
    title: 'Unité',
    type: 'text',
    width: 80,
    visible: true,
    editable: true,
  },
  {
    id: 'unit_price',
    key: 'unit_price',
    title: 'Prix unitaire',
    type: 'number',
    width: 120,
    sortable: true,
    visible: true,
    editable: true,
    getValue: (item) => `${item.unit_price.toFixed(2)} €`,
  },
  {
    id: 'total_price',
    key: 'total_price',
    title: 'Prix total',
    type: 'number',
    width: 120,
    sortable: true,
    visible: true,
    getValue: (item) => `${item.total_price.toFixed(2)} €`,
  },
  {
    id: 'is_optional',
    key: 'is_optional',
    title: 'Optionnel',
    type: 'boolean',
    width: 100,
    visible: true,
    editable: true,
    getValue: (item) => (item.is_optional ? 'Oui' : 'Non'),
  },
]

export function HierarchicalDataTableExample() {
  const [data, setData] = useState<QuotationItem[]>(mockQuotationData)
  const [selectedItems, _setSelectedItems] = useState<QuotationItem[]>([])

  // Utiliser les préférences hiérarchiques
  const {
    config,
    loading: preferencesLoading,
    error: preferencesError,
    savePreferences,
    applyHierarchyOrder,
    updateHierarchyFromData,
  } = useHierarchicalPreferences('quotation-items')

  // Appliquer l'ordre hiérarchique aux données
  const orderedData = useMemo(() => {
    if (!config) return data
    return applyHierarchyOrder(data)
  }, [data, applyHierarchyOrder, config])

  // Gestion des changements de données
  const handleDataChange = (newData: QuotationItem[]) => {
    setData(newData)
    updateHierarchyFromData(newData)
  }

  // Gestion des changements de configuration
  const handleConfigChange = (newConfig: unknown) => {
    if (config) {
      savePreferences(newConfig as HierarchicalDatatableConfig)
    }
  }

  // Gestion du clic sur une ligne
  const handleRowClick = (_item: QuotationItem) => {}

  // Gestion du double-clic sur une ligne
  const handleRowDoubleClick = (_item: QuotationItem) => {}

  // Gestion de l'édition de cellule
  const handleCellEdit = (item: QuotationItem, columnId: string, value: unknown) => {
    const updatedData = data.map((d) => {
      if (d.id === item.id) {
        // Créer un objet typé correctement
        const updatedItem: QuotationItem = { ...d }
        // Mise à jour sécurisée de la propriété
        ;(updatedItem as Record<string, unknown>)[columnId] = value
        return updatedItem
      }
      return d
    })
    handleDataChange(updatedData)
  }

  // Ajout d'un nouvel élément
  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      parent_id: null,
      level: 0,
      display_order: data.length + 1,
      code: `NEW-${Date.now()}`,
      description: 'Nouvel élément',
      quantity: 1,
      unit: 'u',
      unit_price: 0,
      total_price: 0,
      category: 'material',
      is_optional: false,
      children: [],
    }

    handleDataChange([...data, newItem])
  }

  // Calcul du total du devis
  const totalQuotation = useMemo(() => {
    return data.reduce((sum, item) => {
      return sum + (item.is_optional ? 0 : item.total_price)
    }, 0)
  }, [data])

  if (preferencesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des préférences...</div>
      </div>
    )
  }

  if (preferencesError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Erreur: {preferencesError}
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Configuration non disponible</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Devis hiérarchique - Exemple</h2>
          <p className="text-muted-foreground">
            Démonstration du DataTable avec réorganisation hiérarchique
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handleAddItem} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un élément
          </Button>
        </div>
      </div>

      {/* Statistiques du devis */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">Total éléments</div>
              <div className="text-2xl font-bold">{data.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm text-muted-foreground">Éléments obligatoires</div>
              <div className="text-2xl font-bold">{data.filter((d) => !d.is_optional).length}</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-sm text-muted-foreground">Éléments optionnels</div>
              <div className="text-2xl font-bold">{data.filter((d) => d.is_optional).length}</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-full" />
            <div>
              <div className="text-sm text-muted-foreground">Total HT</div>
              <div className="text-2xl font-bold">{totalQuotation.toFixed(2)} €</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table hiérarchique */}
      <HierarchicalDataTable
        data={orderedData}
        columns={quotationColumns}
        config={config}
        onDataChange={handleDataChange}
        onConfigChange={handleConfigChange}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
        onCellEdit={handleCellEdit}
        className="min-h-[600px]"
      />

      {/* Informations de débogage */}
      <details className="bg-muted/50 rounded-lg p-4">
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Summary element has native keyboard support, custom handler for enhanced accessibility */}
        <summary
          className="cursor-pointer font-medium"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.currentTarget.click()
            }
          }}
        >
          Informations de débogage
        </summary>
        <div className="mt-4 space-y-2">
          <div>
            <strong>Éléments sélectionnés:</strong> {selectedItems.length}
          </div>
          <div>
            <strong>Configuration actuelle:</strong>
            <pre className="text-xs bg-background p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </div>
  )
}
