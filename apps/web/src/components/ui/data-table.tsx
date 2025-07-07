'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, ChevronDown, Search } from 'lucide-react'
import * as React from 'react'

// ===== TYPES ROBUSTES =====
interface Column {
  key: string
  label: string
  render?: (value: unknown, item: unknown) => React.ReactNode
  sortable?: boolean
  required?: boolean
}

interface FilterOption {
  id: string
  title: string
  options: Array<{
    label: string
    value: string
  }>
}

interface DataTableProps {
  data: unknown[]
  columns: Column[]
  searchableColumns?: string[]
  filterableColumns?: FilterOption[]
  loading?: boolean
  emptyStateMessage?: string
  errorState?: string | null
  onRowClick?: (item: unknown) => void
}

// ===== GUARDS DE VALIDATION =====
const _isValidColumnState = (state: Record<string, boolean | undefined>, key: string): boolean => {
  return Boolean(state[key] ?? true) // Fallback explicite à true
}

const _ensureBooleanValue = (value: boolean | undefined): boolean => {
  return value ?? true // Garantit un boolean pour exactOptionalPropertyTypes
}

const _safeGetItemValue = (item: unknown, column: string): string => {
  try {
    return String(item?.[column] ?? '')
  } catch {
    return ''
  }
}

// ===== HOOKS DE GESTION D'ÉTAT ROBUSTES =====
const _useDataTableState = (columns: Column[]) => {
  // Initialisation garantie avec tous les états boolean
  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}

    columns.forEach(col => {
      initialState[col.key] = true // Valeur explicite, pas undefined
    })

    return initialState
  })

  const [searchTerm, setSearchTerm] = React.useState<string>('')
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string[]>>({})

  const _toggleColumnVisibility = React.useCallback((columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !ensureBooleanValue(prev[columnKey])
    }))
  }, [])

  const _handleColumnFilterChange = React.useCallback((
    columnId: string, 
    value: string, 
    checked: boolean
  ) => {
    setColumnFilters(prev => {
      const _current = prev[columnId] ?? []

      if (checked) {
        return { ...prev, [columnId]: [...current, value] }
      } else {
        return { ...prev, [columnId]: current.filter(v => v !== value) }
      }
    })
  }, [])

  return {
    visibleColumns,
    searchTerm,
    columnFilters,
    setSearchTerm,
    toggleColumnVisibility,
    handleColumnFilterChange
  }
}

// ===== LOGIQUE DE FILTRAGE OPTIMISÉE =====
const _useFilteredData = (
  data: unknown[],
  searchTerm: string,
  columnFilters: Record<string, string[]>,
  searchableColumns: string[]
) => {
  return React.useMemo(() => {
    try {
      const _filtered = [...data] // Copie pour éviter les mutations

      // Recherche textuelle avec protection
      if (searchTerm.trim() && searchableColumns.length > 0) {
        const _normalizedSearch = searchTerm.toLowerCase().trim()

        filtered = filtered.filter(item =>
          searchableColumns.some(column => {
            const _value = safeGetItemValue(item, column)

            return value.toLowerCase().includes(normalizedSearch)
          })
        )
      }

      // Filtres par colonnes avec protection
      Object.entries(columnFilters).forEach(([column, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          filtered = filtered.filter(item => {
            const _itemValue = safeGetItemValue(item, column)

            return values.includes(itemValue)
          })
        }
      })

      return filtered
    } catch (error) {
      console.error('[DataTable] Erreur lors du filtrage:', error)

      return data // Fallback sur les données originales
    }
  }, [data, searchTerm, columnFilters, searchableColumns])
}

// ===== COMPOSANT PRINCIPAL =====
export function DataTable({
  data = [],
  columns = [],
  searchableColumns = [],
  filterableColumns = [],
  loading = false,
  emptyStateMessage = "Aucun résultat trouvé",
  errorState = null,
  onRowClick
}: DataTableProps) {
  const {
    visibleColumns,
    searchTerm,
    columnFilters,
    setSearchTerm,
    toggleColumnVisibility,
    handleColumnFilterChange
  } = useDataTableState(columns)

  const _filteredData = useFilteredData(data, searchTerm, columnFilters, searchableColumns)

  // ===== GESTION DES ÉTATS D'ERREUR =====
  if (errorState) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        <AlertTriangle className="mr-2 h-5 w-5" />
        <span>{errorState}</span>
      </div>
    )
  }

  // ===== GESTION DU LOADING =====
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ===== VALIDATION DES PROPS =====
  if (!Array.isArray(data)) {
    console.warn('[DataTable] prop "data" doit être un array')

    return null
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    console.warn('[DataTable] prop "columns" doit être un array non vide')

    return null
  }

  // Colonnes visibles avec protection
  const _visibleColumnsArray = columns.filter(column => 
    isValidColumnState(visibleColumns, column.key)
  )

  return (
    <div className="space-y-4">
      {/* ===== BARRE D'OUTILS ===== */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {/* Recherche */}
          {searchableColumns.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 min-w-64"
              />
            </div>
          )}

          {/* Filtres */}
          {filterableColumns.map((filterColumn) => (
            <DropdownMenu key={filterColumn.id}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {filterColumn.title}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {filterColumn.options.map((option) => {
                  const _currentFilters = columnFilters[filterColumn.id] ?? []
                  const _isChecked = currentFilters.includes(option.value)
                  
                  return (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={isChecked} // Valeur garantie boolean
                      onCheckedChange={(checked) =>
                        handleColumnFilterChange(filterColumn.id, option.value, checked)
                      }
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>

        {/* Sélecteur de colonnes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Colonnes ({visibleColumnsArray.length}/{columns.length})
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {columns.map((column) => {
              // CORRECTION PRINCIPALE: Garantie que checked est toujours boolean
              const _isVisible = ensureBooleanValue(visibleColumns[column.key])
              
              return (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={isVisible} // Type: boolean garanti
                  onCheckedChange={() => toggleColumnVisibility(column.key)}
                >
                  {column.label}
                  {column.required && <span className="text-destructive ml-1">*</span>}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ===== TABLEAU PRINCIPAL ===== */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumnsArray.map((column) => (
                <TableHead key={column.key} className="font-medium">
                  {column.label}
                  {column.required && <span className="text-destructive ml-1">*</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TableRow 
                  key={item.id ?? `row-${index}`}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
                  onClick={() => onRowClick?.(item)}
                >
                  {visibleColumnsArray.map((column) => (
                    <TableCell key={`${column.key}-${index}`}>
                      {column.render 
                        ? column.render(item[column.key], item)
                        : safeGetItemValue(item, column.key) || '-'
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumnsArray.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ===== INFORMATIONS ===== */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''} affiché{filteredData.length > 1 ? 's' : ''}
            {filteredData.length !== data.length && ` sur ${data.length} total`}
          </span>
          
          {/* Indicateurs de filtres actifs */}
          {(searchTerm || Object.values(columnFilters).some(f => f.length > 0)) && (
            <div className="flex items-center gap-2">
              <span className="text-xs">Filtres actifs:</span>
              {searchTerm && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  Recherche: "{searchTerm}"
                </span>
              )}
              {Object.entries(columnFilters).map(([column, values]) => 
                values.length > 0 && (
                  <span key={column} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                    {column}: {values.length}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
