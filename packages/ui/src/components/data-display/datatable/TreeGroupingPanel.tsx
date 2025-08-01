'use client'

import { Badge } from '../badge'
import { Button } from '../../primitives/button'
import { Separator } from '../../primitives'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Expand,
  GripVertical,
  Minimize,
  Network,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { SimpleModal } from './SimpleModal'
import type { ColumnConfig } from './types'
import type { TreeGroupingConfig } from './use-tree-grouping'

interface TreeGroupingPanelProps<T = any> {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnConfig<T>[]
  config: TreeGroupingConfig
  onConfigChange: (config: TreeGroupingConfig) => void
  onAddColumn: (columnId: string) => void
  onRemoveColumn: (columnId: string) => void
  onReorderColumns: (oldIndex: number, newIndex: number) => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onClearGrouping: () => void
}

export function TreeGroupingPanel<T = any>({
  open,
  onOpenChange,
  columns,
  config,
  onConfigChange,
  onAddColumn,
  onRemoveColumn,
  onReorderColumns,
  onExpandAll,
  onCollapseAll,
  onClearGrouping,
}: TreeGroupingPanelProps<T>) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  // Colonnes disponibles pour le regroupement
  const availableColumns = columns.filter((col) => !config.columns.includes(col.id))
  const groupingColumns = config.columns
    .map((colId) => columns.find((c) => c.id === colId))
    .filter(Boolean) as ColumnConfig<T>[]

  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedItem === null || draggedItem === index) return

    onReorderColumns(draggedItem, index)
    setDraggedItem(index)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  return (
    <SimpleModal
      open={open}
      onOpenChange={onOpenChange}
      title="Regroupement en arbre"
      maxWidth="max-w-2xl"
    >
      <div className="p-6">
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Actions rapides</p>
              <p className="text-xs text-muted-foreground">Gérez l'expansion et le regroupement</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExpandAll}
                disabled={config.columns.length === 0}
              >
                <Expand className="h-4 w-4 mr-2" />
                Tout étendre
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onCollapseAll}
                disabled={config.columns.length === 0}
              >
                <Minimize className="h-4 w-4 mr-2" />
                Tout réduire
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onClearGrouping}
                disabled={config.columns.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </div>
          </div>

          {/* Colonnes de regroupement actuelles */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Colonnes de regroupement ({groupingColumns.length})
            </h3>

            {groupingColumns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun regroupement configuré</p>
                <p className="text-sm">Ajoutez des colonnes ci-dessous pour créer une hiérarchie</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groupingColumns.map((column, index) => (
                  <div
                    key={column.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors ${
                      draggedItem === index ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Indicateur de niveau */}
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        Niveau {index + 1}
                      </Badge>
                    </div>

                    {/* Icône de drag */}
                    <GripVertical className="h-4 w-4 text-muted-foreground" />

                    {/* Informations de la colonne */}
                    <div className="flex-1">
                      <div className="font-medium">{column.title}</div>
                      <div className="text-xs text-muted-foreground">ID: {column.id}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReorderColumns(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onReorderColumns(index, Math.min(groupingColumns.length - 1, index + 1))
                        }
                        disabled={index === groupingColumns.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="sm" onClick={() => onRemoveColumn(column.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Colonnes disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Colonnes disponibles ({availableColumns.length})
            </h3>

            {availableColumns.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">
                  Toutes les colonnes sont déjà utilisées pour le regroupement
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableColumns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{column.title}</div>
                      <div className="text-xs text-muted-foreground">ID: {column.id}</div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => onAddColumn(column.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prévisualisation de la hiérarchie */}
          {groupingColumns.length > 0 && (
            <>
              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Prévisualisation de la hiérarchie</h3>

                <div className="border rounded-lg p-4 bg-muted/20">
                  {groupingColumns.map((column, index) => (
                    <div
                      key={column.id}
                      className="flex items-center gap-2 py-1"
                      style={{ paddingLeft: `${index * 20}px` }}
                    >
                      {index < groupingColumns.length - 1 ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}

                      <Badge variant={index === groupingColumns.length - 1 ? 'default' : 'outline'}>
                        {column.title}
                      </Badge>

                      {index === groupingColumns.length - 1 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (éléments individuels)
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Les données seront groupées dans cet ordre hiérarchique. Utilisez le drag & drop
                  pour réorganiser les niveaux.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-border">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Fermer
        </Button>
      </div>
    </SimpleModal>
  )
}

export default TreeGroupingPanel
