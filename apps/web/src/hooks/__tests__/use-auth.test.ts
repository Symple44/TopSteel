import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth, useCurrentUser, useIsAuthenticated, useCurrentCompany, useAuthLoading, useRequiresCompanySelection } from '../use-auth'
import type { AuthContextType, User, Company, AuthTokens } from '../use-auth'
import { AuthContext } from '../../lib/auth/auth-context'
import React from 'react'

// Mock data
const mockUser: User = {
  id: 'user-1',
  nom: 'Doe',
  prenom: 'John',
  email: 'john.doe@example.com',
  role: 'USER',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  permissions: ['read', 'write'],
}

const mockCompany: Company = {
  id: 'company-1',
  nom: 'Test Company',
  name: 'Test Company',
  code: 'TEST',
  status: 'active',
  plan: 'premium',
  isActive: true,
}

const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 3600000,
  expiresIn: 3600,
  tokenType: 'Bearer',
}

// Mock AuthProvider context
const createMockAuthContext = (overrides?: Partial<AuthContextType>): AuthContextType => ({
  isLoading: false,
  isAuthenticated: false,
  user: null,
  tokens: null,
  mfa: { required: false },
  company: null,
  requiresCompanySelection: false,
  mounted: true,
  login: vi.fn(),
  logout: vi.fn(),
  verifyMFA: vi.fn(),
  resetMFA: vi.fn(),
  setUser: vi.fn(),
  refreshTokens: vi.fn(),
  selectCompany: vi.fn(),
  refreshAuth: vi.fn(),
  validateTokens: vi.fn(),
  ...overrides,
})

