'use client'

import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'

// Types pour les éléments de liste
export interface ReorderableItem {
  id: string
  children?: ReorderableItem[]
  [key: string]: any
}

export interface RenderItemProps<T extends ReorderableItem> {
  item: T
  level: number
  isExpanded: boolean
  hasChildren: boolean
  onToggleExpand?: (id: string) => void
  isDragOverlay?: boolean
}

export interface ReorderableListProps<T extends ReorderableItem> {
  items: T[]
  onItemsChange?: (items: T[]) => void
  onSave?: (items: T[]) => void
  renderItem: (props: RenderItemProps<T>) => React.ReactNode
  maxDepth?: number
  allowNesting?: boolean
  showSaveButton?: boolean
  saveButtonText?: string
  className?: string
  itemClassName?: string
  dragHandleClassName?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  dragOverlayRenderer?: (item: T) => React.ReactNode
  dropIndicatorClassName?: string
}

// Utilitaires pour la manipulation des arbres
const flattenTree = <T extends ReorderableItem>(
  items: T[],
  parentId: string | null = null,
  level = 0
): Array<T & { level: number; parentId: string | null }> => {
  const flattened: Array<T & { level: number; parentId: string | null }> = []

  items.forEach((item) => {
    flattened.push({ ...item, level, parentId })
    if (item.children && item.children.length > 0) {
      flattened.push(...flattenTree(item.children as T[], item.id, level + 1))
    }
  })

  return flattened
}

const _findItemById = <T extends ReorderableItem>(items: T[], id: string): T | null => {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const found = _findItemById(item.children as T[], id)
      if (found) return found
    }
  }
  return null
}

