/**
 * Rate Limiting Configuration
 * Centralized configuration for all rate limiting rules
 */

import { registerAs } from '@nestjs/config'
import { GlobalUserRole } from '../../../domains/auth/core/constants/roles.constants'

export interface EndpointRateLimitConfig {
  windowSizeMs: number
  maxRequests: number
  ipMaxRequests?: number
  bypassForRoles?: GlobalUserRole[]
  progressivePenalties?: boolean
}

export interface RateLimitingConfiguration {
  // Global defaults
  defaultWindow: number
  defaultLimit: number

  // Redis configuration
  redis: {
    keyPrefix: string
    defaultTTL: number
  }

  // Progressive penalties
  penalties: {
    enabled: boolean
    violationWindow: number // Time window for counting violations (ms)
    banThresholds: Array<{
      violations: number
      banDurationMs: number
    }>
  }

  // Trusted IPs that bypass rate limiting
  trustedIPs: string[]

  // Endpoint-specific configurations
  endpoints: Record<string, EndpointRateLimitConfig>

  // Role-based configurations
  roleConfigs: Record<
    GlobalUserRole,
    {
      multiplier: number
      maxDailyRequests?: number
      burstLimit?: number
    }
  >

  // Monitoring
  monitoring: {
    alertThreshold: number // Alert when violations exceed this per hour
    enabled: boolean
    logViolations: boolean
  }
}

export const rateLimitingConfig = registerAs('rateLimiting', (): RateLimitingConfiguration => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  // Base multipliers for development vs production
  const baseMultiplier = isDevelopment ? 100 : 1  // Augmenté à 100x en développement
  const strictMultiplier = isDevelopment ? 50 : 1  // Augmenté à 50x en développement

  return {
    // Global defaults
    defaultWindow: 60 * 1000, // 1 minute
    defaultLimit: 100 * baseMultiplier,

    // Redis configuration
    redis: {
      keyPrefix: process.env.RATE_LIMIT_REDIS_PREFIX || 'topsteel:rate_limit',
      defaultTTL: 300, // 5 minutes
    },

    // Progressive penalties
    penalties: {
      enabled: isProduction, // Only in production by default
      violationWindow: 60 * 60 * 1000, // 1 hour
      banThresholds: [
        { violations: 10, banDurationMs: 5 * 60 * 1000 }, // 5 min after 10 violations
        { violations: 25, banDurationMs: 30 * 60 * 1000 }, // 30 min after 25 violations
        { violations: 50, banDurationMs: 60 * 60 * 1000 }, // 1 hour after 50 violations
        { violations: 100, banDurationMs: 24 * 60 * 60 * 1000 }, // 24 hours after 100 violations
      ],
    },

    // Trusted IPs (from environment)
    trustedIPs: (process.env.TRUSTED_IPS || '127.0.0.1,::1').split(',').map((ip) => ip.trim()),

    // Endpoint-specific configurations
    endpoints: {
      // Authentication endpoints - very strict
      '/auth/login': {
        windowSizeMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5 * strictMultiplier,
        ipMaxRequests: 10 * strictMultiplier,
        progressivePenalties: true,
      },
      '/auth/register': {
        windowSizeMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3 * strictMultiplier,
        ipMaxRequests: 5 * strictMultiplier,
        progressivePenalties: true,
      },
      '/auth/forgot-password': {
        windowSizeMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3 * strictMultiplier,
        ipMaxRequests: 5 * strictMultiplier,
        progressivePenalties: true,
      },
      '/auth/reset-password': {
        windowSizeMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3 * strictMultiplier,
        ipMaxRequests: 5 * strictMultiplier,
        progressivePenalties: true,
      },

      // API endpoints - moderate limits
      '/api/v1/.*': {
        windowSizeMs: 60 * 1000, // 1 minute
        maxRequests: 200 * baseMultiplier,
        ipMaxRequests: 100 * baseMultiplier,
        bypassForRoles: [GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN],
      },

      // Upload endpoints - strict limits
      '/upload': {
        windowSizeMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 10 * strictMultiplier,
        ipMaxRequests: 5 * strictMultiplier,
      },

      // Search endpoints - moderate limits
      '/search': {
        windowSizeMs: 60 * 1000, // 1 minute
        maxRequests: 50 * baseMultiplier,
        ipMaxRequests: 30 * baseMultiplier,
      },

      // Query builder - strict limits for security
      '/api/query-builder/execute': {
        windowSizeMs: 60 * 1000, // 1 minute
        maxRequests: 10 * strictMultiplier,
        ipMaxRequests: 5 * strictMultiplier,
        bypassForRoles: [GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN],
      },

      // Admin endpoints - higher limits for admin users
      '/admin': {
        windowSizeMs: 60 * 1000, // 1 minute
        maxRequests: 500 * baseMultiplier,
        ipMaxRequests: 200 * baseMultiplier,
        bypassForRoles: [GlobalUserRole.SUPER_ADMIN],
      },

      // Marketplace endpoints
      '/marketplace/orders': {
        windowSizeMs: 60 * 1000, // 1 minute
        maxRequests: 30 * baseMultiplier,
        ipMaxRequests: 15 * baseMultiplier,
      },

      // Webhook endpoints - special handling
      '/webhooks': {
        windowSizeMs: 60 * 1000, // 1 minute
        maxRequests: 100 * baseMultiplier,
        ipMaxRequests: 50 * baseMultiplier,
      },

      // Health checks - very permissive
      '/health': {
        windowSizeMs: 60 * 1000, // 1 minute
        maxRequests: 1000 * baseMultiplier,
        ipMaxRequests: 1000 * baseMultiplier,
      },
    },

    // Role-based configurations
    roleConfigs: {
      [GlobalUserRole.SUPER_ADMIN]: {
        multiplier: 20, // 20x more requests
        maxDailyRequests: 1000000, // Virtually unlimited
        burstLimit: 1000,
      },
      [GlobalUserRole.ADMIN]: {
        multiplier: 10, // 10x more requests
        maxDailyRequests: 100000,
        burstLimit: 500,
      },
      [GlobalUserRole.MANAGER]: {
        multiplier: 5, // 5x more requests
        maxDailyRequests: 50000,
        burstLimit: 200,
      },
      [GlobalUserRole.COMMERCIAL]: {
        multiplier: 3, // 3x more requests
        maxDailyRequests: 30000,
        burstLimit: 150,
      },
      [GlobalUserRole.COMPTABLE]: {
        multiplier: 3, // 3x more requests
        maxDailyRequests: 30000,
        burstLimit: 150,
      },
      [GlobalUserRole.TECHNICIEN]: {
        multiplier: 2, // 2x more requests
        maxDailyRequests: 20000,
        burstLimit: 100,
      },
      [GlobalUserRole.OPERATEUR]: {
        multiplier: 1.5, // 1.5x more requests
        maxDailyRequests: 15000,
        burstLimit: 75,
      },
      [GlobalUserRole.USER]: {
        multiplier: 1, // Standard rate
        maxDailyRequests: 10000,
        burstLimit: 50,
      },
      [GlobalUserRole.VIEWER]: {
        multiplier: 0.5, // Half the standard rate
        maxDailyRequests: 5000,
        burstLimit: 25,
      },
    },

    // Monitoring configuration
    monitoring: {
      alertThreshold: Number.parseInt(process.env.RATE_LIMIT_ALERT_THRESHOLD || '50', 10),
      enabled: isProduction,
      logViolations: true,
    },
  }
})

