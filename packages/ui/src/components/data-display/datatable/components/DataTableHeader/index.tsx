'use client'

import { Columns, Download, Loader2, Plus, Search, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { cn } from '../../../../../lib/utils'
import { Button } from '../../../../primitives/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../primitives/dropdown/DropdownMenu'
import { Input } from '../../../../primitives/input'
import { AdvancedFilters, type AdvancedFilterGroup } from '../../AdvancedFilters'
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
  const { state, setSearchTerm, setFilters, exportData, toggleColumnVisibility } = useDataTableContext()

  // État local pour les filtres avancés
  const [filterGroups, setFilterGroups] = useState<AdvancedFilterGroup[]>([])

  // Callback pour mettre à jour les filtres
  const handleFiltersChange = useCallback((newFilters: AdvancedFilterGroup[]) => {
    setFilterGroups(newFilters)

    // Convertir les filtres avancés en FilterConfig[] pour le contexte
    const simpleFilters = newFilters.flatMap((group) =>
      group.rules
        .filter((rule) => rule.enabled && rule.value !== '')
        .map((rule) => ({
          field: rule.column,
          // Convertir JsonValue en DataValue (string/number/boolean/Date/null)
          value: typeof rule.value === 'string' || typeof rule.value === 'number' || typeof rule.value === 'boolean'
            ? rule.value
            : rule.value === null
              ? null
              : String(rule.value),
          operator: rule.operator,
        }))
    )
    setFilters(simpleFilters)
  }, [setFilters])

  const handleExport = async (format: ExportFormat['format']) => {
    try {
      await exportData(format, {
        visibleColumnsOnly: true,
        selectedRowsOnly: state.selection.selectedRows.size > 0,
      })
    } catch (_error) {}
  }

  const handleClearSearch = () => {
    setSearchTerm('')
  }

  const hasActiveFilters = state.filters.length > 0 || state.searchTerm.length > 0

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-border/40 bg-muted/10">
      {/* Ligne principale: recherche à gauche, actions à droite */}
      <div className="flex items-center gap-3">
        {/* Recherche */}
        {showSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder={searchPlaceholder}
              value={state.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-9 bg-background border-border/50 text-sm placeholder:text-muted-foreground/50"
            />
            {/* Bouton effacer ou indicateur de chargement */}
            {state.isSearchPending ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
            ) : state.searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Filtres avancés */}
        {showFilters && (
          <AdvancedFilters
            columns={state.columns}
            filters={filterGroups}
            onFiltersChange={handleFiltersChange}
          />
        )}

        {/* Séparateur */}
        <div className="h-6 w-px bg-border/50 hidden sm:block" />

        {/* Toggle colonnes */}
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground">
                <Columns className="h-4 w-4" />
                <span className="hidden sm:inline">Colonnes</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2 border-b border-border/50">
                <div className="text-sm font-medium">Colonnes visibles</div>
                <div className="text-xs text-muted-foreground">{state.visibleColumns.length} sur {state.columns.length}</div>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {state.columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={state.visibleColumns.some((c) => c.id === column.id)}
                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                    className="cursor-pointer text-sm"
                  >
                    {column.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Export */}
        {showExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10 text-green-600 text-[10px] font-bold">CSV</span>
                <span>Export CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">XLS</span>
                <span>Export Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold">{'{}'}</span>
                <span>Export JSON</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions personnalisées */}
        {customActions}

        {/* Bouton Ajouter */}
        {onAddNew && (
          <Button type="button" onClick={onAddNew} size="sm" className="h-9">
            <Plus className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">Ajouter</span>
          </Button>
        )}
      </div>

      {/* Indicateur de résultats filtrés */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{state.processedData.length}</span>
          <span>résultat{state.processedData.length > 1 ? 's' : ''}</span>
          {state.data.length !== state.processedData.length && (
            <>
              <span>sur</span>
              <span>{state.data.length}</span>
            </>
          )}
          {(state.searchTerm || state.filters.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setFilters([])
                setFilterGroups([])
              }}
              className="ml-2 text-primary hover:underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}
    </div>
  )
}
