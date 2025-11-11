'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  ScrollArea,
} from '@erp/ui'
import {
  ArrowUpDown,
  Calendar,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Hash,
  Key,
  Link2,
  Search,
  ToggleLeft,
  Type,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { callClientApi } from '../../utils/backend-api'

interface Column {
  id?: string
  tableName: string
  columnName: string
  alias: string
  label: string
  description?: string
  dataType: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  isVisible: boolean
  isFilterable: boolean
  isSortable: boolean
  displayOrder: number
}

interface ColumnSelectorProps {
  selectedTables: string[]
  columns: Column[]
  onColumnsChange: (columns: Column[]) => void
}

interface DraggableColumnProps {
  column: Column
  index: number
  moveColumn?: (fromIndex: number, toIndex: number) => void
  toggleVisibility: (index: number) => void
  onRemove: (index: number) => void
  selected: boolean
  onSelect: () => void
}

const DraggableColumn = ({
  column,
  index,
  toggleVisibility,
  onRemove,
  selected,
  onSelect,
}: DraggableColumnProps) => {
  // Temporairement désactivé le drag & drop
  const isDragging = false

  const getDataTypeIcon = (dataType: string) => {
    if (
      dataType?.includes('int') ||
      dataType?.includes('numeric') ||
      dataType?.includes('decimal')
    ) {
      return <Hash className="h-3 w-3" />
    }
    if (dataType?.includes('char') || dataType?.includes('text')) {
      return <Type className="h-3 w-3" />
    }
    if (dataType?.includes('date') || dataType?.includes('time')) {
      return <Calendar className="h-3 w-3" />
    }
    if (dataType?.includes('bool')) {
      return <ToggleLeft className="h-3 w-3" />
    }
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md transition-colors',
        isDragging && 'opacity-50',
        selected && 'bg-accent'
      )}
    >
      <div className="cursor-move">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox checked={selected} onCheckedChange={onSelect} />
      <div className="flex-1 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {column.isPrimaryKey && <Key className="h-3 w-3 text-yellow-500" />}
          {column.isForeignKey && <Link2 className="h-3 w-3 text-blue-500" />}
          {getDataTypeIcon(column.dataType)}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{column.label}</div>
          <div className="text-xs text-muted-foreground">
            {column.tableName}.{column.columnName}
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {column.dataType}
        </Badge>
        <div className="flex items-center gap-1">
          {column.isFilterable && <Filter className="h-3 w-3 text-muted-foreground" />}
          {column.isSortable && <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => toggleVisibility(index)}
            className="h-6 w-6 p-0"
          >
            {column.isVisible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onRemove(index)}
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            title="Supprimer cette colonne"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ColumnSelector({ selectedTables, columns, onColumnsChange }: ColumnSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [availableColumns, setAvailableColumns] = useState<any[]>([])
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchColumnsForTables = useCallback(async (tables: string[]) => {
    setLoading(true)
    try {
      const allColumns: unknown[] = []

      for (const table of tables) {
        const response = await callClientApi(`query-builder/schema/tables/${table}/columns`)
        if (response?.ok) {
          const result = await response?.json()
          // Assurer que nous avons bien un tableau
          const tableColumns = Array.isArray(result) ? result : result.data || result.columns || []
          allColumns?.push(...tableColumns)
        }
      }

      setAvailableColumns(allColumns)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedTables.length > 0) {
      fetchColumnsForTables(selectedTables)
    }
  }, [selectedTables, fetchColumnsForTables])

  // Synchroniser selectedColumns avec les colonnes importées
  useEffect(() => {
    const importedColumnIds = new Set(columns?.map((col) => `${col.tableName}.${col.columnName}`))
    setSelectedColumns(importedColumnIds)
  }, [columns])

  const handleAddColumns = () => {
    const newColumns: Column[] = []
    let maxOrder = Math.max(...columns.map((c) => c.displayOrder), -1)

    selectedColumns?.forEach((colId) => {
      if (!colId) return
      const [tableName, columnName] = colId.split('.')
      const sourceColumn = availableColumns?.find(
        (c) => c.tableName === tableName && c.columnName === columnName
      )

      if (sourceColumn && !columns?.some((c) => c.alias === colId)) {
        newColumns.push({
          tableName,
          columnName,
          alias: colId,
          label: columnName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          description: sourceColumn.comment,
          dataType: sourceColumn.dataType,
          isPrimaryKey: sourceColumn.isPrimaryKey,
          isForeignKey: sourceColumn.isForeignKey,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
          displayOrder: ++maxOrder,
        })
      }
    })

    if (newColumns?.length > 0) {
      onColumnsChange([...columns, ...newColumns])
      setSelectedColumns(new Set())
    }
  }

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...columns]
    const [movedColumn] = newColumns.splice(fromIndex, 1)
    newColumns.splice(toIndex, 0, movedColumn)

    // Update display order
    newColumns?.forEach((col, index) => {
      col.displayOrder = index
    })

    onColumnsChange(newColumns)
  }

  const toggleColumnVisibility = (index: number) => {
    const newColumns = [...columns]
    if (newColumns[index]) {
      newColumns[index].isVisible = !newColumns[index].isVisible
    }
    onColumnsChange(newColumns)
  }

  const removeColumn = (index: number) => {
    onColumnsChange(columns?.filter((_, i) => i !== index))
  }

  const filteredAvailableColumns = availableColumns?.filter(
    (col) =>
      col?.columnName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      col?.tableName?.toLowerCase().includes(searchTerm?.toLowerCase())
  )

  return (
    <div className="h-full flex gap-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Available Columns</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value)}
                className="pl-8"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddColumns}
              disabled={selectedColumns.size === 0}
              className="w-full bg-primary text-white hover:bg-primary/90 font-medium"
            >
              Add Selected Columns ({selectedColumns.size})
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading columns...</div>
            ) : filteredAvailableColumns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {selectedTables.length === 0
                  ? 'Select a table to see available columns'
                  : 'No columns found'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAvailableColumns?.map((col) => {
                  const colId = `${col.tableName}.${col.columnName}`
                  const isSelected = selectedColumns?.has(colId)
                  const isAdded = columns?.some((c) => c.alias === colId)

                  return (
                    <button
                      key={colId}
                      type="button"
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer w-full text-left',
                        isAdded && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => {
                        if (!isAdded) {
                          setSelectedColumns((prev) => {
                            const newSet = new Set(prev)
                            if (newSet?.has(colId)) {
                              newSet?.delete(colId)
                            } else {
                              newSet?.add(colId)
                            }
                            return newSet
                          })
                        }
                      }}
                      disabled={isAdded}
                    >
                      <Checkbox checked={isSelected} disabled={isAdded} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{col.columnName}</div>
                        <div className="text-xs text-muted-foreground">{col.tableName}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {col.dataType}
                      </Badge>
                      {isAdded && (
                        <Badge variant="secondary" className="text-xs">
                          Added
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Selected Columns ({columns.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-full">
            {columns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No columns selected</div>
            ) : (
              <div className="space-y-1">
                {columns?.map((column, index) => (
                  <DraggableColumn
                    key={column.alias}
                    column={column}
                    index={index}
                    moveColumn={moveColumn}
                    toggleVisibility={toggleColumnVisibility}
                    onRemove={removeColumn}
                    selected={false}
                    onSelect={() => {}}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
