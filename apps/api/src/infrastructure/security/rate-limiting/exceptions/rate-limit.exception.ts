/**
 * Custom Rate Limiting Exceptions
 * Provides detailed error responses for different rate limiting scenarios
 */

import { HttpException, HttpStatus } from '@nestjs/common'
import { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'

export interface RateLimitErrorDetails {
  message: string
  statusCode: number
  retryAfter?: number
  resetTime?: number
  remainingRequests?: number
  limitType: 'ip' | 'user' | 'role' | 'endpoint' | 'combined'
  identifier?: string
  userRole?: GlobalUserRole
  endpoint?: string
  limitingFactor?: 'ip' | 'user' | 'both'
  banInfo?: {
    isBanned: boolean
    banExpiry?: number
    banLevel?: number
    reason?: string
    canAppeal?: boolean
  }
  suggestions?: string[]
}

/**
 * Base rate limiting exception with enhanced details
 */
export class RateLimitException extends HttpException {
  constructor(
    details: Partial<RateLimitErrorDetails>,
    status: HttpStatus = HttpStatus.TOO_MANY_REQUESTS
  ) {
    const errorResponse: RateLimitErrorDetails = {
      message: details.message || 'Rate limit exceeded',
      statusCode: status,
      limitType: details.limitType || 'ip',
      retryAfter: details.retryAfter,
      resetTime: details.resetTime,
      remainingRequests: details.remainingRequests || 0,
      identifier: details.identifier,
      userRole: details.userRole,
      endpoint: details.endpoint,
      limitingFactor: details.limitingFactor,
      banInfo: details.banInfo,
      suggestions:
        details.suggestions || RateLimitException.getDefaultSuggestions(details.limitType || 'ip'),
    }

    super(errorResponse, status)
  }

  private static getDefaultSuggestions(limitType: string): string[] {
    const suggestions = {
      ip: [
        'Wait for the rate limit window to reset',
        'Reduce the frequency of your requests',
        'Consider implementing client-side caching',
        'Contact support if you believe this is an error',
      ],
      user: [
        'Wait for your user rate limit to reset',
        'Consider upgrading your account for higher limits',
        'Implement pagination for large data requests',
        'Use batch operations where possible',
      ],
      role: [
        'Your current role has limited API access',
        'Contact an administrator to upgrade your permissions',
        'Use read-only operations which have higher limits',
        'Wait for the limit window to reset',
      ],
      endpoint: [
        'This endpoint has specific rate limits',
        'Consider using alternative endpoints if available',
        'Implement exponential backoff in your client',
        'Wait for the rate limit to reset',
      ],
      combined: [
        'Multiple rate limits are in effect',
        'Reduce request frequency from your IP',
        'Wait for both IP and user limits to reset',
        'Consider using different endpoints',
      ],
    }

    return suggestions[limitType as keyof typeof suggestions] || suggestions.ip
  }
}

/**
 * IP-based rate limiting exception
 */
export class IPRateLimitException extends RateLimitException {
  constructor(
    ip: string,
    retryAfter?: number,
    resetTime?: number,
    remainingRequests?: number,
    customMessage?: string
  ) {
    super({
      message: customMessage || `IP rate limit exceeded for ${ip}. Please try again later.`,
      limitType: 'ip',
      identifier: ip,
      retryAfter,
      resetTime,
      remainingRequests,
      suggestions: [
        'Your IP address has exceeded the rate limit',
        'Wait for the rate limit window to reset',
        'Ensure your application implements proper request throttling',
        'Contact support if you believe this is an error',
      ],
    })
  }
}

/**
 * User-based rate limiting exception
 */
export class UserRateLimitException extends RateLimitException {
  constructor(
    userId: string,
    userRole?: GlobalUserRole,
    retryAfter?: number,
    resetTime?: number,
    remainingRequests?: number,
    customMessage?: string
  ) {
    const roleSpecificMessage = userRole
      ? `User rate limit exceeded for role ${userRole}. Please try again later.`
      : `User rate limit exceeded. Please try again later.`

    super({
      message: customMessage || roleSpecificMessage,
      limitType: 'user',
      identifier: userId,
      userRole,
      retryAfter,
      resetTime,
      remainingRequests,
      suggestions:
        userRole === GlobalUserRole.VIEWER
          ? [
              'Viewer accounts have limited API access',
              'Contact an administrator to upgrade your account',
              'Use read-only operations which have higher limits',
              'Wait for the rate limit to reset',
            ]
          : undefined,
    })
  }
}

/**
 * Role-based rate limiting exception
 */
export class RoleRateLimitException extends RateLimitException {
  constructor(
    role: GlobalUserRole,
    operation: string,
    retryAfter?: number,
    resetTime?: number,
    customMessage?: string
  ) {
    super({
      message:
        customMessage ||
        `Role-based rate limit exceeded. ${role} users cannot perform ${operation} operations at this frequency.`,
      limitType: 'role',
      userRole: role,
      retryAfter,
      resetTime,
      suggestions: [
        `Your role (${role}) has specific limitations for ${operation} operations`,
        'Contact an administrator if you need higher limits',
        'Consider using operations allowed for your role',
        'Wait for the rate limit window to reset',
      ],
    })
  }
}

/**
 * Combined rate limiting exception (IP + User)
 */
export class CombinedRateLimitException extends RateLimitException {
  constructor(
    limitingFactor: 'ip' | 'user' | 'both',
    ip: string,
    userId?: string,
    userRole?: GlobalUserRole,
    retryAfter?: number,
    resetTime?: number,
    customMessage?: string
  ) {
    const factorMessage = {
      ip: 'IP-based rate limit exceeded',
      user: 'User-based rate limit exceeded',
      both: 'Both IP and user rate limits exceeded',
    }

    super({
      message: customMessage || `${factorMessage[limitingFactor]}. Please try again later.`,
      limitType: 'combined',
      limitingFactor,
      identifier: userId || ip,
      userRole,
      retryAfter,
      resetTime,
      suggestions:
        limitingFactor === 'both'
          ? [
              'Both your IP and user account have exceeded rate limits',
              'Wait for both limits to reset before retrying',
              'Consider using a different network if possible',
              'Implement proper client-side throttling',
            ]
          : undefined,
    })
  }
}

/**
 * Endpoint-specific rate limiting exception
 */
export class EndpointRateLimitException extends RateLimitException {
  constructor(endpoint: string, retryAfter?: number, resetTime?: number, customMessage?: string) {
    super({
      message:
        customMessage ||
        `Rate limit exceeded for endpoint ${endpoint}. This endpoint has specific usage restrictions.`,
      limitType: 'endpoint',
      endpoint,
      retryAfter,
      resetTime,
      suggestions: [
        `The endpoint ${endpoint} has specific rate limits`,
        'Consider using alternative endpoints if available',
        'Implement caching to reduce duplicate requests',
        'Wait for the endpoint rate limit to reset',
      ],
    })
  }
}

/**
 * Progressive penalty/ban exception
 */
export class ProgressivePenaltyException extends HttpException {
  constructor(
    _identifier: string,
    banLevel: number,
    banExpiry: number,
    violations: number,
    reason?: string,
    canAppeal = false
  ) {
    const timeUntilExpiry = Math.ceil((banExpiry - Date.now()) / 1000)
    const banDurationMinutes = Math.ceil(timeUntilExpiry / 60)

    const errorResponse = {
      message: `Account temporarily restricted due to repeated violations`,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      banInfo: {
        isBanned: true,
        banExpiry,
        banLevel,
        reason: reason || `Level ${banLevel} penalty for ${violations} violations`,
        canAppeal,
        timeUntilExpiry,
        banDurationMinutes,
      },
      retryAfter: timeUntilExpiry,
      violations,
      suggestions: canAppeal
        ? [
            'Your account has been temporarily restricted',
            `Restriction will be lifted in ${banDurationMinutes} minutes`,
            'Contact support to appeal this restriction',
            'Review our API usage guidelines to avoid future restrictions',
          ]
        : [
            'Your account has been temporarily restricted',
            `Restriction will be lifted in ${banDurationMinutes} minutes`,
            'Review our API usage guidelines to avoid future restrictions',
            'Repeated violations may result in longer restrictions',
          ],
    }

    super(errorResponse, HttpStatus.TOO_MANY_REQUESTS)
  }
}

/**
 * Authentication rate limiting exception (for sensitive endpoints)
 */
export class AuthRateLimitException extends RateLimitException {
  constructor(
    operation: 'login' | 'register' | 'forgot-password' | 'reset-password',
    identifier: string,
    retryAfter?: number,
    resetTime?: number,
    violations?: number
  ) {
    const operationMessages = {
      login: 'Too many login attempts. Please try again later.',
      register: 'Too many registration attempts. Please try again later.',
      'forgot-password': 'Too many password reset requests. Please try again later.',
      'reset-password': 'Too many password reset attempts. Please try again later.',
    }

    const securityWarning =
      violations && violations >= 5
        ? 'Multiple failed attempts detected. Your IP may be temporarily blocked for security.'
        : 'Please wait before attempting again.'

    super({
      message: `${operationMessages[operation]} ${securityWarning}`,
      limitType: 'endpoint',
      endpoint: `/auth/${operation}`,
      identifier,
      retryAfter,
      resetTime,
      suggestions: [
        'Authentication endpoints are strictly rate limited for security',
        'Wait for the rate limit to reset before retrying',
        'Ensure you are using correct credentials',
        'Contact support if you continue to experience issues',
        violations && violations >= 10 ? 'Consider using account recovery options' : '',
      ].filter(Boolean),
    })
  }
}

/**
 * Dangerous operation rate limiting exception
 */
export class DangerousOperationException extends RateLimitException {
  constructor(operation: string, retryAfter?: number, resetTime?: number, customMessage?: string) {
    super({
      message:
        customMessage ||
        `Rate limit exceeded for dangerous operation: ${operation}. These operations are strictly limited for security.`,
      limitType: 'endpoint',
      endpoint: operation,
      retryAfter,
      resetTime,
      suggestions: [
        'Dangerous operations have very strict rate limits',
        'Ensure you really need to perform this operation',
        'Wait for the rate limit to reset',
        'Consider if there are alternative approaches',
        'Contact an administrator if this operation is urgent',
      ],
    })
  }
}
