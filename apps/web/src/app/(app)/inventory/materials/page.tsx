'use client'

import type { Material } from '@erp/types'
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
import { AlertCircle, Download, Package2, Plus, TrendingUp, Upload } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useDeleteMaterial, useMaterialStatistics, useMaterials } from '@/hooks/use-materials'
import { sanitizeSearchQuery } from '@/lib/security-utils'
import { formatCurrency } from '@/lib/utils'

interface MaterialFilters {
  type?: string
  category?: string
  search?: string
  stockAlert?: boolean
}

export default function MaterialsPage() {
  const [filters, setFilters] = useState<MaterialFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)

  const finalFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch ? sanitizeSearchQuery(debouncedSearch) : undefined,
    }),
    [filters, debouncedSearch]
  )

  const { data: materials = [], isLoading, error } = useMaterials(finalFilters)
  const { data: statistics } = useMaterialStatistics()
  const deleteMaterial = useDeleteMaterial()

  const handleDelete = useCallback(
    async (material: Material) => {
      if (confirm(`Êtes-vous sûr de vouloir supprimer ${material.designation} ?`)) {
        await deleteMaterial.mutateAsync(material.id)
      }
    },
    [deleteMaterial]
  )

  const columns = useMemo(
    () => [
      {
        key: 'reference',
        label: 'Référence',
        sortable: true,
        width: 120,
      },
      {
        key: 'designation',
        label: 'Désignation',
        sortable: true,
        searchable: true,
      },
      {
        key: 'type',
        label: 'Type',
        width: 120,
        render: (value: string) => <Badge variant="outline">{value}</Badge>,
      },
      {
        key: 'category',
        label: 'Catégorie',
        width: 150,
      },
      {
        key: 'dimensions',
        label: 'Dimensions',
        width: 150,
      },
      {
        key: 'quality',
        label: 'Qualité',
        width: 100,
      },
      {
        key: 'stockQuantity',
        label: 'Stock',
        width: 100,
        render: (value: number, material: Material) => {
          const isLow = material.stockMin && value <= material.stockMin
          return (
            <div className={isLow ? 'text-destructive font-medium' : ''}>
              {value} {material.unit}
              {isLow && <AlertCircle className="inline-block ml-1 h-3 w-3" />}
            </div>
          )
        },
      },
      {
        key: 'unitPrice',
        label: 'Prix unitaire',
        width: 120,
        render: (value: number) => formatCurrency(value),
      },
      {
        key: 'stockValue',
        label: 'Valeur stock',
        width: 120,
        render: (_: unknown, material: Material) =>
          formatCurrency((material.stockQuantity || 0) * (material.unitPrice || 0)),
      },
    ],
    []
  )

  const actions = useMemo(
    () => [
      {
        label: 'Modifier',
        onClick: (_material: Material) => {
          // TODO: Implement MaterialFormDialog
        },
      },
      {
        label: 'Supprimer',
        onClick: handleDelete,
        variant: 'destructive' as const,
      },
    ],
    [handleDelete]
  )

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
          <Button variant="outline" size="sm" aria-label="Importer des matériaux">
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Importer
          </Button>
          <Button variant="outline" size="sm" aria-label="Exporter les matériaux">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exporter
          </Button>
          <Button aria-label="Créer un nouveau matériau">
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
              <div className="text-2xl font-bold">{statistics.totalMaterials || 0}</div>
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
                {formatCurrency(statistics.totalStockValue || 0)}
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
              <div className="text-2xl font-bold">{statistics.lowStockCount || 0}</div>
              <p className="text-xs text-muted-foreground">Matériaux en rupture</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.categoryCount || 0}</div>
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
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-sm"
              aria-label="Rechercher dans les matériaux"
            />
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
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
              value={filters.stockAlert !== undefined ? filters.stockAlert.toString() : 'all'}
              onValueChange={(value) =>
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
            columns={columns}
            data={materials}
            actions={actions}
            loading={isLoading}
            searchable
            selectable
            exportable
            pageSize={20}
          />
        </CardContent>
      </Card>
    </div>
  )
}
