/**
 * Rate Limiting Monitoring Service
 * Provides metrics, alerts, and analytics for rate limiting
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import type { Redis } from 'ioredis'
import type { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'
import type { RateLimitingConfiguration } from '../rate-limiting.config'

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

export interface SecurityAlert {
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

export interface ThreatIntelligence {
  suspiciousIPs: string[]
  attackPatterns: Array<{
    pattern: string
    frequency: number
    lastSeen: number
  }>
  geographicDistribution: Record<string, number>
  userAgentAnalysis: Array<{
    userAgent: string
    requestCount: number
    suspiciousScore: number
  }>
}

@Injectable()
export class RateLimitingMonitoringService {
  private readonly logger = new Logger(RateLimitingMonitoringService.name)
  private readonly config: RateLimitingConfiguration

  constructor(
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
    private readonly configService?: ConfigService
  ) {
    this.config = this.configService?.get('rateLimiting') as RateLimitingConfiguration
  }

  /**
   * Record a rate limit event for monitoring
   */
  async recordEvent(
    type: 'request' | 'block' | 'allow',
    identifier: string,
    endpoint: string,
    metadata?: {
      userRole?: GlobalUserRole
      ip?: string
      userId?: string
      userAgent?: string
      method?: string
    }
  ): Promise<void> {
    if (!this.redis || !this.config?.monitoring?.enabled) return

    const now = Date.now()
    const hourBucket = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000)
    const dayBucket = Math.floor(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000)

    try {
      // Use pipeline for better performance
      const pipeline = this.redis.pipeline()

      // Global counters
      pipeline.incr(`rate_limit_metrics:${type}:hour:${hourBucket}`)
      pipeline.expire(`rate_limit_metrics:${type}:hour:${hourBucket}`, 25 * 60 * 60) // 25 hours
      pipeline.incr(`rate_limit_metrics:${type}:day:${dayBucket}`)
      pipeline.expire(`rate_limit_metrics:${type}:day:${dayBucket}`, 8 * 24 * 60 * 60) // 8 days

      // Identifier tracking
      if (type === 'block') {
        pipeline.zincrby(`rate_limit_violators:hour:${hourBucket}`, 1, identifier)
        pipeline.expire(`rate_limit_violators:hour:${hourBucket}`, 25 * 60 * 60)
      }

      // Endpoint tracking
      pipeline.hincrby(`rate_limit_endpoints:${type}:hour:${hourBucket}`, endpoint, 1)
      pipeline.expire(`rate_limit_endpoints:${type}:hour:${hourBucket}`, 25 * 60 * 60)

      // Role tracking (if available)
      if (metadata?.userRole) {
        pipeline.hincrby(`rate_limit_roles:${type}:hour:${hourBucket}`, metadata.userRole, 1)
        pipeline.expire(`rate_limit_roles:${type}:hour:${hourBucket}`, 25 * 60 * 60)
      }

      // IP tracking
      if (metadata?.ip) {
        pipeline.sadd(`rate_limit_ips:hour:${hourBucket}`, metadata.ip)
        pipeline.expire(`rate_limit_ips:hour:${hourBucket}`, 25 * 60 * 60)

        if (type === 'block') {
          pipeline.zincrby(`rate_limit_blocked_ips:hour:${hourBucket}`, 1, metadata.ip)
          pipeline.expire(`rate_limit_blocked_ips:hour:${hourBucket}`, 25 * 60 * 60)
        }
      }

      // User tracking
      if (metadata?.userId) {
        pipeline.sadd(`rate_limit_users:hour:${hourBucket}`, metadata.userId)
        pipeline.expire(`rate_limit_users:hour:${hourBucket}`, 25 * 60 * 60)
      }

      // User agent tracking (for suspicious pattern detection)
      if (metadata?.userAgent && type === 'block') {
        pipeline.hincrby(`rate_limit_user_agents:hour:${hourBucket}`, metadata.userAgent, 1)
        pipeline.expire(`rate_limit_user_agents:hour:${hourBucket}`, 25 * 60 * 60)
      }

      await pipeline.exec()

      // Check for alerts if this is a block
      if (type === 'block') {
        await this.checkForAlerts(identifier, endpoint, metadata)
      }
    } catch (error) {
      this.logger.error(
        `Failed to record rate limit event: ${error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)}`
      )
    }
  }

  /**
   * Get rate limiting metrics for a time period
   */
  async getMetrics(hoursBack = 24): Promise<RateLimitMetrics> {
    if (!this.redis) {
      return this.getEmptyMetrics()
    }

    const now = Date.now()
    const start = now - hoursBack * 60 * 60 * 1000
    const hourBuckets = this.generateHourBuckets(start, now)

    try {
      let totalRequests = 0
      let blockedRequests = 0
      const uniqueIPs = new Set<string>()
      const uniqueUsers = new Set<string>()
      const violatorCounts = new Map<string, number>()
      const endpointStats = new Map<string, { requests: number; blocks: number }>()
      const roleStats = new Map<
        GlobalUserRole,
        { requests: number; blocks: number; users: Set<string> }
      >()

      // Aggregate data from all hour buckets
      for (const bucket of hourBuckets) {
        // Get basic counts
        const [requests, blocks] = await Promise.all([
          this.redis
            .get(`rate_limit_metrics:request:hour:${bucket}`)
            .then((v) => Number.parseInt(v || '0', 10)),
          this.redis
            .get(`rate_limit_metrics:block:hour:${bucket}`)
            .then((v) => Number.parseInt(v || '0', 10)),
        ])

        totalRequests += requests
        blockedRequests += blocks

        // Get unique IPs and users
        const [ips, users] = await Promise.all([
          this.redis.smembers(`rate_limit_ips:hour:${bucket}`),
          this.redis.smembers(`rate_limit_users:hour:${bucket}`),
        ])

        for (const ip of ips) {
          uniqueIPs.add(ip)
        }
        for (const user of users) {
          uniqueUsers.add(user)
        }

        // Get violators
        const violators = await this.redis.zrevrange(
          `rate_limit_violators:hour:${bucket}`,
          0,
          -1,
          'WITHSCORES'
        )
        for (let i = 0; i < violators.length; i += 2) {
          const identifier = violators[i] as string
          const count = Number.parseInt(violators[i + 1] as string, 10)
          violatorCounts.set(identifier, (violatorCounts.get(identifier) || 0) + count)
        }

        // Get endpoint stats
        const [endpointRequests, endpointBlocks] = await Promise.all([
          this.redis.hgetall(`rate_limit_endpoints:request:hour:${bucket}`),
          this.redis.hgetall(`rate_limit_endpoints:block:hour:${bucket}`),
        ])

        for (const [endpoint, count] of Object.entries(endpointRequests)) {
          const current = endpointStats.get(endpoint) || { requests: 0, blocks: 0 }
          current.requests += Number.parseInt(count, 10)
          endpointStats.set(endpoint, current)
        }

        for (const [endpoint, count] of Object.entries(endpointBlocks)) {
          const current = endpointStats.get(endpoint) || { requests: 0, blocks: 0 }
          current.blocks += Number.parseInt(count, 10)
          endpointStats.set(endpoint, current)
        }

        // Get role stats
        const [roleRequests, roleBlocks] = await Promise.all([
          this.redis.hgetall(`rate_limit_roles:request:hour:${bucket}`),
          this.redis.hgetall(`rate_limit_roles:block:hour:${bucket}`),
        ])

        for (const [role, count] of Object.entries(roleRequests)) {
          const current = roleStats.get(role as GlobalUserRole) || {
            requests: 0,
            blocks: 0,
            users: new Set(),
          }
          current.requests += Number.parseInt(count, 10)
          roleStats.set(role as GlobalUserRole, current)
        }

        for (const [role, count] of Object.entries(roleBlocks)) {
          const current = roleStats.get(role as GlobalUserRole) || {
            requests: 0,
            blocks: 0,
            users: new Set(),
          }
          current.blocks += Number.parseInt(count, 10)
          roleStats.set(role as GlobalUserRole, current)
        }
      }

      // Format results
      const topViolators = Array.from(violatorCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([identifier, violations]) => ({
          identifier,
          violations,
          type: identifier.startsWith('user:') ? ('user' as const) : ('ip' as const),
        }))

      const endpointStatsArray = Array.from(endpointStats.entries())
        .map(([endpoint, stats]) => ({
          endpoint,
          requests: stats.requests,
          blocks: stats.blocks,
          blockRate: stats.requests > 0 ? stats.blocks / stats.requests : 0,
        }))
        .sort((a, b) => b.requests - a.requests)

      const roleStatsArray = Array.from(roleStats.entries())
        .map(([role, stats]) => ({
          role,
          requests: stats.requests,
          blocks: stats.blocks,
          users: stats.users.size,
        }))
        .sort((a, b) => b.requests - a.requests)

      return {
        totalRequests,
        blockedRequests,
        allowedRequests: totalRequests - blockedRequests,
        blockRate: totalRequests > 0 ? blockedRequests / totalRequests : 0,
        uniqueIPs: uniqueIPs.size,
        uniqueUsers: uniqueUsers.size,
        topViolators,
        endpointStats: endpointStatsArray,
        roleStats: roleStatsArray,
        timeRange: {
          start,
          end: now,
          duration: now - start,
        },
      }
    } catch (error) {
      this.logger.error(
        `Failed to get rate limiting metrics: ${error instanceof Error ? error.message : String(error)}`
      )
      return this.getEmptyMetrics()
    }
  }

  /**
   * Check for security alerts based on current activity
   */
  private async checkForAlerts(
    identifier: string,
    endpoint: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.redis) return

    const now = Date.now()
    const hourBucket = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000)

    try {
      // Check for high violation rates
      const violationCount = await this.redis.zscore(
        `rate_limit_violators:hour:${hourBucket}`,
        identifier
      )
      if (
        violationCount &&
        Number.parseInt(violationCount.toString(), 10) >= this.config.monitoring.alertThreshold
      ) {
        await this.createAlert('HIGH_VIOLATION_RATE', 'high', identifier, {
          violations: violationCount,
          timeWindow: '1 hour',
          endpoint,
          metadata,
        })
      }

      // Check for suspicious patterns (same endpoint, different IPs)
      if (metadata?.ip) {
        const endpointBlocks = await this.redis.hget(
          `rate_limit_endpoints:block:hour:${hourBucket}`,
          endpoint
        )
        if (endpointBlocks && Number.parseInt(endpointBlocks, 10) >= 50) {
          await this.createAlert('SUSPICIOUS_PATTERN', 'medium', endpoint, {
            blocks: endpointBlocks,
            endpoint,
            timeWindow: '1 hour',
          })
        }
      }

      // Check for mass blocking (potential DDoS)
      const totalBlocks = await this.redis.get(`rate_limit_metrics:block:hour:${hourBucket}`)
      if (totalBlocks && Number.parseInt(totalBlocks, 10) >= 1000) {
        await this.createAlert('MASS_BLOCKING', 'critical', 'system', {
          totalBlocks,
          timeWindow: '1 hour',
        })
      }
    } catch (error) {
      this.logger.error(
        `Failed to check for alerts: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Create a security alert
   */
  private async createAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    identifier: string,
    details: Record<string, unknown>
  ): Promise<void> {
    if (!this.redis) return

    const alert: SecurityAlert = {
      id: `${type}_${identifier}_${Date.now()}`,
      type,
      severity,
      timestamp: Date.now(),
      identifier,
      details,
      resolved: false,
    }

    try {
      // Store alert
      await this.redis.hset(`rate_limit_alerts:${alert.id}`, {
        type: alert.type,
        severity: alert.severity,
        timestamp: alert.timestamp.toString(),
        identifier: alert.identifier,
        details: JSON.stringify(alert.details),
        resolved: alert.resolved.toString(),
      })

      // Add to active alerts list
      await this.redis.zadd('rate_limit_alerts:active', alert.timestamp, alert.id)

      // Set expiration
      await this.redis.expire(`rate_limit_alerts:${alert.id}`, 7 * 24 * 60 * 60) // 7 days

      this.logger.warn(`Security alert created: ${type}`, {
        alertId: alert.id,
        severity,
        identifier,
        details,
      })

      // Send external notifications for high-severity alerts
      if (severity === 'high' || severity === 'critical') {
        await this.sendExternalAlert(alert)
      }
    } catch (error) {
      this.logger.error(
        `Failed to create alert: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Get active security alerts
   */
  async getActiveAlerts(limit = 50): Promise<SecurityAlert[]> {
    if (!this.redis) return []

    try {
      const alertIds = await this.redis.zrevrange('rate_limit_alerts:active', 0, limit - 1)
      const alerts: SecurityAlert[] = []

      for (const alertId of alertIds) {
        const alertData = await this.redis.hgetall(`rate_limit_alerts:${alertId}`)
        if (alertData.type) {
          alerts.push({
            id: alertId,
            type: alertData.type as SecurityAlert['type'],
            severity: alertData.severity as SecurityAlert['severity'],
            timestamp: Number.parseInt(alertData.timestamp, 10),
            identifier: alertData.identifier,
            details: JSON.parse(alertData.details || '{}'),
            resolved: alertData.resolved === 'true',
            resolvedAt: alertData.resolvedAt
              ? Number.parseInt(alertData.resolvedAt, 10)
              : undefined,
          })
        }
      }

      return alerts
    } catch (error) {
      this.logger.error(
        `Failed to get active alerts: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  /**
   * Periodic cleanup of old metrics and alerts
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldData(): Promise<void> {
    if (!this.redis) return

    const now = Date.now()
    const oldHour = now - 25 * 60 * 60 * 1000 // 25 hours ago
    const _oldDay = now - 8 * 24 * 60 * 60 * 1000 // 8 days ago

    try {
      // Clean old hourly metrics
      const hourPattern = Math.floor(oldHour / (60 * 60 * 1000)) * (60 * 60 * 1000)
      const keysToDelete = [
        `rate_limit_metrics:*:hour:${hourPattern}`,
        `rate_limit_violators:hour:${hourPattern}`,
        `rate_limit_endpoints:*:hour:${hourPattern}`,
        `rate_limit_roles:*:hour:${hourPattern}`,
        `rate_limit_ips:hour:${hourPattern}`,
        `rate_limit_blocked_ips:hour:${hourPattern}`,
        `rate_limit_users:hour:${hourPattern}`,
        `rate_limit_user_agents:hour:${hourPattern}`,
      ]

      for (const pattern of keysToDelete) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }

      // Clean resolved alerts older than 7 days
      const oldAlertTime = now - 7 * 24 * 60 * 60 * 1000
      await this.redis.zremrangebyscore('rate_limit_alerts:active', 0, oldAlertTime)

      this.logger.debug('Rate limiting metrics cleanup completed')
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old data: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Generate hour buckets for time range
   */
  private generateHourBuckets(start: number, end: number): number[] {
    const buckets: number[] = []
    let current = Math.floor(start / (60 * 60 * 1000)) * (60 * 60 * 1000)

    while (current < end) {
      buckets.push(current)
      current += 60 * 60 * 1000
    }

    return buckets
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): RateLimitMetrics {
    const now = Date.now()
    return {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      blockRate: 0,
      uniqueIPs: 0,
      uniqueUsers: 0,
      topViolators: [],
      endpointStats: [],
      roleStats: [],
      timeRange: {
        start: now - 24 * 60 * 60 * 1000,
        end: now,
        duration: 24 * 60 * 60 * 1000,
      },
    }
  }

  /**
   * Send external alert notifications
   */
  private async sendExternalAlert(alert: SecurityAlert): Promise<void> {
    // This would integrate with your notification systems
    this.logger.error(`RATE LIMITING SECURITY ALERT: ${alert.type}`, {
      severity: alert.severity,
      identifier: alert.identifier,
      details: alert.details,
    })

    // Could integrate with:
    // - Sentry for error tracking
    // - Slack for team notifications
    // - Email for admin alerts
    // - PagerDuty for critical issues
    // - External SIEM systems
  }
}
