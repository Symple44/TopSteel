'use client'

import type { Material, MaterialFilters as MaterialFiltersType, MaterialType } from '@erp/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'
import type { ColumnConfig } from '@erp/ui/components/data-display/datatable/types'
import { AlertCircle, Download, Package2, Plus, TrendingUp, Upload } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useMaterialStatistics, useMaterials } from '@/hooks/use-materials'
import { sanitizeSearchQuery } from '@/lib/security-utils'
import { formatCurrency } from '@/lib/utils'

interface MaterialFiltersLocal {
  type?: string
  category?: string
  search?: string
  stockAlert?: boolean
}

export default function MaterialsPage() {
  const [filters, setFilters] = useState<MaterialFiltersLocal>({})
  const [searchInput, setSearchInput] = useState('')
  const [formMode, _setFormMode] = useState<'create' | 'edit'>('create')
  const debouncedSearch = useDebounce(searchInput, 500)

  const finalFilters = useMemo((): MaterialFiltersType => {
    const convertedFilters: MaterialFiltersType = {
      search: debouncedSearch ? sanitizeSearchQuery(debouncedSearch) : undefined,
    }

    // Convert string type to MaterialType array if needed
    if (filters.type) {
      const materialType = filters.type as MaterialType
      convertedFilters.type = [materialType]
    }

    // Add other filters that match the type
    if (filters.stockAlert !== undefined) {
      // Map stockAlert to the expected stockPhysique filter
      convertedFilters.stockPhysique = filters.stockAlert ? 'low' : undefined
    }

    return convertedFilters
  }, [filters, debouncedSearch])

  const materialsQuery = useMaterials(finalFilters)
  const { data: materials = [], isLoading, error } = materialsQuery
  const statisticsQuery = useMaterialStatistics()
  const { data: statistics } = statisticsQuery
  // const deleteMaterial = useDeleteMaterial() // TODO: Implement delete functionality

  const columns = useMemo(
    () => [
      {
        id: 'reference',
        key: 'reference',
        title: 'Référence',
        type: 'text' as const,
        sortable: true,
        width: 120,
      },
      {
        id: 'designation',
        key: 'designation',
        title: 'Désignation',
        type: 'text' as const,
        sortable: true,
      },
      {
        id: 'type',
        key: 'type',
        title: 'Type',
        type: 'text' as const,
        width: 120,
        render: (value: unknown, _row: Material, _column: ColumnConfig<Material>) => (
          <Badge variant="outline">{String(value)}</Badge>
        ),
      },
      {
        id: 'category',
        key: 'category',
        title: 'Catégorie',
        type: 'text' as const,
        width: 150,
      },
      {
        id: 'dimensions',
        key: 'dimensions',
        title: 'Dimensions',
        type: 'text' as const,
        width: 150,
      },
      {
        id: 'quality',
        key: 'quality',
        title: 'Qualité',
        type: 'text' as const,
        width: 100,
      },
      {
        id: 'stock',
        key: 'stock',
        title: 'Stock',
        type: 'number' as const,
        width: 100,
        render: (_value: unknown, material: Material, _column: ColumnConfig<Material>) => {
          const stockValue = material.stockPhysique ?? 0
          const isLow = material?.stockMini && stockValue <= material.stockMini
          return (
            <div className={isLow ? 'text-destructive font-medium' : ''}>
              {stockValue} {material.unite}
              {isLow && <AlertCircle className="inline-block ml-1 h-3 w-3" />}
            </div>
          )
        },
      },
      {
        id: 'price',
        key: 'price',
        title: 'Prix unitaire',
        type: 'number' as const,
        width: 120,
        render: (_value: unknown, material: Material, _column: ColumnConfig<Material>) =>
          formatCurrency(material.prixUnitaire ?? 0),
      },
      {
        id: 'stockValue',
        key: 'stockValue',
        title: 'Valeur stock',
        type: 'number' as const,
        width: 120,
        render: (_value: unknown, material: Material, _column: ColumnConfig<Material>) =>
          formatCurrency((material.stockPhysique ?? 0) * (material.prixUnitaire ?? 0)),
      },
    ],
    []
  )

  const [showMaterialForm, setShowMaterialForm] = useState(false)

  const handleCreate = useCallback(() => {
    setShowMaterialForm(true)
  }, [])

  // const _actions = useMemo(...) removed - unused actions array

  // Gestion d'erreur
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
        <p className="text-muted-foreground">
          Impossible de charger les matériaux. Veuillez réessayer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matériaux</h1>
          <p className="text-muted-foreground">Gérez votre inventaire de matériaux industriels</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" aria-label="Importer des matériaux">
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Importer
          </Button>
          <Button type="button" variant="outline" size="sm" aria-label="Exporter les matériaux">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exporter
          </Button>
          <Button type="button" aria-label="Créer un nouveau matériau" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nouveau matériau
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matériaux</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalMaterials ?? 0}</div>
              <p className="text-xs text-muted-foreground">Références actives</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statistics.totalStockValue ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Valorisation totale</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.lowStockCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">Matériaux en rupture</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.categoryCount
                  ? Object.values(statistics.categoryCount).reduce((sum, count) => sum + count, 0)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Types de matériaux</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Rechercher..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchInput(e?.target?.value)
              }
              className="max-w-sm"
              aria-label="Rechercher dans les matériaux"
            />
            <Select
              value={filters.type || 'all'}
              onValueChange={(value: string) =>
                setFilters({ ...filters, type: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="PROFILE">Profilés</SelectItem>
                <SelectItem value="TUBE">Tubes</SelectItem>
                <SelectItem value="SHEET">Tôles</SelectItem>
                <SelectItem value="BAR">Barres</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.stockAlert !== undefined ? filters?.stockAlert?.toString() : 'all'}
              onValueChange={(value: string) =>
                setFilters({
                  ...filters,
                  stockAlert: value === 'all' ? undefined : value === 'true',
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout le stock</SelectItem>
                <SelectItem value="true">Stock faible</SelectItem>
                <SelectItem value="false">Stock normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns as any}
            data={materials as any}
            keyField="id"
            tableId="materials-table"
            userId={
              typeof window !== 'undefined'
                ? localStorage?.getItem('userId') || 'default-user'
                : 'default-user'
            }
            searchable
            sortable
            selectable
            filterable
            loading={isLoading}
            pagination={{
              page: 1,
              pageSize: 25,
              total: materials.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 25, 50, 100],
            }}
          />
        </CardContent>
      </Card>

      {/* Material Form Dialog - Dialog composant à créer si besoin */}
      {showMaterialForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>
                {formMode === 'create' ? 'Nouveau Matériau' : 'Modifier Matériau'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Formulaire temporaire - à remplacer par MaterialFormDialog */}
              <div className="space-y-4">
                <p>Formulaire matériau en cours de développement</p>
                <Button type="button" onClick={() => setShowMaterialForm(false)}>
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
