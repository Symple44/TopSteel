/**
 * Role-Based Rate Limiting Guard
 * Applies different rate limits based on user roles and permissions
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
import {
  GLOBAL_ROLE_HIERARCHY,
  GlobalUserRole,
} from '../../../../domains/auth/core/constants/roles.constants'
import type { AdvancedRateLimitingService } from '../advanced-rate-limiting.service'
import type { RateLimitingConfiguration } from '../rate-limiting.config'
import type { RateLimitConfig, RateLimitResult, UserContext } from '../types/rate-limiting.types'

interface RequestWithUser extends Request {
  user?: {
    id: string
    globalRole?: GlobalUserRole
    societeRole?: string
    permissions?: string[]
  }
}

export const ROLE_RATE_LIMIT_KEY = 'roleRateLimit'

export interface RoleRateLimitConfig {
  [key: string]: {
    windowSizeMs: number
    maxRequests: number
  }
}

@Injectable()
export class RoleBasedRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RoleBasedRateLimitGuard.name)
  private config: RateLimitingConfiguration

  // Predefined role-based limits for different operation types
  private readonly operationLimits = {
    READ: {
      [GlobalUserRole.SUPER_ADMIN]: { windowSizeMs: 60 * 1000, maxRequests: 2000 },
      [GlobalUserRole.ADMIN]: { windowSizeMs: 60 * 1000, maxRequests: 1000 },
      [GlobalUserRole.MANAGER]: { windowSizeMs: 60 * 1000, maxRequests: 500 },
      [GlobalUserRole.COMMERCIAL]: { windowSizeMs: 60 * 1000, maxRequests: 300 },
      [GlobalUserRole.COMPTABLE]: { windowSizeMs: 60 * 1000, maxRequests: 300 },
      [GlobalUserRole.TECHNICIEN]: { windowSizeMs: 60 * 1000, maxRequests: 200 },
      [GlobalUserRole.OPERATEUR]: { windowSizeMs: 60 * 1000, maxRequests: 150 },
      [GlobalUserRole.USER]: { windowSizeMs: 60 * 1000, maxRequests: 100 },
      [GlobalUserRole.VIEWER]: { windowSizeMs: 60 * 1000, maxRequests: 50 },
    },
    WRITE: {
      [GlobalUserRole.SUPER_ADMIN]: { windowSizeMs: 60 * 1000, maxRequests: 500 },
      [GlobalUserRole.ADMIN]: { windowSizeMs: 60 * 1000, maxRequests: 200 },
      [GlobalUserRole.MANAGER]: { windowSizeMs: 60 * 1000, maxRequests: 100 },
      [GlobalUserRole.COMMERCIAL]: { windowSizeMs: 60 * 1000, maxRequests: 50 },
      [GlobalUserRole.COMPTABLE]: { windowSizeMs: 60 * 1000, maxRequests: 50 },
      [GlobalUserRole.TECHNICIEN]: { windowSizeMs: 60 * 1000, maxRequests: 30 },
      [GlobalUserRole.OPERATEUR]: { windowSizeMs: 60 * 1000, maxRequests: 20 },
      [GlobalUserRole.USER]: { windowSizeMs: 60 * 1000, maxRequests: 10 },
      [GlobalUserRole.VIEWER]: { windowSizeMs: 60 * 1000, maxRequests: 0 }, // No writes for viewers
    },
    DELETE: {
      [GlobalUserRole.SUPER_ADMIN]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 100 },
      [GlobalUserRole.ADMIN]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 50 },
      [GlobalUserRole.MANAGER]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 20 },
      [GlobalUserRole.COMMERCIAL]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 10 },
      [GlobalUserRole.COMPTABLE]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 5 },
      [GlobalUserRole.TECHNICIEN]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 5 },
      [GlobalUserRole.OPERATEUR]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 0 }, // No deletes
      [GlobalUserRole.USER]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 0 }, // No deletes
      [GlobalUserRole.VIEWER]: { windowSizeMs: 5 * 60 * 1000, maxRequests: 0 }, // No deletes
    },
    ADMIN: {
      [GlobalUserRole.SUPER_ADMIN]: { windowSizeMs: 60 * 1000, maxRequests: 1000 },
      [GlobalUserRole.ADMIN]: { windowSizeMs: 60 * 1000, maxRequests: 500 },
      [GlobalUserRole.MANAGER]: { windowSizeMs: 60 * 1000, maxRequests: 100 },
      // Other roles get 0 admin requests
      [GlobalUserRole.COMMERCIAL]: { windowSizeMs: 60 * 1000, maxRequests: 0 },
      [GlobalUserRole.COMPTABLE]: { windowSizeMs: 60 * 1000, maxRequests: 0 },
      [GlobalUserRole.TECHNICIEN]: { windowSizeMs: 60 * 1000, maxRequests: 0 },
      [GlobalUserRole.OPERATEUR]: { windowSizeMs: 60 * 1000, maxRequests: 0 },
      [GlobalUserRole.USER]: { windowSizeMs: 60 * 1000, maxRequests: 0 },
      [GlobalUserRole.VIEWER]: { windowSizeMs: 60 * 1000, maxRequests: 0 },
    },
  }

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: AdvancedRateLimitingService,
    private readonly configService: ConfigService
  ) {
    this.config = this.configService.get('rateLimiting') as RateLimitingConfiguration
  }

  /**
   * Main guard activation method with reduced cognitive complexity (reduced from ~15 to ~5)
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const response = context.switchToHttp().getResponse<Response>()

    // Early returns for bypass conditions
    if (this.shouldSkipRateLimit(request)) {
      return true
    }

    const userContext = this.extractUserContext(request)
    const roleConfig = this.getRoleBasedConfig(context, request, userContext)

    if (!roleConfig) {
      return true // No rate limits configured
    }

    const rateLimitResult = await this.checkRateLimit(userContext, roleConfig, request)
    this.addRoleRateLimitHeaders(response, rateLimitResult, userContext)

    if (!rateLimitResult.isAllowed) {
      this.handleRateLimitExceeded(userContext, rateLimitResult, request)
    }

    return true
  }

  /**
   * Determine if rate limiting should be skipped
   */
  private shouldSkipRateLimit(request: RequestWithUser): boolean {
    // Skip if user is not authenticated
    if (!request.user) {
      return true
    }

    // Skip for SUPER_ADMIN if configured
    if (request.user.globalRole === GlobalUserRole.SUPER_ADMIN && this.shouldBypassSuperAdmin()) {
      return true
    }

    return false
  }

  /**
   * Check rate limit for the user context
   */
  private async checkRateLimit(
    userContext: UserContext & { permissions?: string[] },
    roleConfig: RateLimitConfig,
    request: RequestWithUser
  ): Promise<RateLimitResult> {
    const rateLimitKey = this.buildRateLimitKey(userContext, request)

    return await this.rateLimitService.checkRateLimit(rateLimitKey, roleConfig, userContext)
  }

  /**
   * Build rate limit key
   */
  private buildRateLimitKey(userContext: UserContext, request: RequestWithUser): string {
    const operationType = this.getOperationType(request)
    return `role:${userContext.globalRole}:${userContext.userId}:${operationType}`
  }

  /**
   * Handle rate limit exceeded scenario
   */
  private handleRateLimitExceeded(
    userContext: UserContext,
    result: RateLimitResult,
    request: RequestWithUser
  ): never {
    const operationType = this.getOperationType(request)

    this.logger.warn('Role-based rate limit exceeded', {
      userId: userContext.userId,
      role: userContext.globalRole,
      operationType,
      path: request.path,
      remaining: result.remainingRequests,
    })

    throw new HttpException(
      {
        message: this.getRoleLimitMessage(userContext.globalRole, operationType),
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        retryAfter: result.retryAfter,
        roleLimit: true,
      },
      HttpStatus.TOO_MANY_REQUESTS
    )
  }

  /**
   * Extract user context from request
   */
  private extractUserContext(request: RequestWithUser): UserContext & { permissions?: string[] } {
    const user = request.user!
    const ip = this.getClientIP(request)

    return {
      userId: user.id,
      globalRole: user.globalRole,
      ip,
      isAuthenticated: true,
      permissions: user.permissions,
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
   * Determine operation type from request
   */
  private getOperationType(request: Request): string {
    const method = request.method.toUpperCase()
    const path = request.path.toLowerCase()

    // Admin operations
    if (path.includes('/admin')) {
      return 'ADMIN'
    }

    // Based on HTTP method
    switch (method) {
      case 'GET':
      case 'HEAD':
      case 'OPTIONS':
        return 'READ'
      case 'DELETE':
        return 'DELETE'
      default:
        return 'WRITE'
    }
  }

  /**
   * Get role-based rate limit configuration (reduced complexity from ~12 to ~6)
   */
  private getRoleBasedConfig(
    context: ExecutionContext,
    request: Request,
    userContext: UserContext & { permissions?: string[] }
  ): RateLimitConfig | null {
    // Try custom decorator configuration first
    const customConfig = this.getCustomConfig(context, userContext)
    if (customConfig) {
      return customConfig
    }

    // Use predefined operation limits
    return this.getOperationLimitConfig(request, userContext)
  }

  /**
   * Get custom configuration from decorator
   */
  private getCustomConfig(
    context: ExecutionContext,
    userContext: UserContext & { permissions?: string[] }
  ): RateLimitConfig | null {
    const customConfig = this.reflector.get<RoleRateLimitConfig>(
      ROLE_RATE_LIMIT_KEY,
      context.getHandler()
    )

    if (!customConfig || !userContext.globalRole || !customConfig[userContext.globalRole]) {
      return null
    }

    const config = customConfig[userContext.globalRole]
    return {
      windowSizeMs: config.windowSizeMs,
      maxRequests: config.maxRequests,
      keyPrefix: 'role_based',
    }
  }

  /**
   * Get operation limit configuration
   */
  private getOperationLimitConfig(
    request: Request,
    userContext: UserContext & { permissions?: string[] }
  ): RateLimitConfig | null {
    const operationType = this.getOperationType(request)
    const operationLimits = this.operationLimits[operationType as keyof typeof this.operationLimits]

    if (!operationLimits || !userContext.globalRole) {
      return null
    }

    const roleLimit = operationLimits[userContext.globalRole]
    if (!roleLimit) {
      return null
    }

    // Check if operation is forbidden for this role
    this.validateOperationAllowed(operationType, userContext.globalRole, roleLimit.maxRequests)

    return {
      windowSizeMs: roleLimit.windowSizeMs,
      maxRequests: roleLimit.maxRequests,
      keyPrefix: 'role_based',
    }
  }

  /**
   * Validate that operation is allowed for the role
   */
  private validateOperationAllowed(
    operationType: string,
    userRole: GlobalUserRole,
    maxRequests: number
  ): void {
    if (maxRequests === 0) {
      throw new HttpException(
        {
          message: `Operation '${operationType}' is not allowed for role '${userRole}'`,
          statusCode: HttpStatus.FORBIDDEN,
          operationType,
          userRole,
        },
        HttpStatus.FORBIDDEN
      )
    }
  }

  /**
   * Check if SUPER_ADMIN should bypass limits
   */
  private shouldBypassSuperAdmin(): boolean {
    return this.configService.get('rateLimiting.bypassSuperAdmin', true)
  }

  /**
   * Get role-specific limit message
   */
  private getRoleLimitMessage(role: GlobalUserRole | undefined, operationType: string): string {
    if (!role) {
      return 'Rate limit exceeded for your role.'
    }

    const messages = {
      READ: `Reading rate limit exceeded for ${role}. Please slow down your requests.`,
      WRITE: `Writing rate limit exceeded for ${role}. Please reduce the frequency of modifications.`,
      DELETE: `Deletion rate limit exceeded for ${role}. Please wait before deleting more items.`,
      ADMIN: `Administrative operation rate limit exceeded for ${role}.`,
    }

    return (
      messages[operationType as keyof typeof messages] ||
      `Rate limit exceeded for ${role} performing ${operationType} operations.`
    )
  }

  /**
   * Add role-specific headers
   */
  private addRoleRateLimitHeaders(
    response: Response,
    result: RateLimitResult,
    userContext: UserContext
  ): void {
    response.setHeader(
      'X-Role-RateLimit-Limit',
      result.totalRequests + result.remainingRequests || 0
    )
    response.setHeader('X-Role-RateLimit-Remaining', Math.max(0, result.remainingRequests))
    response.setHeader('X-Role-RateLimit-Reset', Math.ceil(result.resetTime / 1000))
    response.setHeader('X-Role-RateLimit-Policy', 'role-based-sliding-window')

    if (userContext.globalRole) {
      response.setHeader('X-Applied-Role', userContext.globalRole)

      // Add role hierarchy info
      const hierarchy = GLOBAL_ROLE_HIERARCHY[userContext.globalRole]
      response.setHeader('X-Role-Hierarchy-Level', hierarchy.toString())
    }

    if (result.retryAfter) {
      response.setHeader('X-Role-Retry-After', result.retryAfter)
    }
  }
}

/**
 * Decorator to set custom role-based rate limits
 */
export const RoleRateLimit = (config: RoleRateLimitConfig) =>
  Reflect.metadata(ROLE_RATE_LIMIT_KEY, config)
