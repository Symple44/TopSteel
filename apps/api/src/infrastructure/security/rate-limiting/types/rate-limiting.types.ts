/**
 * Rate Limiting Types
 * Centralized type definitions for the rate limiting system
 */

import type {
  GlobalUserRole,
  SocieteRoleType,
} from '../../../../domains/auth/core/constants/roles.constants'

// Base rate limiting types
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

// Statistics and monitoring types
export interface RateLimitStats {
  identifier: string
  timeWindow: number
  violations: number
  activeRateLimits: number
  violationTimestamps: number[]
}

export interface AlertData {
  id: string
  type:
    | 'HIGH_VIOLATION_RATE'
    | 'SUSPICIOUS_PATTERN'
    | 'MASS_BLOCKING'
    | 'CREDENTIAL_STUFFING'
    | 'DDoS_PATTERN'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  identifier: string
  details: Record<string, unknown>
  resolved: boolean
  resolvedAt?: number
}

// Violation and penalty types
export interface ViolationRecord {
  timestamp: number
  endpoint: string
  violations: number
  penaltyLevel: number
}

// Ban status types
export interface BanStatus {
  isBanned: boolean
  banExpiry?: number
  reason?: string
}

// Metrics types
export interface RateLimitMetrics {
  totalRequests: number
  blockedRequests: number
  allowedRequests: number
  blockRate: number
  uniqueIPs: number
  uniqueUsers: number
  topViolators: Array<{
    identifier: string
    violations: number
    type: 'ip' | 'user'
  }>
  endpointStats: Array<{
    endpoint: string
    requests: number
    blocks: number
    blockRate: number
  }>
  roleStats: Array<{
    role: GlobalUserRole
    requests: number
    blocks: number
    users: number
  }>
  timeRange: {
    start: number
    end: number
    duration: number
  }
}

// Custom configuration types for decorators
export interface RoleBasedConfig {
  type: 'role-based'
  defaultConfig: Partial<RateLimitConfig>
  roleConfigs: Record<string, Partial<RateLimitConfig>>
}

export interface BurstConfig {
  type: 'burst'
  shortTerm: {
    windowSizeMs: number
    maxRequests: number
  }
  longTerm?: {
    windowSizeMs: number
    maxRequests: number
  }
}

export type CustomRateLimitConfig = RoleBasedConfig | BurstConfig

// Combined rate limit result
export interface CombinedRateLimitResult {
  ip: RateLimitResult
  user?: RateLimitResult
  combined: RateLimitResult & {
    limitingFactor: 'ip' | 'user' | 'both'
  }
}