// Create wrapper component for AuthProvider
const createWrapper = (contextValue: AuthContextType) => {
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(AuthContext.Provider, { value: contextValue }, children)
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization and context', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleErrorSpy.mockRestore()
    })

    it('should return default unauthenticated state', () => {
      const mockContext = createMockAuthContext()
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.tokens).toBeNull()
      expect(result.current.company).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.mounted).toBe(true)
    })

    it('should return authenticated state when user is logged in', () => {
      const mockContext = createMockAuthContext({
        isAuthenticated: true,
        user: mockUser,
        tokens: mockTokens,
        company: mockCompany,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.tokens).toEqual(mockTokens)
      expect(result.current.company).toEqual(mockCompany)
    })
  })

  describe('login functionality', () => {
    it('should call login with correct credentials', async () => {
      const loginMock = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockAuthContext({ login: loginMock })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.login('john.doe@example.com', 'password123')

      expect(loginMock).toHaveBeenCalledWith('john.doe@example.com', 'password123')
      expect(loginMock).toHaveBeenCalledTimes(1)
    })

    it('should handle login with rememberMe option', async () => {
      const loginMock = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockAuthContext({ login: loginMock })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.login('john.doe@example.com', 'password123', true)

      expect(loginMock).toHaveBeenCalledWith('john.doe@example.com', 'password123', true)
    })

    it('should handle login error', async () => {
      const loginError = new Error('Invalid credentials')
      const loginMock = vi.fn().mockRejectedValue(loginError)
      const mockContext = createMockAuthContext({ login: loginMock })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await expect(
        result.current.login('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid credentials')
    })

    it('should set loading state during login', async () => {
      const loginMock = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      const mockContext = createMockAuthContext({
        login: loginMock,
        isLoading: true,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('logout functionality', () => {
    it('should call logout and clear authentication state', async () => {
      const logoutMock = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockAuthContext({
        isAuthenticated: true,
        user: mockUser,
        tokens: mockTokens,
        logout: logoutMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.logout()

      expect(logoutMock).toHaveBeenCalledTimes(1)
    })

    it('should handle logout errors gracefully', async () => {
      const logoutError = new Error('Logout failed')
      const logoutMock = vi.fn().mockRejectedValue(logoutError)
      const mockContext = createMockAuthContext({ logout: logoutMock })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await expect(result.current.logout()).rejects.toThrow('Logout failed')
    })
  })

  describe('MFA functionality', () => {
    it('should handle MFA requirement', () => {
      const mockContext = createMockAuthContext({
        mfa: {
          required: true,
          userId: 'user-1',
          email: 'john.doe@example.com',
          methods: ['totp', 'email'],
        },
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.mfa.required).toBe(true)
      expect(result.current.mfa.userId).toBe('user-1')
      expect(result.current.mfa.email).toBe('john.doe@example.com')
    })

    it('should verify MFA with code', async () => {
      const verifyMFAMock = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockAuthContext({
        mfa: { required: true, userId: 'user-1' },
        verifyMFA: verifyMFAMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.verifyMFA('totp', '123456')

      expect(verifyMFAMock).toHaveBeenCalledWith('totp', '123456')
    })

    it('should reset MFA state', () => {
      const resetMFAMock = vi.fn()
      const mockContext = createMockAuthContext({
        mfa: { required: true, userId: 'user-1' },
        resetMFA: resetMFAMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      result.current.resetMFA()

      expect(resetMFAMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('company selection', () => {
    it('should indicate company selection is required', () => {
      const mockContext = createMockAuthContext({
        isAuthenticated: true,
        user: mockUser,
        tokens: mockTokens,
        requiresCompanySelection: true,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.requiresCompanySelection).toBe(true)
      expect(result.current.company).toBeNull()
    })

    it('should select company successfully', async () => {
      const selectCompanyMock = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockAuthContext({
        isAuthenticated: true,
        user: mockUser,
        tokens: mockTokens,
        requiresCompanySelection: true,
        selectCompany: selectCompanyMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.selectCompany(mockCompany)

      expect(selectCompanyMock).toHaveBeenCalledWith(mockCompany)
      expect(selectCompanyMock).toHaveBeenCalledTimes(1)
    })

    it('should handle company selection error', async () => {
      const selectCompanyError = new Error('Company selection failed')
      const selectCompanyMock = vi.fn().mockRejectedValue(selectCompanyError)
      const mockContext = createMockAuthContext({
        selectCompany: selectCompanyMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await expect(
        result.current.selectCompany(mockCompany)
      ).rejects.toThrow('Company selection failed')
    })
  })

  describe('token management', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokensMock = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockAuthContext({
        isAuthenticated: true,
        tokens: mockTokens,
        refreshTokens: refreshTokensMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.refreshTokens()

      expect(refreshTokensMock).toHaveBeenCalledTimes(1)
    })

    it('should validate tokens', async () => {
      const validateTokensMock = vi.fn().mockResolvedValue(true)
      const mockContext = createMockAuthContext({
        validateTokens: validateTokensMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      const isValid = await result.current.validateTokens(mockTokens)

      expect(isValid).toBe(true)
      expect(validateTokensMock).toHaveBeenCalledWith(mockTokens)
    })

    it('should handle token validation failure', async () => {
      const validateTokensMock = vi.fn().mockResolvedValue(false)
      const mockContext = createMockAuthContext({
        validateTokens: validateTokensMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      const isValid = await result.current.validateTokens(mockTokens)

      expect(isValid).toBe(false)
    })

    it('should handle token refresh error', async () => {
      const refreshError = new Error('Token refresh failed')
      const refreshTokensMock = vi.fn().mockRejectedValue(refreshError)
      const mockContext = createMockAuthContext({
        refreshTokens: refreshTokensMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await expect(result.current.refreshTokens()).rejects.toThrow('Token refresh failed')
    })
  })

  describe('user management', () => {
    it('should set user', () => {
      const setUserMock = vi.fn()
      const mockContext = createMockAuthContext({
        setUser: setUserMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      result.current.setUser(mockUser)

      expect(setUserMock).toHaveBeenCalledWith(mockUser)
    })

    it('should clear user by setting null', () => {
      const setUserMock = vi.fn()
      const mockContext = createMockAuthContext({
        isAuthenticated: true,
        user: mockUser,
        setUser: setUserMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      result.current.setUser(null)

      expect(setUserMock).toHaveBeenCalledWith(null)
    })

    it('should refresh auth state', async () => {
      const refreshAuthMock = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockAuthContext({
        refreshAuth: refreshAuthMock,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.refreshAuth()

      expect(refreshAuthMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('loading states', () => {
    it('should handle initial loading state', () => {
      const mockContext = createMockAuthContext({
        isLoading: true,
        mounted: false,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.mounted).toBe(false)
    })

    it('should transition from loading to loaded', async () => {
      const mockContext = createMockAuthContext({
        isLoading: false,
        mounted: true,
      })
      const wrapper = createWrapper(mockContext)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.mounted).toBe(true)
      })
    })
  })
})

describe('useCurrentUser', () => {
  it('should return current user when authenticated', () => {
    const mockContext = createMockAuthContext({
      isAuthenticated: true,
      user: mockUser,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useCurrentUser(), { wrapper })

    expect(result.current).toEqual(mockUser)
  })

  it('should return null when not authenticated', () => {
    const mockContext = createMockAuthContext({
      isAuthenticated: false,
      user: null,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useCurrentUser(), { wrapper })

    expect(result.current).toBeNull()
  })
})

describe('useIsAuthenticated', () => {
  it('should return true when authenticated', () => {
    const mockContext = createMockAuthContext({
      isAuthenticated: true,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useIsAuthenticated(), { wrapper })

    expect(result.current).toBe(true)
  })

  it('should return false when not authenticated', () => {
    const mockContext = createMockAuthContext({
      isAuthenticated: false,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useIsAuthenticated(), { wrapper })

    expect(result.current).toBe(false)
  })
})

describe('useCurrentCompany', () => {
  it('should return current company when selected', () => {
    const mockContext = createMockAuthContext({
      company: mockCompany,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useCurrentCompany(), { wrapper })

    expect(result.current).toEqual(mockCompany)
  })

  it('should return null when no company selected', () => {
    const mockContext = createMockAuthContext({
      company: null,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useCurrentCompany(), { wrapper })

    expect(result.current).toBeNull()
  })
})

describe('useAuthLoading', () => {
  it('should return loading state', () => {
    const mockContext = createMockAuthContext({
      isLoading: true,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useAuthLoading(), { wrapper })

    expect(result.current).toBe(true)
  })

  it('should return false when not loading', () => {
    const mockContext = createMockAuthContext({
      isLoading: false,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useAuthLoading(), { wrapper })

    expect(result.current).toBe(false)
  })
})

describe('useRequiresCompanySelection', () => {
  it('should return true when company selection is required', () => {
    const mockContext = createMockAuthContext({
      requiresCompanySelection: true,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useRequiresCompanySelection(), { wrapper })

    expect(result.current).toBe(true)
  })

  it('should return false when company selection is not required', () => {
    const mockContext = createMockAuthContext({
      requiresCompanySelection: false,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useRequiresCompanySelection(), { wrapper })

    expect(result.current).toBe(false)
  })

  it('should return false when company is already selected', () => {
    const mockContext = createMockAuthContext({
      requiresCompanySelection: false,
      company: mockCompany,
    })
    const wrapper = createWrapper(mockContext)

    const { result } = renderHook(() => useRequiresCompanySelection(), { wrapper })

    expect(result.current).toBe(false)
  })
})
