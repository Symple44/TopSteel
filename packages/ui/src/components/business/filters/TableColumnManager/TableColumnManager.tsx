'use client'
import { useState, useCallback } from 'react'
import { Settings, Eye, EyeOff, GripVertical, X, RotateCcw } from 'lucide-react'
import { Button } from '../../../primitives/button/Button'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { cn } from '../../../../lib/utils'
export interface TableColumn {
  id: string
  key: string
  label: string
  visible: boolean
  sortable?: boolean
  resizable?: boolean
  width?: number
  minWidth?: number
  maxWidth?: number
  order?: number
}
interface TableColumnManagerProps {
  columns: TableColumn[]
  onChange?: (columns: TableColumn[]) => void
  onReset?: () => void
  disabled?: boolean
  showVisibilityCount?: boolean
  allowReorder?: boolean
  className?: string
}
export function TableColumnManager({
  columns,
  onChange,
  onReset,
  disabled = false,
  showVisibilityCount = true,
  allowReorder = true,
  className,
}: TableColumnManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const sortedColumns = [...columns].sort((a, b) => (a.order || 0) - (b.order || 0))
  const visibleColumns = columns.filter(col => col.visible)
  const hiddenColumns = columns.filter(col => !col.visible)
  const updateColumns = useCallback((updatedColumns: TableColumn[]) => {
    onChange?.(updatedColumns)
  }, [onChange])
  const toggleColumnVisibility = useCallback((columnId: string) => {
    const updatedColumns = columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    )
    updateColumns(updatedColumns)
  }, [columns, updateColumns])
  const showAllColumns = useCallback(() => {
    const updatedColumns = columns.map(col => ({ ...col, visible: true }))
    updateColumns(updatedColumns)
  }, [columns, updateColumns])
  const hideAllColumns = useCallback(() => {
    // Keep at least one column visible
    const updatedColumns = columns.map((col, index) => ({
      ...col,
      visible: index === 0
    }))
    updateColumns(updatedColumns)
  }, [columns, updateColumns])
  const resetToDefault = useCallback(() => {
    onReset?.()
  }, [onReset])
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!allowReorder) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [allowReorder])
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!allowReorder || draggedIndex === null) return
    e.preventDefault()
    setDragOverIndex(index)
  }, [allowReorder, draggedIndex])
  const handleDragEnd = useCallback(() => {
    if (!allowReorder || draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    const reorderedColumns = [...sortedColumns]
    const draggedColumn = reorderedColumns[draggedIndex]
    // Remove dragged item
    reorderedColumns.splice(draggedIndex, 1)
    // Insert at new position
    reorderedColumns.splice(dragOverIndex, 0, draggedColumn)
    // Update order property
    const updatedColumns = columns.map(col => {
      const newIndex = reorderedColumns.findIndex(reorderedCol => reorderedCol.id === col.id)
      return { ...col, order: newIndex }
    })
    updateColumns(updatedColumns)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [allowReorder, draggedIndex, dragOverIndex, sortedColumns, columns, updateColumns])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleDragEnd()
  }, [handleDragEnd])
  return (
    <div className={cn('space-y-2', className)}>
      {/* Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Colonnes
          {showVisibilityCount && (
            <Badge variant="secondary" className="ml-1">
              {visibleColumns.length}/{columns.length}
            </Badge>
          )}
        </Button>
        {onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            disabled={disabled}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Expanded Column Manager */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-4 bg-background">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={showAllColumns}
                disabled={disabled || visibleColumns.length === columns.length}
              >
                <Eye className="h-4 w-4 mr-1" />
                Tout afficher
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={hideAllColumns}
                disabled={disabled || visibleColumns.length <= 1}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Tout masquer
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Column List */}
          <div className="space-y-2 max-h-64 overflow-auto">
            <Label className="text-sm font-medium">Gestion des colonnes</Label>
            <div className="space-y-1">
              {sortedColumns.map((column, index) => {
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index
                return (
                  <div
                    key={column.id}
                    draggable={allowReorder && !disabled}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    className={cn(
                      'flex items-center gap-3 p-2 border rounded-lg transition-all',
                      isDragging && 'opacity-50',
                      isDragOver && allowReorder && 'border-primary bg-primary/5',
                      allowReorder && 'cursor-move',
                      !column.visible && 'bg-muted/50'
                    )}
                  >
                    {/* Drag Handle */}
                    {allowReorder && (
                      <div className="flex-shrink-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {/* Visibility Toggle */}
                    <div className="flex-shrink-0">
                      <Checkbox
                        id={`column-${column.id}`}
                        checked={column.visible}
                        onCheckedChange={() => toggleColumnVisibility(column.id)}
                        disabled={disabled || (column.visible && visibleColumns.length === 1)}
                      />
                    </div>
                    {/* Column Info */}
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={`column-${column.id}`} 
                        className={cn(
                          'text-sm cursor-pointer',
                          !column.visible && 'text-muted-foreground'
                        )}
                      >
                        {column.label}
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        {column.key}
                        {column.width && ` • ${column.width}px`}
                      </div>
                    </div>
                    {/* Column Properties */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {column.sortable && (
                        <Badge variant="outline" className="text-xs">
                          Triable
                        </Badge>
                      )}
                      {column.resizable && (
                        <Badge variant="outline" className="text-xs">
                          Redimensionnable
                        </Badge>
                      )}
                    </div>
                    {/* Visibility Indicator */}
                    <div className="flex-shrink-0">
                      {column.visible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Summary */}
          <div className="pt-3 border-t text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Colonnes visibles: {visibleColumns.length}</span>
              <span>Colonnes masquées: {hiddenColumns.length}</span>
            </div>
            {allowReorder && (
              <div className="text-xs mt-1">
                Glissez-déposez pour réorganiser les colonnes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
