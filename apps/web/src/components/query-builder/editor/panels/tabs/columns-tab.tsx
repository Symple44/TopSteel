'use client'

import { Badge, Button, Input, Switch } from '@erp/ui'
import {
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Pencil,
  SortAsc,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { QueryBuilderColumn } from '../../../../../types/query-builder.types'
import { cn } from '../../../../../lib/utils'

interface ColumnsTabProps {
  columns: QueryBuilderColumn[]
  onReorder: (columns: QueryBuilderColumn[]) => void
  onUpdate: (columnId: string, updates: Partial<QueryBuilderColumn>) => void
}

export function ColumnsTab({ columns, onReorder, onUpdate }: ColumnsTabProps) {
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newColumns = [...columns]
    const [draggedItem] = newColumns.splice(draggedIndex, 1)
    newColumns.splice(index, 0, draggedItem)

    // Update display order
    const reordered = newColumns.map((col, idx) => ({
      ...col,
      displayOrder: idx,
    }))

    onReorder(reordered)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleRemove = (column: QueryBuilderColumn) => {
    const newColumns = columns.filter(
      (c) => !(c.tableName === column.tableName && c.columnName === column.columnName)
    )
    onReorder(newColumns)
  }

  const getColumnId = (col: QueryBuilderColumn) => `${col.tableName}.${col.columnName}`

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune colonne sélectionnée</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Sélectionnez des colonnes dans le panneau de gauche pour les ajouter à votre requête.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">
          Colonnes sélectionnées ({columns.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => onReorder([])}
        >
          Tout supprimer
        </Button>
      </div>

      <div className="space-y-1">
        {columns.map((column, index) => {
          const columnId = getColumnId(column)
          const isEditing = editingColumn === columnId

          return (
            <div
              key={columnId}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group flex items-center gap-2 p-2 rounded-lg border bg-card transition-all',
                draggedIndex === index && 'opacity-50 border-primary',
                'hover:border-primary/50'
              )}
            >
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Column Info */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={column.label || column.alias}
                    onChange={(e) => onUpdate(columnId, { label: e.target.value, alias: e.target.value })}
                    onBlur={() => setEditingColumn(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingColumn(null)}
                    className="h-7 text-sm"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {column.label || column.alias || column.columnName}
                    </span>
                    {column.label !== column.columnName && (
                      <span className="text-xs text-muted-foreground truncate">
                        ({column.columnName})
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {column.tableName}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {column.dataType}
                  </span>
                </div>
              </div>

              {/* Column Options */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setEditingColumn(columnId)}
                  title="Renommer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 w-7 p-0',
                    column.isVisible ? 'text-foreground' : 'text-muted-foreground'
                  )}
                  onClick={() => onUpdate(columnId, { isVisible: !column.isVisible })}
                  title={column.isVisible ? 'Masquer' : 'Afficher'}
                >
                  {column.isVisible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(column)}
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Quick Toggles */}
              <div className="flex items-center gap-3 pl-2 border-l">
                <div className="flex items-center gap-1" title="Filtrable">
                  <Filter className={cn('h-3 w-3', column.isFilterable ? 'text-primary' : 'text-muted-foreground')} />
                  <Switch
                    checked={column.isFilterable}
                    onCheckedChange={(checked) => onUpdate(columnId, { isFilterable: checked })}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center gap-1" title="Triable">
                  <SortAsc className={cn('h-3 w-3', column.isSortable ? 'text-primary' : 'text-muted-foreground')} />
                  <Switch
                    checked={column.isSortable}
                    onCheckedChange={(checked) => onUpdate(columnId, { isSortable: checked })}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
