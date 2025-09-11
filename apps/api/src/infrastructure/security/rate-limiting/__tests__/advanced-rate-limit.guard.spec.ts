/**
 * Advanced Rate Limit Guard Tests
 * Tests for the comprehensive rate limiting guard
 */

import { type ExecutionContext, HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { Test, type TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'
import { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'
import { AdvancedRateLimitingService } from '../advanced-rate-limiting.service'
import { AdvancedRateLimitGuard } from '../guards/advanced-rate-limit.guard'
import { rateLimitingConfig } from '../rate-limiting.config'

// Mock services
const mockRateLimitService = {
  checkCombinedRateLimit: vi.fn(),
  checkBanStatus: vi.fn(),
  recordViolation: vi.fn(),
  getRateLimitStats: vi.fn(),
  imposeBan: vi.fn(),
}

const mockReflector = {
  get: vi.fn(),
}

const mockConfigService = {
  get: vi.fn().mockReturnValue(rateLimitingConfig()),
}

// Mock request and response objects
const createMockRequest = (overrides = {}) => ({
  user: {
    id: 'user123',
    globalRole: GlobalUserRole.USER,
  },
  path: '/api/test',
  method: 'GET',
  ip: '192.168.1.1',
  headers: {
    'user-agent': 'test-agent',
  },
  connection: {
    remoteAddress: '192.168.1.1',
  },
  ...overrides,
})

const createMockResponse = () => ({
  setHeader: vi.fn(),
})

const createMockExecutionContext = (
  request = createMockRequest(),
  response = createMockResponse()
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as ExecutionContext

describe('AdvancedRateLimitGuard', () => {
  let guard: AdvancedRateLimitGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancedRateLimitGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: AdvancedRateLimitingService,
          useValue: mockRateLimitService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    guard = module.get<AdvancedRateLimitGuard>(AdvancedRateLimitGuard)

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('canActivate', () => {
    it('should allow request when rate limit is not exceeded', async () => {
      const mockRequest = createMockRequest()
      const mockResponse = createMockResponse()
      const context = createMockExecutionContext(mockRequest, mockResponse)

      // Mock no bypass
      mockReflector.get.mockReturnValue(undefined)

      // Mock not banned
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock rate limit check passes
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: true,
          remainingRequests: 99,
          resetTime: Date.now() + 60000,
          totalRequests: 1,
          windowStartTime: Date.now() - 60000,
        },
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number))
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 99)
    })

    it('should block request when rate limit is exceeded', async () => {
      const mockRequest = createMockRequest()
      const mockResponse = createMockResponse()
      const context = createMockExecutionContext(mockRequest, mockResponse)

      // Mock no bypass
      mockReflector.get.mockReturnValue(undefined)

      // Mock not banned
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock rate limit check fails
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: false,
          remainingRequests: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
          totalRequests: 100,
          windowStartTime: Date.now() - 60000,
        },
      })

      // Mock progressive penalty check
      mockRateLimitService.getRateLimitStats.mockResolvedValueOnce({
        violations: 5,
      })

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException)

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 60)
    })

    it('should bypass rate limiting when bypass decorator is present', async () => {
      const context = createMockExecutionContext()

      // Mock bypass decorator
      mockReflector.get.mockReturnValue({ bypass: true, reason: 'Testing' })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockRateLimitService.checkCombinedRateLimit).not.toHaveBeenCalled()
    })

    it('should bypass rate limiting for trusted IPs', async () => {
      const mockRequest = createMockRequest({ ip: '127.0.0.1' })
      const context = createMockExecutionContext(mockRequest)

      // Mock no bypass decorator
      mockReflector.get.mockReturnValue(undefined)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockRateLimitService.checkCombinedRateLimit).not.toHaveBeenCalled()
    })

    it('should handle banned users correctly', async () => {
      const mockRequest = createMockRequest()
      const mockResponse = createMockResponse()
      const context = createMockExecutionContext(mockRequest, mockResponse)

      // Mock no bypass
      mockReflector.get.mockReturnValue(undefined)

      // Mock user is banned
      const banExpiry = Date.now() + 300000 // 5 minutes
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({
        isBanned: true,
        banExpiry,
        reason: 'Rate limit violations',
      })

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException)

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number))
    })

    it('should bypass for role-based permissions', async () => {
      const mockRequest = createMockRequest({
        user: {
          id: 'admin123',
          globalRole: GlobalUserRole.SUPER_ADMIN,
        },
      })
      const context = createMockExecutionContext(mockRequest)

      // Mock no bypass decorator
      mockReflector.get.mockReturnValue(undefined)

      // Mock not banned
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock decorator config that bypasses for SUPER_ADMIN
      mockReflector.get.mockReturnValueOnce({
        windowSizeMs: 60000,
        maxRequests: 100,
        bypassForRoles: [GlobalUserRole.SUPER_ADMIN],
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockRateLimitService.checkCombinedRateLimit).not.toHaveBeenCalled()
    })

    it('should handle X-Forwarded-For header correctly', async () => {
      const mockRequest = createMockRequest({
        headers: {
          'x-forwarded-for': '203.0.113.1, 192.168.1.1',
          'user-agent': 'test-agent',
        },
      })
      const context = createMockExecutionContext(mockRequest)

      // Mock no bypass
      mockReflector.get.mockReturnValue(undefined)

      // Mock not banned
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock rate limit check passes
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: true,
          remainingRequests: 99,
          resetTime: Date.now() + 60000,
          totalRequests: 1,
          windowStartTime: Date.now() - 60000,
        },
      })

      await guard.canActivate(context)

      // Check that the first IP from X-Forwarded-For was used
      const rateLimitCall = mockRateLimitService.checkCombinedRateLimit.mock.calls[0]
      const userContext = rateLimitCall[3] // Fourth argument is userContext
      expect(userContext.ip).toBe('203.0.113.1')
    })

    it('should handle unauthenticated users', async () => {
      const mockRequest = createMockRequest({ user: undefined })
      const mockResponse = createMockResponse()
      const context = createMockExecutionContext(mockRequest, mockResponse)

      // Mock no bypass
      mockReflector.get.mockReturnValue(undefined)

      // Mock not banned
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock rate limit check passes
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: true,
          remainingRequests: 99,
          resetTime: Date.now() + 60000,
          totalRequests: 1,
          windowStartTime: Date.now() - 60000,
        },
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)

      // Verify user context shows unauthenticated
      const rateLimitCall = mockRateLimitService.checkCombinedRateLimit.mock.calls[0]
      const userContext = rateLimitCall[3]
      expect(userContext.isAuthenticated).toBe(false)
      expect(userContext.userId).toBeUndefined()
    })
  })

  describe('Rate limit configuration', () => {
    it('should use decorator configuration when present', async () => {
      const mockRequest = createMockRequest()
      const context = createMockExecutionContext(mockRequest)

      const decoratorConfig = {
        windowSizeMs: 30000,
        maxRequests: 50,
        ipMaxRequests: 25,
        customMessage: 'Custom rate limit message',
      }

      // Mock decorator configuration
      mockReflector.get.mockReturnValueOnce(decoratorConfig)
      mockReflector.get.mockReturnValueOnce(undefined) // No bypass

      // Mock not banned
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock rate limit check
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: true,
          remainingRequests: 49,
          resetTime: Date.now() + 30000,
          totalRequests: 1,
          windowStartTime: Date.now() - 30000,
        },
      })

      await guard.canActivate(context)

      // Verify the decorator config was used
      const rateLimitCall = mockRateLimitService.checkCombinedRateLimit.mock.calls[0]
      const ipConfig = rateLimitCall[1]
      const userConfig = rateLimitCall[2]

      expect(ipConfig.maxRequests).toBe(25) // ipMaxRequests from decorator
      expect(userConfig.maxRequests).toBe(50) // maxRequests from decorator
      expect(ipConfig.windowSizeMs).toBe(30000)
      expect(userConfig.windowSizeMs).toBe(30000)
    })

    it('should use endpoint-specific configuration', async () => {
      const mockRequest = createMockRequest({ path: '/auth/login' })
      const context = createMockExecutionContext(mockRequest)

      // Mock no decorator config
      mockReflector.get.mockReturnValue(undefined)

      // Mock not banned
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock rate limit check
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: true,
          remainingRequests: 4,
          resetTime: Date.now() + 900000,
          totalRequests: 1,
          windowStartTime: Date.now() - 900000,
        },
      })

      await guard.canActivate(context)

      // Auth endpoints should have strict limits
      const rateLimitCall = mockRateLimitService.checkCombinedRateLimit.mock.calls[0]
      const userConfig = rateLimitCall[2]

      // Should use strict auth limits (5 requests per 15 minutes in config)
      expect(userConfig.maxRequests).toBe(5)
      expect(userConfig.windowSizeMs).toBe(15 * 60 * 1000)
    })
  })

  describe('Progressive penalties', () => {
    it('should check and apply progressive penalties', async () => {
      const mockRequest = createMockRequest()
      const mockResponse = createMockResponse()
      const context = createMockExecutionContext(mockRequest, mockResponse)

      // Mock rate limit exceeded with progressive penalties enabled
      mockReflector.get.mockReturnValueOnce({
        windowSizeMs: 60000,
        maxRequests: 10,
        progressivePenalties: true,
      })
      mockReflector.get.mockReturnValueOnce(undefined) // No bypass

      // Mock not banned initially
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      // Mock rate limit exceeded
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: false,
          remainingRequests: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
          totalRequests: 10,
          windowStartTime: Date.now() - 60000,
        },
      })

      // Mock violation stats that trigger penalty
      mockRateLimitService.getRateLimitStats.mockResolvedValueOnce({
        violations: 15,
      })

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException)

      // Should have imposed a ban due to high violations
      expect(mockRateLimitService.imposeBan).toHaveBeenCalled()
    })
  })

  describe('Headers and responses', () => {
    it('should add correct rate limit headers', async () => {
      const mockRequest = createMockRequest()
      const mockResponse = createMockResponse()
      const context = createMockExecutionContext(mockRequest, mockResponse)

      // Mock successful rate limit check
      mockReflector.get.mockReturnValue(undefined)
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      const rateLimitResult = {
        combined: {
          isAllowed: true,
          remainingRequests: 95,
          resetTime: Date.now() + 60000,
          totalRequests: 5,
          windowStartTime: Date.now() - 60000,
        },
      }
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce(rateLimitResult)

      await guard.canActivate(context)

      // Check headers were set correctly
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 95)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number))
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Window', expect.any(Number))
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Policy',
        'advanced-sliding-window'
      )
    })

    it('should set retry-after header when rate limited', async () => {
      const mockRequest = createMockRequest()
      const mockResponse = createMockResponse()
      const context = createMockExecutionContext(mockRequest, mockResponse)

      mockReflector.get.mockReturnValue(undefined)
      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })

      const rateLimitResult = {
        combined: {
          isAllowed: false,
          remainingRequests: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
          totalRequests: 100,
          windowStartTime: Date.now() - 60000,
        },
      }
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce(rateLimitResult)
      mockRateLimitService.getRateLimitStats.mockResolvedValueOnce({ violations: 1 })

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException)

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 60)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Status', 'exceeded')
    })
  })

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      const context = createMockExecutionContext()

      mockReflector.get.mockReturnValue(undefined)
      mockRateLimitService.checkBanStatus.mockRejectedValueOnce(new Error('Redis error'))

      // Should still continue and not throw
      const result = await guard.canActivate(context)
      expect(result).toBe(true)
    })

    it('should throw appropriate exception with custom message', async () => {
      const mockRequest = createMockRequest()
      const context = createMockExecutionContext(mockRequest)

      const customMessage = 'Custom rate limit exceeded message'
      mockReflector.get.mockReturnValueOnce({
        windowSizeMs: 60000,
        maxRequests: 10,
        customMessage,
      })
      mockReflector.get.mockReturnValueOnce(undefined)

      mockRateLimitService.checkBanStatus.mockResolvedValueOnce({ isBanned: false })
      mockRateLimitService.checkCombinedRateLimit.mockResolvedValueOnce({
        combined: {
          isAllowed: false,
          remainingRequests: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
        },
      })
      mockRateLimitService.getRateLimitStats.mockResolvedValueOnce({ violations: 1 })

      await expect(guard.canActivate(context)).rejects.toThrow(
        expect.objectContaining({
          message: expect.objectContaining({
            message: customMessage,
          }),
        })
      )
    })
  })
})
