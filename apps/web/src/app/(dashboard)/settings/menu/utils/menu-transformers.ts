/**
 * Menu Transformers Module
 *
 * This module provides transformation utilities for converting menu data
 * between different formats. It handles recursive mapping of menu items
 * and extraction of sortable IDs for drag-and-drop operations.
 *
 * @module menu/utils/menu-transformers
 */

import { getTranslatedTitle, type TranslatableMenuItem } from '../../../../../utils/menu-translations'
import type { UserMenuItem } from '../types/menu.types'

/**
 * Recursively map API menu items to UserMenuItem format.
 *
 * This function transforms menu items from the API response format into
 * the UserMenuItem type used throughout the menu editor. It handles:
 * - Type conversions and defaults
 * - Translated titles with custom title support
 * - Custom icons and colors
 * - Recursive processing of nested children
 * - Order index assignment
 *
 * The function is designed to work with unknown input types from the API
 * and normalize them into a consistent structure. It applies user
 * preferences (custom titles, icons, colors) while preserving the
 * underlying menu structure.
 *
 * @param {unknown} item - Raw menu item from API (type-checked internally)
 * @param {number} index - Position index of the item in its parent array
 * @param {string} [parentId] - ID of the parent menu item (for nested items)
 * @returns {UserMenuItem} Normalized menu item with all required properties
 *
 * @example
 * ```typescript
 * // Transform a single menu item
 * const apiItem = {
 *   id: 'item-1',
 *   type: 'P',
 *   programId: '/dashboard',
 *   customTitle: 'My Dashboard',
 *   customIcon: 'Home',
 *   customIconColor: '#3b82f6',
 *   children: []
 * }
 *
 * const userItem = mapMenuItemRecursively(apiItem, 0)
 * // Returns: UserMenuItem with normalized structure
 *
 * // Transform menu tree from API response
 * const apiMenuTree = response.data.menuTree
 * const userMenu = apiMenuTree.map((item, index) =>
 *   mapMenuItemRecursively(item, index)
 * )
 * ```
 */
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

/**
 * Recursively collect IDs of all sortable (non-folder) menu items.
 *
 * This function traverses a menu tree and extracts the IDs of all items
 * that can be reordered via drag-and-drop. Folder items (type 'M') are
 * excluded since they act as containers and use different drag logic.
 *
 * The function is used by @dnd-kit to determine which items can be
 * sorted within the SortableContext. It processes the entire tree
 * recursively, including items nested within folders.
 *
 * @param {UserMenuItem[]} items - Array of menu items to process
 * @returns {string[]} Flat array of sortable item IDs
 *
 * @example
 * ```typescript
 * const userMenu = [
 *   { id: 'folder-1', type: 'M', children: [
 *     { id: 'item-1', type: 'P' },
 *     { id: 'item-2', type: 'L' }
 *   ]},
 *   { id: 'item-3', type: 'P' }
 * ]
 *
 * const sortableIds = getAllSortableIds(userMenu)
 * // Returns: ['item-1', 'item-2', 'item-3']
 * // Note: 'folder-1' is excluded as it's a folder (type 'M')
 *
 * // Use with @dnd-kit SortableContext
 * <SortableContext items={getAllSortableIds(userMenu)}>
 *   {userMenu.map(item => <MenuItem key={item.id} {...item} />)}
 * </SortableContext>
 * ```
 */
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
