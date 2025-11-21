import { useState } from 'react'
import type { MenuItemConfig, UserMenuItem } from '../types/menu.types'

export function useMenuState() {
  const [standardMenu, setStandardMenu] = useState<MenuItemConfig[]>([])
  const [userMenu, setUserMenu] = useState<UserMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedStandardItem, setDraggedStandardItem] = useState<MenuItemConfig | null>(null)
  const [expandedStandardItems, setExpandedStandardItems] = useState<string[]>([])
  const [expandedUserItems, setExpandedUserItems] = useState<string[]>([])
  const [editingItem, setEditingItem] = useState<UserMenuItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const toggleStandardItemExpansion = (itemId: string) => {
    setExpandedStandardItems((prev) =>
      prev?.includes(itemId) ? prev?.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const toggleUserItemExpansion = (itemId: string) => {
    setExpandedUserItems((prev) =>
      prev?.includes(itemId) ? prev?.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const openEditModal = (item: UserMenuItem) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingItem(null)
  }

  const resetUserMenu = () => {
    setUserMenu([])
  }

  const addToUserMenu = (item: UserMenuItem) => {
    setUserMenu([...userMenu, item])
  }

  const removeFromUserMenu = (id: string) => {
    const removeFromItems = (items: UserMenuItem[]): UserMenuItem[] => {
      return items?.filter((item) => {
        if (item.id === id) return false
        if (item?.children?.length > 0) {
          item.children = removeFromItems(item.children)
        }
        return true
      })
    }
    setUserMenu(removeFromItems(userMenu))
  }

  return {
    standardMenu,
    setStandardMenu,
    userMenu,
    setUserMenu,
    loading,
    setLoading,
    saving,
    setSaving,
    draggedStandardItem,
    setDraggedStandardItem,
    expandedStandardItems,
    setExpandedStandardItems,
    expandedUserItems,
    setExpandedUserItems,
    editingItem,
    setEditingItem,
    showEditModal,
    setShowEditModal,
    toggleStandardItemExpansion,
    toggleUserItemExpansion,
    openEditModal,
    closeEditModal,
    resetUserMenu,
    addToUserMenu,
    removeFromUserMenu,
  }
}
