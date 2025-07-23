'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GripVertical, ChevronDown, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@erp/ui'
import { 
  ReorderableItem, 
  RenderItemProps, 
  ThemedReorderableListProps,
  ReorderableTheme 
} from './reorderable-list-theme'
import { getTheme } from './reorderable-list-themes'
import { useReorderableConfig } from './use-reorderable-config'
import { ReorderableListCustomizationPanel } from './reorderable-list-customization-panel'

// Reprise du hook useDragAndDrop existant (simplifié)
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
    console.log('Native drag started:', item.id)
    setDraggedItem(item)
    
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 50, 20)
    }
    
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedItem && draggedItem.id !== targetId) {
      setDragOverItem(targetId)
      
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height
      
      if (y < height * 0.2) {
        setDropPosition('above')
      } else if (y > height * 0.8) {
        setDropPosition('below')
      } else {
        setDropPosition('inside')
      }
    }
  }, [draggedItem])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
      setDropPosition('inside')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedItem || draggedItem.id === targetId) {
      return
    }

    // Logique simplifiée de drop - à adapter selon vos besoins
    console.log('🎯 DROP EVENT:', {
      draggedId: draggedItem.id, 
      targetId, 
      position: dropPosition
    })

    // Ici vous pouvez implémenter votre logique de réorganisation
    // En utilisant la logique existante du composant original

    setDraggedItem(null)
    setDragOverItem(null)
    setDropPosition('inside')
  }, [draggedItem, dropPosition, items, onItemsChange])

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

// Utilitaires pour appliquer les styles des thèmes
function createThemeStyles(theme: ReorderableTheme) {
  return {
    container: {
      backgroundColor: theme.container.background,
      border: `1px solid ${theme.container.border}`,
      borderRadius: theme.container.borderRadius,
      padding: theme.container.padding
    },
    item: (isHover: boolean, isDragging: boolean, isActive: boolean) => ({
      backgroundColor: isDragging 
        ? theme.item.backgroundDragging
        : isActive 
          ? theme.item.backgroundActive 
          : isHover 
            ? theme.item.backgroundHover 
            : theme.item.background,
      border: `1px solid ${isActive ? theme.item.borderActive : isHover ? theme.item.borderHover : theme.item.border}`,
      borderRadius: theme.item.borderRadius,
      padding: theme.item.padding,
      color: isActive ? theme.item.textColorActive : isHover ? theme.item.textColorHover : theme.item.textColor,
      boxShadow: isHover ? theme.item.shadowHover : theme.item.shadow,
      transition: theme.item.transition,
      transform: theme.animations.hover && isHover && !isDragging
        ? `scale(${theme.animations.hover.scale}) translateY(${theme.animations.hover.translateY}px)`
        : isDragging 
          ? `scale(${theme.animations.drag.scale})`
          : 'none',
      opacity: isDragging ? theme.animations.drag.opacity : 1
    }),
    dragHandle: (isHover: boolean, isActive: boolean) => ({
      width: theme.dragHandle.width,
      backgroundColor: isActive ? theme.dragHandle.backgroundActive : isHover ? theme.dragHandle.backgroundHover : theme.dragHandle.background,
      border: `1px solid ${theme.dragHandle.border}`,
      color: isActive ? theme.dragHandle.iconColorActive : isHover ? theme.dragHandle.iconColorHover : theme.dragHandle.iconColor
    }),
    hierarchy: {
      indent: theme.hierarchy.indentSize,
      borderColor: theme.hierarchy.indentColor
    }
  }
}

// Indicateur de drop avec thème
function ThemedDropIndicator({ 
  position, 
  show, 
  theme,
  className 
}: { 
  position: 'above' | 'below' | 'inside'
  show: boolean
  theme: ReorderableTheme
  className?: string 
}) {
  if (!show) return null

  if (position === 'inside') {
    return (
      <div 
        className={cn("absolute inset-0 rounded-md transition-all duration-300", className)}
        style={{
          backgroundColor: theme.dropIndicator.inside.background,
          border: theme.dropIndicator.inside.border,
          animation: theme.dropIndicator.inside.animation === 'pulse' ? 'pulse 1s infinite' :
                    theme.dropIndicator.inside.animation === 'bounce' ? 'bounce 1s infinite' : 'none'
        }}
      >
        <div className="absolute top-1 right-1 text-sm">
          {theme.dropIndicator.inside.icon}
        </div>
      </div>
    )
  }

  const positionClass = position === 'above' ? '-top-1' : '-bottom-1'
  const indicator = position === 'above' ? theme.dropIndicator.above : theme.dropIndicator.below
  
  return (
    <div className={cn(`absolute ${positionClass} left-0 right-0 z-50`, className)}>
      <div 
        style={{
          height: indicator.thickness,
          backgroundColor: indicator.color,
          boxShadow: indicator.glow
        }}
        className="animate-pulse"
      />
    </div>
  )
}

