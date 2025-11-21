import type React from 'react'
import { useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { MenuItemConfig, UserMenuItem } from '../types/menu.types'

export function useMenuDragDrop(
  userMenu: UserMenuItem[],
  setUserMenu: (menu: UserMenuItem[]) => void,
  setDraggedStandardItem: (item: MenuItemConfig | null) => void
) {
  const [_isDraggingFromExternal, setIsDraggingFromExternal] = useState(false)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event || {}

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Fonction récursive pour trouver et déplacer un élément dans n'importe quel niveau
    const moveItemRecursively = (items: UserMenuItem[]): UserMenuItem[] => {
      // D'abord essayer de déplacer au niveau racine
      const activeIndex = items?.findIndex((item) => item.id === activeId)
      const overIndex = items?.findIndex((item) => item.id === overId)

      if (activeIndex !== -1 && overIndex !== -1) {
        // Les deux éléments sont au même niveau
        const newItems = arrayMove(items, activeIndex, overIndex)
        newItems?.forEach((item, index) => {
          item.orderIndex = index
        })
        return newItems
      }

      // Sinon, chercher dans les enfants
      return items?.map((item) => {
        if (item.children && item?.children?.length > 0) {
          const activeInChildren = item?.children?.findIndex((child) => child.id === activeId)
          const overInChildren = item?.children?.findIndex((child) => child.id === overId)

          if (activeInChildren !== -1 && overInChildren !== -1) {
            // Les deux sont des enfants du même parent
            const newChildren = arrayMove(item.children, activeInChildren, overInChildren)
            newChildren?.forEach((child, index) => {
              child.orderIndex = index
            })
            return { ...item, children: newChildren }
          } else {
            // Chercher récursivement dans les enfants
            return { ...item, children: moveItemRecursively(item.children) }
          }
        }
        return item
      })
    }

    setUserMenu(moveItemRecursively(userMenu))
  }

  const handleStandardItemDragStart = (item: MenuItemConfig) => {
    setDraggedStandardItem(item)
    setIsDraggingFromExternal(true)
  }

  const handleDropInFolder = (parentId: string, droppedItem: unknown) => {
    const droppedItemTyped = droppedItem as { id?: string; title?: string; children?: unknown[] }
    const newUserItem: UserMenuItem = {
      ...(droppedItem as UserMenuItem),
      id:
        droppedItemTyped?.id ||
        `user-${droppedItemTyped.id || droppedItemTyped.title}-${Date.now()}`,
      parentId: parentId,
      orderIndex: 0,
      children: Array.isArray(droppedItemTyped.children)
        ? (droppedItemTyped?.children as UserMenuItem[])
        : [],
    }

    // Ajouter l'élément au dossier parent
    const updateMenuWithNewItem = (items: UserMenuItem[]): UserMenuItem[] => {
      return items?.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...item.children, newUserItem],
          }
        }
        if (item?.children?.length > 0) {
          return {
            ...item,
            children: updateMenuWithNewItem(item.children),
          }
        }
        return item
      })
    }

    setUserMenu(updateMenuWithNewItem(userMenu))
    setIsDraggingFromExternal(false)
  }

  const handleUserMenuDrop = (e: React.DragEvent) => {
    e?.preventDefault()

    // Essayer de récupérer les données depuis dataTransfer
    let draggedData = e?.dataTransfer?.getData('application/json')

    // Fallback vers sessionStorage si nécessaire
    if (!draggedData) {
      draggedData = sessionStorage?.getItem('draggedStandardItem') || ''
      sessionStorage?.removeItem('draggedStandardItem')
    }

    if (draggedData) {
      try {
        const droppedItem = JSON.parse(draggedData)

        const newUserItem: UserMenuItem = {
          ...droppedItem,
          id: droppedItem.id || `user-${droppedItem.id}-${Date.now()}`,
          orderIndex: userMenu.length,
          children: Array.isArray(droppedItem.children) ? droppedItem.children : [],
        }

        setUserMenu([...userMenu, newUserItem])
      } catch {
        // Erreur lors du parsing des données de drop
      }
    }

    setDraggedStandardItem(null)
    setIsDraggingFromExternal(false)
  }

  const handleUserMenuDragOver = (e: React.DragEvent) => {
    e?.preventDefault()
  }

  return {
    handleDragEnd,
    handleStandardItemDragStart,
    handleDropInFolder,
    handleUserMenuDrop,
    handleUserMenuDragOver,
  }
}
