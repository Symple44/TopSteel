import { getTranslatedTitle, type TranslatableMenuItem } from '../../../../../utils/menu-translations'
import type { UserMenuItem } from '../types/menu.types'

// Fonction récursive pour mapper les éléments de menu
export const mapMenuItemRecursively = (
  item: unknown,
  index: number,
  parentId?: string
): UserMenuItem => {
  const itemTyped = item as {
    id?: string
    parentId?: string
    type?: 'M' | 'P' | 'L' | 'D'
    programId?: string
    externalUrl?: string
    queryBuilderId?: string
    orderIndex?: number
    isVisible?: boolean
    children?: unknown[]
    customIcon?: string
    icon?: string
    customTitle?: string
    customIconColor?: string
  }
  return {
    id: itemTyped.id || `item-${Date.now()}-${index}`,
    parentId: parentId || itemTyped.parentId,
    title: getTranslatedTitle(item as TranslatableMenuItem) || 'Sans titre',
    type: itemTyped.type || 'P',
    programId: itemTyped.programId,
    externalUrl: itemTyped.externalUrl,
    queryBuilderId: itemTyped.queryBuilderId,
    orderIndex: typeof itemTyped.orderIndex === 'number' ? itemTyped.orderIndex : index,
    isVisible: typeof itemTyped.isVisible === 'boolean' ? itemTyped.isVisible : true,
    children: Array.isArray(itemTyped.children)
      ? itemTyped?.children?.map((child: unknown, childIndex: number) =>
          mapMenuItemRecursively(child, childIndex, itemTyped?.id)
        )
      : [],
    icon: itemTyped.customIcon || itemTyped.icon,
    customTitle: itemTyped.customTitle,
    customIcon: itemTyped.customIcon,
    customIconColor: itemTyped.customIconColor,
  }
}

// Fonction récursive pour collecter tous les IDs d'éléments déplaçables (non-dossiers)
export const getAllSortableIds = (items: UserMenuItem[]): string[] => {
  let ids: string[] = []

  items?.forEach((item) => {
    if (item.type !== 'M') {
      ids?.push(item.id)
    }

    if (item.children && item?.children?.length > 0) {
      ids = ids?.concat(getAllSortableIds(item.children))
    }
  })

  return ids
}
