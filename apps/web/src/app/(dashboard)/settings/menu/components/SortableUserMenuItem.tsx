import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge, Button } from '@erp/ui'
import { Edit, GripVertical, Trash2 } from 'lucide-react'
import { getTranslatedTitle } from '../../../../../utils/menu-translations'
import { useTranslation } from '../../../../../lib/i18n/hooks'
import { getIconComponent } from '../utils/icon-utils'
import { getColorStyle } from '../utils/color-utils'
import { getTypeBadgeColor, getTypeIcon, getTypeLabel } from '../utils/menu-type-utils'
import type { UserMenuItem } from '../types/menu.types'

interface SortableUserMenuItemProps {
  item: UserMenuItem
  onRemove: (id: string) => void
  level?: number
  onDropInFolder?: (parentId: string, droppedItem: unknown) => void
  onEdit?: (item: UserMenuItem) => void
}

export function SortableUserMenuItem({
  item,
  onRemove,
  level = 0,
  onEdit,
}: SortableUserMenuItemProps) {
  const { t } = useTranslation('settings')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS?.Transform?.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const IconComponent = item.customIcon ? getIconComponent(item.customIcon) : getTypeIcon(item.type)
  const Icon = IconComponent
  const iconStyle = getColorStyle(item.customIconColor)

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 mb-2 bg-card border rounded-lg transition-colors ${
          isDragging ? 'shadow-lg bg-accent' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-move">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          {Icon && <Icon className="h-4 w-4" style={iconStyle} />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{getTranslatedTitle(item)}</span>
              <Badge className={`text-xs ${getTypeBadgeColor(item.type)} text-white`}>
                {getTypeLabel(item.type, t)}
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
      </div>
    </div>
  )
}
