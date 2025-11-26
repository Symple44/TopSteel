/**
 * Tests pour les selectors mémoïsés Zustand
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '../app.store'
import { useAuthStore } from '../auth.store'
import {
  useUIState,
  useSidebarState,
  useUnreadNotifications,
  useUnreadNotificationCount,
  useAppUserInfo,
  useAppStatus,
  useAuthState,
  useSessionInfo,
  useUserPermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  useUserFullName,
  useUserRole,
  useIsAdmin,
  useIsSuperAdmin,
} from '../selectors'

describe('App Store Selectors', () => {
  beforeEach(() => {
    // Reset stores before each test
    useAppStore.getState().reset()
  })

  describe('useUIState', () => {
    it('should return UI state object', () => {
      const { result } = renderHook(() => useUIState())

      expect(result.current).toEqual({
        sidebarCollapsed: false,
        sidebarPinned: true,
        layoutMode: 'default',
        activeModule: null,
        showTooltips: true,
      })
    })

    it('should update when sidebar state changes', () => {
      const { result } = renderHook(() => useUIState())

      act(() => {
        useAppStore.getState().setSidebarCollapsed(true)
      })

      expect(result.current.sidebarCollapsed).toBe(true)
    })
  })

  describe('useSidebarState', () => {
    it('should return sidebar collapsed and pinned state', () => {
      const { result } = renderHook(() => useSidebarState())

      expect(result.current).toEqual({
        collapsed: false,
        pinned: true,
      })
    })

    it('should update when sidebar is collapsed', () => {
      const { result } = renderHook(() => useSidebarState())

      act(() => {
        useAppStore.getState().setSidebarCollapsed(true)
        useAppStore.getState().setSidebarPinned(false)
      })

      expect(result.current.collapsed).toBe(true)
      expect(result.current.pinned).toBe(false)
    })
  })

  describe('useUnreadNotifications', () => {
    it('should return empty array when no notifications', () => {
      const { result } = renderHook(() => useUnreadNotifications())
      expect(result.current).toEqual([])
    })

    it('should filter only unread notifications', () => {
      act(() => {
        useAppStore.getState().addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
          read: false,
        })
        useAppStore.getState().addNotification({
          type: 'success',
          title: 'Test 2',
          message: 'Message 2',
          read: false,
        })
      })

      const { result } = renderHook(() => useUnreadNotifications())
      expect(result.current).toHaveLength(2)

      // Mark one as read
      const notificationId = result.current[0].id
      act(() => {
        useAppStore.getState().markNotificationRead(notificationId)
      })

      expect(result.current).toHaveLength(1)
    })
  })

  describe('useUnreadNotificationCount', () => {
    it('should return 0 when no notifications', () => {
      const { result } = renderHook(() => useUnreadNotificationCount())
      expect(result.current).toBe(0)
    })

    it('should return correct count', () => {
      act(() => {
        useAppStore.getState().addNotification({
          type: 'info',
          title: 'Test',
          message: 'Message',
          read: false,
        })
        useAppStore.getState().addNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
          read: false,
        })
      })

      const { result } = renderHook(() => useUnreadNotificationCount())
      expect(result.current).toBe(2)
    })
  })

  describe('useAppStatus', () => {
    it('should return loading and error state', () => {
      const { result } = renderHook(() => useAppStatus())

      expect(result.current).toEqual({
        loading: false,
        error: null,
      })
    })

    it('should update when loading changes', () => {
      const { result } = renderHook(() => useAppStatus())

      act(() => {
        useAppStore.getState().setLoading(true)
      })

      expect(result.current.loading).toBe(true)
    })

    it('should update when error is set', () => {
      const { result } = renderHook(() => useAppStatus())

      act(() => {
        useAppStore.getState().setError('Test error')
      })

      expect(result.current.error).toBe('Test error')
    })
  })
})

describe('Auth Store Selectors', () => {
  beforeEach(() => {
    // Reset auth store before each test
    useAuthStore.getState().reset()
  })

  describe('useAuthState', () => {
    it('should return initial auth state', () => {
      const { result } = renderHook(() => useAuthState())

      expect(result.current).toEqual({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    })

    it('should update when user is set', () => {
      const mockUser = {
        id: '1',
        nom: 'Doe',
        prenom: 'John',
        email: 'john@test.com',
        role: 'USER',
        permissions: ['READ'],
      }

      act(() => {
        useAuthStore.getState().setUser(mockUser)
        useAuthStore.getState().setAuthenticated(true)
      })

      const { result } = renderHook(() => useAuthState())

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('useUserPermissions', () => {
    it('should return empty array when no user', () => {
      const { result } = renderHook(() => useUserPermissions())
      expect(result.current).toEqual([])
    })

    it('should return user permissions', () => {
      act(() => {
        useAuthStore.getState().setPermissions(['READ', 'WRITE', 'DELETE'])
      })

      const { result } = renderHook(() => useUserPermissions())
      expect(result.current).toEqual(['READ', 'WRITE', 'DELETE'])
    })
  })

  describe('useHasPermission', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().setPermissions(['READ', 'WRITE'])
      })
    })

    it('should return true for existing permission', () => {
      const { result } = renderHook(() => useHasPermission('READ'))
      expect(result.current).toBe(true)
    })

    it('should return false for missing permission', () => {
      const { result } = renderHook(() => useHasPermission('DELETE'))
      expect(result.current).toBe(false)
    })
  })

  describe('useHasAnyPermission', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().setPermissions(['READ', 'WRITE'])
      })
    })

    it('should return true if user has at least one permission', () => {
      const { result } = renderHook(() =>
        useHasAnyPermission(['DELETE', 'READ'])
      )
      expect(result.current).toBe(true)
    })

    it('should return false if user has none of the permissions', () => {
      const { result } = renderHook(() =>
        useHasAnyPermission(['DELETE', 'ADMIN'])
      )
      expect(result.current).toBe(false)
    })
  })

  describe('useHasAllPermissions', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().setPermissions(['READ', 'WRITE', 'DELETE'])
      })
    })

    it('should return true if user has all permissions', () => {
      const { result } = renderHook(() =>
        useHasAllPermissions(['READ', 'WRITE'])
      )
      expect(result.current).toBe(true)
    })

    it('should return false if user is missing any permission', () => {
      const { result } = renderHook(() =>
        useHasAllPermissions(['READ', 'ADMIN'])
      )
      expect(result.current).toBe(false)
    })
  })

  describe('useUserFullName', () => {
    it('should return empty string when no user', () => {
      const { result } = renderHook(() => useUserFullName())
      expect(result.current).toBe('')
    })

    it('should return formatted full name', () => {
      act(() => {
        useAuthStore.getState().setUser({
          id: '1',
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean@test.com',
        })
      })

      const { result } = renderHook(() => useUserFullName())
      expect(result.current).toBe('Jean Dupont')
    })
  })

  describe('useUserRole', () => {
    it('should return undefined when no user', () => {
      const { result } = renderHook(() => useUserRole())
      expect(result.current).toBeUndefined()
    })

    it('should return user role', () => {
      act(() => {
        useAuthStore.getState().setUser({
          id: '1',
          nom: 'Test',
          prenom: 'User',
          email: 'test@test.com',
          role: 'MANAGER',
        })
      })

      const { result } = renderHook(() => useUserRole())
      expect(result.current).toBe('MANAGER')
    })
  })

  describe('useIsAdmin', () => {
    it('should return false when no user', () => {
      const { result } = renderHook(() => useIsAdmin())
      expect(result.current).toBe(false)
    })

    it('should return true for ADMIN role', () => {
      act(() => {
        useAuthStore.getState().setUser({
          id: '1',
          nom: 'Admin',
          prenom: 'User',
          email: 'admin@test.com',
          role: 'ADMIN',
        })
      })

      const { result } = renderHook(() => useIsAdmin())
      expect(result.current).toBe(true)
    })

    it('should return true for SUPER_ADMIN role', () => {
      act(() => {
        useAuthStore.getState().setUser({
          id: '1',
          nom: 'Super',
          prenom: 'Admin',
          email: 'super@test.com',
          role: 'SUPER_ADMIN',
        })
      })

      const { result } = renderHook(() => useIsAdmin())
      expect(result.current).toBe(true)
    })

    it('should return false for USER role', () => {
      act(() => {
        useAuthStore.getState().setUser({
          id: '1',
          nom: 'Regular',
          prenom: 'User',
          email: 'user@test.com',
          role: 'USER',
        })
      })

      const { result } = renderHook(() => useIsAdmin())
      expect(result.current).toBe(false)
    })
  })

  describe('useIsSuperAdmin', () => {
    it('should return false when no user', () => {
      const { result } = renderHook(() => useIsSuperAdmin())
      expect(result.current).toBe(false)
    })

    it('should return true only for SUPER_ADMIN', () => {
      act(() => {
        useAuthStore.getState().setUser({
          id: '1',
          nom: 'Super',
          prenom: 'Admin',
          email: 'super@test.com',
          role: 'SUPER_ADMIN',
        })
      })

      const { result } = renderHook(() => useIsSuperAdmin())
      expect(result.current).toBe(true)
    })

    it('should return false for ADMIN', () => {
      act(() => {
        useAuthStore.getState().setUser({
          id: '1',
          nom: 'Admin',
          prenom: 'User',
          email: 'admin@test.com',
          role: 'ADMIN',
        })
      })

      const { result } = renderHook(() => useIsSuperAdmin())
      expect(result.current).toBe(false)
    })
  })
})
