import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMenuApi } from '../useMenuApi'
import type { MenuItemConfig, UserMenuItem } from '../../types/menu.types'
import * as apiTyped from '../../../../../../lib/api-typed'

// Mock the API functions
vi.mock('../../../../../../lib/api-typed', () => ({
  fetchTyped: vi.fn(),
  postTyped: vi.fn(),
}))

// Mock the menu transformers
vi.mock('../../utils/menu-transformers', () => ({
  mapMenuItemRecursively: vi.fn((item: any, index: number) => ({
    ...item,
    orderIndex: index,
  })),
}))

// Mock data
const mockStandardMenuResponse = {
  data: {
    success: true,
    data: {
      menuTree: [
        {
          id: 'menu-1',
          title: 'Dashboard',
          type: 'M',
          orderIndex: 0,
          isVisible: true,
          children: [],
          depth: 0,
        },
        {
          id: 'menu-2',
          title: 'Settings',
          type: 'M',
          orderIndex: 1,
          isVisible: true,
          children: [
            {
              id: 'menu-2-1',
              parentId: 'menu-2',
              title: 'Profile',
              type: 'P',
              programId: 'profile',
              orderIndex: 0,
              isVisible: true,
              children: [],
              depth: 1,
            },
          ],
          depth: 0,
        },
      ],
    },
  },
}

const mockUserMenuResponse = {
  data: {
    success: true,
    data: [
      {
        id: 'user-menu-1',
        title: 'My Dashboard',
        type: 'M',
        orderIndex: 0,
        isVisible: true,
        children: [],
        customTitle: 'Custom Dashboard',
      },
      {
        id: 'user-menu-2',
        title: 'My Settings',
        type: 'M',
        orderIndex: 1,
        isVisible: true,
        children: [],
        customIcon: 'settings',
      },
    ],
  },
}

const mockSaveSuccessResponse = {
  data: {
    success: true,
  },
}

