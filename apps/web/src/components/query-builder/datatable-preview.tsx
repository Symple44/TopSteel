'use client'

import { useState, useMemo } from 'react'
// import { DataTable } from '@/components/ui/datatable/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// import { ColumnDef } from '@tanstack/react-table'

interface DataTablePreviewProps {
  data: any
  columns: any[]
  calculatedFields: any[]
  layout: any
  settings: any
}

export function DataTablePreview({
  data,
  columns,
  calculatedFields,
  layout,
  settings,
}: DataTablePreviewProps) {
  const [loading, setLoading] = useState(false)

  const tableColumns = useMemo(() => {
    // Filtrer les colonnes visibles
    const visibleColumns = columns.filter(col => col.isVisible)
    const visibleCalculatedFields = calculatedFields.filter(field => field.isVisible)
    
    // Trier par displayOrder
    const allColumns = [...visibleColumns, ...visibleCalculatedFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))

    return allColumns.map(col => ({
      accessorKey: col.alias || col.columnName || col.name,
      header: col.label || col.columnName,
      dataType: col.dataType,
      format: col.format,
      cell: ({ getValue }) => {
        const value = getValue()
        
        // Format based on data type and format settings
        if (col.format) {
          switch (col.format.type) {
            case 'currency':
              return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(value as number)
            case 'percentage':
              return `${(value as number * 100).toFixed(col.format.decimals || 2)}%`
            case 'number':
              return (value as number).toFixed(col.format.decimals || 0)
            case 'date':
              return new Date(value as string).toLocaleDateString('fr-FR')
            default:
              return String(value)
          }
        }

        return String(value ?? '')
      },
      enableSorting: col.isSortable ?? true,
      enableColumnFilter: col.isFilterable ?? true,
    }))
  }, [columns, calculatedFields])

  const handleExport = async (format: string) => {
    // TODO: Implement export functionality
    console.log('Export to', format)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // TODO: Refetch data
      await new Promise(resolve => setTimeout(resolve, 1000))
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
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
                    <DropdownMenuItem
                      key={format}
                      onClick={() => handleExport(format)}
                    >
                      Export as {format.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {!data && columns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Aucune colonne sélectionnée</p>
              <p className="text-sm">Sélectionnez des colonnes dans l'onglet Design</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Aucune donnée à afficher</p>
              <p className="text-sm">Cliquez sur "Execute" pour charger les données</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {tableColumns.map((column, index) => (
                  <th
                    key={index}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    <div>
                      <div>{column.header}</div>
                      {column.dataType && (
                        <div className="text-xs font-normal opacity-70">
                          {column.dataType}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {(data.data || []).slice(0, 10).map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {tableColumns.map((column, colIndex) => (
                    <td key={colIndex} className="p-4 align-middle">
                      {column.cell ? column.cell({ getValue: () => row[column.accessorKey] }) : row[column.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            </table>
            {(data.data || []).length > 10 && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              ... et {(data.data || []).length - 10} lignes supplémentaires
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="text-sm text-muted-foreground">
              {data.total || 0} résultat(s) au total
            </div>
            <div className="text-sm text-muted-foreground">
              Page {data.page || 1} sur {Math.ceil((data.total || 0) / (data.pageSize || 50))}
            </div>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
}