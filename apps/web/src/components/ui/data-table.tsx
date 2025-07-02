'use client'

import * as React from 'react'
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
import { ChevronDown, Search } from 'lucide-react'

interface Column {
  key: string
  label: string
  render?: (value: any, item: any) => React.ReactNode
  sortable?: boolean
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
  data: any[]
  columns: Column[]
  searchableColumns?: string[]
  filterableColumns?: FilterOption[]
  loading?: boolean
}

export function DataTable({
  data,
  columns,
  searchableColumns = [],
  filterableColumns = [],
  loading = false,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string[]>>({})
  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  )

  // Filtrer les données
  const filteredData = React.useMemo(() => {
    let filtered = data

    // Recherche textuelle
    if (searchTerm && searchableColumns.length > 0) {
      filtered = filtered.filter(item =>
        searchableColumns.some(column =>
          String(item[column] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Filtres par colonnes
    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(item =>
          values.includes(String(item[column]))
        )
      }
    })

    return filtered
  }, [data, searchTerm, columnFilters, searchableColumns])

  const handleColumnFilterChange = (columnId: string, value: string, checked: boolean) => {
    setColumnFilters(prev => {
      const current = prev[columnId] || []
      if (checked) {
        return { ...prev, [columnId]: [...current, value] }
      } else {
        return { ...prev, [columnId]: current.filter(v => v !== value) }
      }
    })
  }

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Recherche */}
          {searchableColumns.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm((e.target as HTMLInputElement | HTMLTextAreaElement).value)}
                className="pl-8"
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
                {filterColumn.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={(columnFilters[filterColumn.id] || []).includes(option.value)}
                    onCheckedChange={(checked) =>
                      handleColumnFilterChange(filterColumn.id, option.value, checked)
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>

        {/* Colonnes visibles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Colonnes
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={visibleColumns[column.key]}
                onCheckedChange={() => toggleColumnVisibility(column.key)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns
                .filter(column => visibleColumns[column.key])
                .map((column) => (
                  <TableHead key={column.key}>
                    {column.label}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TableRow key={item.id || index}>
                  {columns
                    .filter(column => visibleColumns[column.key])
                    .map((column) => (
                      <TableCell key={column.key}>
                        {column.render 
                          ? column.render(item[column.key], item)
                          : item[column.key]
                        }
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.filter(col => visibleColumns[col.key]).length}
                  className="h-24 text-center"
                >
                  Aucun résultat trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Info pagination */}
      {filteredData.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {filteredData.length} résultat(s) affiché(s)
          {filteredData.length !== data.length && ` sur ${data.length} total`}
        </div>
      )}
    </div>
  )
}

