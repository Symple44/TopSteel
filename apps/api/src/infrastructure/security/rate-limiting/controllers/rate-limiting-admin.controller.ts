/**
 * Rate Limiting Administration Controller
 * Provides endpoints for monitoring and managing rate limits
 */

import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
// DTOs
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'
import { Roles } from '../../../../domains/auth/decorators/roles.decorator'
// Guards
import { JwtAuthGuard } from '../../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../domains/auth/security/guards/roles.guard'
// Services
import type { AdvancedRateLimitingService } from '../advanced-rate-limiting.service'
import type { ProgressivePenaltyService } from '../services/progressive-penalty.service'
import type { RateLimitingMonitoringService } from '../services/rate-limiting-monitoring.service'

class RateLimitMetricsDto {
  @ApiProperty({ description: 'Total number of requests' })
  totalRequests: number

  @ApiProperty({ description: 'Number of blocked requests' })
  blockedRequests: number

  @ApiProperty({ description: 'Number of allowed requests' })
  allowedRequests: number

  @ApiProperty({ description: 'Block rate as percentage' })
  blockRate: number

  @ApiProperty({ description: 'Number of unique IPs' })
  uniqueIPs: number

  @ApiProperty({ description: 'Number of unique users' })
  uniqueUsers: number
}

class ClearRateLimitDto {
  @ApiProperty({ description: 'Identifier to clear (IP or user ID)' })
  identifier: string

  @ApiProperty({ description: 'Reason for clearing', required: false })
  reason?: string
}

class CreateBanDto {
  @ApiProperty({ description: 'Identifier to ban (IP or user ID)' })
  identifier: string

  @ApiProperty({ description: 'Ban duration in milliseconds' })
  durationMs: number

  @ApiProperty({ description: 'Reason for ban' })
  reason: string
}

