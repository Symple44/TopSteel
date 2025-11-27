'use client'

import { Columns, Download, Filter, Loader2, Plus, Search, Settings } from 'lucide-react'
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
    <div className="flex flex-col gap-4 p-5 border-b border-border/50 bg-muted/20">
      {/* Titre et actions principales */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && <h2 className="text-xl font-bold tracking-tight">{title}</h2>}

          {/* Indicateurs de filtres actifs */}
          {state.isFiltered && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                {state.processedData.length} / {state.data.length} lignes
              </span>
              {state.filters.length > 0 && (
                <span className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
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
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter
            </Button>
          )}

          {/* Export */}
          {showExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1.5" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-green-100 text-green-700 text-xs font-bold">CSV</span>
                    Export CSV
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-emerald-100 text-emerald-700 text-xs font-bold">XLS</span>
                    Export Excel
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-amber-100 text-amber-700 text-xs font-bold">{ }</span>
                    Export JSON
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Toggle colonnes */}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Columns className="h-4 w-4 mr-1.5" />
                  Colonnes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2.5 border-b border-border/50">
                  <div className="text-sm font-semibold">Colonnes visibles</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{state.visibleColumns.length} sur {state.columns.length}</div>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {state.columns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={state.visibleColumns.some((c) => c.id === column.id)}
                      onCheckedChange={() => toggleColumnVisibility(column.id)}
                      className="cursor-pointer"
                    >
                      {column.title}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Paramètres */}
          <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex items-center gap-3">
        {/* Recherche avec indicateur de debounce */}
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              placeholder={searchPlaceholder}
              value={state.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-background"
            />
            {/* Indicateur de recherche en cours */}
            {state.isSearchPending && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
            )}
          </div>
        )}

        {/* Bouton Filtres */}
        {showFilters && (
          <Button
            type="button"
            variant={state.filters.length > 0 ? 'default' : 'outline'}
            size="sm"
            className={state.filters.length > 0 ? '' : 'bg-background'}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filtres
            {state.filters.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-white/25 rounded-full font-semibold">
                {state.filters.length}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
