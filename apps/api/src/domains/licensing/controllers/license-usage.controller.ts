import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'
import { Roles } from '../../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/security/guards/roles.guard'
import {
  CheckThresholdDto,
  RecordUsageDto,
  UsageByMetricQueryDto,
  UsageStatsQueryDto,
} from '../dto/usage.dto'
import { LicensePrismaService } from '../prisma/license-prisma.service'
import { UsageMetricType } from '@prisma/client'

/**
 * License Usage Controller
 *
 * Gestion et monitoring de l'usage des licenses
 * - Enregistrer usage
 * - Récupérer statistiques
 * - Analytics par métrique
 * - Vérifier seuils
 *
 * Routes: /api/licensing/licenses/:licenseId/usage/...
 */
@ApiTags('Licensing - Usage Analytics')
@ApiBearerAuth()
@Controller('api/licensing/licenses/:licenseId/usage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LicenseUsageController {
  constructor(private readonly licenseService: LicensePrismaService) {}

  /**
   * Enregistrer un usage
   */
  @Post()
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Enregistrer un usage de license' })
  @ApiResponse({ status: 201, description: 'Usage enregistré' })
  @ApiResponse({ status: 404, description: 'License non trouvée' })
  async recordUsage(@Param('licenseId') licenseId: string, @Body() usageDto: RecordUsageDto) {
    return await this.licenseService.recordUsage(licenseId, {
      metricType: usageDto.metricType,
      metricName: usageDto.metricName,
      value: usageDto.value,
      limit: usageDto.limit,
      breakdown: usageDto.breakdown,
      metadata: usageDto.metadata,
    })
  }

  /**
   * Récupérer les statistiques d'usage
   */
  @Get('stats')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer les statistiques d\'usage' })
  @ApiResponse({ status: 200, description: 'Statistiques d\'usage' })
  async getUsageStats(
    @Param('licenseId') licenseId: string,
    @Query() queryDto: UsageStatsQueryDto
  ) {
    const period = queryDto.period || 'month'
    return await this.licenseService.getUsageStats(licenseId, period as any)
  }

  /**
   * Récupérer l'usage par type de métrique
   */
  @Get('metrics/:metricType')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer l\'usage par type de métrique' })
  @ApiResponse({ status: 200, description: 'Usage par métrique' })
  async getUsageByMetric(
    @Param('licenseId') licenseId: string,
    @Param('metricType') metricType: UsageMetricType,
    @Query() queryDto: UsageByMetricQueryDto
  ) {
    // Get all usage for this license and filter by metric type
    const license = await this.licenseService.findById(licenseId)
    const usage = (license as any)?.usage || []

    return usage.filter((u: any) => u.metricType === metricType)
  }

  /**
   * Vérifier si un seuil d'usage est dépassé
   */
  @Post('check-threshold')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Vérifier si un seuil d\'usage est dépassé' })
  @ApiResponse({ status: 200, description: 'Résultat de la vérification' })
  async checkUsageThreshold(
    @Param('licenseId') licenseId: string,
    @Body() thresholdDto: CheckThresholdDto
  ) {
    // Get latest usage for this metric type
    const license = await this.licenseService.findById(licenseId)
    const usage = (license as any)?.usage || []
    const latestUsage = usage
      .filter((u: any) => u.metricType === thresholdDto.metricType)
      .sort((a: any, b: any) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0]

    if (!latestUsage) {
      return { thresholdExceeded: false, usage: null }
    }

    const threshold = thresholdDto.threshold || 80
    const percentage = latestUsage.limit ? (latestUsage.value / latestUsage.limit) * 100 : 0

    return {
      thresholdExceeded: percentage >= threshold,
      percentage,
      threshold,
      currentValue: latestUsage.value,
      limit: latestUsage.limit,
      usage: latestUsage,
    }
  }

  /**
   * Récupérer toutes les données d'usage (analytics dashboard)
   */
  @Get('analytics')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer toutes les données analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics complet' })
  async getUsageAnalytics(@Param('licenseId') licenseId: string) {
    // Get license with usage included
    const license = await this.licenseService.findById(licenseId)

    // Get stats for different periods
    const [dayStats, weekStats, monthStats] = await Promise.all([
      this.licenseService.getUsageStats(licenseId, 'day'),
      this.licenseService.getUsageStats(licenseId, 'week'),
      this.licenseService.getUsageStats(licenseId, 'month'),
    ])

    return {
      license: {
        id: (license as any)?.id,
        licenseKey: (license as any)?.licenseKey,
        status: (license as any)?.status,
      },
      usage: (license as any)?.usage || [],
      stats: {
        day: dayStats,
        week: weekStats,
        month: monthStats,
      },
    }
  }

  /**
   * Récupérer l'historique complet d'usage
   */
  @Get('history')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer l\'historique complet d\'usage' })
  @ApiResponse({ status: 200, description: 'Historique d\'usage' })
  async getUsageHistory(@Param('licenseId') licenseId: string) {
    const license = await this.licenseService.findById(licenseId)
    return (license as any)?.usage || []
  }
}
