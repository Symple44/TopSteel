/**
 * Progressive Penalty Service
 * Manages escalating penalties for repeat rate limit offenders
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import type { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'
import type { RateLimitingConfiguration } from '../rate-limiting.config'

export interface PenaltyRecord {
  identifier: string
  violations: number
  lastViolation: number
  penaltyLevel: number
  totalBanTime: number
  firstViolation: number
  endpoints: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface BanRecord {
  identifier: string
  reason: string
  startTime: number
  endTime: number
  violations: number
  banLevel: number
  isActive: boolean
  canAppeal: boolean
}

export interface PenaltyAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendedAction: 'monitor' | 'warn' | 'temp_ban' | 'extended_ban' | 'permanent_ban'
  violationPattern: 'sporadic' | 'burst' | 'sustained' | 'escalating'
  trustScore: number // 0-100, lower is more suspicious
}

@Injectable()
export class ProgressivePenaltyService {
  private readonly logger = new Logger(ProgressivePenaltyService.name)
  private readonly config: RateLimitingConfiguration

  // Escalating penalty levels
  private readonly penaltyLevels = [
    {
      level: 1,
      minViolations: 5,
      banDurationMs: 5 * 60 * 1000, // 5 minutes
      severity: 'low' as const,
    },
    {
      level: 2,
      minViolations: 10,
      banDurationMs: 15 * 60 * 1000, // 15 minutes
      severity: 'low' as const,
    },
    {
      level: 3,
      minViolations: 20,
      banDurationMs: 60 * 60 * 1000, // 1 hour
      severity: 'medium' as const,
    },
    {
      level: 4,
      minViolations: 35,
      banDurationMs: 4 * 60 * 60 * 1000, // 4 hours
      severity: 'medium' as const,
    },
    {
      level: 5,
      minViolations: 50,
      banDurationMs: 12 * 60 * 60 * 1000, // 12 hours
      severity: 'high' as const,
    },
    {
      level: 6,
      minViolations: 75,
      banDurationMs: 24 * 60 * 60 * 1000, // 24 hours
      severity: 'high' as const,
    },
    {
      level: 7,
      minViolations: 100,
      banDurationMs: 3 * 24 * 60 * 60 * 1000, // 3 days
      severity: 'critical' as const,
    },
    {
      level: 8,
      minViolations: 150,
      banDurationMs: 7 * 24 * 60 * 60 * 1000, // 1 week
      severity: 'critical' as const,
    },
    {
      level: 9,
      minViolations: 200,
      banDurationMs: 30 * 24 * 60 * 60 * 1000, // 30 days
      severity: 'critical' as const,
    },
  ]

  constructor(
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
    private readonly configService?: ConfigService
  ) {
    this.config = this.configService?.get('rateLimiting') as RateLimitingConfiguration
  }

  /**
   * Record a rate limit violation and determine if penalty should be applied
   */
  async recordViolation(
    identifier: string,
    endpoint: string,
    userRole?: GlobalUserRole,
    context?: any
  ): Promise<{ shouldPenalize: boolean; penaltyLevel: number; banDurationMs?: number }> {
    if (!this.redis || !this.config?.penalties?.enabled) {
      return { shouldPenalize: false, penaltyLevel: 0 }
    }

    try {
      const now = Date.now()
      const windowStart = now - this.config.penalties.violationWindow

      // Update violation record
      const penaltyRecord = await this.updateViolationRecord(identifier, endpoint, now, windowStart)

      // Analyze violation pattern
      const analysis = await this.analyzePenaltyPattern(penaltyRecord)

      // Determine if penalty should be applied
      const penaltyLevel = this.calculatePenaltyLevel(penaltyRecord.violations, analysis)

      if (penaltyLevel > 0) {
        const penalty = this.penaltyLevels.find((p) => p.level === penaltyLevel)
        if (penalty) {
          await this.imposePenalty(identifier, penalty, penaltyRecord, userRole, context)
          return {
            shouldPenalize: true,
            penaltyLevel,
            banDurationMs: penalty.banDurationMs,
          }
        }
      }

      return { shouldPenalize: false, penaltyLevel: 0 }
    } catch (error) {
      this.logger.error(
        `Failed to record violation: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      )
      return { shouldPenalize: false, penaltyLevel: 0 }
    }
  }

  /**
   * Update violation record in Redis
   */
  private async updateViolationRecord(
    identifier: string,
    endpoint: string,
    now: number,
    windowStart: number
  ): Promise<PenaltyRecord> {
    const violationKey = `penalty:violations:${identifier}`
    const endpointKey = `penalty:endpoints:${identifier}`

    // Remove old violations outside the window
    await this.redis?.zremrangebyscore(violationKey, 0, windowStart)

    // Add current violation
    await this.redis?.zadd(violationKey, now, `${now}:${endpoint}`)
    await this.redis?.expire(violationKey, Math.ceil(this.config.penalties.violationWindow / 1000))

    // Track unique endpoints
    await this.redis?.sadd(endpointKey, endpoint)
    await this.redis?.expire(endpointKey, Math.ceil(this.config.penalties.violationWindow / 1000))

    // Get violation stats
    const violations = await this.redis?.zcard(violationKey)
    const endpoints = await this.redis?.smembers(endpointKey)
    const firstViolation = await this.redis?.zrange(violationKey, 0, 0, 'WITHSCORES')

    // Get existing penalty record
    const existingRecord = await this.redis?.hgetall(`penalty:record:${identifier}`)

    const penaltyRecord: PenaltyRecord = {
      identifier,
      violations: violations || 0,
      lastViolation: now,
      penaltyLevel: existingRecord ? Number.parseInt(existingRecord.penaltyLevel || '0', 10) : 0,
      totalBanTime: existingRecord ? Number.parseInt(existingRecord.totalBanTime || '0', 10) : 0,
      firstViolation:
        firstViolation && firstViolation.length > 0
          ? Number.parseInt(firstViolation[1] as string, 10)
          : now,
      endpoints: endpoints || [],
      severity: this.calculateSeverity(
        violations || 0,
        endpoints ? endpoints.length : 0,
        now -
          (firstViolation && firstViolation.length > 0
            ? Number.parseInt(firstViolation[1] as string, 10)
            : now)
      ),
    }

    // Update penalty record
    await this.redis?.hmset(`penalty:record:${identifier}`, {
      violations: (violations || 0).toString(),
      lastViolation: now.toString(),
      penaltyLevel: penaltyRecord.penaltyLevel.toString(),
      totalBanTime: penaltyRecord.totalBanTime.toString(),
      firstViolation: penaltyRecord.firstViolation.toString(),
      severity: penaltyRecord.severity,
      endpointCount: (endpoints ? endpoints.length : 0).toString(),
    })

    await this.redis?.expire(`penalty:record:${identifier}`, 7 * 24 * 60 * 60) // 7 days

    return penaltyRecord
  }

  /**
   * Calculate violation severity
   */
  private calculateSeverity(
    violations: number,
    _uniqueEndpoints: number,
    timeSpan: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const violationsPerHour = violations / (timeSpan / (60 * 60 * 1000))

    if (violations >= 100 || violationsPerHour >= 50) return 'critical'
    if (violations >= 50 || violationsPerHour >= 25) return 'high'
    if (violations >= 20 || violationsPerHour >= 10) return 'medium'
    return 'low'
  }

  /**
   * Analyze penalty pattern for risk assessment
   */
  private async analyzePenaltyPattern(record: PenaltyRecord): Promise<PenaltyAnalysis> {
    const timespan = record.lastViolation - record.firstViolation
    const violationsPerHour = record.violations / (timespan / (60 * 60 * 1000))
    const endpointDiversity = record.endpoints.length

    // Determine violation pattern
    let violationPattern: PenaltyAnalysis['violationPattern']
    if (violationsPerHour >= 20) {
      violationPattern = 'burst'
    } else if (violationsPerHour >= 5) {
      violationPattern = 'sustained'
    } else if (record.violations >= 50 && timespan > 60 * 60 * 1000) {
      violationPattern = 'escalating'
    } else {
      violationPattern = 'sporadic'
    }

    // Calculate trust score (0-100, lower = more suspicious)
    let trustScore = 100
    trustScore -= Math.min(50, record.violations * 2) // Max 50 points for violations
    trustScore -= Math.min(20, endpointDiversity * 3) // Max 20 points for endpoint diversity
    trustScore -= Math.min(20, violationsPerHour * 2) // Max 20 points for rate
    trustScore -= Math.min(10, record.penaltyLevel * 2) // Max 10 points for penalty history

    // Risk level assessment
    let riskLevel: PenaltyAnalysis['riskLevel']
    if (trustScore < 20 || record.severity === 'critical') {
      riskLevel = 'critical'
    } else if (trustScore < 40 || record.severity === 'high') {
      riskLevel = 'high'
    } else if (trustScore < 60 || record.severity === 'medium') {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    // Recommended action
    let recommendedAction: PenaltyAnalysis['recommendedAction']
    switch (riskLevel) {
      case 'critical':
        recommendedAction = record.violations >= 200 ? 'permanent_ban' : 'extended_ban'
        break
      case 'high':
        recommendedAction = 'temp_ban'
        break
      case 'medium':
        recommendedAction = 'warn'
        break
      default:
        recommendedAction = 'monitor'
    }

    return {
      riskLevel,
      recommendedAction,
      violationPattern,
      trustScore: Math.max(0, trustScore),
    }
  }

  /**
   * Calculate penalty level based on violations and analysis
   */
  private calculatePenaltyLevel(violations: number, analysis: PenaltyAnalysis): number {
    // Find the highest penalty level the violations qualify for
    let maxLevel = 0
    for (const penalty of this.penaltyLevels) {
      if (violations >= penalty.minViolations) {
        maxLevel = penalty.level
      }
    }

    // Adjust based on risk analysis
    if (analysis.riskLevel === 'critical' && maxLevel > 0) {
      maxLevel = Math.min(maxLevel + 2, this.penaltyLevels.length)
    } else if (analysis.riskLevel === 'high' && maxLevel > 0) {
      maxLevel = Math.min(maxLevel + 1, this.penaltyLevels.length)
    }

    return maxLevel
  }

  /**
   * Impose penalty/ban
   */
  private async imposePenalty(
    identifier: string,
    penalty: (typeof this.penaltyLevels)[0],
    record: PenaltyRecord,
    userRole?: GlobalUserRole,
    context?: any
  ): Promise<void> {
    const now = Date.now()
    const endTime = now + penalty.banDurationMs

    // Create ban record
    const banRecord: BanRecord = {
      identifier,
      reason: `Progressive penalty level ${penalty.level} for ${record.violations} violations`,
      startTime: now,
      endTime,
      violations: record.violations,
      banLevel: penalty.level,
      isActive: true,
      canAppeal: penalty.level <= 6, // Can appeal bans up to level 6
    }

    // Store ban
    const banKey = `penalty:ban:${identifier}`
    await this.redis?.hmset(banKey, {
      reason: banRecord.reason,
      startTime: banRecord.startTime.toString(),
      endTime: banRecord.endTime.toString(),
      violations: banRecord.violations.toString(),
      banLevel: banRecord.banLevel.toString(),
      isActive: 'true',
      canAppeal: banRecord.canAppeal.toString(),
      userRole: userRole || 'unknown',
    })

    await this.redis?.expire(banKey, Math.ceil(penalty.banDurationMs / 1000))

    // Update penalty record
    await this.redis?.hset(`penalty:record:${identifier}`, {
      penaltyLevel: penalty.level.toString(),
      totalBanTime: (record.totalBanTime + penalty.banDurationMs).toString(),
      lastPenalty: now.toString(),
    })

    // Log penalty
    this.logger.warn(`Progressive penalty imposed`, {
      identifier,
      level: penalty.level,
      duration: penalty.banDurationMs,
      violations: record.violations,
      severity: penalty.severity,
      userRole,
      endTime: new Date(endTime).toISOString(),
      context,
    })

    // Send alerts for high-severity penalties
    if (penalty.severity === 'high' || penalty.severity === 'critical') {
      await this.sendSecurityAlert(identifier, banRecord, record, context)
    }
  }

  /**
   * Check if identifier is currently banned
   */
  async checkBanStatus(identifier: string): Promise<{ isBanned: boolean; banRecord?: BanRecord }> {
    if (!this.redis) return { isBanned: false }

    try {
      const banKey = `penalty:ban:${identifier}`
      const banData = await this.redis.hgetall(banKey)

      if (!banData.endTime) {
        return { isBanned: false }
      }

      const endTime = Number.parseInt(banData.endTime, 10)
      const now = Date.now()

      if (endTime > now) {
        const banRecord: BanRecord = {
          identifier,
          reason: banData.reason,
          startTime: Number.parseInt(banData.startTime, 10),
          endTime,
          violations: Number.parseInt(banData.violations, 10),
          banLevel: Number.parseInt(banData.banLevel, 10),
          isActive: true,
          canAppeal: banData.canAppeal === 'true',
        }

        return { isBanned: true, banRecord }
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
   * Get penalty statistics for monitoring
   */
  async getPenaltyStats(identifier: string): Promise<PenaltyRecord | null> {
    if (!this.redis) return null

    try {
      const recordKey = `penalty:record:${identifier}`
      const _violationKey = `penalty:violations:${identifier}`
      const endpointKey = `penalty:endpoints:${identifier}`

      const record = await this.redis.hgetall(recordKey)
      if (!record.violations) return null

      const endpoints = await this.redis.smembers(endpointKey)

      return {
        identifier,
        violations: Number.parseInt(record.violations, 10),
        lastViolation: Number.parseInt(record.lastViolation, 10),
        penaltyLevel: Number.parseInt(record.penaltyLevel || '0', 10),
        totalBanTime: Number.parseInt(record.totalBanTime || '0', 10),
        firstViolation: Number.parseInt(record.firstViolation, 10),
        endpoints,
        severity: record.severity as 'low' | 'medium' | 'high' | 'critical',
      }
    } catch (error) {
      this.logger.error(
        `Failed to get penalty stats: ${error instanceof Error ? error.message : String(error)}`
      )
      return null
    }
  }

  /**
   * Clear penalties for an identifier (admin function)
   */
  async clearPenalties(identifier: string, reason = 'Admin intervention'): Promise<void> {
    if (!this.redis) return

    try {
      const keys = [
        `penalty:violations:${identifier}`,
        `penalty:endpoints:${identifier}`,
        `penalty:record:${identifier}`,
        `penalty:ban:${identifier}`,
      ]

      await this.redis.del(...keys)

      this.logger.log(`Penalties cleared for ${identifier}: ${reason}`)
    } catch (error) {
      this.logger.error(
        `Failed to clear penalties: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Send security alert for high-severity penalties
   */
  private async sendSecurityAlert(
    identifier: string,
    banRecord: BanRecord,
    penaltyRecord: PenaltyRecord,
    context?: any
  ): Promise<void> {
    // This would integrate with your notification system
    const alert = {
      type: 'SECURITY_ALERT',
      level: penaltyRecord.severity.toUpperCase(),
      title: `Progressive Penalty Level ${banRecord.banLevel} Imposed`,
      message: `Identifier ${identifier} has been banned for ${Math.round(banRecord.endTime - banRecord.startTime) / (60 * 1000)} minutes`,
      details: {
        identifier,
        violations: penaltyRecord.violations,
        penaltyLevel: banRecord.banLevel,
        banDuration: banRecord.endTime - banRecord.startTime,
        uniqueEndpoints: penaltyRecord.endpoints.length,
        severity: penaltyRecord.severity,
        canAppeal: banRecord.canAppeal,
      },
      context,
    }

    this.logger.error('SECURITY ALERT: High-severity penalty imposed', alert)

    // Could send to external systems
    // await this.notificationService.sendSecurityAlert(alert)
    // await this.slackService.sendAlert(alert)
    // await this.emailService.sendSecurityNotification(alert)
  }
}
