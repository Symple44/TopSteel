/**
 * Advanced Rate Limiting Service
 * Implements granular per-user rate limiting with Redis backend
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import {
  GlobalUserRole,
  type SocieteRoleType,
} from '../../../domains/auth/core/constants/roles.constants'
import type { CombinedRateLimitResult } from './types/rate-limiting.types'

export interface RateLimitConfig {
  windowSizeMs: number
  maxRequests: number
  keyPrefix?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  isAllowed: boolean
  remainingRequests: number
  resetTime: number
  retryAfter?: number
  totalRequests: number
  windowStartTime: number
}

export interface UserContext {
  userId?: string
  globalRole?: GlobalUserRole
  societeRole?: SocieteRoleType
  ip: string
  isAuthenticated: boolean
}

export interface ViolationRecord {
  timestamp: number
  endpoint: string
  violations: number
  penaltyLevel: number
}

@Injectable()
export class AdvancedRateLimitingService {
  private readonly logger = new Logger(AdvancedRateLimitingService.name)

  // Role-based multipliers for rate limits
  private readonly roleMultipliers: Record<GlobalUserRole, number> = {
    [GlobalUserRole.SUPER_ADMIN]: 10,
    [GlobalUserRole.ADMIN]: 5,
    [GlobalUserRole.MANAGER]: 3,
    [GlobalUserRole.COMMERCIAL]: 2,
    [GlobalUserRole.COMPTABLE]: 2,
    [GlobalUserRole.TECHNICIEN]: 2,
    [GlobalUserRole.OPERATEUR]: 1.5,
    [GlobalUserRole.USER]: 1,
    [GlobalUserRole.VIEWER]: 0.5,
  }

  // Progressive penalty levels
  private readonly penaltyLevels = [
    { violations: 1, multiplier: 1 }, // First offense
    { violations: 3, multiplier: 2 }, // 2x penalty after 3 violations
    { violations: 5, multiplier: 4 }, // 4x penalty after 5 violations
    { violations: 10, multiplier: 8 }, // 8x penalty after 10 violations
    { violations: 20, multiplier: 16 }, // 16x penalty after 20 violations
  ]

  constructor(
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
    private readonly configService?: ConfigService
  ) {}

  /**
   * Check if request is within rate limits using sliding window algorithm
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
    userContext?: UserContext
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      this.logger.warn('Redis not available, allowing request')
      return this.allowRequest(config)
    }

    const now = Date.now()
    const windowStart = now - config.windowSizeMs
    const key = this.generateKey(config.keyPrefix || 'rate_limit', identifier)

    // Apply role-based adjustments
    const adjustedConfig = this.adjustConfigForUser(config, userContext)

    // Check for progressive penalties
    const penaltyMultiplier = await this.calculatePenaltyMultiplier(identifier, userContext)
    const effectiveLimit = Math.floor(adjustedConfig.maxRequests / penaltyMultiplier)

    try {
      // Use Lua script for atomic sliding window operations
      const luaScript = `
        local key = KEYS[1]
        local penalty_key = KEYS[2]
        local now = tonumber(ARGV[1])
        local windowStart = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local windowSizeMs = tonumber(ARGV[4])
        
        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
        
        -- Count current requests
        local currentCount = redis.call('ZCARD', key)
        
        -- Check if within limit
        if currentCount < limit then
          -- Add current request
          redis.call('ZADD', key, now, now .. ':' .. math.random())
          redis.call('EXPIRE', key, math.ceil(windowSizeMs / 1000))
          return {1, limit - currentCount - 1, now + windowSizeMs - (now % windowSizeMs), currentCount + 1, windowStart}
        else
          -- Rate limited
          local oldestRequest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')[2]
          local resetTime = (oldestRequest or now) + windowSizeMs
          return {0, 0, resetTime, currentCount, windowStart}
        end
      `

      const penaltyKey = this.generateKey('violations', identifier)
      const result = (await this.redis.eval(
        luaScript,
        2,
        key,
        penaltyKey,
        now.toString(),
        windowStart.toString(),
        effectiveLimit.toString(),
        config.windowSizeMs.toString()
      )) as number[]

      const [allowed, remaining, resetTime, totalRequests, windowStartTime] = result

      if (!allowed) {
        // Record violation
        await this.recordViolation(identifier, userContext)
      }

      return {
        isAllowed: !!allowed,
        remainingRequests: remaining,
        resetTime: resetTime,
        retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
        totalRequests: totalRequests,
        windowStartTime: windowStartTime,
      }
    } catch (error) {
      this.logger.error(
        `Rate limiting check failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      )
      // Fail open - allow request if Redis fails
      return this.allowRequest(adjustedConfig)
    }
  }

  /**
   * Check rate limit with both IP and user-based tracking
   */
  async checkCombinedRateLimit(
    endpoint: string,
    ipConfig: RateLimitConfig,
    userConfig: RateLimitConfig,
    userContext: UserContext
  ): Promise<CombinedRateLimitResult> {
    const ipResult = await this.checkRateLimit(
      `ip:${userContext.ip}:${endpoint}`,
      ipConfig,
      userContext
    )

    let userResult: RateLimitResult | undefined
    if (userContext.isAuthenticated && userContext.userId) {
      userResult = await this.checkRateLimit(
        `user:${userContext.userId}:${endpoint}`,
        userConfig,
        userContext
      )
    }

    // Combined result - both must allow
    let limitingFactor: 'ip' | 'user' | 'both'
    if (!ipResult.isAllowed && !userResult?.isAllowed) {
      limitingFactor = 'both'
    } else if (!ipResult.isAllowed) {
      limitingFactor = 'ip'
    } else if (!userResult?.isAllowed) {
      limitingFactor = 'user'
    } else {
      limitingFactor = 'both' // Default when both are allowed
    }

    const combined = {
      isAllowed: ipResult.isAllowed && (userResult?.isAllowed ?? true),
      remainingRequests: Math.min(
        ipResult.remainingRequests,
        userResult?.remainingRequests ?? Number.MAX_SAFE_INTEGER
      ),
      resetTime: Math.max(ipResult.resetTime, userResult?.resetTime ?? 0),
      retryAfter: Math.max(ipResult.retryAfter ?? 0, userResult?.retryAfter ?? 0) || undefined,
      totalRequests: Math.max(ipResult.totalRequests, userResult?.totalRequests ?? 0),
      windowStartTime: Math.min(
        ipResult.windowStartTime,
        userResult?.windowStartTime ?? Date.now()
      ),
      limitingFactor,
    }

    return { ip: ipResult, user: userResult, combined }
  }

  /**
   * Record a rate limit violation for progressive penalties
   */
  private async recordViolation(identifier: string, userContext?: UserContext): Promise<void> {
    if (!this.redis) return

    const violationKey = this.generateKey('violations', identifier)
    const now = Date.now()
    const hourAgo = now - 60 * 60 * 1000 // 1 hour window for violations

    try {
      // Clean old violations and add new one
      await this.redis.zremrangebyscore(violationKey, 0, hourAgo)
      await this.redis.zadd(violationKey, now, now)
      await this.redis.expire(violationKey, 24 * 60 * 60) // 24 hour expiry

      // Log violation for monitoring
      const violationCount = await this.redis.zcard(violationKey)
      this.logger.warn(`Rate limit violation recorded`, {
        identifier,
        violationCount,
        userContext: userContext
          ? {
              userId: userContext.userId,
              role: userContext.globalRole,
              ip: userContext.ip,
            }
          : undefined,
      })

      // Alert on suspicious activity
      if (violationCount >= 10) {
        this.logger.error(`Suspicious rate limit activity detected`, {
          identifier,
          violationCount,
          userContext,
        })

        // Could integrate with notification system here
        await this.notifySuspiciousActivity(identifier, violationCount, userContext)
      }
    } catch (error) {
      this.logger.error(
        `Failed to record violation: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Calculate penalty multiplier based on violation history
   */
  private async calculatePenaltyMultiplier(
    identifier: string,
    _userContext?: UserContext
  ): Promise<number> {
    if (!this.redis) return 1

    try {
      const violationKey = this.generateKey('violations', identifier)
      const hourAgo = Date.now() - 60 * 60 * 1000

      // Clean old violations and count recent ones
      await this.redis.zremrangebyscore(violationKey, 0, hourAgo)
      const violationCount = await this.redis.zcard(violationKey)

      // Find appropriate penalty level
      let multiplier = 1
      for (const level of this.penaltyLevels) {
        if (violationCount >= level.violations) {
          multiplier = level.multiplier
        }
      }

      return multiplier
    } catch (error) {
      this.logger.error(
        `Failed to calculate penalty: ${error instanceof Error ? error.message : String(error)}`
      )
      return 1
    }
  }

  /**
   * Adjust rate limit config based on user role
   */
  private adjustConfigForUser(config: RateLimitConfig, userContext?: UserContext): RateLimitConfig {
    if (!userContext?.globalRole) {
      return config
    }

    const multiplier = this.roleMultipliers[userContext.globalRole] || 1

    return {
      ...config,
      maxRequests: Math.ceil(config.maxRequests * multiplier),
    }
  }

  /**
   * Generate Redis key with proper namespacing
   */
  private generateKey(prefix: string, identifier: string): string {
    const namespace = this.configService?.get('app.name') || 'topsteel'
    return `${namespace}:rate_limit:${prefix}:${identifier}`
  }

  /**
   * Allow request with default values
   */
  private allowRequest(config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    return {
      isAllowed: true,
      remainingRequests: config.maxRequests - 1,
      resetTime: now + config.windowSizeMs,
      totalRequests: 1,
      windowStartTime: now - config.windowSizeMs,
    }
  }

  /**
   * Check if user/IP is temporarily or permanently banned
   */
  async checkBanStatus(
    identifier: string
  ): Promise<{ isBanned: boolean; banExpiry?: number; reason?: string }> {
    if (!this.redis) return { isBanned: false }

    try {
      const banKey = this.generateKey('bans', identifier)
      const banData = await this.redis.hgetall(banKey)

      if (!banData.expiry) {
        return { isBanned: false }
      }

      const expiry = Number.parseInt(banData.expiry, 10)
      const now = Date.now()

      if (expiry > now) {
        return {
          isBanned: true,
          banExpiry: expiry,
          reason: banData.reason || 'Rate limit violations',
        }
      }

      // Clean expired ban
      await this.redis.del(banKey)
      return { isBanned: false }
    } catch (error) {
      this.logger.error(
        `Failed to check ban status: ${error instanceof Error ? error.message : String(error)}`
      )
      return { isBanned: false }
    }
  }

  /**
   * Impose temporary ban
   */
  async imposeBan(
    identifier: string,
    durationMs: number,
    reason: string = 'Repeated rate limit violations'
  ): Promise<void> {
    if (!this.redis) return

    try {
      const banKey = this.generateKey('bans', identifier)
      const expiry = Date.now() + durationMs

      await this.redis.hmset(banKey, {
        expiry: expiry.toString(),
        reason,
        imposedAt: Date.now().toString(),
      })

      await this.redis.expire(banKey, Math.ceil(durationMs / 1000))

      this.logger.warn(`Temporary ban imposed`, {
        identifier,
        durationMs,
        reason,
        expiry: new Date(expiry).toISOString(),
      })
    } catch (error) {
      this.logger.error(
        `Failed to impose ban: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Get rate limit statistics for monitoring
   */
  async getRateLimitStats(identifier: string, timeWindow = 24 * 60 * 60 * 1000): Promise<unknown> {
    if (!this.redis) return null

    try {
      const now = Date.now()
      const windowStart = now - timeWindow

      // Get violation stats
      const violationKey = this.generateKey('violations', identifier)
      const violations = await this.redis.zrangebyscore(violationKey, windowStart, now)

      // Get current rate limit keys for this identifier
      const pattern = this.generateKey('*', identifier)
      const keys = await this.redis.keys(pattern)

      const stats = {
        identifier,
        timeWindow,
        violations: violations.length,
        activeRateLimits: keys.length,
        violationTimestamps: violations.map((v) => Number.parseInt(v, 10)),
      }

      return stats
    } catch (error) {
      this.logger.error(
        `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`
      )
      return null
    }
  }

  /**
   * Clear all rate limiting data for an identifier (admin function)
   */
  async clearRateLimitData(identifier: string): Promise<void> {
    if (!this.redis) return

    try {
      const pattern = this.generateKey('*', `*${identifier}*`)
      const keys = await this.redis.keys(pattern)

      if (keys.length > 0) {
        await this.redis.del(...keys)
        this.logger.log(`Cleared rate limit data for ${identifier}: ${keys.length} keys removed`)
      }
    } catch (error) {
      this.logger.error(
        `Failed to clear rate limit data: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Notify about suspicious activity (integrate with your notification system)
   */
  private async notifySuspiciousActivity(
    identifier: string,
    violationCount: number,
    userContext?: UserContext
  ): Promise<void> {
    // This could integrate with your existing notification system
    // For now, just log the event
    this.logger.error('SECURITY ALERT: Suspicious rate limiting activity', {
      identifier,
      violationCount,
      userContext,
      timestamp: new Date().toISOString(),
    })

    // Could send to Sentry, email alerts, Slack, etc.
    // await this.notificationService.sendSecurityAlert(...)
  }
}
