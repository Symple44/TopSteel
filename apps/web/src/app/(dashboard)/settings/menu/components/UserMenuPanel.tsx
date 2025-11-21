import type React from 'react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@erp/ui'
import { Eye, Settings } from 'lucide-react'
import { FolderMenuItem } from './FolderMenuItem'
import { SortableUserMenuItem } from './SortableUserMenuItem'
import { CreateItemDialogs } from './CreateItemDialogs'
import type { MenuItemConfig, UserMenuItem } from '../types/menu.types'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

interface UserMenuPanelProps {
  userMenu: UserMenuItem[]
  draggedStandardItem: MenuItemConfig | null
  expandedUserItems: string[]
  onDragEnd: (event: DragEndEvent) => void
  onUserMenuDrop: (e: React.DragEvent) => void
  onUserMenuDragOver: (e: React.DragEvent) => void
  onRemoveFromUserMenu: (id: string) => void
  onDropInFolder: (parentId: string, droppedItem: unknown) => void
  onToggleUserItemExpansion: (itemId: string) => void
  onEditItem: (item: UserMenuItem) => void
  onCreateFolder: (folder: UserMenuItem) => void
  onCreateLink: (link: UserMenuItem) => void
  onCreateQuery: (query: UserMenuItem) => void
  getAllSortableIds: (items: UserMenuItem[]) => string[]
  t: TranslationFunction
}

export function UserMenuPanel({
  userMenu,
  draggedStandardItem,
  expandedUserItems,
  onDragEnd,
  onUserMenuDrop,
  onUserMenuDragOver,
  onRemoveFromUserMenu,
  onDropInFolder,
  onToggleUserItemExpansion,
  onEditItem,
  onCreateFolder,
  onCreateLink,
  onCreateQuery,
  getAllSortableIds,
  t,
}: UserMenuPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {t('menu.yourCustomMenu')}
        </CardTitle>
        <CardDescription>{t('menu.menuPreview')}</CardDescription>
        <CreateItemDialogs
          userMenu={userMenu}
          onCreateFolder={onCreateFolder}
          onCreateLink={onCreateLink}
          onCreateQuery={onCreateQuery}
          t={t}
        />
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <section
          onDrop={onUserMenuDrop}
          onDragOver={onUserMenuDragOver}
          className={`h-full p-4 border-2 border-dashed rounded-lg transition-colors ${
            draggedStandardItem ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          aria-label="Zone de dépôt pour le menu personnalisé"
        >
          {userMenu.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">{t('menu.emptyMenu')}</p>
                <p className="text-sm">{t('menu.emptyMenuDescription')}</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={getAllSortableIds(userMenu)}
                  strategy={verticalListSortingStrategy}
                >
                  {userMenu?.map((item) =>
                    item.type === 'M' ? (
                      <FolderMenuItem
                        key={item.id}
                        item={item}
                        onRemove={onRemoveFromUserMenu}
                        onDropInFolder={onDropInFolder}
                        onEdit={onEditItem}
                        expandedItems={expandedUserItems}
                        onToggleExpanded={onToggleUserItemExpansion}
                      />
                    ) : (
                      <SortableUserMenuItem
                        key={item.id}
                        item={item}
                        onRemove={onRemoveFromUserMenu}
                        onDropInFolder={onDropInFolder}
                        onEdit={onEditItem}
                      />
                    )
                  )}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
