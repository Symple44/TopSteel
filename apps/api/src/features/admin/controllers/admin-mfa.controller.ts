import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import type { AuthPerformanceService } from '../../../domains/auth/services/auth-performance.service'
import type { MFAService } from '../../../domains/auth/services/mfa.service'

@Controller('admin/mfa')
@ApiTags('🔧 Admin - Multi-Factor Authentication')
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminMFAController {
  constructor(
    private readonly mfaService: MFAService,
    private readonly performanceService: AuthPerformanceService
  ) {}

  @Get('status')
  @ApiOperation({ summary: "Obtenir l'état global MFA du système" })
  @ApiResponse({ status: 200, description: 'État MFA récupéré avec succès' })
  async getMFAStatus() {
    return this.performanceService.trackOperation('admin_mfa_status', async () => {
      const status = await this.mfaService.getAdminMFAStatus()

      return {
        success: true,
        data: {
          ...status,
          complianceRate:
            status.totalUsers > 0 ? (status.usersWithMFA / status.totalUsers) * 100 : 0,
          recommendations: this.generateMFARecommendations(status),
          timestamp: new Date(),
        },
      }
    })
  }

  @Get('users/:userId')
  @ApiOperation({ summary: "Obtenir l'état MFA d'un utilisateur spécifique" })
  @ApiResponse({ status: 200, description: 'État MFA utilisateur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserMFAStatus(@Param('userId') userId: string) {
    try {
      const mfaMethods = await this.mfaService.getUserMFAMethods(userId)
      const hasMFAEnabled = await this.mfaService.hasMFAEnabled(userId)
      const isMFARequired = await this.mfaService.isMFARequiredForUser(userId)
      const stats = await this.mfaService.getMFAStats(userId)

      return {
        success: true,
        data: {
          userId,
          hasMFAEnabled,
          isMFARequired,
          methods: mfaMethods.map((method) => ({
            id: method.id,
            type: method.type,
            isEnabled: method.isEnabled,
            isVerified: method.isVerified,
            lastUsed: method.lastUsedAt,
            createdAt: method.createdAt,
            metadata: {
              usageCount: method.metadata?.usageCount || 0,
              failedAttempts: method.metadata?.failedAttempts || 0,
              deviceInfo:
                method.type === 'webauthn'
                  ? method.webauthnCredentials?.map((cred) => ({
                      deviceName: cred.deviceName,
                      createdAt: cred.createdAt,
                    }))
                  : undefined,
            },
          })),
          stats,
          compliance: {
            status: this.getMFAComplianceStatus(hasMFAEnabled, isMFARequired),
            recommendation: this.getMFARecommendation(hasMFAEnabled, isMFARequired, stats),
          },
        },
      }
    } catch (_error) {
      throw new NotFoundException('Utilisateur non trouvé ou erreur lors de la récupération')
    }
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Lister les sessions MFA actives' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'verified', 'expired', 'failed'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Sessions MFA récupérées avec succès' })
  async getMFASessions(
    @Query('status') status?: 'pending' | 'verified' | 'expired' | 'failed',
    @Query('userId') userId?: string,
    @Query('limit') limit = 50
  ) {
    try {
      const queryBuilder = this.mfaService.mfaSessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.user', 'user')
        .orderBy('session.createdAt', 'DESC')
        .limit(limit)

      if (status) {
        queryBuilder.andWhere('session.status = :status', { status })
      }

      if (userId) {
        queryBuilder.andWhere('session.userId = :userId', { userId })
      }

      const sessions = await queryBuilder.getMany()

      return {
        success: true,
        data: sessions.map((session) => ({
          id: session.id,
          userId: session.userId,
          sessionToken: `${session.sessionToken.substring(0, 8)}***`, // Masked for security
          status: session.status,
          mfaType: session.mfaType,
          ipAddress: session.ipAddress,
          userAgent: `${session.userAgent?.substring(0, 100)}...`,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isExpired: session.isExpired(),
          attemptsCount: session.getAttemptsCount(),
        })),
        meta: {
          total: sessions.length,
          limit,
          filters: { status, userId },
        },
      }
    } catch (_error) {
      throw new BadRequestException('Erreur lors de la récupération des sessions MFA')
    }
  }

  @Delete('sessions/expired')
  @ApiOperation({ summary: 'Nettoyer les sessions MFA expirées' })
  @ApiResponse({ status: 200, description: 'Sessions expirées nettoyées avec succès' })
  async cleanupExpiredSessions() {
    const cleanedCount = await this.mfaService.cleanupExpiredSessions()

    return {
      success: true,
      data: {
        cleanedCount,
        message: `${cleanedCount} session(s) MFA expirée(s) ont été supprimées`,
      },
    }
  }

  @Post('users/:userId/reset')
  @ApiOperation({ summary: 'Réinitialiser MFA pour un utilisateur' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Raison de la réinitialisation' },
        disableOnly: {
          type: 'boolean',
          description: 'Désactiver seulement sans supprimer',
          default: false,
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'MFA réinitialisé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async resetUserMFA(
    @Param('userId') userId: string,
    @Body() body: { reason: string; disableOnly?: boolean }
  ) {
    try {
      const mfaMethods = await this.mfaService.getUserMFAMethods(userId)

      if (mfaMethods.length === 0) {
        return {
          success: true,
          message: 'Aucune méthode MFA à réinitialiser',
        }
      }

      let resetCount = 0
      for (const method of mfaMethods) {
        if (body.disableOnly) {
          method.disable()
          await this.mfaService.userMFARepository.save(method)
        } else {
          await this.mfaService.userMFARepository.remove(method)
        }
        resetCount++
      }

      // Invalider le cache MFA
      await this.mfaService.invalidateMFACache(userId)

      return {
        success: true,
        data: {
          resetCount,
          disableOnly: body.disableOnly || false,
          reason: body.reason,
          timestamp: new Date(),
        },
        message: `${resetCount} méthode(s) MFA ${body.disableOnly ? 'désactivée(s)' : 'supprimée(s)'}`,
      }
    } catch (_error) {
      throw new BadRequestException('Erreur lors de la réinitialisation MFA')
    }
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Analyses et statistiques MFA' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d'],
    description: "Période d'analyse",
  })
  @ApiResponse({ status: 200, description: 'Analyses MFA récupérées avec succès' })
  async getMFAAnalytics(@Query('period') period = '30d') {
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      // Get usage statistics
      const mfaRecords = await this.mfaService.userMFARepository
        .createQueryBuilder('mfa')
        .where('mfa.lastUsedAt >= :since', { since })
        .getMany()

      // Get session statistics
      const mfaSessions = await this.mfaService.mfaSessionRepository
        .createQueryBuilder('session')
        .where('session.createdAt >= :since', { since })
        .getMany()

      const analytics = {
        period: `${days} days`,
        mfaUsage: {
          totalAuthentications: mfaSessions.length,
          successfulAuthentications: mfaSessions.filter((s) => s.status === 'verified').length,
          failedAuthentications: mfaSessions.filter((s) => s.status === 'failed').length,
          expiredSessions: mfaSessions.filter((s) => s.status === 'expired').length,
        },
        methodPopularity: this.calculateMethodPopularity(mfaRecords),
        securityMetrics: {
          averageAttemptsPerSession: this.calculateAverageAttempts(mfaSessions),
          mostActiveHours: this.calculateActiveHours(mfaSessions),
          topFailureReasons: this.calculateFailureReasons(mfaSessions),
        },
        trends: {
          adoptionRate: await this.calculateAdoptionTrend(days),
          usageGrowth: this.calculateUsageGrowth(mfaSessions),
        },
      }

      return {
        success: true,
        data: analytics,
      }
    } catch (_error) {
      throw new BadRequestException('Erreur lors de la récupération des analyses MFA')
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Vérification de santé du système MFA' })
  @ApiResponse({ status: 200, description: 'État de santé MFA récupéré avec succès' })
  async getMFAHealth() {
    try {
      const status = await this.mfaService.getAdminMFAStatus()
      const recentSessions = await this.mfaService.mfaSessionRepository
        .createQueryBuilder('session')
        .where('session.createdAt >= :since', { since: new Date(Date.now() - 24 * 60 * 60 * 1000) })
        .getCount()

      const health = {
        overall: 'healthy',
        checks: {
          mfaAdoption: {
            status: status.usersWithMFA > status.totalUsers * 0.5 ? 'good' : 'warning',
            value: `${((status.usersWithMFA / status.totalUsers) * 100).toFixed(1)}%`,
            threshold: '> 50%',
          },
          recentActivity: {
            status: recentSessions > 0 ? 'good' : 'info',
            value: recentSessions,
            description: 'Sessions MFA dernières 24h',
          },
          methodDiversity: {
            status: Object.keys(status.mfaMethodDistribution).length > 1 ? 'good' : 'warning',
            value: Object.keys(status.mfaMethodDistribution).length,
            description: 'Nombre de méthodes MFA utilisées',
          },
        },
        recommendations: this.generateHealthRecommendations(status, recentSessions),
      }

      return {
        success: true,
        data: health,
      }
    } catch (_error) {
      throw new BadRequestException('Erreur lors de la vérification de santé MFA')
    }
  }

  // Helper methods
  private generateMFARecommendations(status: any): string[] {
    const recommendations: string[] = []

    const adoptionRate = status.totalUsers > 0 ? (status.usersWithMFA / status.totalUsers) * 100 : 0

    if (adoptionRate < 50) {
      recommendations.push("Encourager l'adoption MFA - taux actuel faible")
    }

    if (!status.mfaMethodDistribution.totp) {
      recommendations.push('Promouvoir TOTP comme méthode MFA principale')
    }

    if (status.usersByRole.SUPER_ADMIN?.withMFA < status.usersByRole.SUPER_ADMIN?.total) {
      recommendations.push('Assurer que tous les SUPER_ADMIN ont MFA activé')
    }

    return recommendations.length > 0 ? recommendations : ['Système MFA bien configuré']
  }

  private getMFAComplianceStatus(hasMFA: boolean, isRequired: boolean): string {
    if (isRequired && hasMFA) return 'compliant'
    if (isRequired && !hasMFA) return 'non_compliant'
    if (!isRequired && hasMFA) return 'voluntary'
    return 'not_applicable'
  }

  private getMFARecommendation(hasMFA: boolean, isRequired: boolean, stats: any): string {
    if (isRequired && !hasMFA) return 'MFA requis pour ce rôle - configuration nécessaire'
    if (!hasMFA) return 'MFA recommandé pour améliorer la sécurité'
    if (stats.securityLevel === 'basic') return "Considérer l'ajout d'une seconde méthode MFA"
    return 'Configuration MFA optimale'
  }

  private calculateMethodPopularity(records: any[]): Record<string, number> {
    const popularity: Record<string, number> = {}
    for (const record of records) {
      popularity[record.type] = (popularity[record.type] || 0) + 1
    }
    return popularity
  }

  private calculateAverageAttempts(sessions: any[]): number {
    if (sessions.length === 0) return 0
    const totalAttempts = sessions.reduce(
      (sum, session) => sum + (session.getAttemptsCount() || 1),
      0
    )
    return totalAttempts / sessions.length
  }

  private calculateActiveHours(sessions: any[]): number[] {
    const hourCounts = new Array(24).fill(0)
    for (const session of sessions) {
      const hour = new Date(session.createdAt).getHours()
      hourCounts[hour]++
    }
    return hourCounts
  }

  private calculateFailureReasons(sessions: any[]): Record<string, number> {
    const reasons: Record<string, number> = {}
    const failedSessions = sessions.filter((s) => s.status === 'failed')

    // Simple categorization - in production, you'd have more detailed failure tracking
    for (const session of failedSessions) {
      const reason = session.getAttemptsCount() >= 3 ? 'too_many_attempts' : 'invalid_code'
      reasons[reason] = (reasons[reason] || 0) + 1
    }

    return reasons
  }

  private async calculateAdoptionTrend(days: number): Promise<number> {
    // Simple trend calculation - could be more sophisticated
    const oldCount = await this.mfaService.userMFARepository
      .createQueryBuilder('mfa')
      .where('mfa.createdAt <= :date', { date: new Date(Date.now() - days * 24 * 60 * 60 * 1000) })
      .andWhere('mfa.isEnabled = true')
      .getCount()

    const newCount = await this.mfaService.userMFARepository
      .createQueryBuilder('mfa')
      .where('mfa.isEnabled = true')
      .getCount()

    return newCount - oldCount
  }

  private calculateUsageGrowth(sessions: any[]): number {
    if (sessions.length === 0) return 0

    const midpoint = Math.floor(sessions.length / 2)
    const firstHalf = sessions.slice(0, midpoint).length
    const secondHalf = sessions.slice(midpoint).length

    if (firstHalf === 0) return 100
    return ((secondHalf - firstHalf) / firstHalf) * 100
  }

  private generateHealthRecommendations(status: any, recentActivity: number): string[] {
    const recommendations: string[] = []

    const adoptionRate = status.totalUsers > 0 ? (status.usersWithMFA / status.totalUsers) * 100 : 0

    if (adoptionRate < 25) {
      recommendations.push('Adoption MFA critique - implémenter une stratégie de déploiement')
    } else if (adoptionRate < 50) {
      recommendations.push('Améliorer la communication sur les bénéfices MFA')
    }

    if (recentActivity === 0) {
      recommendations.push("Pas d'activité MFA récente - vérifier la configuration")
    }

    if (Object.keys(status.mfaMethodDistribution).length === 1) {
      recommendations.push('Diversifier les méthodes MFA disponibles')
    }

    return recommendations.length > 0 ? recommendations : ['Système MFA en bonne santé']
  }
}
