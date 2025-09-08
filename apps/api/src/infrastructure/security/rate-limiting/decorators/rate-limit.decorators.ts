/**
 * Rate Limiting Decorators
 * Custom decorators for applying different rate limiting strategies
 */

import { applyDecorators, SetMetadata } from '@nestjs/common'
import { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'

export const RATE_LIMIT_KEY = 'rateLimitConfig'
export const RATE_LIMIT_BYPASS_KEY = 'rateLimitBypass'
export const RATE_LIMIT_CUSTOM_KEY = 'rateLimitCustom'

export interface RateLimitDecoratorConfig {
  windowSizeMs: number
  maxRequests: number
  ipMaxRequests?: number
  keyGenerator?: string // Custom key generator function name
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  bypassForRoles?: GlobalUserRole[]
  progressivePenalties?: boolean
  customMessage?: string
}

/**
 * Apply custom rate limiting to an endpoint
 */
export const RateLimit = (config: RateLimitDecoratorConfig) => SetMetadata(RATE_LIMIT_KEY, config)

/**
 * Bypass rate limiting completely (for trusted endpoints)
 */
export const BypassRateLimit = (reason?: string) =>
  SetMetadata(RATE_LIMIT_BYPASS_KEY, { bypass: true, reason })

/**
 * Apply strict rate limiting for authentication endpoints
 */
export const StrictRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    ipMaxRequests: 10,
    progressivePenalties: true,
    customMessage: 'Too many authentication attempts. Please try again later.',
    ...options,
  })

/**
 * Apply moderate rate limiting for API endpoints
 */
export const ApiRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    ipMaxRequests: 50,
    bypassForRoles: [GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN],
    ...options,
  })

/**
 * Apply lenient rate limiting for read-only endpoints
 */
export const ReadOnlyRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    ipMaxRequests: 100,
    skipFailedRequests: true,
    bypassForRoles: [GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN, GlobalUserRole.MANAGER],
    ...options,
  })

/**
 * Apply very strict rate limiting for dangerous operations
 */
export const DangerousOperationRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    ipMaxRequests: 2,
    progressivePenalties: true,
    bypassForRoles: [GlobalUserRole.SUPER_ADMIN],
    customMessage: 'This operation is strictly rate limited for security reasons.',
    ...options,
  })

/**
 * Apply rate limiting for file upload endpoints
 */
export const UploadRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    ipMaxRequests: 5,
    keyGenerator: 'uploadKeyGenerator', // Custom key based on file size/type
    customMessage: 'Upload rate limit exceeded. Please wait before uploading more files.',
    ...options,
  })

/**
 * Apply rate limiting based on user role with different limits
 */
export const RoleBasedRateLimit = (
  roleConfigs: Partial<
    Record<GlobalUserRole, Pick<RateLimitDecoratorConfig, 'maxRequests' | 'windowSizeMs'>>
  >,
  defaultConfig?: Partial<RateLimitDecoratorConfig>
) => SetMetadata(RATE_LIMIT_CUSTOM_KEY, { type: 'role-based', roleConfigs, defaultConfig })

/**
 * Apply dynamic rate limiting based on endpoint complexity
 */
export const ComplexityBasedRateLimit = (
  complexity: 'low' | 'medium' | 'high' | 'critical',
  options?: Partial<RateLimitDecoratorConfig>
) => {
  const complexityConfigs = {
    low: { windowSizeMs: 60 * 1000, maxRequests: 300, ipMaxRequests: 150 },
    medium: { windowSizeMs: 60 * 1000, maxRequests: 100, ipMaxRequests: 50 },
    high: { windowSizeMs: 60 * 1000, maxRequests: 30, ipMaxRequests: 15 },
    critical: {
      windowSizeMs: 5 * 60 * 1000,
      maxRequests: 5,
      ipMaxRequests: 3,
      progressivePenalties: true,
    },
  }

  return RateLimit({
    ...complexityConfigs[complexity],
    ...options,
  })
}

