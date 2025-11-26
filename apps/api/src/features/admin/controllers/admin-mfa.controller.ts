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
import { Public } from '../../../core/multi-tenant'
import type { MfaSession, UserMfa } from '@prisma/client'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { AuthPerformanceService } from '../../../domains/auth/services/auth-performance.service'
import { MfaPrismaService } from '../../../domains/auth/prisma/mfa-prisma.service'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { MFASecurityStats, MFAStatusData } from '../interfaces/mfa-admin.interfaces'

@Controller('admin/mfa')
@ApiTags('🔧 Admin - Multi-Factor Authentication')
@Public() // Bypass global TenantGuard - CombinedSecurityGuard handles JWT auth
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminMFAController {
  constructor(
    private readonly mfaService: MfaPrismaService,
    private readonly performanceService: AuthPerformanceService,
    private readonly prisma: PrismaService
  ) {}

  @Get('status')
  @ApiOperation({ summary: "Obtenir l'état global MFA du système" })
  @ApiResponse({ status: 200, description: 'État MFA récupéré avec succès' })
  async getMFAStatus() {
    return this.performanceService.trackOperation('admin_mfa_status', async () => {
      const status = await this.getAdminMFAStatus()

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
      const mfaMethods = await this.getUserMFAMethods(userId)
      const hasMFAEnabled = await this.mfaService.hasMFAEnabled(userId)
      const isMFARequired = await this.isMFARequiredForUser(userId)
      const stats = await this.getMFAStats(userId)

      return {
        success: true,
        data: {
          userId,
          hasMFAEnabled,
          isMFARequired,
          methods: mfaMethods.map((method: UserMfa) => {
            const metadata = method.metadata as Record<string, unknown> | null
            return {
              id: method.id,
              type: method.type,
              isEnabled: method.isEnabled,
              isVerified: method.isVerified,
              lastUsed: method.lastUsedAt || (metadata?.lastUsed as Date | undefined),
              createdAt: method.createdAt,
              metadata: {
                usageCount: metadata?.usageCount ? Number(metadata.usageCount) : 0,
                failedAttempts: metadata?.failedAttempts ? Number(metadata.failedAttempts) : 0,
                deviceInfo:
                  method.type === 'webauthn' && metadata?.deviceInfo
                    ? [
                        {
                          deviceName: (metadata.deviceInfo as Record<string, unknown>).deviceName as string,
                          createdAt: method.createdAt,
                        },
                      ]
                    : undefined,
              },
            }
          }),
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
      const whereClause: Record<string, unknown> = {}

      if (userId) {
        whereClause.userId = userId
      }

      const sessions = await this.prisma.mfaSession.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })

      return {
        success: true,
        data: sessions.map((session: MfaSession) => {
          const isExpired = new Date() > new Date(session.expiresAt)
          const metadata = session.metadata as Record<string, unknown> | null
          const attemptsCount = metadata?.attemptsCount ? Number(metadata.attemptsCount) : 1

          return {
            id: session.id,
            userId: session.userId,
            sessionToken: `${session.challenge.substring(0, 8)}***`, // Masked for security
            status: session.verified ? 'verified' : isExpired ? 'expired' : 'pending',
            mfaType: session.mfaType,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent ? `${session.userAgent.substring(0, 100)}...` : undefined,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            isExpired,
            attemptsCount,
          }
        }),
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
    const cleanedCount = await this.cleanupExpiredMFASessions()

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
      const mfaMethods = await this.getUserMFAMethods(userId)

      if (mfaMethods.length === 0) {
        return {
          success: true,
          message: 'Aucune méthode MFA à réinitialiser',
        }
      }

      let resetCount = 0
      for (const method of mfaMethods) {
        if (body.disableOnly) {
          // Désactiver la méthode
          await this.prisma.userMfa.update({
            where: { id: method.id },
            data: { isEnabled: false },
          })
        } else {
          await this.prisma.userMfa.delete({
            where: { id: method.id },
          })
        }
        resetCount++
      }

      // Invalider le cache MFA
      await this.invalidateMFACache(userId)

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
      const mfaRecords = await this.prisma.userMfa.findMany({
        where: {
          lastUsedAt: {
            gte: since,
          },
        },
      })

      // Get session statistics
      const mfaSessions = await this.prisma.mfaSession.findMany({
        where: {
          createdAt: {
            gte: since,
          },
        },
      })

      const analytics = {
        period: `${days} days`,
        mfaUsage: {
          totalAuthentications: mfaSessions.length,
          successfulAuthentications: mfaSessions.filter((s) => s.verified).length,
          failedAuthentications: mfaSessions.filter((s) => !s.verified && new Date() > new Date(s.expiresAt)).length,
          expiredSessions: mfaSessions.filter((s) => new Date() > new Date(s.expiresAt)).length,
        },
        methodPopularity: this.calculateMethodPopularity(mfaRecords as UserMfa[]),
        securityMetrics: {
          averageAttemptsPerSession: this.calculateAverageAttempts(mfaSessions as MfaSession[]),
          mostActiveHours: this.calculateActiveHours(mfaSessions as MfaSession[]),
          topFailureReasons: this.calculateFailureReasons(mfaSessions as MfaSession[]),
        },
        trends: {
          adoptionRate: await this.calculateAdoptionTrend(days),
          usageGrowth: this.calculateUsageGrowth(mfaSessions as MfaSession[]),
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
      const status = await this.getAdminMFAStatus()
      const recentSessions = await this.prisma.mfaSession.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      })

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
            status: Object.keys(status.mfaMethodDistribution || {}).length > 1 ? 'good' : 'warning',
            value: Object.keys(status.mfaMethodDistribution || {}).length,
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
  private generateMFARecommendations(status: MFAStatusData): string[] {
    const recommendations: string[] = []

    const adoptionRate = status.totalUsers > 0 ? (status.usersWithMFA / status.totalUsers) * 100 : 0

    if (adoptionRate < 50) {
      recommendations.push("Encourager l'adoption MFA - taux actuel faible")
    }

    if (!status.mfaMethodDistribution?.totp) {
      recommendations.push('Promouvoir TOTP comme méthode MFA principale')
    }

    if (
      status.usersByRole?.SUPER_ADMIN?.withMFA &&
      status.usersByRole?.SUPER_ADMIN?.total &&
      status.usersByRole.SUPER_ADMIN.withMFA < status.usersByRole.SUPER_ADMIN.total
    ) {
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

  private getMFARecommendation(
    hasMFA: boolean,
    isRequired: boolean,
    stats: MFASecurityStats
  ): string {
    if (isRequired && !hasMFA) return 'MFA requis pour ce rôle - configuration nécessaire'
    if (!hasMFA) return 'MFA recommandé pour améliorer la sécurité'
    if (stats.securityLevel === 'basic') return "Considérer l'ajout d'une seconde méthode MFA"
    return 'Configuration MFA optimale'
  }

  private calculateMethodPopularity(records: UserMfa[]): Record<string, number> {
    const popularity: Record<string, number> = {}
    for (const record of records) {
      popularity[record.type] = (popularity[record.type] || 0) + 1
    }
    return popularity
  }

  private calculateAverageAttempts(sessions: MfaSession[]): number {
    if (sessions.length === 0) return 0
    const totalAttempts = sessions.reduce((sum, session) => {
      const metadata = session.metadata as Record<string, unknown> | null
      const attempts = metadata?.attemptsCount ? Number(metadata.attemptsCount) : 1
      return sum + attempts
    }, 0)
    return totalAttempts / sessions.length
  }

  private calculateActiveHours(sessions: MfaSession[]): number[] {
    const hourCounts = new Array(24).fill(0)
    for (const session of sessions) {
      const hour = new Date(session.createdAt).getHours()
      hourCounts[hour]++
    }
    return hourCounts
  }

  private calculateFailureReasons(sessions: MfaSession[]): Record<string, number> {
    const reasons: Record<string, number> = {}
    const failedSessions = sessions.filter((s) => !s.verified && new Date() > new Date(s.expiresAt))

    // Simple categorization - in production, you'd have more detailed failure tracking
    for (const session of failedSessions) {
      const metadata = session.metadata as Record<string, unknown> | null
      const attempts = metadata?.attemptsCount ? Number(metadata.attemptsCount) : 0
      const reason = attempts >= 3 ? 'too_many_attempts' : 'invalid_code'
      reasons[reason] = (reasons[reason] || 0) + 1
    }

    return reasons
  }

  private async calculateAdoptionTrend(days: number): Promise<number> {
    // Simple trend calculation - could be more sophisticated
    const oldCount = await this.prisma.userMfa.count({
      where: {
        createdAt: {
          lte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
        isEnabled: true,
      },
    })

    const newCount = await this.prisma.userMfa.count({
      where: {
        isEnabled: true,
      },
    })

    return newCount - oldCount
  }

  private calculateUsageGrowth(sessions: MfaSession[]): number {
    if (sessions.length === 0) return 0

    const midpoint = Math.floor(sessions.length / 2)
    const firstHalf = sessions.slice(0, midpoint).length
    const secondHalf = sessions.slice(midpoint).length

    if (firstHalf === 0) return 100
    return ((secondHalf - firstHalf) / firstHalf) * 100
  }

  private generateHealthRecommendations(status: MFAStatusData, recentActivity: number): string[] {
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

    if (Object.keys(status.mfaMethodDistribution || {}).length === 1) {
      recommendations.push('Diversifier les méthodes MFA disponibles')
    }

    return recommendations.length > 0 ? recommendations : ['Système MFA en bonne santé']
  }

  // Additional helper methods for MFA operations

  /**
   * Get admin MFA status - aggregates MFA statistics across all users
   */
  private async getAdminMFAStatus(): Promise<MFAStatusData> {
    const totalUsers = await this.prisma.user.count()
    const usersWithMFA = await this.prisma.user.count({
      where: {
        mfaSettings: {
          some: {
            isEnabled: true,
            isVerified: true,
          },
        },
      },
    })

    // Get users by role
    const usersByRole: Record<string, { total: number; withMFA: number }> = {}
    const users = await this.prisma.user.findMany({
      select: {
        role: true,
        mfaSettings: {
          where: {
            isEnabled: true,
            isVerified: true,
          },
        },
      },
    })

    for (const user of users) {
      const role = user.role || 'USER'
      if (!usersByRole[role]) {
        usersByRole[role] = { total: 0, withMFA: 0 }
      }
      usersByRole[role].total++
      if (user.mfaSettings.length > 0) {
        usersByRole[role].withMFA++
      }
    }

    // Get MFA method distribution
    const mfaMethods = await this.prisma.userMfa.groupBy({
      by: ['type'],
      where: {
        isEnabled: true,
        isVerified: true,
      },
      _count: true,
    })

    const mfaMethodDistribution: Record<string, number> = {}
    for (const method of mfaMethods) {
      mfaMethodDistribution[method.type.toLowerCase()] = method._count
    }

    return {
      totalUsers,
      usersWithMFA,
      usersByRole,
      mfaMethodDistribution,
    }
  }

  /**
   * Get all MFA methods for a user
   */
  private async getUserMFAMethods(userId: string): Promise<UserMfa[]> {
    return this.prisma.userMfa.findMany({
      where: {
        userId,
      },
    })
  }

  /**
   * Check if MFA is required for a user based on their role
   */
  private async isMFARequiredForUser(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) return false

    // MFA is required for SUPER_ADMIN and ADMIN roles
    const rolesRequiringMFA = ['SUPER_ADMIN', 'ADMIN']
    return rolesRequiringMFA.includes(user.role)
  }

  /**
   * Get MFA security stats for a user
   */
  private async getMFAStats(userId: string): Promise<MFASecurityStats> {
    const mfaMethods = await this.getUserMFAMethods(userId)

    const stats: MFASecurityStats = {
      hasActiveMFA: false,
      methods: {
        totp: { enabled: false, verified: false },
        webauthn: { enabled: false, verified: false, credentialsCount: 0 },
        sms: { enabled: false, verified: false },
      },
      totalUsage: 0,
      securityLevel: 'none',
    }

    for (const method of mfaMethods) {
      const methodType = method.type.toLowerCase() as 'totp' | 'sms' | 'webauthn'

      if (methodType === 'totp' || methodType === 'sms') {
        stats.methods[methodType] = {
          enabled: method.isEnabled,
          verified: method.isVerified,
          lastUsed: method.lastUsedAt || undefined,
        }
      } else if (methodType === 'webauthn') {
        const credentials = method.webauthnCredentials as unknown[] | null
        stats.methods.webauthn = {
          enabled: method.isEnabled,
          verified: method.isVerified,
          credentialsCount: credentials ? credentials.length : 0,
          lastUsed: method.lastUsedAt || undefined,
        }
      }

      if (method.isEnabled && method.isVerified) {
        stats.hasActiveMFA = true
        const metadata = method.metadata as Record<string, unknown> | null
        stats.totalUsage += metadata?.usageCount ? Number(metadata.usageCount) : 0
      }
    }

    // Determine security level
    const activeMethods = mfaMethods.filter((m) => m.isEnabled && m.isVerified).length
    if (activeMethods === 0) {
      stats.securityLevel = 'none'
    } else if (activeMethods === 1) {
      stats.securityLevel = 'basic'
    } else {
      stats.securityLevel = 'enhanced'
    }

    return stats
  }

  /**
   * Cleanup expired MFA sessions
   */
  private async cleanupExpiredMFASessions(): Promise<number> {
    const result = await this.prisma.mfaSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    return result.count
  }

  /**
   * Invalidate MFA cache for a user (stub for cache integration)
   */
  private async invalidateMFACache(userId: string): Promise<void> {
    // This is a stub - implement cache invalidation if using Redis/cache
    // For now, it's a no-op since we're querying directly from database
    void userId
  }
}