describe('useMenuApi', () => {
  let setStandardMenuMock: ReturnType<typeof vi.fn>
  let setUserMenuMock: ReturnType<typeof vi.fn>
  let setLoadingMock: ReturnType<typeof vi.fn>
  let setSavingMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    setStandardMenuMock = vi.fn()
    setUserMenuMock = vi.fn()
    setLoadingMock = vi.fn()
    setSavingMock = vi.fn()

    // Reset window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization and loading', () => {
    it('should call loadStandardMenu and loadUserMenu on mount', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockUserMenuResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(apiTyped.fetchTyped).toHaveBeenCalledWith('/admin/menu-raw/configurations/active')
        expect(apiTyped.fetchTyped).toHaveBeenCalledWith('/user/menu-preferences/custom-menu')
      })
    })

    it('should set loading to false after loading standard menu', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockUserMenuResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setLoadingMock).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('loadStandardMenu', () => {
    it('should load and set standard menu successfully', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setStandardMenuMock).toHaveBeenCalledWith(mockStandardMenuResponse.data.data.menuTree)
      })
    })

    it('should handle empty menu tree', async () => {
      const emptyResponse = {
        data: {
          success: true,
          data: {
            menuTree: [],
          },
        },
      }

      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(emptyResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setStandardMenuMock).toHaveBeenCalledWith([])
      })
    })

    it('should handle API error gracefully', async () => {
      vi.mocked(apiTyped.fetchTyped).mockRejectedValueOnce(new Error('API Error'))

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setLoadingMock).toHaveBeenCalledWith(false)
      })
    })

    it('should handle unsuccessful response', async () => {
      const unsuccessfulResponse = {
        data: {
          success: false,
        },
      }

      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(unsuccessfulResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setLoadingMock).toHaveBeenCalledWith(false)
      })

      // Should not set menu if unsuccessful
      expect(setStandardMenuMock).not.toHaveBeenCalled()
    })

    it('should handle response without menuTree', async () => {
      const responseWithoutMenuTree = {
        data: {
          success: true,
          data: {},
        },
      }

      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(responseWithoutMenuTree)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setStandardMenuMock).toHaveBeenCalledWith([])
      })
    })

    it('should call loadStandardMenu manually', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      // Clear previous calls
      vi.clearAllMocks()

      await result.current.loadStandardMenu()

      await waitFor(() => {
        expect(apiTyped.fetchTyped).toHaveBeenCalledWith('/admin/menu-raw/configurations/active')
        expect(setStandardMenuMock).toHaveBeenCalled()
      })
    })
  })

  describe('loadUserMenu', () => {
    it('should load and set user menu successfully', async () => {
      // Skip standard menu call
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockUserMenuResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setUserMenuMock).toHaveBeenCalled()
      })

      const callArg = setUserMenuMock.mock.calls[0][0]
      expect(callArg).toHaveLength(2)
    })

    it('should handle empty user menu', async () => {
      const emptyResponse = {
        data: {
          success: true,
          data: [],
        },
      }

      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(emptyResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setUserMenuMock).toHaveBeenCalledWith([])
      })
    })

    it('should handle user menu API error', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockRejectedValueOnce(new Error('User menu error'))

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setUserMenuMock).toHaveBeenCalledWith([])
      })
    })

    it('should handle unsuccessful user menu response', async () => {
      const unsuccessfulResponse = {
        data: {
          success: false,
        },
      }

      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(unsuccessfulResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setUserMenuMock).toHaveBeenCalledWith([])
      })
    })

    it('should handle non-array user menu data', async () => {
      const invalidResponse = {
        data: {
          success: true,
          data: { invalid: 'data' },
        },
      }

      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(invalidResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setUserMenuMock).toHaveBeenCalledWith([])
      })
    })

    it('should call loadUserMenu manually', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockUserMenuResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      // Clear previous calls
      vi.clearAllMocks()

      await result.current.loadUserMenu()

      await waitFor(() => {
        expect(apiTyped.fetchTyped).toHaveBeenCalledWith('/user/menu-preferences/custom-menu')
        expect(setUserMenuMock).toHaveBeenCalled()
      })
    })
  })

  describe('saveUserMenu', () => {
    const mockUserMenuToSave: UserMenuItem[] = [
      {
        id: 'user-menu-1',
        title: 'My Menu',
        type: 'M',
        orderIndex: 0,
        isVisible: true,
        children: [],
      },
    ]

    it('should save user menu successfully', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)
      vi.mocked(apiTyped.postTyped).mockResolvedValueOnce(mockSaveSuccessResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await result.current.saveUserMenu(mockUserMenuToSave)

      await waitFor(() => {
        expect(apiTyped.postTyped).toHaveBeenCalledWith('/user/menu-preferences/custom-menu', {
          menuItems: mockUserMenuToSave,
        })
      })
    })

    it('should set saving state during save operation', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)
      vi.mocked(apiTyped.postTyped).mockResolvedValueOnce(mockSaveSuccessResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      const savePromise = result.current.saveUserMenu(mockUserMenuToSave)

      // Should be called with true at the start
      expect(setSavingMock).toHaveBeenCalledWith(true)

      await savePromise

      // Should be called with false at the end
      await waitFor(() => {
        expect(setSavingMock).toHaveBeenCalledWith(false)
      })
    })

    it('should dispatch custom event on successful save', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)
      vi.mocked(apiTyped.postTyped).mockResolvedValueOnce(mockSaveSuccessResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await result.current.saveUserMenu(mockUserMenuToSave)

      await waitFor(() => {
        expect(window.dispatchEvent).toHaveBeenCalled()
      })

      const eventCall = (window.dispatchEvent as any).mock.calls.find(
        (call: any) => call[0].type === 'menuPreferencesChanged'
      )
      expect(eventCall).toBeDefined()
      expect(eventCall[0].detail.fromCustomizationPage).toBe(true)
      expect(eventCall[0].detail.menuItemsCount).toBe(1)
      expect(eventCall[0].detail.menuItems).toEqual(mockUserMenuToSave)
    })

    it('should handle save error gracefully', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)
      vi.mocked(apiTyped.postTyped).mockRejectedValueOnce(new Error('Save failed'))

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await result.current.saveUserMenu(mockUserMenuToSave)

      // Should still set saving to false even on error
      await waitFor(() => {
        expect(setSavingMock).toHaveBeenCalledWith(false)
      })
    })

    it('should not dispatch event on failed save', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)
      vi.mocked(apiTyped.postTyped).mockResolvedValueOnce({
        data: {
          success: false,
        },
      })

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      dispatchEventSpy.mockClear()

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await result.current.saveUserMenu(mockUserMenuToSave)

      await waitFor(() => {
        expect(setSavingMock).toHaveBeenCalledWith(false)
      })

      // Should not dispatch event if save was not successful
      expect(dispatchEventSpy).not.toHaveBeenCalled()
    })

    it('should save empty menu array', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)
      vi.mocked(apiTyped.postTyped).mockResolvedValueOnce(mockSaveSuccessResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await result.current.saveUserMenu([])

      await waitFor(() => {
        expect(apiTyped.postTyped).toHaveBeenCalledWith('/user/menu-preferences/custom-menu', {
          menuItems: [],
        })
      })
    })

    it('should save complex nested menu structure', async () => {
      const complexMenu: UserMenuItem[] = [
        {
          id: 'parent-1',
          title: 'Parent',
          type: 'M',
          orderIndex: 0,
          isVisible: true,
          children: [
            {
              id: 'child-1',
              parentId: 'parent-1',
              title: 'Child 1',
              type: 'P',
              programId: 'prog-1',
              orderIndex: 0,
              isVisible: true,
              children: [],
            },
            {
              id: 'child-2',
              parentId: 'parent-1',
              title: 'Child 2',
              type: 'P',
              programId: 'prog-2',
              orderIndex: 1,
              isVisible: true,
              children: [],
            },
          ],
        },
      ]

      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)
      vi.mocked(apiTyped.postTyped).mockResolvedValueOnce(mockSaveSuccessResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await result.current.saveUserMenu(complexMenu)

      await waitFor(() => {
        expect(apiTyped.postTyped).toHaveBeenCalledWith('/user/menu-preferences/custom-menu', {
          menuItems: complexMenu,
        })
      })
    })
  })

  describe('integration tests', () => {
    it('should load both menus sequentially', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockUserMenuResponse)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setStandardMenuMock).toHaveBeenCalled()
        expect(setUserMenuMock).toHaveBeenCalled()
      })
    })

    it('should handle mixed success and failure', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)
      vi.mocked(apiTyped.fetchTyped).mockRejectedValueOnce(new Error('User menu failed'))

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setStandardMenuMock).toHaveBeenCalled()
        expect(setUserMenuMock).toHaveBeenCalledWith([])
        expect(setLoadingMock).toHaveBeenCalledWith(false)
      })
    })

    it('should allow reloading after initial load', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValue(mockStandardMenuResponse)

      const { result } = renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setStandardMenuMock).toHaveBeenCalled()
      })

      vi.clearAllMocks()
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(mockStandardMenuResponse)

      await result.current.loadStandardMenu()

      await waitFor(() => {
        expect(apiTyped.fetchTyped).toHaveBeenCalledWith('/admin/menu-raw/configurations/active')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle null response data', async () => {
      const nullResponse = {
        data: null,
      }

      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(nullResponse as any)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setLoadingMock).toHaveBeenCalledWith(false)
      })
    })

    it('should handle undefined response', async () => {
      vi.mocked(apiTyped.fetchTyped).mockResolvedValueOnce(undefined as any)

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setLoadingMock).toHaveBeenCalledWith(false)
      })
    })

    it('should handle network timeout', async () => {
      vi.mocked(apiTyped.fetchTyped).mockRejectedValueOnce(new Error('Network timeout'))

      renderHook(() =>
        useMenuApi(setStandardMenuMock, setUserMenuMock, setLoadingMock, setSavingMock)
      )

      await waitFor(() => {
        expect(setLoadingMock).toHaveBeenCalledWith(false)
      })
    })
  })
})
