/**
 * Advanced Rate Limiting Service Tests
 * Comprehensive tests for the rate limiting service functionality
 */

import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'
import { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'
import { AdvancedRateLimitingService, type UserContext } from '../advanced-rate-limiting.service'
import { rateLimitingConfig } from '../rate-limiting.config'

// Mock Redis client
const mockRedis = {
  eval: vi.fn(),
  zremrangebyscore: vi.fn(),
  zadd: vi.fn(),
  expire: vi.fn(),
  hgetall: vi.fn(),
  hmset: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  zcard: vi.fn(),
}

describe('AdvancedRateLimitingService', () => {
  let service: AdvancedRateLimitingService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancedRateLimitingService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue(rateLimitingConfig()),
          },
        },
      ],
    }).compile()

    service = module.get<AdvancedRateLimitingService>(AdvancedRateLimitingService)
    configService = module.get<ConfigService>(ConfigService)

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    const mockConfig = {
      windowSizeMs: 60000,
      maxRequests: 100,
      keyPrefix: 'test',
    }

    const mockUserContext: UserContext = {
      userId: 'user123',
      globalRole: GlobalUserRole.USER,
      ip: '192.168.1.1',
      isAuthenticated: true,
    }

    it('should allow request when within limits', async () => {
      // Mock Redis response for allowed request
      mockRedis.eval.mockResolvedValueOnce([1, 99, 1640000000000, 1, 1639940000000])

      const result = await service.checkRateLimit('test-identifier', mockConfig, mockUserContext)

      expect(result.isAllowed).toBe(true)
      expect(result.remainingRequests).toBe(99)
      expect(result.totalRequests).toBe(1)
      expect(mockRedis.eval).toHaveBeenCalledTimes(1)
    })

    it('should block request when limits exceeded', async () => {
      // Mock Redis response for blocked request
      mockRedis.eval.mockResolvedValueOnce([0, 0, 1640000060000, 100, 1639940000000])

      const result = await service.checkRateLimit('test-identifier', mockConfig, mockUserContext)

      expect(result.isAllowed).toBe(false)
      expect(result.remainingRequests).toBe(0)
      expect(result.totalRequests).toBe(100)
      expect(result.retryAfter).toBeDefined()
    })

    it('should apply role-based multipliers', async () => {
      // Admin user should get higher limits
      const adminUserContext: UserContext = {
        ...mockUserContext,
        globalRole: GlobalUserRole.ADMIN,
      }

      mockRedis.eval.mockResolvedValueOnce([1, 499, 1640000000000, 1, 1639940000000])

      await service.checkRateLimit('admin-identifier', mockConfig, adminUserContext)

      // Verify that the service was called with adjusted limits for admin role
      const _luaScript = mockRedis.eval.mock.calls[0][0]
      const args = mockRedis.eval.mock.calls[0].slice(2) // Skip script and key count

      // Admin should get 5x multiplier, so 100 * 5 = 500 requests
      expect(args[2]).toBe('500') // limit argument
    })

    it('should handle Redis failures gracefully', async () => {
      mockRedis.eval.mockRejectedValueOnce(new Error('Redis connection failed'))

      const result = await service.checkRateLimit('test-identifier', mockConfig, mockUserContext)

      // Should fail open (allow request) when Redis fails
      expect(result.isAllowed).toBe(true)
    })
  })

  describe('checkCombinedRateLimit', () => {
    const mockIpConfig = {
      windowSizeMs: 60000,
      maxRequests: 50,
    }

    const mockUserConfig = {
      windowSizeMs: 60000,
      maxRequests: 100,
    }

    const mockUserContext: UserContext = {
      userId: 'user123',
      globalRole: GlobalUserRole.USER,
      ip: '192.168.1.1',
      isAuthenticated: true,
    }

    it('should allow when both IP and user limits are within bounds', async () => {
      // Mock IP limit check (allowed)
      mockRedis.eval.mockResolvedValueOnce([1, 49, 1640000000000, 1, 1639940000000])
      // Mock user limit check (allowed)
      mockRedis.eval.mockResolvedValueOnce([1, 99, 1640000000000, 1, 1639940000000])

      const result = await service.checkCombinedRateLimit(
        'test-endpoint',
        mockIpConfig,
        mockUserConfig,
        mockUserContext
      )

      expect(result.combined.isAllowed).toBe(true)
      expect(result.ip.isAllowed).toBe(true)
      expect(result.user?.isAllowed).toBe(true)
    })

    it('should block when IP limit is exceeded', async () => {
      // Mock IP limit check (blocked)
      mockRedis.eval.mockResolvedValueOnce([0, 0, 1640000060000, 50, 1639940000000])
      // Mock user limit check (allowed)
      mockRedis.eval.mockResolvedValueOnce([1, 99, 1640000000000, 1, 1639940000000])

      const result = await service.checkCombinedRateLimit(
        'test-endpoint',
        mockIpConfig,
        mockUserConfig,
        mockUserContext
      )

      expect(result.combined.isAllowed).toBe(false)
      expect(result.ip.isAllowed).toBe(false)
      expect(result.user?.isAllowed).toBe(true)
    })

    it('should block when user limit is exceeded', async () => {
      // Mock IP limit check (allowed)
      mockRedis.eval.mockResolvedValueOnce([1, 49, 1640000000000, 1, 1639940000000])
      // Mock user limit check (blocked)
      mockRedis.eval.mockResolvedValueOnce([0, 0, 1640000060000, 100, 1639940000000])

      const result = await service.checkCombinedRateLimit(
        'test-endpoint',
        mockIpConfig,
        mockUserConfig,
        mockUserContext
      )

      expect(result.combined.isAllowed).toBe(false)
      expect(result.ip.isAllowed).toBe(true)
      expect(result.user?.isAllowed).toBe(false)
    })
  })

  describe('checkBanStatus', () => {
    it('should return not banned when no ban exists', async () => {
      mockRedis.hgetall.mockResolvedValueOnce({})

      const result = await service.checkBanStatus('test-identifier')

      expect(result.isBanned).toBe(false)
    })

    it('should return banned when active ban exists', async () => {
      const futureExpiry = Date.now() + 60000
      mockRedis.hgetall.mockResolvedValueOnce({
        expiry: futureExpiry.toString(),
        reason: 'Rate limit violations',
      })

      const result = await service.checkBanStatus('test-identifier')

      expect(result.isBanned).toBe(true)
      expect(result.banExpiry).toBe(futureExpiry)
      expect(result.reason).toBe('Rate limit violations')
    })

    it('should clean expired bans and return not banned', async () => {
      const pastExpiry = Date.now() - 60000
      mockRedis.hgetall.mockResolvedValueOnce({
        expiry: pastExpiry.toString(),
        reason: 'Rate limit violations',
      })

      const result = await service.checkBanStatus('test-identifier')

      expect(result.isBanned).toBe(false)
      expect(mockRedis.del).toHaveBeenCalled()
    })
  })

  describe('imposeBan', () => {
    it('should impose ban correctly', async () => {
      const identifier = 'test-user'
      const durationMs = 300000 // 5 minutes
      const reason = 'Test ban'

      await service.imposeBan(identifier, durationMs, reason)

      expect(mockRedis.hmset).toHaveBeenCalledWith(
        expect.stringContaining('bans:test-user'),
        expect.objectContaining({
          reason,
          imposedAt: expect.any(String),
        })
      )
      expect(mockRedis.expire).toHaveBeenCalled()
    })
  })

  describe('getRateLimitStats', () => {
    it('should return stats for identifier', async () => {
      const mockViolations = ['1640000000000', '1640001000000']
      mockRedis.zrangebyscore.mockResolvedValueOnce(mockViolations)
      mockRedis.keys.mockResolvedValueOnce(['key1', 'key2', 'key3'])

      const result = await service.getRateLimitStats('test-identifier')

      expect(result).toEqual({
        identifier: 'test-identifier',
        timeWindow: expect.any(Number),
        violations: 2,
        activeRateLimits: 3,
        violationTimestamps: [1640000000000, 1640001000000],
      })
    })

    it('should handle Redis errors gracefully', async () => {
      mockRedis.zrangebyscore.mockRejectedValueOnce(new Error('Redis error'))

      const result = await service.getRateLimitStats('test-identifier')

      expect(result).toBeNull()
    })
  })

  describe('clearRateLimitData', () => {
    it('should clear all rate limit data for identifier', async () => {
      mockRedis.keys.mockResolvedValueOnce(['key1', 'key2', 'key3'])

      await service.clearRateLimitData('test-identifier')

      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3')
    })

    it('should handle no keys found', async () => {
      mockRedis.keys.mockResolvedValueOnce([])

      await service.clearRateLimitData('test-identifier')

      expect(mockRedis.del).not.toHaveBeenCalled()
    })
  })

  describe('Role-based adjustments', () => {
    it('should apply correct multipliers for different roles', async () => {
      const baseConfig = {
        windowSizeMs: 60000,
        maxRequests: 100,
      }

      const testCases = [
        { role: GlobalUserRole.VIEWER, expectedMultiplier: 0.5 },
        { role: GlobalUserRole.USER, expectedMultiplier: 1 },
        { role: GlobalUserRole.ADMIN, expectedMultiplier: 5 },
        { role: GlobalUserRole.SUPER_ADMIN, expectedMultiplier: 10 },
      ]

      for (const testCase of testCases) {
        mockRedis.eval.mockResolvedValueOnce([1, 50, 1640000000000, 1, 1639940000000])

        const userContext: UserContext = {
          userId: 'test-user',
          globalRole: testCase.role,
          ip: '192.168.1.1',
          isAuthenticated: true,
        }

        await service.checkRateLimit('test-id', baseConfig, userContext)

        const lastCall = mockRedis.eval.mock.calls[mockRedis.eval.mock.calls.length - 1]
        const limit = Number.parseInt(lastCall[4], 10) // Fifth argument is the limit
        const expectedLimit = Math.ceil(baseConfig.maxRequests * testCase.expectedMultiplier)

        expect(limit).toBe(expectedLimit)
      }
    })
  })

  describe('Progressive penalties', () => {
    it('should calculate penalty multiplier correctly', async () => {
      // Mock violation history indicating multiple violations
      mockRedis.zremrangebyscore.mockResolvedValueOnce(null)
      mockRedis.zcard.mockResolvedValueOnce(15) // 15 violations

      // Mock the eval call to use penalty multiplier
      mockRedis.eval.mockResolvedValueOnce([1, 10, 1640000000000, 1, 1639940000000])

      const config = {
        windowSizeMs: 60000,
        maxRequests: 100,
      }

      const userContext: UserContext = {
        userId: 'repeat-offender',
        globalRole: GlobalUserRole.USER,
        ip: '192.168.1.1',
        isAuthenticated: true,
      }

      await service.checkRateLimit('repeat-offender', config, userContext)

      // With 15 violations, should get penalty multiplier of 2
      // So effective limit should be 100 / 2 = 50
      const lastCall = mockRedis.eval.mock.calls[mockRedis.eval.mock.calls.length - 1]
      const effectiveLimit = Number.parseInt(lastCall[4], 10)
      expect(effectiveLimit).toBe(50) // 100 / 2 (penalty multiplier)
    })
  })

  describe('Edge cases', () => {
    it('should handle missing Redis client', async () => {
      const serviceWithoutRedis = new AdvancedRateLimitingService(undefined, configService)

      const result = await serviceWithoutRedis.checkRateLimit('test', {
        windowSizeMs: 60000,
        maxRequests: 100,
      })

      expect(result.isAllowed).toBe(true)
    })

    it('should handle undefined user context', async () => {
      mockRedis.eval.mockResolvedValueOnce([1, 99, 1640000000000, 1, 1639940000000])

      const result = await service.checkRateLimit('test', { windowSizeMs: 60000, maxRequests: 100 })

      expect(result.isAllowed).toBe(true)
    })

    it('should handle very high request limits', async () => {
      const config = {
        windowSizeMs: 60000,
        maxRequests: Number.MAX_SAFE_INTEGER,
      }

      mockRedis.eval.mockResolvedValueOnce([
        1,
        Number.MAX_SAFE_INTEGER - 1,
        1640000000000,
        1,
        1639940000000,
      ])

      const result = await service.checkRateLimit('test', config)

      expect(result.isAllowed).toBe(true)
      expect(result.remainingRequests).toBe(Number.MAX_SAFE_INTEGER - 1)
    })
  })
})
