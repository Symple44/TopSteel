import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMenuState } from '../useMenuState'
import type { MenuItemConfig, UserMenuItem } from '../../types/menu.types'

// Mock data
const mockStandardMenuItem: MenuItemConfig = {
  id: 'menu-1',
  title: 'Dashboard',
  type: 'M',
  orderIndex: 0,
  isVisible: true,
  children: [],
  depth: 0,
  icon: 'dashboard',
}

const mockUserMenuItem: UserMenuItem = {
  id: 'user-menu-1',
  title: 'My Dashboard',
  type: 'M',
  orderIndex: 0,
  isVisible: true,
  children: [],
  customTitle: 'Custom Dashboard',
  isUserCreated: true,
}

const mockUserMenuItemWithChildren: UserMenuItem = {
  id: 'user-menu-parent',
  title: 'Parent Menu',
  type: 'M',
  orderIndex: 0,
  isVisible: true,
  children: [
    {
      id: 'user-menu-child-1',
      title: 'Child 1',
      type: 'P',
      programId: 'prog-1',
      orderIndex: 0,
      isVisible: true,
      children: [],
    },
    {
      id: 'user-menu-child-2',
      title: 'Child 2',
      type: 'P',
      programId: 'prog-2',
      orderIndex: 1,
      isVisible: true,
      children: [],
    },
  ],
}