// Hook pour gérer le drag & drop natif
function useDragAndDrop<T extends ReorderableItem>(
  items: T[],
  onItemsChange?: (items: T[]) => void,
  onExpandItem?: (id: string) => void
) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | 'inside'>('inside')
  const dragImageRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.DragEvent, item: T) => {
    setDraggedItem(item)

    // Créer une image de drag personnalisée
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 50, 20)
    }

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      e.stopPropagation() // Empêcher la propagation vers les parents
      e.dataTransfer.dropEffect = 'move'

      if (draggedItem && draggedItem.id !== targetId) {
        setDragOverItem(targetId)

        // Calculer la position de drop basée sur la position de la souris
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const y = e.clientY - rect.top
        const height = rect.height

        // Zones plus intuitives : inside plus large pour faciliter l'insertion
        if (y < height * 0.2) {
          setDropPosition('above')
        } else if (y > height * 0.8) {
          setDropPosition('below')
        } else {
          setDropPosition('inside')
        }
      }
    },
    [draggedItem]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Seulement clear si on quitte vraiment l'élément (pas ses enfants)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
      setDropPosition('inside')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      e.stopPropagation() // Empêcher la propagation vers les parents

      if (!draggedItem || draggedItem.id === targetId) {
        return
      }

      // STEP 1: Trouver le parent de chaque élément
      const findItemParent = (
        items: T[],
        childId: string,
        parentId: string | null = null
      ): string | null => {
        for (const item of items) {
          if (item.id === childId) {
            return parentId
          }
          if (item.children) {
            const found = findItemParent(item.children as T[], childId, item.id)
            if (found !== null) return found
          }
        }
        return null
      }

      const draggedParentId = findItemParent(items, draggedItem.id)
      const targetParentId = findItemParent(items, targetId)

      // STEP 2: Logique différenciée selon la position
      if (dropPosition === 'inside') {
        // Pour 'inside': on ne bouge que si on change de parent
        if (draggedParentId === targetId) {
          setDraggedItem(null)
          setDragOverItem(null)
          setDropPosition('inside')
          return
        } else {
          // Continue avec la logique inter-parent
        }
      } else if (draggedParentId === targetParentId) {
        // Fonction pour réorganiser dans le même tableau
        const reorderInSameParent = (items: T[]): T[] => {
          if (draggedParentId === null) {
            // Niveau racine
            const newItems = [...items]
            const draggedIdx = newItems.findIndex((i) => i.id === draggedItem.id)
            const targetIdx = newItems.findIndex((i) => i.id === targetId)

            if (draggedIdx !== -1 && targetIdx !== -1) {
              const [moved] = newItems.splice(draggedIdx, 1)
              let insertIdx = targetIdx
              if (draggedIdx < targetIdx) insertIdx--
              if (dropPosition === 'below') insertIdx++
              newItems.splice(insertIdx, 0, moved)
            }
            return newItems
          } else {
            // Dans un parent spécifique
            const updateItems = (currentItems: T[]): T[] => {
              return currentItems.map((item) => {
                if (item.id === draggedParentId && item.children) {
                  const children = [...(item.children as T[])]
                  const draggedIdx = children.findIndex((i) => i.id === draggedItem.id)
                  const targetIdx = children.findIndex((i) => i.id === targetId)

                  if (draggedIdx !== -1 && targetIdx !== -1) {
                    const [moved] = children.splice(draggedIdx, 1)
                    let insertIdx = targetIdx
                    if (draggedIdx < targetIdx) insertIdx--
                    if (dropPosition === 'below') insertIdx++
                    children.splice(insertIdx, 0, moved)
                    return { ...item, children }
                  }
                }
                if (item.children) {
                  return { ...item, children: updateItems(item.children as T[]) }
                }
                return item
              })
            }
            return updateItems(items)
          }
        }

        const newItems = reorderInSameParent(items)
        onItemsChange?.(newItems)
      }

      // STEP 3: Logique inter-parent (soit position 'inside' vers nouveau parent, soit parents différents)
      if (
        (dropPosition === 'inside' && draggedParentId !== targetId) ||
        (dropPosition !== 'inside' && draggedParentId !== targetParentId)
      ) {
        // STEP 3: Logique inter-parent - retirer de l'ancien parent et insérer dans le nouveau
        const removeItemFromTree = (
          items: T[],
          itemId: string
        ): { newItems: T[]; removedItem: T | null } => {
          const processItems = (currentItems: T[]): { newItems: T[]; removedItem: T | null } => {
            for (let i = 0; i < currentItems.length; i++) {
              if (currentItems[i].id === itemId) {
                const removed = currentItems[i]
                const newItems = [...currentItems.slice(0, i), ...currentItems.slice(i + 1)]
                return { newItems, removedItem: removed }
              }
              const children = currentItems[i].children
              if (children && children.length > 0) {
                const result = processItems(children as T[])
                if (result.removedItem) {
                  const newItems = [...currentItems]
                  newItems[i] = { ...newItems[i], children: result.newItems }
                  return { newItems, removedItem: result.removedItem }
                }
              }
            }
            return { newItems: currentItems, removedItem: null }
          }
          return processItems(items)
        }

        const insertItemInTree = (
          items: T[],
          item: T,
          targetId: string,
          position: 'above' | 'below' | 'inside'
        ): T[] => {
          const processLevel = (currentItems: T[]): { items: T[]; found: boolean } => {
            for (let i = 0; i < currentItems.length; i++) {
              if (currentItems[i].id === targetId) {
                const newItems = [...currentItems]

                if (position === 'above') {
                  newItems.splice(i, 0, item)
                } else if (position === 'below') {
                  newItems.splice(i + 1, 0, item)
                } else {
                  // inside

                  // Nettoyer l'item avant de l'insérer (retirer d'éventuels parents)
                  const cleanItem = { ...item }
                  delete cleanItem.parentId

                  if (newItems[i].children) {
                    const updatedChildren = [...(newItems[i].children as T[]), cleanItem]
                    newItems[i] = {
                      ...newItems[i],
                      children: updatedChildren,
                    }
                  } else {
                    newItems[i] = { ...newItems[i], children: [cleanItem] }
                  }

                  // Auto-expand le parent pour montrer le résultat
                  if (onExpandItem) {
                    onExpandItem(newItems[i].id)
                  }
                }
                return { items: newItems, found: true }
              }

              // Rechercher récursivement dans les enfants
              const children = currentItems[i].children
              if (children && children.length > 0) {
                const result = processLevel(children as T[])
                if (result.found) {
                  const newItems = [...currentItems]
                  newItems[i] = { ...newItems[i], children: result.items }
                  return { items: newItems, found: true }
                }
              }
            }
            return { items: currentItems, found: false }
          }

          const result = processLevel(items)
          if (!result.found) {
          }
          return result.items
        }

        // Retirer l'élément de sa position actuelle
        const { newItems: itemsWithoutDragged, removedItem } = removeItemFromTree(
          items,
          draggedItem.id
        )

        if (removedItem) {
          // Insérer l'élément à sa nouvelle position
          const finalItems = insertItemInTree(
            itemsWithoutDragged,
            removedItem,
            targetId,
            dropPosition
          )
          onItemsChange?.(finalItems)
        } else {
        }
      }

      // Cleanup
      setDraggedItem(null)
      setDragOverItem(null)
      setDropPosition('inside')
    },
    [draggedItem, dropPosition, items, onItemsChange, onExpandItem]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverItem(null)
    setDropPosition('inside')
  }, [])

  return {
    draggedItem,
    dragOverItem,
    dropPosition,
    dragImageRef,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}

