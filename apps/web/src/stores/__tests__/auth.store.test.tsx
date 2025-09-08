import { act, renderHook } from '@testing-library/react'
import type { LoginCredentials, User } from '../auth.store'
import { useAuthStore } from '../auth.store'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    useAuthStore.getState().reset()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.refreshToken).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.permissions).toEqual([])
    })
  })

  describe('Login', () => {
    const mockCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'test-p@ssw0rd',
      rememberMe: true,
    }

    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      nom: 'Test',
      prenom: 'User',
      role: 'USER',
      permissions: ['read', 'write'],
      societeId: 'soc-1',
      societeName: 'Test Company',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockLoginResponse = {
      user: mockUser,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    }

    it('should successfully login with valid credentials', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login(mockCredentials)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe('mock-jwt-token')
      expect(result.current.refreshToken).toBe('mock-refresh-token')
      expect(result.current.permissions).toEqual(['read', 'write'])
      expect(result.current.error).toBeNull()
    })

    it('should handle login failure with invalid credentials', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login(mockCredentials)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle network error during login', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login(mockCredentials)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Network error')
    })

    it('should set loading state during login', async () => {
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(fetch as jest.Mock).mockReturnValueOnce(promise)

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login(mockCredentials)
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolvePromise?.({
          ok: true,
          json: async () => mockLoginResponse,
        })
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Logout', () => {
    it('should clear auth state on logout', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set authenticated state first
      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'USER',
            permissions: ['read'],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'token',
          refreshToken: 'refresh',
        })
      })

      expect(result.current.isAuthenticated).toBe(true)

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.refreshToken).toBeNull()
      expect(result.current.permissions).toEqual([])
    })

    it('should clear localStorage on logout', async () => {
      localStorageMock.setItem('auth-token', 'token')
      localStorageMock.setItem('refresh-token', 'refresh')

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.logout()
      })

      expect(localStorageMock.getItem('auth-token')).toBeNull()
      expect(localStorageMock.getItem('refresh-token')).toBeNull()
    })
  })

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshResponse = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      })

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'USER',
            permissions: [],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'old-token',
          refreshToken: 'old-refresh',
        })
      })

      await act(async () => {
        await result.current.refreshTokens()
      })

      expect(result.current.token).toBe('new-jwt-token')
      expect(result.current.refreshToken).toBe('new-refresh-token')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should logout on refresh token failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'USER',
            permissions: [],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'token',
          refreshToken: 'refresh',
        })
      })

      await act(async () => {
        await result.current.refreshTokens()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.token).toBeNull()
    })
  })

  describe('Permissions', () => {
    it('should check if user has permission', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'ADMIN',
            permissions: ['users.read', 'users.write', 'projects.read'],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'token',
          refreshToken: 'refresh',
        })
      })

      expect(result.current.hasPermission('users.read')).toBe(true)
      expect(result.current.hasPermission('users.write')).toBe(true)
      expect(result.current.hasPermission('users.delete')).toBe(false)
    })

    it('should check if user has any of the permissions', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'USER',
            permissions: ['projects.read'],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'token',
          refreshToken: 'refresh',
        })
      })

      expect(result.current.hasAnyPermission(['projects.read', 'projects.write'])).toBe(true)
      expect(result.current.hasAnyPermission(['users.read', 'users.write'])).toBe(false)
    })

    it('should check if user has all permissions', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'ADMIN',
            permissions: ['users.read', 'users.write', 'users.delete'],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'token',
          refreshToken: 'refresh',
        })
      })

      expect(result.current.hasAllPermissions(['users.read', 'users.write'])).toBe(true)
      expect(result.current.hasAllPermissions(['users.read', 'projects.write'])).toBe(false)
    })
  })

  describe('Session Management', () => {
    it('should track login attempts', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrong',
        })
      })

      expect(result.current.loginAttempts.length).toBe(1)
      expect(result.current.loginAttempts[0].email).toBe('test@example.com')
      expect(result.current.loginAttempts[0].success).toBe(false)
    })

    it('should update last activity time', () => {
      const { result } = renderHook(() => useAuthStore())

      const initialTime = result.current.lastActivity

      act(() => {
        result.current.updateActivity()
      })

      expect(result.current.lastActivity).toBeGreaterThan(initialTime)
    })

    it('should check session validity', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'USER',
            permissions: [],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'token',
          refreshToken: 'refresh',
        })
      })

      expect(result.current.isSessionValid()).toBe(true)

      // Simulate expired session
      act(() => {
        result.current.sessionExpiry = Date.now() - 1000
      })

      expect(result.current.isSessionValid()).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set some state
      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'test@example.com',
            nom: 'Test',
            prenom: 'User',
            role: 'USER',
            permissions: ['read'],
            societeId: 'soc-1',
            societeName: 'Test Company',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'token',
          refreshToken: 'refresh',
        })
        result.current.setError('Some error')
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.reset()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.permissions).toEqual([])
    })
  })
})