@ApiTags('Rate Limiting Administration')
@ApiBearerAuth()
@Controller('admin/rate-limiting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
export class RateLimitingAdminController {
  constructor(
    private readonly rateLimitService: AdvancedRateLimitingService,
    private readonly penaltyService: ProgressivePenaltyService,
    private readonly monitoringService: RateLimitingMonitoringService
  ) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Get rate limiting metrics',
    description: 'Retrieve comprehensive rate limiting statistics and metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Metrics retrieved successfully',
    type: RateLimitMetricsDto,
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    description: 'Number of hours to look back (default: 24)',
  })
  async getMetrics(@Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number) {
    const metrics = await this.monitoringService.getMetrics(hours)
    return {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    }
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Get active security alerts',
    description: 'Retrieve active security alerts from rate limiting violations',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alerts retrieved successfully' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of alerts to return (default: 50)',
  })
  async getActiveAlerts(@Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const alerts = await this.monitoringService.getActiveAlerts(limit)
    return {
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    }
  }

  @Get('violations/:identifier')
  @ApiOperation({
    summary: 'Get violation history for identifier',
    description: 'Get detailed violation history and penalty information for an IP or user',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Violation history retrieved successfully' })
  async getViolationHistory(@Param('identifier') identifier: string) {
    const [rateLimitStats, penaltyStats] = await Promise.all([
      this.rateLimitService.getRateLimitStats(identifier),
      this.penaltyService.getPenaltyStats(identifier),
    ])

    return {
      success: true,
      data: {
        identifier,
        rateLimitStats,
        penaltyStats,
        timestamp: new Date().toISOString(),
      },
    }
  }

  @Get('ban-status/:identifier')
  @ApiOperation({
    summary: 'Check ban status for identifier',
    description: 'Check if an IP or user is currently banned and get ban details',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ban status retrieved successfully' })
  async getBanStatus(@Param('identifier') identifier: string) {
    const [rateLimitBan, penaltyBan] = await Promise.all([
      this.rateLimitService.checkBanStatus(identifier),
      this.penaltyService.checkBanStatus(identifier),
    ])

    return {
      success: true,
      data: {
        identifier,
        rateLimitBan,
        penaltyBan,
        isAnyBanActive: rateLimitBan.isBanned || penaltyBan.isBanned,
        timestamp: new Date().toISOString(),
      },
    }
  }

  @Post('clear-limits')
  @ApiOperation({
    summary: 'Clear rate limits for identifier',
    description: 'Clear all rate limiting data for a specific IP or user (admin action)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rate limits cleared successfully' })
  async clearRateLimits(@Body() clearDto: ClearRateLimitDto) {
    await Promise.all([
      this.rateLimitService.clearRateLimitData(clearDto.identifier),
      this.penaltyService.clearPenalties(clearDto.identifier, clearDto.reason),
    ])

    return {
      success: true,
      message: `Rate limits cleared for ${clearDto.identifier}`,
      reason: clearDto.reason,
      timestamp: new Date().toISOString(),
    }
  }

  @Post('impose-ban')
  @ApiOperation({
    summary: 'Impose manual ban',
    description: 'Manually impose a temporary ban on an IP or user',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ban imposed successfully' })
  async imposeBan(@Body() banDto: CreateBanDto) {
    await this.rateLimitService.imposeBan(banDto.identifier, banDto.durationMs, banDto.reason)

    return {
      success: true,
      message: `Ban imposed on ${banDto.identifier}`,
      duration: banDto.durationMs,
      reason: banDto.reason,
      expiresAt: new Date(Date.now() + banDto.durationMs).toISOString(),
      timestamp: new Date().toISOString(),
    }
  }

  @Delete('ban/:identifier')
  @ApiOperation({
    summary: 'Remove ban',
    description: 'Remove an active ban from an IP or user (admin action)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ban removed successfully' })
  async removeBan(
    @Param('identifier') identifier: string,
    @Query('reason') reason = 'Admin intervention'
  ) {
    await Promise.all([
      this.rateLimitService.clearRateLimitData(identifier),
      this.penaltyService.clearPenalties(identifier, reason),
    ])

    return {
      success: true,
      message: `Ban removed for ${identifier}`,
      reason,
      timestamp: new Date().toISOString(),
    }
  }

  @Get('top-violators')
  @ApiOperation({
    summary: 'Get top violators',
    description: 'Get list of IPs and users with the most rate limiting violations',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Top violators retrieved successfully' })
  @ApiQuery({
    name: 'hours',
    required: false,
    description: 'Number of hours to look back (default: 24)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of violators to return (default: 20)',
  })
  async getTopViolators(
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    const metrics = await this.monitoringService.getMetrics(hours)
    const topViolators = metrics.topViolators.slice(0, limit)

    return {
      success: true,
      data: topViolators,
      timeRange: metrics.timeRange,
      timestamp: new Date().toISOString(),
    }
  }

  @Get('endpoint-stats')
  @ApiOperation({
    summary: 'Get endpoint statistics',
    description: 'Get rate limiting statistics per endpoint',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Endpoint statistics retrieved successfully' })
  @ApiQuery({
    name: 'hours',
    required: false,
    description: 'Number of hours to look back (default: 24)',
  })
  async getEndpointStats(@Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number) {
    const metrics = await this.monitoringService.getMetrics(hours)

    return {
      success: true,
      data: {
        endpointStats: metrics.endpointStats,
        timeRange: metrics.timeRange,
      },
      timestamp: new Date().toISOString(),
    }
  }

  @Get('role-stats')
  @ApiOperation({
    summary: 'Get role-based statistics',
    description: 'Get rate limiting statistics per user role',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role statistics retrieved successfully' })
  @ApiQuery({
    name: 'hours',
    required: false,
    description: 'Number of hours to look back (default: 24)',
  })
  async getRoleStats(@Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number) {
    const metrics = await this.monitoringService.getMetrics(hours)

    return {
      success: true,
      data: {
        roleStats: metrics.roleStats,
        timeRange: metrics.timeRange,
      },
      timestamp: new Date().toISOString(),
    }
  }

  @Get('system-health')
  @ApiOperation({
    summary: 'Get rate limiting system health',
    description: 'Get overall health and status of the rate limiting system',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'System health retrieved successfully' })
  async getSystemHealth() {
    const metrics = await this.monitoringService.getMetrics(1) // Last hour
    const alerts = await this.monitoringService.getActiveAlerts(10)

    // Calculate health score based on various factors
    const healthScore = this.calculateHealthScore(metrics, alerts)

    // Determine system status
    const systemStatus =
      healthScore >= 90
        ? 'healthy'
        : healthScore >= 70
          ? 'warning'
          : healthScore >= 50
            ? 'degraded'
            : 'critical'

    return {
      success: true,
      data: {
        systemStatus,
        healthScore,
        metrics: {
          totalRequests: metrics.totalRequests,
          blockRate: metrics.blockRate,
          uniqueIPs: metrics.uniqueIPs,
          uniqueUsers: metrics.uniqueUsers,
        },
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
        highAlerts: alerts.filter((a) => a.severity === 'high').length,
        timestamp: new Date().toISOString(),
      },
    }
  }

  @Post('test-rate-limit')
  @ApiOperation({
    summary: 'Test rate limiting configuration',
    description: 'Test rate limiting for a specific identifier and endpoint (admin testing)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rate limit test completed' })
  async testRateLimit(
    @Body() testData: { identifier: string; endpoint: string; userRole?: GlobalUserRole }
  ) {
    const config = {
      windowSizeMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyPrefix: 'test',
    }

    const result = await this.rateLimitService.checkRateLimit(testData.identifier, config, {
      userId: testData.identifier.startsWith('user:')
        ? testData.identifier.substring(5)
        : undefined,
      globalRole: testData.userRole,
      ip: testData.identifier.startsWith('ip:') ? testData.identifier.substring(3) : '127.0.0.1',
      isAuthenticated: testData.identifier.startsWith('user:'),
    })

    return {
      success: true,
      data: {
        testConfig: config,
        result,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Calculate system health score based on metrics and alerts
   */
  private calculateHealthScore(metrics: unknown, alerts: unknown[]): number {
    let score = 100

    // Deduct points for high block rate
    if (metrics.blockRate > 0.5)
      score -= 30 // >50% block rate
    else if (metrics.blockRate > 0.2)
      score -= 15 // >20% block rate
    else if (metrics.blockRate > 0.1) score -= 5 // >10% block rate

    // Deduct points for active alerts
    score -= alerts.length * 2 // 2 points per alert

    // Deduct extra points for critical alerts
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length
    score -= criticalAlerts * 10

    // Deduct points for high alert rate
    const highAlerts = alerts.filter((a) => a.severity === 'high').length
    score -= highAlerts * 5

    return Math.max(0, Math.min(100, score))
  }
}
