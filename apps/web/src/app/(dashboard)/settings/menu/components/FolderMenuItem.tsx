import type React from 'react'
import { useState } from 'react'
import { Badge, Button } from '@erp/ui'
import { ChevronDown, ChevronRight, Edit, GripVertical, Trash2 } from 'lucide-react'
import { getTranslatedTitle } from '../../../../../utils/menu-translations'
import { useTranslation } from '../../../../../lib/i18n/hooks'
import { getIconComponent } from '../utils/icon-utils'
import { getColorStyle } from '../utils/color-utils'
import { getTypeBadgeColor, getTypeIcon, getTypeLabel } from '../utils/menu-type-utils'
import type { UserMenuItem } from '../types/menu.types'
import { SortableUserMenuItem } from './SortableUserMenuItem'

interface FolderMenuItemProps {
  item: UserMenuItem
  onRemove: (id: string) => void
  level?: number
  onDropInFolder?: (parentId: string, droppedItem: unknown) => void
  onEdit?: (item: UserMenuItem) => void
  expandedItems?: string[]
  onToggleExpanded?: (id: string) => void
}

export function FolderMenuItem({
  item,
  onRemove,
  level = 0,
  onDropInFolder,
  onEdit,
  expandedItems = [],
  onToggleExpanded,
}: FolderMenuItemProps) {
  const { t } = useTranslation('settings')
  const IconComponent = item.customIcon ? getIconComponent(item.customIcon) : getTypeIcon(item.type)
  const Icon = IconComponent
  const iconStyle = getColorStyle(item.customIconColor)
  const [isDragOver, setIsDragOver] = useState(false)
  const hasChildren = item.children && item?.children?.length > 0
  const isExpanded = expandedItems?.includes(item.id)

  const handleDrop = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (onDropInFolder) {
      // D'abord essayer de récupérer depuis dataTransfer
      let draggedData = e?.dataTransfer?.getData('application/json')

      // Si pas de données dans dataTransfer, essayer sessionStorage (fallback)
      if (!draggedData) {
        draggedData = sessionStorage?.getItem('draggedStandardItem') || ''
        sessionStorage?.removeItem('draggedStandardItem')
      }

      // Essayer aussi de récupérer depuis un état global
      if (!draggedData) {
        const globalDragData = (window as unknown as { currentDragData?: unknown }).currentDragData
        if (globalDragData) {
          draggedData = JSON.stringify(globalDragData)
          ;(window as unknown as { currentDragData?: unknown }).currentDragData = null
        }
      }

      if (draggedData) {
        try {
          const droppedItem = JSON.parse(draggedData)
          onDropInFolder(item.id, droppedItem)
        } catch {
          // Erreur lors du parsing des données de drag
        }
      }
    }

    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setIsDragOver(false)
  }

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <section
        className={`p-3 mb-2 bg-card border rounded-lg transition-colors border-purple-200 ${
          isDragOver ? 'bg-purple-200 border-purple-400' : 'bg-purple-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        aria-label="Zone de dépôt pour réorganiser les éléments"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="cursor-move">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            {hasChildren && onToggleExpanded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e?.stopPropagation()
                  onToggleExpanded(item.id)
                }}
                className="p-1 hover:bg-accent rounded transition-colors"
                aria-label={isExpanded ? 'Réduire le dossier' : 'Étendre le dossier'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-purple-600" />
                )}
              </Button>
            )}
          </div>
          {Icon && <Icon className="h-4 w-4" style={iconStyle} />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{getTranslatedTitle(item)}</span>
              <Badge className={`text-xs ${getTypeBadgeColor(item.type)} text-white`}>
                {getTypeLabel(item.type, t)}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isDragOver
                    ? 'bg-purple-200 text-purple-800 border-purple-400'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {isDragOver ? `🎯 ${t('menu.dropHere')}` : t('menu.folderDropHint')}
              </Badge>
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
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e?.stopPropagation()
                onEdit?.(item)
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* Afficher les enfants du dossier seulement si étendu */}
      {hasChildren && isExpanded && (
        <div className="ml-4 border-l-2 border-purple-200 pl-4 space-y-1">
          {item?.children?.map((child) =>
            child.type === 'M' ? (
              <FolderMenuItem
                key={child.id}
                item={child}
                onRemove={onRemove}
                level={level + 1}
                onDropInFolder={onDropInFolder}
                onEdit={onEdit}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
              />
            ) : (
              <SortableUserMenuItem
                key={child.id}
                item={child}
                onRemove={onRemove}
                level={level + 1}
                onDropInFolder={onDropInFolder}
                onEdit={onEdit}
              />
            )
          )}
        </div>
      )}

      {/* Debug pour voir si c'est un dossier vide */}
      {(!item.children || item?.children?.length === 0) && (
        <div className="ml-4 text-xs text-muted-foreground italic">📁 {t('menu.folderEmpty')}</div>
      )}
    </div>
  )
}
