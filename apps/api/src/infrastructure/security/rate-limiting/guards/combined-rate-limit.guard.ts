/**
 * Combined Rate Limiting Guard
 * Applies both IP-based and user-based rate limiting simultaneously
 */

import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { Reflector } from '@nestjs/core'
import type { Request, Response } from 'express'
import type { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'
import type { AdvancedRateLimitingService } from '../advanced-rate-limiting.service'
import {
  RATE_LIMIT_BYPASS_KEY,
  RATE_LIMIT_KEY,
  type RateLimitDecoratorConfig,
} from '../decorators/rate-limit.decorators'
import type { RateLimitingConfiguration } from '../rate-limiting.config'
import type {
  CombinedRateLimitResult,
  RateLimitConfig,
  RateLimitResult,
  UserContext,
} from '../types/rate-limiting.types'

interface RequestWithUser extends Request {
  user?: {
    id: string
    globalRole?: GlobalUserRole
    societeRole?: string
  }
}

// CombinedRateLimitResult is now imported from types

@Injectable()
export class CombinedRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(CombinedRateLimitGuard.name)
  private readonly config: RateLimitingConfiguration

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: AdvancedRateLimitingService,
    private readonly configService: ConfigService
  ) {
    this.config = this.configService.get('rateLimiting') as RateLimitingConfiguration
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const response = context.switchToHttp().getResponse<Response>()

    // Check for bypass
    const bypassConfig = this.reflector.get(RATE_LIMIT_BYPASS_KEY, context.getHandler())
    if (bypassConfig?.bypass) {
      return true
    }

    const userContext = this.extractUserContext(request)
    const endpoint = this.getEndpointIdentifier(request)

    // Get rate limiting configuration
    const rateLimitConfig = this.getRateLimitConfig(context, userContext)

    if (!rateLimitConfig) {
      return true
    }

    // Apply combined rate limiting
    const result = await this.applyCombinedRateLimit(endpoint, rateLimitConfig, userContext)

    // Add comprehensive headers
    this.addCombinedRateLimitHeaders(response, result)

    if (!result.combined.isAllowed) {
      this.logRateLimitViolation(request, userContext, result)

      const message = this.generateRateLimitMessage(result, rateLimitConfig)

      throw new HttpException(
        {
          message,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter: result.combined.retryAfter,
          limitingFactor: result.combined.limitingFactor,
          limits: {
            ip: result.ip,
            user: result.user,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    return true
  }

  /**
   * Extract user context from request
   */
  private extractUserContext(request: RequestWithUser): UserContext {
    const user = request.user
    const ip = this.getClientIP(request)

    return {
      userId: user?.id,
      globalRole: user?.globalRole,
      ip,
      isAuthenticated: !!user,
    }
  }

  /**
   * Get client IP address with proxy support
   */
  private getClientIP(request: Request): string {
    // Try multiple headers for proxy scenarios
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip', // Cloudflare
      'x-client-ip',
      'x-cluster-client-ip',
    ]

    for (const header of headers) {
      const value = request.headers[header]
      if (value && typeof value === 'string') {
        // Take first IP in case of comma-separated list
        const ip = value.split(',')[0].trim()
        if (ip && this.isValidIP(ip)) {
          return ip
        }
      }
    }

    return request.connection?.remoteAddress || request.ip || 'unknown'
  }

  /**
   * Basic IP validation
   */
  private isValidIP(ip: string): boolean {
    // Basic IPv4 and IPv6 validation
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  /**
   * Get normalized endpoint identifier
   */
  private getEndpointIdentifier(request: Request): string {
    let path = request.path

    // Normalize common patterns
    path = path.replace(/\/\d+/g, '/:id') // Replace numeric IDs
    path = path.replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
    path = path.replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token') // Replace long tokens

    return `${request.method}:${path}`
  }

  /**
   * Get rate limit configuration for this request
   */
  private getRateLimitConfig(
    context: ExecutionContext,
    userContext: UserContext
  ): RateLimitDecoratorConfig | null {
    // Check for decorator configuration first
    const decoratorConfig = this.reflector.get<RateLimitDecoratorConfig>(
      RATE_LIMIT_KEY,
      context.getHandler()
    )
    if (decoratorConfig) {
      return decoratorConfig
    }

    // Use default configuration adjusted for user role
    const baseConfig = {
      windowSizeMs: this.config.defaultWindow,
      maxRequests: this.config.defaultLimit,
      ipMaxRequests: Math.floor(this.config.defaultLimit * 0.8), // IP gets 80% of user limit
    }

    // Apply role-based adjustments
    if (userContext.globalRole && this.config.roleConfigs[userContext.globalRole]) {
      const roleConfig = this.config.roleConfigs[userContext.globalRole]
      baseConfig.maxRequests = Math.ceil(baseConfig.maxRequests * roleConfig.multiplier)
      baseConfig.ipMaxRequests = Math.ceil(baseConfig.ipMaxRequests * roleConfig.multiplier)
    }

    return baseConfig
  }

  /**
   * Apply combined IP and user rate limiting
   */
  private async applyCombinedRateLimit(
    endpoint: string,
    config: RateLimitDecoratorConfig,
    userContext: UserContext
  ): Promise<CombinedRateLimitResult> {
    // Configure IP-based limits
    const ipConfig: RateLimitConfig = {
      windowSizeMs: config.windowSizeMs,
      maxRequests: config.ipMaxRequests || Math.floor(config.maxRequests * 0.8),
      keyPrefix: 'ip_rate_limit',
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
    }

    // Configure user-based limits (only if authenticated)
    const userConfig: RateLimitConfig = {
      windowSizeMs: config.windowSizeMs,
      maxRequests: config.maxRequests,
      keyPrefix: 'user_rate_limit',
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
    }

    // Check IP-based rate limit
    const ipResult: RateLimitResult = await this.rateLimitService.checkRateLimit(
      `ip:${userContext.ip}:${endpoint}`,
      ipConfig,
      userContext
    )

    let userResult: RateLimitResult | undefined

    // Check user-based rate limit if authenticated
    if (userContext.isAuthenticated && userContext.userId) {
      userResult = await this.rateLimitService.checkRateLimit(
        `user:${userContext.userId}:${endpoint}`,
        userConfig,
        userContext
      )
    }

    // Determine combined result
    const combined = this.combineLimitResults(ipResult, userResult)

    return {
      ip: ipResult,
      user: userResult,
      combined,
    }
  }

  /**
   * Combine IP and user limit results
   */
  private combineLimitResults(
    ipResult: RateLimitResult,
    userResult?: RateLimitResult
  ): RateLimitResult & { limitingFactor: 'ip' | 'user' | 'both' } {
    let isAllowed = ipResult.isAllowed
    let limitingFactor: 'ip' | 'user' | 'both' = 'ip'

    if (userResult) {
      if (ipResult.isAllowed && !userResult.isAllowed) {
        isAllowed = false
        limitingFactor = 'user'
      } else if (!ipResult.isAllowed && !userResult.isAllowed) {
        isAllowed = false
        limitingFactor = 'both'
      } else if (ipResult.isAllowed && userResult.isAllowed) {
        isAllowed = true
        limitingFactor = 'ip' // Default to IP when both allow
      }
    }

    return {
      isAllowed,
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
  }

  /**
   * Add comprehensive rate limit headers
   */
  private addCombinedRateLimitHeaders(response: Response, result: CombinedRateLimitResult): void {
    // Combined headers
    response.setHeader('X-RateLimit-Policy', 'combined-ip-user')
    response.setHeader('X-RateLimit-Limiting-Factor', result.combined.limitingFactor)
    response.setHeader(
      'X-RateLimit-Combined-Limit',
      result.combined.remainingRequests + (result.ip.remainingRequests || 0)
    )
    response.setHeader(
      'X-RateLimit-Combined-Remaining',
      Math.max(0, result.combined.remainingRequests)
    )
    response.setHeader('X-RateLimit-Combined-Reset', Math.ceil(result.combined.resetTime / 1000))

    // IP-specific headers
    response.setHeader('X-IP-RateLimit-Remaining', Math.max(0, result.ip.remainingRequests))
    response.setHeader('X-IP-RateLimit-Reset', Math.ceil(result.ip.resetTime / 1000))

    // User-specific headers (if applicable)
    if (result.user) {
      response.setHeader('X-User-RateLimit-Remaining', Math.max(0, result.user.remainingRequests))
      response.setHeader('X-User-RateLimit-Reset', Math.ceil(result.user.resetTime / 1000))
    }

    // Retry-After header
    if (result.combined.retryAfter) {
      response.setHeader('Retry-After', result.combined.retryAfter)
    }

    // Status indicator
    response.setHeader('X-RateLimit-Status', result.combined.isAllowed ? 'allowed' : 'exceeded')
  }

  /**
   * Log rate limit violation with context
   */
  private logRateLimitViolation(
    request: Request,
    userContext: UserContext,
    result: CombinedRateLimitResult
  ): void {
    this.logger.warn('Combined rate limit exceeded', {
      method: request.method,
      path: request.path,
      ip: userContext.ip,
      userId: userContext.userId,
      role: userContext.globalRole,
      limitingFactor: result.combined.limitingFactor,
      ipRemaining: result.ip.remainingRequests,
      userRemaining: result.user?.remainingRequests,
      combinedRemaining: result.combined.remainingRequests,
      resetTime: new Date(result.combined.resetTime).toISOString(),
      userAgent: request.headers['user-agent'],
    })
  }

  /**
   * Generate appropriate rate limit message
   */
  private generateRateLimitMessage(
    result: CombinedRateLimitResult,
    config: RateLimitDecoratorConfig
  ): string {
    if (config.customMessage) {
      return config.customMessage
    }

    switch (result.combined.limitingFactor) {
      case 'ip':
        return 'IP-based rate limit exceeded. Too many requests from your network.'
      case 'user':
        return 'User rate limit exceeded. Please reduce your request frequency.'
      case 'both':
        return 'Multiple rate limits exceeded. Please wait before making more requests.'
      default:
        return 'Rate limit exceeded. Please try again later.'
    }
  }
}
