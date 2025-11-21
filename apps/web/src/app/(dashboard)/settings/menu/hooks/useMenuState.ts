import { useState } from 'react'
import type { MenuItemConfig, UserMenuItem } from '../types/menu.types'

/**
 * Custom hook for managing menu editor state.
 *
 * This hook centralizes all state management for the menu customization interface,
 * including:
 * - Standard menu (read-only source menu from system)
 * - User menu (customizable menu being edited)
 * - Loading and saving states
 * - Drag-and-drop state
 * - Expansion/collapse state for both menus
 * - Edit modal state
 *
 * Use this hook in the main menu editor component to maintain a single source
 * of truth for all menu-related state.
 *
 * @returns {Object} Menu state and state setters:
 *   - standardMenu: Array of standard menu items from system
 *   - setStandardMenu: Update standard menu
 *   - userMenu: Array of user's customized menu items
 *   - setUserMenu: Update user menu
 *   - loading: Whether initial data is loading
 *   - setLoading: Update loading state
 *   - saving: Whether changes are being saved
 *   - setSaving: Update saving state
 *   - draggedStandardItem: Item being dragged from standard menu
 *   - setDraggedStandardItem: Update dragged item
 *   - expandedStandardItems: IDs of expanded standard menu items
 *   - setExpandedStandardItems: Update expanded standard items
 *   - expandedUserItems: IDs of expanded user menu items
 *   - setExpandedUserItems: Update expanded user items
 *   - editingItem: Item currently being edited
 *   - setEditingItem: Update editing item
 *   - showEditModal: Whether edit modal is visible
 *   - setShowEditModal: Update modal visibility
 *   - toggleStandardItemExpansion: Toggle expansion of standard menu item
 *   - toggleUserItemExpansion: Toggle expansion of user menu item
 *   - openEditModal: Open edit modal for an item
 *   - closeEditModal: Close edit modal
 *   - resetUserMenu: Clear all user menu items
 *   - addToUserMenu: Add item to user menu
 *   - removeFromUserMenu: Remove item from user menu (recursively)
 *
 * @example
 * ```tsx
 * function MenuEditor() {
 *   const {
 *     standardMenu,
 *     userMenu,
 *     loading,
 *     saving,
 *     openEditModal,
 *     resetUserMenu
 *   } = useMenuState()
 *
 *   if (loading) return <Spinner />
 *
 *   return (
 *     <div>
 *       <button onClick={resetUserMenu}>Reset Menu</button>
 *       <StandardMenuPanel items={standardMenu} />
 *       <UserMenuPanel
 *         items={userMenu}
 *         onEditItem={openEditModal}
 *       />
 *       {saving && <SaveIndicator />}
 *     </div>
 *   )
 * }
 * ```
 */
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