// Indicateur de drop zone
function DropIndicator({
  position,
  show,
  className,
}: {
  position: 'above' | 'below' | 'inside'
  show: boolean
  className?: string
}) {
  if (!show) return null

  if (position === 'inside') {
    return (
      <div
        className={cn(
          'absolute inset-0 border-2 border-green-500 bg-green-500/15 rounded-md',
          'transition-all duration-300 ease-out',
          'shadow-lg shadow-green-500/25 backdrop-blur-sm',
          'animate-pulse',
          "before:content-['📁'] before:absolute before:top-1 before:right-1",
          'before:text-green-600 before:text-sm before:font-bold before:drop-shadow-sm',
          'before:animate-bounce',
          'after:absolute after:inset-0 after:bg-gradient-to-br after:from-green-400/10 after:to-green-600/10',
          'after:rounded-md after:opacity-50',
          className
        )}
      />
    )
  }

  const positionClass = position === 'above' ? '-top-1' : '-bottom-1'

  return (
    <div className={cn(`absolute ${positionClass} left-0 right-0 z-50`, className)}>
      <div
        className={cn(
          'h-1 bg-primary shadow-lg shadow-primary/40 transition-all duration-300 ease-out',
          'animate-pulse backdrop-blur-sm',
          'bg-gradient-to-r from-primary/80 via-primary to-primary/80'
        )}
      />
      <div
        className={cn(
          'absolute -left-2 -top-1 w-3 h-3 bg-primary rounded-full',
          'shadow-lg shadow-primary/50 transition-all duration-300',
          'animate-ping bg-gradient-to-br from-primary/90 to-primary'
        )}
      />
      <div
        className={cn(
          'absolute -right-2 -top-1 w-3 h-3 bg-primary rounded-full',
          'shadow-lg shadow-primary/50 transition-all duration-300',
          'animate-ping bg-gradient-to-br from-primary/90 to-primary'
        )}
      />
      {/* Ligne de surlignage subtile */}
      <div
        className={cn(
          'absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r',
          'from-transparent via-primary/30 to-transparent',
          'animate-pulse'
        )}
      />
    </div>
  )
}

// Composant d'un élément sortable
interface SortableItemProps<T extends ReorderableItem> {
  item: T
  level: number
  renderItem: (props: RenderItemProps<T>) => React.ReactNode
  maxDepth: number
  allowNesting: boolean
  collapsible: boolean
  isExpanded: boolean
  onToggleExpand?: (id: string) => void
  itemClassName?: string
  dragHandleClassName?: string
  expandedItems?: Set<string>
  dropIndicatorClassName?: string
  // Props du drag & drop natif
  isDragging: boolean
  isDragOver: boolean
  dropPosition: 'above' | 'below' | 'inside'
  onDragStart: (e: React.DragEvent, item: T) => void
  onDragOver: (e: React.DragEvent, targetId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetId: string) => void
  onDragEnd: () => void
  // Props pour la gestion des enfants
  draggedItem?: T | null
  dragOverItem?: string | null
}

