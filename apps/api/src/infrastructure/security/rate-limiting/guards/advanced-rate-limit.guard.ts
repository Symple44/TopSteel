/**
 * Advanced Rate Limiting Guard
 * Comprehensive guard implementing multiple rate limiting strategies
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
import type { AdvancedRateLimitingService, UserContext } from '../advanced-rate-limiting.service'
import {
  RATE_LIMIT_BYPASS_KEY,
  RATE_LIMIT_CUSTOM_KEY,
  RATE_LIMIT_KEY,
  type RateLimitDecoratorConfig,
} from '../decorators/rate-limit.decorators'
import {
  getDefaultConfig,
  getEndpointConfig,
  isTrustedIP,
  type RateLimitingConfiguration,
  shouldBypassForRole,
} from '../rate-limiting.config'

interface RequestWithUser extends Request {
  user?: {
    id: string
    globalRole?: GlobalUserRole
    societeRole?: string
  }
}

@Injectable()
export class AdvancedRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AdvancedRateLimitGuard.name)
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

    // Check if rate limiting is bypassed for this endpoint
    const bypassConfig = this.reflector.get(RATE_LIMIT_BYPASS_KEY, context.getHandler())
    if (bypassConfig?.bypass) {
      this.logger.debug(`Rate limiting bypassed: ${bypassConfig.reason || 'No reason provided'}`)
      return true
    }

    // Get user context
    const userContext = this.extractUserContext(request)

    // Check if IP is trusted
    if (isTrustedIP(userContext.ip, this.config)) {
      this.logger.debug(`Trusted IP bypassing rate limit: ${userContext.ip}`)
      return true
    }

    // Check for temporary/permanent bans
    const banStatus = await this.checkBanStatus(userContext)
    if (banStatus.isBanned) {
      this.addRateLimitHeaders(response, {
        isAllowed: false,
        remainingRequests: 0,
        resetTime: banStatus.banExpiry || Date.now() + 60000,
        retryAfter: Math.ceil((banStatus.banExpiry! - Date.now()) / 1000),
        totalRequests: 0,
        windowStartTime: Date.now(),
      })

      throw new HttpException(
        {
          message: `Access temporarily banned: ${banStatus.reason}`,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter: Math.ceil((banStatus.banExpiry! - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    // Get rate limiting configuration for this endpoint
    const rateLimitConfig = await this.getRateLimitConfig(context, request.path, userContext)

    if (!rateLimitConfig) {
      return true // No rate limiting configured
    }

    // Check if user role bypasses rate limiting for this endpoint
    if (shouldBypassForRole(userContext.globalRole, rateLimitConfig)) {
      this.logger.debug(`Role bypass: ${userContext.globalRole} for ${request.path}`)
      return true
    }

    // Apply rate limiting
    const result = await this.applyRateLimit(request.path, rateLimitConfig, userContext)

    // Add rate limit headers
    this.addRateLimitHeaders(response, result.combined)

    if (!result.combined.isAllowed) {
      // Log violation
      this.logger.warn(`Rate limit exceeded`, {
        path: request.path,
        method: request.method,
        ip: userContext.ip,
        userId: userContext.userId,
        remaining: result.combined.remainingRequests,
        resetTime: new Date(result.combined.resetTime).toISOString(),
      })

      // Check if we should impose progressive penalty/ban
      await this.checkProgressivePenalty(userContext, rateLimitConfig)

      // Throw rate limit exception
      const message =
        rateLimitConfig.customMessage || 'Rate limit exceeded. Please try again later.'

      throw new HttpException(
        {
          message,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter: result.combined.retryAfter,
          resetTime: result.combined.resetTime,
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
   * Get client IP address
   */
  private getClientIP(request: Request): string {
    const forwarded = request.headers['x-forwarded-for']
    const realIP = request.headers['x-real-ip']
    const ip = request.connection?.remoteAddress || request.ip

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }

    if (typeof realIP === 'string') {
      return realIP
    }

    return ip || 'unknown'
  }

  /**
   * Get rate limiting configuration for endpoint
   */
  private async getRateLimitConfig(
    context: ExecutionContext,
    path: string,
    userContext: UserContext
  ): Promise<RateLimitDecoratorConfig | null> {
    // Check for custom decorator config first
    const decoratorConfig = this.reflector.get<RateLimitDecoratorConfig>(
      RATE_LIMIT_KEY,
      context.getHandler()
    )
    if (decoratorConfig) {
      return decoratorConfig
    }

    // Check for custom rate limiting logic
    const customConfig = this.reflector.get(RATE_LIMIT_CUSTOM_KEY, context.getHandler())
    if (customConfig) {
      return await this.processCustomConfig(customConfig, userContext)
    }

    // Check endpoint-specific configuration
    const endpointConfig = getEndpointConfig(path, this.config)
    if (endpointConfig) {
      return {
        windowSizeMs: endpointConfig.windowSizeMs,
        maxRequests: endpointConfig.maxRequests,
        ipMaxRequests: endpointConfig.ipMaxRequests,
        bypassForRoles: endpointConfig.bypassForRoles,
        progressivePenalties: endpointConfig.progressivePenalties,
      }
    }

    // Use default configuration
    const defaultConfig = getDefaultConfig(this.config)
    return {
      windowSizeMs: defaultConfig.windowSizeMs,
      maxRequests: defaultConfig.maxRequests,
      ipMaxRequests: defaultConfig.ipMaxRequests,
      progressivePenalties: defaultConfig.progressivePenalties,
    }
  }

  /**
   * Process custom rate limiting configuration
   */
  private async processCustomConfig(
    customConfig: unknown,
    userContext: UserContext
  ): Promise<RateLimitDecoratorConfig | null> {
    switch (customConfig.type) {
      case 'role-based':
        return this.processRoleBasedConfig(customConfig, userContext)
      case 'burst':
        return this.processBurstConfig(customConfig, userContext)
      default:
        return null
    }
  }

  /**
   * Process role-based rate limiting configuration
   */
  private processRoleBasedConfig(
    config: unknown,
    userContext: UserContext
  ): RateLimitDecoratorConfig | null {
    if (!userContext.globalRole || !config.roleConfigs[userContext.globalRole]) {
      return config.defaultConfig || null
    }

    const roleConfig = config.roleConfigs[userContext.globalRole]
    return {
      windowSizeMs: roleConfig.windowSizeMs || this.config.defaultWindow,
      maxRequests: roleConfig.maxRequests || this.config.defaultLimit,
      ...config.defaultConfig,
    }
  }

  /**
   * Process burst rate limiting configuration
   */
  private processBurstConfig(config: unknown, _userContext: UserContext): RateLimitDecoratorConfig {
    // For now, use short term config. Could implement dual-window checking here
    return {
      windowSizeMs: config.shortTerm.windowSizeMs,
      maxRequests: config.shortTerm.maxRequests,
      ...config,
    }
  }

  /**
   * Apply rate limiting using the service
   */
  private async applyRateLimit(
    endpoint: string,
    config: RateLimitDecoratorConfig,
    userContext: UserContext
  ) {
    const ipConfig = {
      windowSizeMs: config.windowSizeMs,
      maxRequests: config.ipMaxRequests || Math.floor(config.maxRequests * 0.8),
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
    }

    const userConfig = {
      windowSizeMs: config.windowSizeMs,
      maxRequests: config.maxRequests,
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
    }

    return await this.rateLimitService.checkCombinedRateLimit(
      endpoint,
      ipConfig,
      userConfig,
      userContext
    )
  }

  /**
   * Check ban status for user/IP
   */
  private async checkBanStatus(userContext: UserContext) {
    const identifier = userContext.userId ? `user:${userContext.userId}` : `ip:${userContext.ip}`
    return await this.rateLimitService.checkBanStatus(identifier)
  }

  /**
   * Check and apply progressive penalties
   */
  private async checkProgressivePenalty(
    userContext: UserContext,
    config: RateLimitDecoratorConfig
  ): Promise<void> {
    if (!config.progressivePenalties || !this.config.penalties.enabled) {
      return
    }

    const identifier = userContext.userId ? `user:${userContext.userId}` : `ip:${userContext.ip}`
    const stats = await this.rateLimitService.getRateLimitStats(
      identifier,
      this.config.penalties.violationWindow
    )

    if (!stats) return

    // Check if violations exceed any ban threshold
    for (const threshold of this.config.penalties.banThresholds) {
      if (stats.violations >= threshold.violations) {
        await this.rateLimitService.imposeBan(
          identifier,
          threshold.banDurationMs,
          `Automatic ban after ${stats.violations} violations`
        )

        this.logger.warn(`Progressive penalty imposed`, {
          identifier,
          violations: stats.violations,
          banDuration: threshold.banDurationMs,
          userContext,
        })
        break
      }
    }
  }

  /**
   * Add rate limit headers to response
   */
  private addRateLimitHeaders(response: Response, result: any): void {
    response.setHeader('X-RateLimit-Limit', result.remainingRequests + result.totalRequests || 0)
    response.setHeader('X-RateLimit-Remaining', Math.max(0, result.remainingRequests))
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000))
    response.setHeader(
      'X-RateLimit-Window',
      Math.ceil((result.resetTime - result.windowStartTime) / 1000)
    )

    if (result.retryAfter) {
      response.setHeader('Retry-After', result.retryAfter)
    }

    // Custom headers for monitoring
    response.setHeader('X-RateLimit-Policy', 'advanced-sliding-window')

    if (!result.isAllowed) {
      response.setHeader('X-RateLimit-Status', 'exceeded')
    }
  }
}
