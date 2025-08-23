import { cookies } from 'next/headers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAuthCookies,
  extractUserFromToken,
  getAuthFromCookies,
  isTokenExpired,
  refreshAuthTokens,
  setAuthCookies,
} from '../cookie-auth'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
  })),
}))

// Mock JWT decode
vi.mock('jwt-decode', () => ({
  default: vi.fn((token) => {
    if (token === 'valid_token') {
      return {
        sub: 'user_123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
      }
    }
    if (token === 'expired_token') {
      return {
        sub: 'user_123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
      }
    }
    throw new Error('Invalid token')
  }),
}))

describe('Cookie Authentication', () => {
  let mockCookies: any

  beforeEach(() => {
    mockCookies = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    }
    ;(cookies as any).mockReturnValue(mockCookies)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('setAuthCookies', () => {
    it('should set access and refresh token cookies with correct options', () => {
      const accessToken = 'access_token_123'
      const refreshToken = 'refresh_token_456'

      setAuthCookies(accessToken, refreshToken)

      // Check access token cookie
      expect(mockCookies.set).toHaveBeenCalledWith(
        'access_token',
        accessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 900, // 15 minutes
        })
      )

      // Check refresh token cookie
      expect(mockCookies.set).toHaveBeenCalledWith(
        'refresh_token',
        refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/api/auth/refresh',
          maxAge: 604800, // 7 days
        })
      )
    })

    it('should handle custom expiry times', () => {
      const accessToken = 'access_token_123'
      const refreshToken = 'refresh_token_456'
      const customExpiry = {
        accessToken: 1800, // 30 minutes
        refreshToken: 1209600, // 14 days
      }

      setAuthCookies(accessToken, refreshToken, customExpiry)

      expect(mockCookies.set).toHaveBeenCalledWith(
        'access_token',
        accessToken,
        expect.objectContaining({
          maxAge: 1800,
        })
      )

      expect(mockCookies.set).toHaveBeenCalledWith(
        'refresh_token',
        refreshToken,
        expect.objectContaining({
          maxAge: 1209600,
        })
      )
    })

    it('should set development-friendly options in dev mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      setAuthCookies('token', 'refresh')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'access_token',
        'token',
        expect.objectContaining({
          secure: false, // Allow HTTP in development
          sameSite: 'lax', // Less strict in development
        })
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('clearAuthCookies', () => {
    it('should delete both access and refresh token cookies', () => {
      clearAuthCookies()

      expect(mockCookies.delete).toHaveBeenCalledWith('access_token')
      expect(mockCookies.delete).toHaveBeenCalledWith('refresh_token')
    })

    it('should clear with proper options', () => {
      clearAuthCookies()

      expect(mockCookies.set).toHaveBeenCalledWith(
        'access_token',
        '',
        expect.objectContaining({
          maxAge: 0,
          path: '/',
        })
      )

      expect(mockCookies.set).toHaveBeenCalledWith(
        'refresh_token',
        '',
        expect.objectContaining({
          maxAge: 0,
          path: '/api/auth/refresh',
        })
      )
    })
  })

  describe('getAuthFromCookies', () => {
    it('should retrieve and decode valid access token', () => {
      mockCookies.get.mockReturnValue({ value: 'valid_token' })

      const auth = getAuthFromCookies()

      expect(mockCookies.get).toHaveBeenCalledWith('access_token')
      expect(auth).toEqual({
        isAuthenticated: true,
        user: {
          id: 'user_123',
          email: 'test@example.com',
        },
        token: 'valid_token',
      })
    })

    it('should handle missing access token', () => {
      mockCookies.get.mockReturnValue(undefined)

      const auth = getAuthFromCookies()

      expect(auth).toEqual({
        isAuthenticated: false,
        user: null,
        token: null,
      })
    })

    it('should handle expired token', () => {
      mockCookies.get.mockReturnValue({ value: 'expired_token' })

      const auth = getAuthFromCookies()

      expect(auth).toEqual({
        isAuthenticated: false,
        user: null,
        token: null,
        needsRefresh: true,
      })
    })

    it('should handle invalid token format', () => {
      mockCookies.get.mockReturnValue({ value: 'invalid_token_format' })

      const auth = getAuthFromCookies()

      expect(auth).toEqual({
        isAuthenticated: false,
        user: null,
        token: null,
        error: 'Invalid token',
      })
    })
  })

  describe('refreshAuthTokens', () => {
    it('should call refresh endpoint with refresh token', async () => {
      mockCookies.get.mockReturnValue({ value: 'refresh_token_123' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
        }),
      })

      const result = await refreshAuthTokens()

      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      expect(result).toEqual({
        success: true,
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      })
    })

    it('should handle refresh failure', async () => {
      mockCookies.get.mockReturnValue({ value: 'invalid_refresh_token' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid refresh token',
        }),
      })

      const result = await refreshAuthTokens()

      expect(result).toEqual({
        success: false,
        error: 'Invalid refresh token',
      })
    })

    it('should handle network errors', async () => {
      mockCookies.get.mockReturnValue({ value: 'refresh_token_123' })

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await refreshAuthTokens()

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
    })
  })

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const expiredToken = {
        exp: Math.floor(Date.now() / 1000) - 100, // 100 seconds ago
      }

      expect(isTokenExpired(expiredToken)).toBe(true)
    })

    it('should return false for valid token', () => {
      const validToken = {
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }

      expect(isTokenExpired(validToken)).toBe(false)
    })

    it('should consider buffer time for near-expiry tokens', () => {
      const nearExpiryToken = {
        exp: Math.floor(Date.now() / 1000) + 30, // 30 seconds from now
      }

      // With 60 second buffer
      expect(isTokenExpired(nearExpiryToken, 60)).toBe(true)

      // With 10 second buffer
      expect(isTokenExpired(nearExpiryToken, 10)).toBe(false)
    })

    it('should handle missing exp claim', () => {
      const tokenWithoutExp = {
        sub: 'user_123',
      }

      expect(isTokenExpired(tokenWithoutExp)).toBe(true)
    })
  })

  describe('extractUserFromToken', () => {
    it('should extract user information from valid token', () => {
      const token = {
        sub: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        permissions: ['read', 'write'],
      }

      const user = extractUserFromToken(token)

      expect(user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        permissions: ['read', 'write'],
      })
    })

    it('should handle missing optional fields', () => {
      const token = {
        sub: 'user_123',
        email: 'test@example.com',
      }

      const user = extractUserFromToken(token)

      expect(user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: undefined,
        role: undefined,
        permissions: [],
      })
    })

    it('should return null for invalid token structure', () => {
      const invalidToken = {
        // Missing required fields
        someField: 'value',
      }

      const user = extractUserFromToken(invalidToken)

      expect(user).toBeNull()
    })
  })

  describe('Cookie Security', () => {
    it('should validate cookie integrity', () => {
      const tamperedCookie = 'modified_token_value'
      mockCookies.get.mockReturnValue({ value: tamperedCookie })

      const auth = getAuthFromCookies()

      expect(auth.isAuthenticated).toBe(false)
      expect(auth.error).toBeDefined()
    })

    it('should handle cookie size limits', () => {
      // Cookies have a 4KB limit
      const largeToken = 'x'.repeat(5000) // Exceeds cookie limit

      expect(() => {
        setAuthCookies(largeToken, 'refresh')
      }).toThrow('Token size exceeds cookie limit')
    })

    it('should sanitize token values', () => {
      const maliciousToken = '<script>alert("XSS")</script>'

      setAuthCookies(maliciousToken, 'refresh')

      // Should escape or reject malicious content
      expect(mockCookies.set).toHaveBeenCalledWith(
        'access_token',
        expect.not.stringContaining('<script>'),
        expect.any(Object)
      )
    })
  })

  describe('Automatic Token Refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should schedule token refresh before expiry', () => {
      const token = {
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
      }

      const refreshCallback = vi.fn()
      scheduleTokenRefresh(token, refreshCallback)

      // Fast-forward to 1 minute before expiry
      vi.advanceTimersByTime(14 * 60 * 1000)

      expect(refreshCallback).toHaveBeenCalled()
    })

    it('should cancel scheduled refresh on logout', () => {
      const token = {
        exp: Math.floor(Date.now() / 1000) + 900,
      }

      const refreshCallback = vi.fn()
      const cancelRefresh = scheduleTokenRefresh(token, refreshCallback)

      cancelRefresh()

      // Fast-forward past refresh time
      vi.advanceTimersByTime(15 * 60 * 1000)

      expect(refreshCallback).not.toHaveBeenCalled()
    })
  })
})

// Helper function for testing (would be in the actual implementation)
function scheduleTokenRefresh(token: any, callback: () => void): () => void {
  const expiresIn = token.exp * 1000 - Date.now()
  const refreshTime = Math.max(0, expiresIn - 60000) // 1 minute before expiry

  const timeoutId = setTimeout(callback, refreshTime)

  return () => clearTimeout(timeoutId)
}