/**
 * Helper function to get rate limit config for an endpoint
 */
export function getEndpointConfig(
  path: string,
  config: RateLimitingConfiguration
): EndpointRateLimitConfig | null {
  // Try exact match first
  if (config.endpoints[path]) {
    return config.endpoints[path]
  }

  // Try regex patterns
  for (const [pattern, endpointConfig] of Object.entries(config.endpoints)) {
    if (pattern.includes('.*')) {
      const regex = new RegExp(`^${pattern}$`)
      if (regex.test(path)) {
        return endpointConfig
      }
    }
  }

  return null
}

/**
 * Get default rate limit config
 */
export function getDefaultConfig(config: RateLimitingConfiguration): EndpointRateLimitConfig {
  return {
    windowSizeMs: config.defaultWindow,
    maxRequests: config.defaultLimit,
    ipMaxRequests: Math.floor(config.defaultLimit * 0.8), // 80% of user limit for IP
    progressivePenalties: false,
  }
}

/**
 * Check if IP is in trusted list
 */
export function isTrustedIP(ip: string, config: RateLimitingConfiguration): boolean {
  return (
    config.trustedIPs.includes(ip) ||
    config.trustedIPs.some((trusted) => {
      if (trusted.includes('/')) {
        // CIDR notation support could be added here
        return false
      }
      return trusted === ip
    })
  )
}

/**
 * Check if role should bypass rate limiting for endpoint
 */
export function shouldBypassForRole(
  role: GlobalUserRole | undefined,
  endpointConfig: EndpointRateLimitConfig
): boolean {
  if (!role || !endpointConfig.bypassForRoles) {
    return false
  }
  return endpointConfig.bypassForRoles.includes(role)
}
