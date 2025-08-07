'use client'

import {
  AdvancedDataTable,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type ColumnConfig,
} from '@erp/ui'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@erp/ui/primitives'
import { Download, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

interface DataTablePreviewProps {
  data: Record<string, unknown>[]
  columns?: Array<{ name: string; type: string; label?: string }>
  calculatedFields?: Array<{ name: string; expression: string; type: string }>
  layout?: Record<string, unknown>
  settings?: Record<string, unknown>
}

// Convert query builder data types to DataTable types
const getDataTableType = (dataType: string): ColumnConfig<any>['type'] => {
  const type = dataType?.toLowerCase() || ''

  if (
    type.includes('int') ||
    type.includes('numeric') ||
    type.includes('decimal') ||
    type.includes('float')
  ) {
    return 'number'
  }
  if (type.includes('bool')) {
    return 'boolean'
  }
  if (type.includes('date') && type.includes('time')) {
    return 'datetime'
  }
  if (type.includes('date')) {
    return 'date'
  }
  return 'text'
}

export function DataTablePreview({
  data = [],
  columns = [],
  calculatedFields = [],
  layout = {},
  settings = {},
}: DataTablePreviewProps) {
  const [loading, setLoading] = useState(false)

  const dataTableColumns = useMemo((): ColumnConfig<any>[] => {
    // Si pas de colonnes définies, pas d'affichage
    if (!columns || columns.length === 0) {
      return []
    }

    // Traitement des colonnes définies par le query builder
    const visibleColumns = columns.filter((col) => col.isVisible ?? true)
    const visibleCalculatedFields = calculatedFields.filter((field) => field.isVisible ?? true)

    // Trier par displayOrder
    const allColumns = [...visibleColumns, ...visibleCalculatedFields].sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
    )

    const result = allColumns.map((col, index): ColumnConfig<any> => {
      const columnId = col.alias || col.columnName || col.name || `col_${index}`

      const columnConfig: ColumnConfig<any> = {
        id: columnId,
        key: columnId as keyof any,
        title: col.label || col.columnName || col.name || 'Unknown',
        description: col.description || `Colonne ${col.tableName || ''}.${col.columnName || ''}`,
        type: getDataTableType(col.dataType),
        width: 150,
        sortable: col.isSortable ?? true,
        searchable: col.isFilterable ?? true,
        render: (value: any) => {
          // Format based on data type and format settings
          if (col.format) {
            switch (col.format.type) {
              case 'currency':
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(value as number)
              case 'percentage':
                return `${((value as number) * 100).toFixed(col.format.decimals || 2)}%`
              case 'number':
                return (value as number).toFixed(col.format.decimals || 0)
              case 'date':
                return new Date(value as string).toLocaleDateString('fr-FR')
              default:
                return String(value ?? '')
            }
          }

          return String(value ?? '')
        },
      }
      return columnConfig
    })
    return result
  }, [columns, calculatedFields])

  const handleExport = async (_format: string) => {}

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // TODO: Refetch data
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {settings.settings?.enableExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {settings.settings?.exportFormats?.map((format: string) => (
                    <DropdownMenuItem key={format} onClick={() => handleExport(format)}>
                      Export as {format.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {!columns || columns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-6">
            <div className="text-center">
              <p className="mb-2">Aucune colonne sélectionnée</p>
              <p className="text-sm">Sélectionnez des colonnes pour voir l'aperçu des données</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Afficher les en-têtes même sans données */}
            <AdvancedDataTable
              data={
                data && data.length > 0
                  ? data
                  : [
                      // Ligne vide pour afficher les en-têtes
                      Object.fromEntries(dataTableColumns.map((col) => [col.id, ''])),
                    ]
              }
              columns={dataTableColumns}
              keyField="id"
              tableId="query-preview"
              // Configuration pour l'aperçu
              editable={false}
              selectable={false}
              sortable={true}
              searchable={true}
              filterable={true}
              // Interface simplifiée pour l'aperçu
              height={400}
              className="border-0"
              // Pagination pour l'aperçu
              pagination={{
                page: 1,
                pageSize: 10,
                total: data?.length || 0,
                showSizeChanger: true,
                pageSizeOptions: [10, 25, 50, 100],
              }}
            />
            {/* Message si pas de données mais colonnes sélectionnées */}
            {(!data || data.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">
                <div className="text-center p-6">
                  <p className="mb-2">Colonnes configurées, aucune donnée disponible</p>
                  <p className="text-sm">
                    Exécutez la requête pour voir les données dans ce tableau
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
