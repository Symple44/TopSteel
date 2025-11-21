import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@erp/ui'
import { Database } from 'lucide-react'
import { StandardMenuItemDisplay } from './StandardMenuItemDisplay'
import type { MenuItemConfig } from '../types/menu.types'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

interface StandardMenuPanelProps {
  standardMenu: MenuItemConfig[]
  expandedStandardItems: string[]
  onStandardItemDragStart: (item: MenuItemConfig) => void
  onToggleStandardItemExpansion: (itemId: string) => void
  t: TranslationFunction
}

export function StandardMenuPanel({
  standardMenu,
  expandedStandardItems,
  onStandardItemDragStart,
  onToggleStandardItemExpansion,
  t,
}: StandardMenuPanelProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('menu.library')}
        </CardTitle>
        <CardDescription>{t('menu.libraryDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="space-y-2 h-full overflow-y-auto">
          {standardMenu?.map((item) => (
            <StandardMenuItemDisplay
              key={item.id}
              item={item}
              onDragStart={onStandardItemDragStart}
              expandedItems={expandedStandardItems}
              onToggleExpandedItem={onToggleStandardItemExpansion}
              t={t}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