function SortableItem<T extends ReorderableItem>({
  item,
  level,
  renderItem,
  maxDepth,
  allowNesting,
  collapsible,
  isExpanded,
  onToggleExpand,
  itemClassName,
  dragHandleClassName,
  expandedItems,
  dropIndicatorClassName,
  isDragging,
  isDragOver,
  dropPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedItem,
  dragOverItem,
}: SortableItemProps<T>) {
  const hasChildren = Boolean(item.children && item.children.length > 0)
  const showChildren = hasChildren && isExpanded

  return (
    <div className="relative">
      <DropIndicator position={dropPosition} show={isDragOver} className={dropIndicatorClassName} />

      <div
        className={cn('relative', isDragging && 'opacity-50')}
        onDragOver={(e) => onDragOver(e, item.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, item.id)}
      >
        <div
          className={cn(
            'group bg-card border border-border rounded-lg relative overflow-hidden',
            'transition-all duration-300 ease-out',
            'hover:scale-[1.01] hover:-translate-y-0.5',
            'hover:shadow-md hover:shadow-primary/5',
            'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/3 before:to-transparent',
            'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
            // Classes de menu de la sidebar
            level > 0 ? 'menu-item-inactive-sub' : 'menu-item-inactive',
            isDragOver &&
              dropPosition === 'inside' &&
              'bg-blue-50 border-blue-300 shadow-lg shadow-blue-500/20',
            isDragging && 'opacity-60 scale-95 shadow-none',
            itemClassName
          )}
          style={{
            marginLeft: level > 0 ? `${level * 24}px` : '0px',
            borderLeft:
              level > 0 ? `2px solid hsl(var(--primary) / ${isDragging ? '0.1' : '0.2'})` : 'none',
          }}
        >
          <div className="flex items-stretch">
            {/* Handle de drag */}
            <div
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onDragEnd={onDragEnd}
              className={cn(
                'flex items-center justify-center w-10 bg-muted/30 border-r border-border',
                'cursor-grab active:cursor-grabbing touch-none select-none',
                'hover:bg-primary/15 active:bg-primary/25 hover:border-r-primary/20',
                'transition-all duration-300 ease-out transform',
                'hover:scale-110 active:scale-95',
                'rounded-l-lg flex-shrink-0',
                'relative overflow-hidden',
                'before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary/5 before:to-transparent',
                'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200',
                level > 1 && 'bg-primary/8 border-r-primary/10', // Plus visible aux niveaux profonds
                isDragging && 'bg-primary/20 border-r-primary/30',
                dragHandleClassName
              )}
              style={{
                cursor: 'grab',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
              }}
            >
              <GripVertical
                className={cn(
                  'h-4 w-4 text-muted-foreground/70 transition-all duration-300',
                  'group-hover:text-primary group-hover:scale-110',
                  'hover:text-primary/80 hover:drop-shadow-sm',
                  level > 1 && 'text-primary/60',
                  isDragging && 'text-primary scale-110'
                )}
              />
            </div>

            {/* Bouton d'expansion */}
            {collapsible && hasChildren && (
              <div className="flex items-center border-r border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onToggleExpand?.(item.id)
                  }}
                  className={cn(
                    'h-full px-2 rounded-none transition-all duration-300 ease-out',
                    'hover:bg-primary/10 hover:border-r-primary/20 hover:scale-105',
                    'active:scale-95 active:bg-primary/15',
                    'relative overflow-hidden',
                    'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:to-primary/5',
                    'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200',
                    hasChildren && isExpanded && 'bg-primary/5 border-r-primary/10'
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-all duration-300',
                        'group-hover:text-primary group-hover:scale-110 hover:drop-shadow-sm',
                        'text-primary/70'
                      )}
                    />
                  ) : (
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-all duration-300',
                        'group-hover:text-primary group-hover:scale-110 hover:drop-shadow-sm',
                        'text-muted-foreground/70 hover:text-primary/80'
                      )}
                    />
                  )}
                </Button>
              </div>
            )}

            {/* Contenu de l'item */}
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2">
                {/* Indicateur de niveau pour les éléments profonds */}
                {level > 0 && (
                  <div className="flex items-center gap-1 group-hover:scale-105 transition-transform duration-300">
                    {Array.from({ length: level }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1 h-1 rounded-full transition-all duration-300',
                          'bg-primary/30 group-hover:bg-primary/50',
                          i === level - 1 &&
                            'bg-primary/60 group-hover:bg-primary/80 group-hover:scale-125',
                          'group-hover:shadow-sm group-hover:shadow-primary/20'
                        )}
                      />
                    ))}
                    <span
                      className={cn(
                        'text-xs text-muted-foreground/60 mr-2 transition-all duration-300',
                        'group-hover:text-primary/70 group-hover:font-medium'
                      )}
                    >
                      L{level}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  {renderItem({
                    item,
                    level,
                    isExpanded,
                    hasChildren,
                    onToggleExpand,
                    isDragOverlay: false,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enfants */}
        {showChildren && allowNesting && level < maxDepth && (
          <div className="mt-2 space-y-1 relative">
            {/* Ligne de connexion visuelle pour les niveaux profonds */}
            {level > 0 && (
              <div
                className={cn(
                  'absolute w-0.5 transition-all duration-300',
                  'bg-primary/10 group-hover:bg-primary/20',
                  'group-hover:shadow-sm group-hover:shadow-primary/10'
                )}
                style={{
                  left: `${level * 24 - 12}px`,
                  top: '100%',
                  height: `${(item.children?.length || 0) * 80}px`,
                  zIndex: 1,
                }}
              />
            )}
            {item.children?.map((child) => (
              <SortableItemWrapper
                key={child.id}
                item={child as T}
                level={level + 1}
                renderItem={renderItem}
                maxDepth={maxDepth}
                allowNesting={allowNesting}
                collapsible={collapsible}
                isExpanded={expandedItems?.has(child.id) || false}
                onToggleExpand={onToggleExpand}
                expandedItems={expandedItems}
                itemClassName={itemClassName}
                dragHandleClassName={dragHandleClassName}
                dropIndicatorClassName={dropIndicatorClassName}
                draggedItem={draggedItem || null}
                dragOverItem={dragOverItem || null}
                dropPosition={dropPosition}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Wrapper pour gérer les états de drag des enfants
interface SortableItemWrapperProps<T extends ReorderableItem>
  extends Omit<SortableItemProps<T>, 'isDragging' | 'isDragOver'> {
  draggedItem: T | null
  dragOverItem: string | null
}

function SortableItemWrapper<T extends ReorderableItem>(props: SortableItemWrapperProps<T>) {
  const { draggedItem, dragOverItem, item, ...rest } = props

  return (
    <SortableItem
      {...rest}
      item={item}
      isDragging={draggedItem?.id === item.id}
      isDragOver={dragOverItem === item.id}
      draggedItem={draggedItem ?? null}
      dragOverItem={dragOverItem ?? null}
    />
  )
}

// Composant principal
export function ReorderableList<T extends ReorderableItem>({
  items,
  onItemsChange,
  onSave,
  renderItem,
  maxDepth = 5,
  allowNesting = true,
  showSaveButton = false,
  saveButtonText = 'Sauvegarder',
  className,
  itemClassName,
  dragHandleClassName,
  collapsible = true,
  defaultExpanded = true,
  dragOverlayRenderer,
  dropIndicatorClassName,
}: ReorderableListProps<T>) {
  const [localItems, setLocalItems] = useState<T[]>(items)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(defaultExpanded ? flattenTree(items).map((item) => item.id) : [])
  )

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const {
    draggedItem,
    dragOverItem,
    dropPosition,
    dragImageRef,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(
    localItems,
    (newItems) => {
      setLocalItems(newItems)
      onItemsChange?.(newItems)
    },
    handleToggleExpand
  )

  React.useEffect(() => {
    setLocalItems(items)
  }, [items])

  const handleSave = useCallback(() => {
    onSave?.(localItems)
  }, [localItems, onSave])

  return (
    <div className={cn('space-y-4', className)}>
      {showSaveButton && (
        <div className="flex justify-end">
          <Button onClick={handleSave} variant="default">
            {saveButtonText}
          </Button>
        </div>
      )}

      {/* Image de drag invisible pour personnaliser l'apparence */}
      <div
        ref={dragImageRef}
        className="fixed -top-96 left-0 pointer-events-none bg-card border border-primary/50 rounded-lg shadow-xl p-2 text-sm font-medium text-primary z-50"
        style={{ transform: 'rotate(-2deg)' }}
      >
        {draggedItem && (
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            <span>📋 {draggedItem.id}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {localItems.map((item) => (
          <SortableItemWrapper
            key={item.id}
            item={item}
            level={0}
            renderItem={renderItem}
            maxDepth={maxDepth}
            allowNesting={allowNesting}
            collapsible={collapsible}
            isExpanded={expandedItems.has(item.id)}
            onToggleExpand={handleToggleExpand}
            expandedItems={expandedItems}
            itemClassName={itemClassName}
            dragHandleClassName={dragHandleClassName}
            dropIndicatorClassName={dropIndicatorClassName}
            draggedItem={draggedItem}
            dragOverItem={dragOverItem}
            dropPosition={dropPosition}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  )
}