/**
 * Apply burst rate limiting with different short and long term limits
 */
export const BurstRateLimit = (
  shortTermConfig: { windowSizeMs: number; maxRequests: number },
  longTermConfig: { windowSizeMs: number; maxRequests: number },
  options?: Partial<RateLimitDecoratorConfig>
) =>
  SetMetadata(RATE_LIMIT_CUSTOM_KEY, {
    type: 'burst',
    shortTerm: shortTermConfig,
    longTerm: longTermConfig,
    ...options,
  })

/**
 * Apply rate limiting for admin operations with role checks
 */
export const AdminRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 500,
    ipMaxRequests: 200,
    bypassForRoles: [GlobalUserRole.SUPER_ADMIN],
    customMessage: 'Admin operation rate limit exceeded.',
    ...options,
  })

/**
 * Apply rate limiting for search operations
 */
export const SearchRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    ipMaxRequests: 30,
    skipSuccessfulRequests: false,
    keyGenerator: 'searchKeyGenerator', // Include search query complexity
    customMessage: 'Search rate limit exceeded. Please refine your search.',
    ...options,
  })

/**
 * Apply rate limiting for marketplace operations
 */
export const MarketplaceRateLimit = (
  operation: 'browse' | 'order' | 'payment',
  options?: Partial<RateLimitDecoratorConfig>
) => {
  const operationConfigs = {
    browse: { windowSizeMs: 60 * 1000, maxRequests: 100, ipMaxRequests: 50 },
    order: { windowSizeMs: 5 * 60 * 1000, maxRequests: 10, ipMaxRequests: 5 },
    payment: {
      windowSizeMs: 10 * 60 * 1000,
      maxRequests: 3,
      ipMaxRequests: 2,
      progressivePenalties: true,
    },
  }

  return RateLimit({
    ...operationConfigs[operation],
    customMessage: `Marketplace ${operation} rate limit exceeded.`,
    ...options,
  })
}

/**
 * Apply webhook rate limiting with special considerations
 */
export const WebhookRateLimit = (options?: Partial<RateLimitDecoratorConfig>) =>
  RateLimit({
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    ipMaxRequests: 50,
    keyGenerator: 'webhookKeyGenerator', // Include webhook signature/source
    skipSuccessfulRequests: true, // Only count failed webhooks
    customMessage: 'Webhook rate limit exceeded.',
    ...options,
  })

/**
 * Combine multiple rate limiting decorators
 */
export const MultiLayerRateLimit = (...decorators: MethodDecorator[]) =>
  applyDecorators(...decorators)

// Example usage decorators for common patterns

/**
 * Standard CRUD operation rate limiting
 */
export const CrudRateLimit = {
  Create: () => ApiRateLimit({ maxRequests: 50, progressivePenalties: true }),
  Read: () => ReadOnlyRateLimit({ maxRequests: 200 }),
  Update: () => ApiRateLimit({ maxRequests: 30, progressivePenalties: true }),
  Delete: () => DangerousOperationRateLimit({ maxRequests: 10 }),
}

/**
 * Authentication flow rate limiting
 */
export const AuthRateLimit = {
  Login: () => StrictRateLimit(),
  Register: () => StrictRateLimit({ windowSizeMs: 60 * 60 * 1000, maxRequests: 3 }),
  ForgotPassword: () => StrictRateLimit({ windowSizeMs: 60 * 60 * 1000, maxRequests: 3 }),
  ResetPassword: () => StrictRateLimit({ windowSizeMs: 60 * 60 * 1000, maxRequests: 3 }),
  Logout: () => ApiRateLimit({ maxRequests: 10 }),
  Refresh: () => ApiRateLimit({ maxRequests: 100 }),
}

/**
 * File operation rate limiting
 */
export const FileRateLimit = {
  Upload: () => UploadRateLimit(),
  Download: () => ReadOnlyRateLimit({ maxRequests: 100 }),
  Delete: () => DangerousOperationRateLimit({ maxRequests: 20 }),
}
