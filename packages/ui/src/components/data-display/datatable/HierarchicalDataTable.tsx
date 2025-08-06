'use client'

import { ChevronDown, ChevronRight, Eye, GripVertical, Minus, Plus, Settings } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'
import { RenderUtils } from './render-utils'
import type { ColumnConfig } from './types'
import {
  type HierarchicalDatatableConfig,
  type HierarchicalItem,
  type HierarchicalTreeNode,
  useHierarchicalReorder,
} from './use-hierarchical-reorder'

export interface HierarchicalDataTableProps<T extends HierarchicalItem = HierarchicalItem> {
  data: T[]
  columns: ColumnConfig<T>[]
  config: HierarchicalDatatableConfig
  onDataChange?: (data: T[]) => void
  onConfigChange?: (config: HierarchicalDatatableConfig) => void
  className?: string
  onRowClick?: (item: T) => void
  onRowDoubleClick?: (item: T) => void
  onCellEdit?: (item: T, columnId: string, value: any) => void
  actions?: React.ReactNode
}

// Indicateur de drop zone pour hiérarchie
function HierarchicalDropIndicator({
  position,
  show,
  level,
  style = 'line',
}: {
  position: 'above' | 'below' | 'inside'
  show: boolean
  level: number
  style?: 'line' | 'highlight'
}) {
  if (!show) return null

  const indent = level * 24

  if (position === 'inside') {
    return (
      <div
        className={cn(
          'absolute inset-0 border-2 border-green-500 bg-green-500/10 rounded-md',
          'transition-all duration-200 ease-out',
          style === 'highlight' && 'bg-green-500/20 shadow-lg shadow-green-500/20'
        )}
        style={{ marginLeft: `${indent}px` }}
      >
        <div className="absolute top-1 right-1 text-green-600 text-sm font-bold">📁</div>
      </div>
    )
  }

  const positionClass = position === 'above' ? '-top-0.5' : '-bottom-0.5'

  return (
    <div
      className={cn(`absolute ${positionClass} left-0 right-0 z-50`)}
      style={{ marginLeft: `${indent}px` }}
    >
      <div className="h-0.5 bg-primary shadow-md transition-all duration-200" />
      <div className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full shadow-md" />
      <div className="absolute -right-1 -top-1 w-2 h-2 bg-primary rounded-full shadow-md" />
    </div>
  )
}

// Ligne de connexion hiérarchique
function ConnectionLine({
  level,
  isLast,
  hasChildren,
  isExpanded,
  show = true,
}: {
  level: number
  isLast: boolean
  hasChildren: boolean
  isExpanded: boolean
  show?: boolean
}) {
  if (!show || level === 0) return null

  return (
    <div className="absolute top-0 bottom-0" style={{ left: `${(level - 1) * 24 + 12}px` }}>
      {/* Ligne verticale */}
      <div
        className={cn(
          'absolute w-px bg-border transition-colors duration-300',
          'top-0',
          isLast ? 'h-6' : 'h-full'
        )}
      />

      {/* Ligne horizontale */}
      <div
        className={cn('absolute top-6 w-3 h-px bg-border transition-colors duration-300', 'left-0')}
      />
    </div>
  )
}