describe('useMenuState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.standardMenu).toEqual([])
      expect(result.current.userMenu).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.saving).toBe(false)
      expect(result.current.draggedStandardItem).toBeNull()
      expect(result.current.expandedStandardItems).toEqual([])
      expect(result.current.expandedUserItems).toEqual([])
      expect(result.current.editingItem).toBeNull()
      expect(result.current.showEditModal).toBe(false)
    })
  })

  describe('menu state management', () => {
    it('should set standard menu', () => {
      const { result } = renderHook(() => useMenuState())

      const menuItems: MenuItemConfig[] = [mockStandardMenuItem]

      act(() => {
        result.current.setStandardMenu(menuItems)
      })

      expect(result.current.standardMenu).toEqual(menuItems)
      expect(result.current.standardMenu).toHaveLength(1)
    })

    it('should set user menu', () => {
      const { result } = renderHook(() => useMenuState())

      const menuItems: UserMenuItem[] = [mockUserMenuItem]

      act(() => {
        result.current.setUserMenu(menuItems)
      })

      expect(result.current.userMenu).toEqual(menuItems)
      expect(result.current.userMenu).toHaveLength(1)
    })

    it('should reset user menu to empty array', () => {
      const { result } = renderHook(() => useMenuState())

      // First set some items
      act(() => {
        result.current.setUserMenu([mockUserMenuItem])
      })

      expect(result.current.userMenu).toHaveLength(1)

      // Then reset
      act(() => {
        result.current.resetUserMenu()
      })

      expect(result.current.userMenu).toEqual([])
    })

    it('should add item to user menu', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.userMenu).toHaveLength(0)

      act(() => {
        result.current.addToUserMenu(mockUserMenuItem)
      })

      expect(result.current.userMenu).toHaveLength(1)
      expect(result.current.userMenu[0]).toEqual(mockUserMenuItem)
    })

    it('should add multiple items to user menu', () => {
      const { result } = renderHook(() => useMenuState())

      const secondItem: UserMenuItem = {
        ...mockUserMenuItem,
        id: 'user-menu-2',
        title: 'Second Menu',
      }

      act(() => {
        result.current.addToUserMenu(mockUserMenuItem)
      })

      act(() => {
        result.current.addToUserMenu(secondItem)
      })

      expect(result.current.userMenu).toHaveLength(2)
      expect(result.current.userMenu[0]).toEqual(mockUserMenuItem)
      expect(result.current.userMenu[1]).toEqual(secondItem)
    })
  })

  describe('menu item removal', () => {
    it('should remove item from user menu by id', () => {
      const { result } = renderHook(() => useMenuState())

      const items: UserMenuItem[] = [
        mockUserMenuItem,
        { ...mockUserMenuItem, id: 'user-menu-2', title: 'Second Menu' },
      ]

      act(() => {
        result.current.setUserMenu(items)
      })

      expect(result.current.userMenu).toHaveLength(2)

      act(() => {
        result.current.removeFromUserMenu('user-menu-1')
      })

      expect(result.current.userMenu).toHaveLength(1)
      expect(result.current.userMenu[0].id).toBe('user-menu-2')
    })

    it('should remove child item from nested menu structure', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.setUserMenu([mockUserMenuItemWithChildren])
      })

      expect(result.current.userMenu[0].children).toHaveLength(2)

      act(() => {
        result.current.removeFromUserMenu('user-menu-child-1')
      })

      expect(result.current.userMenu[0].children).toHaveLength(1)
      expect(result.current.userMenu[0].children[0].id).toBe('user-menu-child-2')
    })

    it('should handle removing non-existent item', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.setUserMenu([mockUserMenuItem])
      })

      const originalLength = result.current.userMenu.length

      act(() => {
        result.current.removeFromUserMenu('non-existent-id')
      })

      expect(result.current.userMenu).toHaveLength(originalLength)
    })

    it('should remove parent and all children when removing parent', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.setUserMenu([mockUserMenuItemWithChildren, mockUserMenuItem])
      })

      expect(result.current.userMenu).toHaveLength(2)

      act(() => {
        result.current.removeFromUserMenu('user-menu-parent')
      })

      expect(result.current.userMenu).toHaveLength(1)
      expect(result.current.userMenu[0].id).toBe('user-menu-1')
    })
  })

  describe('loading and saving states', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.loading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.loading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.loading).toBe(true)
    })

    it('should set saving state', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.saving).toBe(false)

      act(() => {
        result.current.setSaving(true)
      })

      expect(result.current.saving).toBe(true)

      act(() => {
        result.current.setSaving(false)
      })

      expect(result.current.saving).toBe(false)
    })
  })

  describe('drag and drop state', () => {
    it('should set dragged standard item', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.draggedStandardItem).toBeNull()

      act(() => {
        result.current.setDraggedStandardItem(mockStandardMenuItem)
      })

      expect(result.current.draggedStandardItem).toEqual(mockStandardMenuItem)
    })

    it('should clear dragged standard item', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.setDraggedStandardItem(mockStandardMenuItem)
      })

      expect(result.current.draggedStandardItem).not.toBeNull()

      act(() => {
        result.current.setDraggedStandardItem(null)
      })

      expect(result.current.draggedStandardItem).toBeNull()
    })
  })

  describe('expansion state - standard items', () => {
    it('should toggle standard item expansion on', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.expandedStandardItems).toEqual([])

      act(() => {
        result.current.toggleStandardItemExpansion('menu-1')
      })

      expect(result.current.expandedStandardItems).toContain('menu-1')
      expect(result.current.expandedStandardItems).toHaveLength(1)
    })

    it('should toggle standard item expansion off', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleStandardItemExpansion('menu-1')
      })

      expect(result.current.expandedStandardItems).toContain('menu-1')

      act(() => {
        result.current.toggleStandardItemExpansion('menu-1')
      })

      expect(result.current.expandedStandardItems).not.toContain('menu-1')
      expect(result.current.expandedStandardItems).toHaveLength(0)
    })

    it('should handle multiple expanded standard items', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleStandardItemExpansion('menu-1')
        result.current.toggleStandardItemExpansion('menu-2')
        result.current.toggleStandardItemExpansion('menu-3')
      })

      expect(result.current.expandedStandardItems).toHaveLength(3)
      expect(result.current.expandedStandardItems).toContain('menu-1')
      expect(result.current.expandedStandardItems).toContain('menu-2')
      expect(result.current.expandedStandardItems).toContain('menu-3')
    })

    it('should set expanded standard items directly', () => {
      const { result } = renderHook(() => useMenuState())

      const expandedIds = ['menu-1', 'menu-2', 'menu-3']

      act(() => {
        result.current.setExpandedStandardItems(expandedIds)
      })

      expect(result.current.expandedStandardItems).toEqual(expandedIds)
    })
  })

  describe('expansion state - user items', () => {
    it('should toggle user item expansion on', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.expandedUserItems).toEqual([])

      act(() => {
        result.current.toggleUserItemExpansion('user-menu-1')
      })

      expect(result.current.expandedUserItems).toContain('user-menu-1')
      expect(result.current.expandedUserItems).toHaveLength(1)
    })

    it('should toggle user item expansion off', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleUserItemExpansion('user-menu-1')
      })

      expect(result.current.expandedUserItems).toContain('user-menu-1')

      act(() => {
        result.current.toggleUserItemExpansion('user-menu-1')
      })

      expect(result.current.expandedUserItems).not.toContain('user-menu-1')
      expect(result.current.expandedUserItems).toHaveLength(0)
    })

    it('should handle multiple expanded user items', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleUserItemExpansion('user-menu-1')
        result.current.toggleUserItemExpansion('user-menu-2')
        result.current.toggleUserItemExpansion('user-menu-3')
      })

      expect(result.current.expandedUserItems).toHaveLength(3)
      expect(result.current.expandedUserItems).toContain('user-menu-1')
      expect(result.current.expandedUserItems).toContain('user-menu-2')
      expect(result.current.expandedUserItems).toContain('user-menu-3')
    })

    it('should set expanded user items directly', () => {
      const { result } = renderHook(() => useMenuState())

      const expandedIds = ['user-menu-1', 'user-menu-2']

      act(() => {
        result.current.setExpandedUserItems(expandedIds)
      })

      expect(result.current.expandedUserItems).toEqual(expandedIds)
    })
  })

  describe('edit modal state', () => {
    it('should open edit modal with selected item', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.showEditModal).toBe(false)
      expect(result.current.editingItem).toBeNull()

      act(() => {
        result.current.openEditModal(mockUserMenuItem)
      })

      expect(result.current.showEditModal).toBe(true)
      expect(result.current.editingItem).toEqual(mockUserMenuItem)
    })

    it('should close edit modal and clear editing item', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.openEditModal(mockUserMenuItem)
      })

      expect(result.current.showEditModal).toBe(true)
      expect(result.current.editingItem).not.toBeNull()

      act(() => {
        result.current.closeEditModal()
      })

      expect(result.current.showEditModal).toBe(false)
      expect(result.current.editingItem).toBeNull()
    })

    it('should allow opening modal with different items', () => {
      const { result } = renderHook(() => useMenuState())

      const secondItem: UserMenuItem = {
        ...mockUserMenuItem,
        id: 'user-menu-2',
        title: 'Second Menu',
      }

      act(() => {
        result.current.openEditModal(mockUserMenuItem)
      })

      expect(result.current.editingItem?.id).toBe('user-menu-1')

      act(() => {
        result.current.openEditModal(secondItem)
      })

      expect(result.current.editingItem?.id).toBe('user-menu-2')
      expect(result.current.showEditModal).toBe(true)
    })

    it('should set editing item directly', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.setEditingItem(mockUserMenuItem)
      })

      expect(result.current.editingItem).toEqual(mockUserMenuItem)
    })

    it('should set show edit modal directly', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.setShowEditModal(true)
      })

      expect(result.current.showEditModal).toBe(true)

      act(() => {
        result.current.setShowEditModal(false)
      })

      expect(result.current.showEditModal).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty user menu removal', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.userMenu).toEqual([])

      act(() => {
        result.current.removeFromUserMenu('any-id')
      })

      expect(result.current.userMenu).toEqual([])
    })

    it('should handle toggling same item multiple times', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleStandardItemExpansion('menu-1')
        result.current.toggleStandardItemExpansion('menu-1')
        result.current.toggleStandardItemExpansion('menu-1')
      })

      expect(result.current.expandedStandardItems).toContain('menu-1')
    })

    it('should maintain independent expansion states for standard and user items', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleStandardItemExpansion('menu-1')
        result.current.toggleUserItemExpansion('user-menu-1')
      })

      expect(result.current.expandedStandardItems).toContain('menu-1')
      expect(result.current.expandedUserItems).toContain('user-menu-1')
      expect(result.current.expandedStandardItems).not.toContain('user-menu-1')
      expect(result.current.expandedUserItems).not.toContain('menu-1')
    })

    it('should handle deeply nested menu removal', () => {
      const { result } = renderHook(() => useMenuState())

      const deeplyNested: UserMenuItem = {
        id: 'level-1',
        title: 'Level 1',
        type: 'M',
        orderIndex: 0,
        isVisible: true,
        children: [
          {
            id: 'level-2',
            title: 'Level 2',
            type: 'M',
            orderIndex: 0,
            isVisible: true,
            children: [
              {
                id: 'level-3',
                title: 'Level 3',
                type: 'P',
                programId: 'prog-1',
                orderIndex: 0,
                isVisible: true,
                children: [],
              },
            ],
          },
        ],
      }

      act(() => {
        result.current.setUserMenu([deeplyNested])
      })

      expect(result.current.userMenu[0].children[0].children).toHaveLength(1)

      act(() => {
        result.current.removeFromUserMenu('level-3')
      })

      expect(result.current.userMenu[0].children[0].children).toHaveLength(0)
    })
  })
})
