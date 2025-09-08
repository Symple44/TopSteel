'use client'

import { Columns, Download, Filter, Plus, Search, Settings } from 'lucide-react'
import type React from 'react'
import { Button } from '../../../../primitives/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../primitives/dropdown/DropdownMenu'
import { Input } from '../../../../primitives/input'
import { useDataTableContext } from '../../contexts/DataTableContext'
import type { ExportFormat } from '../../hooks/useDataExport'

export interface DataTableHeaderProps {
  title?: string
  searchPlaceholder?: string
  showSearch?: boolean
  showFilters?: boolean
  showExport?: boolean
  showColumnToggle?: boolean
  showViewToggle?: boolean
  onAddNew?: () => void
  customActions?: React.ReactNode
}

/**
 * En-tête du DataTable avec recherche, filtres et actions
 */
export function DataTableHeader({
  title,
  searchPlaceholder = 'Rechercher...',
  showSearch = true,
  showFilters = true,
  showExport = true,
  showColumnToggle = true,
  showViewToggle = false,
  onAddNew,
  customActions,
}: DataTableHeaderProps) {
  const { state, setSearchTerm, exportData, toggleColumnVisibility } = useDataTableContext()

  const handleExport = async (format: ExportFormat['format']) => {
    try {
      await exportData(format, {
        visibleColumnsOnly: true,
        selectedRowsOnly: state.selection.selectedRows.size > 0,
      })
    } catch (_error) {}
  }

  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      {/* Titre et actions principales */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}

          {/* Indicateurs de filtres actifs */}
          {state.isFiltered && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {state.processedData.length} / {state.data.length} lignes
              </span>
              {state.filters.length > 0 && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {state.filters.length} filtre{state.filters.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Actions personnalisées */}
          {customActions}

          {/* Bouton Ajouter */}
          {onAddNew && (
            <Button type="button" onClick={onAddNew} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          )}

          {/* Export */}
          {showExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Export JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Toggle colonnes */}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Columns className="h-4 w-4 mr-1" />
                  Colonnes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Colonnes visibles</div>
                </div>
                <DropdownMenuSeparator />
                {state.columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={state.visibleColumns.some((c) => c.id === column.id)}
                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                  >
                    {column.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Paramètres */}
          <Button type="button" variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex items-center gap-4">
        {/* Recherche */}
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={state.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Bouton Filtres */}
        {showFilters && (
          <Button
            type="button"
            variant={state.filters.length > 0 ? 'default' : 'outline'}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtres
            {state.filters.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                {state.filters.length}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