// Composant d'élément avec thème
interface ThemedSortableItemProps<T extends ReorderableItem> {
  item: T
  level: number
  theme: ReorderableTheme
  renderItem: (props: RenderItemProps<T>) => React.ReactNode
  isExpanded: boolean
  onToggleExpand?: (id: string) => void
  expandedItems?: Set<string>
  config: any
  isDragging: boolean
  isDragOver: boolean
  dropPosition: 'above' | 'below' | 'inside'
  onDragStart: (e: React.DragEvent, item: T) => void
  onDragOver: (e: React.DragEvent, targetId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetId: string) => void
  onDragEnd: () => void
}

function ThemedSortableItem<T extends ReorderableItem>({
  item,
  level,
  theme,
  renderItem,
  isExpanded,
  onToggleExpand,
  expandedItems,
  config,
  isDragging,
  isDragOver,
  dropPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}: ThemedSortableItemProps<T>) {
  const [isHover, setIsHover] = useState(false)
  const hasChildren = Boolean(item.children && item.children.length > 0)
  const showChildren = hasChildren && isExpanded
  const styles = createThemeStyles(theme)

  return (
    <div className="relative">
      <ThemedDropIndicator 
        position={dropPosition} 
        show={isDragOver}
        theme={theme}
      />
      
      <div
        className="relative"
        style={{
          marginLeft: level > 0 ? `${level * theme.hierarchy.indentSize}px` : '0px',
          borderLeft: level > 0 ? `2px solid ${theme.hierarchy.indentColor}` : 'none'
        }}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onDragOver={(e) => onDragOver(e, item.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, item.id)}
      >
        <div
          className="group rounded-lg relative overflow-hidden"
          style={styles.item(isHover, isDragging, false)}
        >
          <div className="flex items-stretch">
            {/* Handle de drag avec thème */}
            {config.layout.dragHandlePosition === 'left' && (
              <div
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onDragEnd={onDragEnd}
                className="flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none rounded-l-lg flex-shrink-0 transition-all duration-200"
                style={styles.dragHandle(isHover, false)}
              >
                <GripVertical className="h-4 w-4 transition-all duration-200" />
              </div>
            )}

            {/* Bouton d'expansion */}
            {hasChildren && (
              <div className="flex items-center border-r border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onToggleExpand?.(item.id)
                  }}
                  className="h-full px-2 rounded-none transition-all duration-200"
                  style={{
                    width: theme.expandButton.size,
                    backgroundColor: isExpanded ? theme.expandButton.backgroundActive : isHover ? theme.expandButton.backgroundHover : theme.expandButton.background
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 transition-all duration-200" style={{ color: theme.expandButton.iconColorActive }} />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-all duration-200" style={{ color: theme.expandButton.iconColor }} />
                  )}
                </Button>
              </div>
            )}

            {/* Contenu de l'item */}
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2">
                {/* Indicateur de niveau */}
                {config.preferences.showLevelIndicators && level > 0 && (
                  <div className="flex items-center gap-1 mr-2">
                    {Array.from({ length: level }, (_, i) => (
                      <div
                        key={i}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: theme.hierarchy.levelIndicator.size,
                          height: theme.hierarchy.levelIndicator.size,
                          backgroundColor: i === level - 1 ? theme.hierarchy.levelIndicator.colorActive : theme.hierarchy.levelIndicator.color
                        }}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">L{level}</span>
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

            {/* Handle de drag à droite */}
            {config.layout.dragHandlePosition === 'right' && (
              <div
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onDragEnd={onDragEnd}
                className="flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none rounded-r-lg flex-shrink-0 transition-all duration-200"
                style={styles.dragHandle(isHover, false)}
              >
                <GripVertical className="h-4 w-4 transition-all duration-200" />
              </div>
            )}
          </div>
        </div>

        {/* Enfants */}
        {showChildren && config.layout.allowNesting && level < config.layout.maxDepth && (
          <div className="mt-2 space-y-1 relative">
            {/* Ligne de connexion */}
            {config.preferences.showConnectionLines && level > 0 && (
              <div 
                className="absolute w-0.5 transition-all duration-300"
                style={{
                  left: `${level * theme.hierarchy.indentSize - 12}px`,
                  top: '100%',
                  height: `${item.children!.length * 80}px`,
                  zIndex: 1,
                  backgroundColor: isHover ? theme.hierarchy.connectionLineHover : theme.hierarchy.connectionLine
                }}
              />
            )}
            
            {item.children!.map((child) => (
              <p key={child.id}>Enfant: {child.id}</p> // Remplacer par récursion
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant principal avec thèmes
export function ThemedReorderableList<T extends ReorderableItem>({
  items,
  onItemsChange,
  onSave,
  renderItem,
  componentId,
  theme: themeProp,
  config: configProp,
  customization,
  enableCustomization = false,
  showCustomizationPanel = false,
  customizationPanelPosition = 'right',
  onConfigChange,
  onError,
  ...otherProps
}: ThemedReorderableListProps<T>) {
  const [localItems, setLocalItems] = useState<T[]>(items)
  const [showCustomization, setShowCustomization] = useState(showCustomizationPanel)
  
  // Utilisation du hook de configuration
  const {
    config,
    loading,
    saving,
    error,
    saveConfig,
    resetConfig,
    updateTheme,
    updatePreferences,
    updateLayout
  } = useReorderableConfig(componentId)

  // Résolution du thème
  const resolvedTheme = useMemo(() => {
    if (typeof themeProp === 'object') {
      return themeProp
    }
    const themeId = themeProp || config.theme
    return getTheme(themeId)
  }, [themeProp, config.theme])

  // États pour la liste
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(config.preferences.defaultExpanded ? items.map(item => item.id) : [])
  )

  // Hook drag & drop
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
  } = useDragAndDrop(localItems, (newItems) => {
    setLocalItems(newItems)
    onItemsChange?.(newItems)
  })

  // Gestionnaires
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const handleConfigChange = useCallback((newConfig: any) => {
    // Appliquer les changements de configuration
    if (newConfig.theme) updateTheme(newConfig.theme)
    if (newConfig.preferences) updatePreferences(newConfig.preferences)
    if (newConfig.layout) updateLayout(newConfig.layout)
    
    onConfigChange?.(config)
  }, [updateTheme, updatePreferences, updateLayout, config, onConfigChange])

  const handleSave = useCallback(() => {
    onSave?.(localItems)
  }, [localItems, onSave])

  // Styles du conteneur
  const containerStyles = createThemeStyles(resolvedTheme).container

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  useEffect(() => {
    if (error) {
      onError?.(new Error(error))
    }
  }, [error, onError])

  if (loading) {
    return <div className="p-4 text-center">Chargement de la configuration...</div>
  }

  return (
    <div className="relative">
      <div className="flex gap-4">
        {/* Panneau de customisation à gauche */}
        {showCustomization && customizationPanelPosition === 'left' && (
          <ReorderableListCustomizationPanel
            config={config}
            onConfigChange={handleConfigChange}
            onSave={() => saveConfig({})}
            onReset={resetConfig}
            saving={saving}
            position="left"
          />
        )}

        {/* Liste principale */}
        <div className="flex-1">
          {/* Panneau de customisation en haut */}
          {showCustomization && customizationPanelPosition === 'top' && (
            <div className="mb-4">
              <ReorderableListCustomizationPanel
                config={config}
                onConfigChange={handleConfigChange}
                onSave={() => saveConfig({})}
                onReset={resetConfig}
                saving={saving}
                position="top"
              />
            </div>
          )}

          {/* Header avec bouton de customisation */}
          {enableCustomization && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Liste réorganisable</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomization(!showCustomization)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Personnaliser
              </Button>
            </div>
          )}

          {/* Conteneur de la liste avec styles de thème */}
          <div 
            className="space-y-1 relative"
            style={containerStyles}
          >
            {/* Image de drag invisible */}
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

            {localItems.map((item) => (
              <ThemedSortableItem
                key={item.id}
                item={item}
                level={0}
                theme={resolvedTheme}
                renderItem={renderItem}
                isExpanded={expandedItems.has(item.id)}
                onToggleExpand={handleToggleExpand}
                expandedItems={expandedItems}
                config={config}
                isDragging={draggedItem?.id === item.id}
                isDragOver={dragOverItem === item.id}
                dropPosition={dropPosition}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

          {/* Panneau de customisation en bas */}
          {showCustomization && customizationPanelPosition === 'bottom' && (
            <div className="mt-4">
              <ReorderableListCustomizationPanel
                config={config}
                onConfigChange={handleConfigChange}
                onSave={() => saveConfig({})}
                onReset={resetConfig}
                saving={saving}
                position="bottom"
              />
            </div>
          )}
        </div>

        {/* Panneau de customisation à droite */}
        {showCustomization && customizationPanelPosition === 'right' && (
          <ReorderableListCustomizationPanel
            config={config}
            onConfigChange={handleConfigChange}
            onSave={() => saveConfig({})}
            onReset={resetConfig}
            saving={saving}
            position="right"
          />
        )}
      </div>
    </div>
  )
}