// Composant pour un nœud hiérarchique
function HierarchicalNode<T extends HierarchicalItem>({
  node,
  columns,
  config,
  isLast,
  onToggleExpansion,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  dropPosition,
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
}: {
  node: HierarchicalTreeNode<T>
  columns: ColumnConfig<T>[]
  config: HierarchicalDatatableConfig
  isLast: boolean
  onToggleExpansion: (nodeId: string) => void
  onDragStart: (node: HierarchicalTreeNode<T>) => void
  onDragOver: (e: React.DragEvent, targetId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetId: string) => void
  onDragEnd: () => void
  isDragging: boolean
  isDragOver: boolean
  dropPosition: 'above' | 'below' | 'inside'
  onRowClick?: (item: T) => void
  onRowDoubleClick?: (item: T) => void
  onCellEdit?: (item: T, columnId: string, value: any) => void
}) {
  const { item, level, hasChildren, isExpanded } = node
  const { displayConfig, reorderConfig } = config
  const indent = level * displayConfig.indentSize

  const levelColor = displayConfig.levelColors[level] || 'hsl(var(--muted-foreground))'

  return (
    <div className="relative">
      <HierarchicalDropIndicator
        position={dropPosition}
        show={isDragOver}
        level={level}
        style={reorderConfig.dropIndicatorStyle}
      />

      {/* Lignes de connexion */}
      {displayConfig.showConnectionLines && (
        <ConnectionLine
          level={level}
          isLast={isLast}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
        />
      )}

      <div
        className={cn(
          'relative bg-card border border-border rounded-lg transition-all duration-200',
          'hover:shadow-md hover:shadow-primary/5',
          isDragging && 'opacity-50 scale-95',
          isDragOver && dropPosition === 'inside' && 'bg-green-50 border-green-300',
          displayConfig.compactMode ? 'min-h-[40px]' : 'min-h-[56px]'
        )}
        style={{
          marginLeft: `${indent}px`,
          borderLeft: level > 0 ? `3px solid ${levelColor}` : 'none',
        }}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node.id)}
        onClick={() => onRowClick?.(item)}
        onDoubleClick={() => onRowDoubleClick?.(item)}
      >
        <div className="flex items-center">
          {/* Handle de drag */}
          {reorderConfig.enableDragDrop && reorderConfig.dragHandleVisible && (
            <div
              draggable
              onDragStart={() => onDragStart(node)}
              onDragEnd={onDragEnd}
              className={cn(
                'flex items-center justify-center w-8 h-full bg-muted/30 border-r border-border',
                'cursor-grab active:cursor-grabbing',
                'hover:bg-primary/10 transition-colors duration-200',
                displayConfig.compactMode ? 'w-6' : 'w-8'
              )}
            >
              <GripVertical
                className={cn(
                  'text-muted-foreground/70 transition-colors duration-200',
                  'hover:text-primary',
                  displayConfig.compactMode ? 'h-3 w-3' : 'h-4 w-4'
                )}
              />
            </div>
          )}

          {/* Bouton d'expansion */}
          {hasChildren && (
            <div className="flex items-center border-r border-border">
              <Button
                variant="ghost"
                size={displayConfig.compactMode ? 'sm' : 'default'}
                onClick={(e: any) => {
                  e.stopPropagation()
                  onToggleExpansion(node.id)
                }}
                className="h-full px-2 rounded-none hover:bg-primary/10"
              >
                {isExpanded ? (
                  <ChevronDown
                    className={cn(
                      'transition-transform duration-200',
                      displayConfig.compactMode ? 'h-3 w-3' : 'h-4 w-4'
                    )}
                  />
                ) : (
                  <ChevronRight
                    className={cn(
                      'transition-transform duration-200',
                      displayConfig.compactMode ? 'h-3 w-3' : 'h-4 w-4'
                    )}
                  />
                )}
              </Button>
            </div>
          )}

          {/* Indicateur de niveau */}
          {displayConfig.showLevelIndicators && level > 0 && (
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: level }, (_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: displayConfig.levelColors[i] || levelColor }}
                />
              ))}
              <span className="text-xs text-muted-foreground/60 ml-1">L{level}</span>
            </div>
          )}

          {/* Contenu des colonnes */}
          <div
            className="flex-1 grid gap-4 p-4"
            style={{
              gridTemplateColumns: `repeat(${columns.filter((c) => c.visible !== false).length}, 1fr)`,
            }}
          >
            {columns
              .filter((col) => col.visible !== false)
              .map((column) => (
                <div key={column.id} className="min-w-0">
                  <div
                    className={cn('truncate', displayConfig.compactMode ? 'text-sm' : 'text-base')}
                  >
                    {RenderUtils.renderCellValue(
                      column.getValue ? column.getValue(item) : (item as any)[column.key],
                      column as ColumnConfig<Record<string, unknown>>,
                      item,
                      !column.editable, // readonly si la colonne n'est pas éditable
                      (value) => onCellEdit?.(item, column.id, value)
                    )}
                  </div>
                  {!displayConfig.compactMode && column.description && (
                    <div className="text-xs text-muted-foreground/60 mt-1">{column.title}</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HierarchicalDataTable<T extends HierarchicalItem = HierarchicalItem>({
  data,
  columns,
  config: initialConfig,
  onDataChange,
  onConfigChange,
  className,
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
  actions,
}: HierarchicalDataTableProps<T>) {
  const {
    flattenedTree,
    config,
    draggedItem,
    dragOverItem,
    dropPosition,
    expandedNodes,
    toggleNodeExpansion,
    expandAll,
    collapseAll,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    updateConfig,
    updateHierarchyFilters,
  } = useHierarchicalReorder(data, initialConfig, onDataChange, onConfigChange)

  const [showSettings, setShowSettings] = useState(false)

  const handleDragOverWithPosition = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      e.stopPropagation()

      // Calculer la position de drop basée sur la position de la souris
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      let position: 'above' | 'below' | 'inside' = 'inside'

      if (y < height * 0.25) {
        position = 'above'
      } else if (y > height * 0.75) {
        position = 'below'
      } else {
        position = 'inside'
      }

      handleDragOver(targetId, position)
    },
    [handleDragOver]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      // On quitte vraiment l'élément
    }
  }, [])

  const visibleColumns = columns.filter((col) => col.visible !== false)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barre d'outils */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <Plus className="h-4 w-4 mr-1" />
            Tout étendre
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <Minus className="h-4 w-4 mr-1" />
            Tout réduire
          </Button>

          {/* Filtres de niveau */}
          {config.hierarchyFilters.showOnlyLevels.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Niveaux: {config.hierarchyFilters.showOnlyLevels.join(', ')}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateHierarchyFilters({ showOnlyLevels: [] })}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
          {actions}
        </div>
      </div>

      {/* Panneau de paramètres */}
      {showSettings && (
        <div className="p-4 bg-card border border-border rounded-lg space-y-4">
          <h3 className="font-medium">Paramètres d'affichage hiérarchique</h3>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.displayConfig.showLevelIndicators}
                onChange={(e) =>
                  updateConfig({
                    displayConfig: {
                      ...config.displayConfig,
                      showLevelIndicators: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Indicateurs de niveau</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.displayConfig.showConnectionLines}
                onChange={(e) =>
                  updateConfig({
                    displayConfig: {
                      ...config.displayConfig,
                      showConnectionLines: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Lignes de connexion</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.displayConfig.compactMode}
                onChange={(e) =>
                  updateConfig({
                    displayConfig: {
                      ...config.displayConfig,
                      compactMode: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Mode compact</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.reorderConfig.enableDragDrop}
                onChange={(e) =>
                  updateConfig({
                    reorderConfig: {
                      ...config.reorderConfig,
                      enableDragDrop: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Réorganisation</span>
            </label>
          </div>
        </div>
      )}

      {/* En-têtes de colonnes */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-center">
          {config.reorderConfig.enableDragDrop && config.reorderConfig.dragHandleVisible && (
            <div
              className={cn(
                'border-r border-border mr-4',
                config.displayConfig.compactMode ? 'w-6' : 'w-8'
              )}
            />
          )}

          <div
            className="flex-1 grid gap-4"
            style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, 1fr)` }}
          >
            {visibleColumns.map((column) => (
              <div key={column.id} className="font-medium text-sm">
                {column.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu hiérarchique */}
      <div className="space-y-1">
        {flattenedTree.map((node, index) => (
          <HierarchicalNode
            key={node.id}
            node={node}
            columns={columns}
            config={config}
            isLast={index === flattenedTree.length - 1}
            onToggleExpansion={toggleNodeExpansion}
            onDragStart={handleDragStart}
            onDragOver={handleDragOverWithPosition}
            onDragLeave={handleDragLeave}
            onDrop={(e, targetId) => {
              e.preventDefault()
              handleDrop(targetId)
            }}
            onDragEnd={handleDragEnd}
            isDragging={draggedItem?.id === node.id}
            isDragOver={dragOverItem === node.id}
            dropPosition={dropPosition}
            onRowClick={onRowClick}
            onRowDoubleClick={onRowDoubleClick}
            onCellEdit={onCellEdit}
          />
        ))}
      </div>

      {/* Message si aucune donnée */}
      {flattenedTree.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">Aucune donnée à afficher</div>
      )}
    </div>
  )
}
