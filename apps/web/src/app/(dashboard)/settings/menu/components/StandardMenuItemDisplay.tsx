import type React from 'react'
import { Badge } from '@erp/ui'
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { getTypeIcon, getTypeBadgeColor, getTypeLabel } from '../utils/menu-type-utils'
import type { MenuItemConfig } from '../types/menu.types'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

interface StandardMenuItemDisplayProps {
  item: MenuItemConfig
  level?: number
  onDragStart: (item: MenuItemConfig) => void
  expandedItems?: string[]
  onToggleExpandedItem?: (id: string) => void
  t: TranslationFunction
}

export function StandardMenuItemDisplay({
  item,
  level = 0,
  onDragStart,
  expandedItems = [],
  onToggleExpandedItem,
  t,
}: StandardMenuItemDisplayProps) {
  const Icon = getTypeIcon(item.type)
  const hasChildren = item.children && item?.children?.length > 0
  const isExpanded = expandedItems?.includes(item.id)

  const handleItemClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    if (hasChildren && onToggleExpandedItem) {
      onToggleExpandedItem(item.id)
    }
  }

  return (
    <>
      <li
        className={`p-3 mb-2 bg-card border rounded-lg transition-colors ${
          hasChildren
            ? 'cursor-pointer hover:bg-blue-50 border-blue-200'
            : 'cursor-move hover:bg-green-50 border-green-200'
        }`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={hasChildren ? handleItemClick : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e?.preventDefault()
            hasChildren && handleItemClick(e)
          }
        }}
        draggable={true}
        onDragStart={(e) => {
          // Empêcher la propagation pour éviter les conflits avec le clic
          e?.stopPropagation()

          // Fonction récursive pour mapper les enfants lors du drag
          const mapChildrenForDrag = (children: unknown[], newParentId: string): unknown[] => {
            return children?.map((child) => {
              const childTyped = child as {
                id?: string
                orderIndex?: number
                isVisible?: boolean
                children?: unknown[]
              }
              return {
                ...(child as Record<string, unknown>),
                id: `user-child-${childTyped.id}-${Date.now()}`,
                parentId: newParentId,
                orderIndex: childTyped.orderIndex ?? 0,
                isVisible: childTyped.isVisible !== false,
                children: Array.isArray(childTyped.children)
                  ? mapChildrenForDrag(
                      childTyped?.children,
                      `user-child-${childTyped.id}-${Date.now()}`
                    )
                  : [],
              }
            })
          }

          // Stocker les données de l'élément dans le dataTransfer
          const newId = `user-${item.id}-${Date.now()}`
          const dragData = {
            ...item,
            id: newId,
            orderIndex: 0,
            children: hasChildren ? mapChildrenForDrag(item.children, newId) : [], // Inclure les enfants avec mapping récursif
          }

          e?.dataTransfer?.setData('application/json', JSON.stringify(dragData))
          e?.dataTransfer?.setData('text/plain', item.title)

          // Stocker aussi dans sessionStorage comme fallback
          sessionStorage.setItem('draggedStandardItem', JSON.stringify(dragData))

          // Stocker aussi dans une variable globale pour les dossiers
          ;(window as unknown as { currentDragData?: unknown }).currentDragData = dragData

          onDragStart(item)
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-blue-500" />
              ))}
          </div>
          <Icon className="h-4 w-4" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.title}</span>
              <Badge className={`text-xs ${getTypeBadgeColor(item.type)} text-white`}>
                {getTypeLabel(item.type, t)}
              </Badge>
              {hasChildren && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  {t('menu.childrenCount').replace('{count}', item?.children?.length?.toString())}
                </Badge>
              )}
              {!hasChildren && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  {t('menu.dragToAdd')}
                </Badge>
              )}
            </div>
            {item.programId && (
              <p className="text-xs text-muted-foreground mt-1">→ {item.programId}</p>
            )}
            {item.externalUrl && (
              <p className="text-xs text-muted-foreground mt-1">🌐 {item.externalUrl}</p>
            )}
            {item.queryBuilderId && (
              <p className="text-xs text-muted-foreground mt-1">📊 Query: {item.queryBuilderId}</p>
            )}
          </div>
        </div>
      </li>

      {/* Afficher les enfants si déplié */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {item?.children?.map((child, index) => (
            <StandardMenuItemDisplay
              key={`${child.id}-${index}`}
              item={child}
              level={level + 1}
              onDragStart={onDragStart}
              expandedItems={expandedItems}
              onToggleExpandedItem={onToggleExpandedItem}
              t={t}
            />
          ))}
        </div>
      )}
    </>
  )
}
