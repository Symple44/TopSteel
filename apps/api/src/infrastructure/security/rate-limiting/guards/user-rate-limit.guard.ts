/**
 * User-Specific Rate Limiting Guard
 * Focuses on per-user rate limiting with role-based adjustments
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
import type { Request, Response } from 'express'
import type { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'
import type {
  AdvancedRateLimitingService,
  RateLimitConfig,
  UserContext,
} from '../advanced-rate-limiting.service'
import type { RateLimitingConfiguration } from '../rate-limiting.config'

interface RequestWithUser extends Request {
  user?: {
    id: string
    globalRole?: GlobalUserRole
    societeRole?: string
  }
}

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(UserRateLimitGuard.name)
  private readonly config: RateLimitingConfiguration

  constructor(
    private readonly rateLimitService: AdvancedRateLimitingService,
    private readonly configService: ConfigService
  ) {
    this.config = this.configService.get('rateLimiting') as RateLimitingConfiguration
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const response = context.switchToHttp().getResponse<Response>()

    // Only apply to authenticated users
    if (!request.user?.id) {
      return true
    }

    const userContext = this.extractUserContext(request)
    const endpoint = this.getEndpointIdentifier(request)

    // Get user-specific rate limit configuration
    const rateLimitConfig = this.getUserRateLimitConfig(userContext, endpoint)

    // Check user-specific rate limits
    const result = await this.rateLimitService.checkRateLimit(
      `user:${userContext.userId}:${endpoint}`,
      rateLimitConfig,
      userContext
    )

    // Add user-specific headers
    this.addUserRateLimitHeaders(response, result, userContext)

    if (!result.isAllowed) {
      this.logger.warn(`User rate limit exceeded`, {
        userId: userContext.userId,
        role: userContext.globalRole,
        endpoint,
        remaining: result.remainingRequests,
        resetTime: new Date(result.resetTime).toISOString(),
      })

      throw new HttpException(
        {
          message: 'User rate limit exceeded. Please try again later.',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter: result.retryAfter,
          userId: userContext.userId,
          userRole: userContext.globalRole,
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
    const user = request.user!
    const ip = this.getClientIP(request)

    return {
      userId: user.id,
      globalRole: user.globalRole,
      ip,
      isAuthenticated: true,
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: Request): string {
    const forwarded = request.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return request.connection?.remoteAddress || request.ip || 'unknown'
  }

  /**
   * Get endpoint identifier for rate limiting
   */
  private getEndpointIdentifier(request: Request): string {
    // Normalize endpoint for rate limiting
    let path = request.path

    // Replace dynamic segments with placeholders
    path = path.replace(/\/\d+/g, '/:id')
    path = path.replace(/\/[a-f0-9-]{36}/g, '/:uuid')

    return `${request.method}:${path}`
  }

  /**
   * Get rate limit configuration specific to user role and endpoint
   */
  private getUserRateLimitConfig(userContext: UserContext, endpoint: string): RateLimitConfig {
    const baseConfig = {
      windowSizeMs: this.config.defaultWindow,
      maxRequests: this.config.defaultLimit,
      keyPrefix: 'user_rate_limit',
    }

    // Apply role-based multipliers
    if (userContext.globalRole && this.config.roleConfigs[userContext.globalRole]) {
      const roleConfig = this.config.roleConfigs[userContext.globalRole]
      baseConfig.maxRequests = Math.ceil(baseConfig.maxRequests * roleConfig.multiplier)
    }

    // Apply endpoint-specific adjustments
    if (endpoint.includes('auth')) {
      return {
        ...baseConfig,
        windowSizeMs: 15 * 60 * 1000, // 15 minutes for auth
        maxRequests: Math.ceil(baseConfig.maxRequests * 0.1), // 10% of normal rate
      }
    }

    if (endpoint.includes('upload')) {
      return {
        ...baseConfig,
        windowSizeMs: 5 * 60 * 1000, // 5 minutes for uploads
        maxRequests: Math.ceil(baseConfig.maxRequests * 0.2), // 20% of normal rate
      }
    }

    if (endpoint.includes('admin')) {
      return {
        ...baseConfig,
        maxRequests: Math.ceil(baseConfig.maxRequests * 2), // 2x for admin endpoints
      }
    }

    return baseConfig
  }

  /**
   * Add user-specific rate limit headers
   */
  private addUserRateLimitHeaders(response: Response, result: unknown, userContext: UserContext): void {
    const typedResult = result as { totalRequests?: number; remainingRequests?: number; resetTime?: number; retryAfter?: number }
    response.setHeader(
      'X-User-RateLimit-Limit',
      (typedResult.totalRequests ?? 0) + (typedResult.remainingRequests ?? 0) || 0
    )
    response.setHeader('X-User-RateLimit-Remaining', Math.max(0, typedResult.remainingRequests ?? 0))
    response.setHeader('X-User-RateLimit-Reset', Math.ceil((typedResult.resetTime ?? 0) / 1000))
    response.setHeader('X-User-RateLimit-Policy', 'per-user-sliding-window')

    if (userContext.globalRole) {
      response.setHeader('X-User-Role', userContext.globalRole)
    }

    if (typedResult.retryAfter) {
      response.setHeader('X-User-Retry-After', typedResult.retryAfter)
    }
  }
}
