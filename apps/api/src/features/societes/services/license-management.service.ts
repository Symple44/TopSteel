import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { License, LicenseStatus, LicenseType, Prisma } from '@prisma/client'
import { GlobalUserRole } from '../../../domains/auth/core/constants/roles.constants'

// Local enum definitions (Prisma uses string fields, not enums for notifications)
export enum NotificationType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ALERT = 'ALERT',
  INFO = 'INFO',
}

export enum NotificationCategory {
  LICENSE = 'LICENSE',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  BILLING = 'BILLING',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RecipientType {
  USER = 'USER',
  ROLE = 'ROLE',
  SOCIETE = 'SOCIETE',
}

export interface LicenseCheckResult {
  isValid: boolean
  reason?: string
  license?: License
  availableSlots?: number
  utilizationPercent?: number
}

export interface LicenseUsageStats {
  societeId: string
  currentUsers: number
  maxUsers: number
  currentSites: number
  maxSites?: number
  currentStorageGB: number
  maxStorageGB?: number
  activeSessions: number
  maxConcurrentSessions?: number
  utilizationPercent: number
  daysUntilExpiration?: number
}

// Utility functions to replace entity methods
function isLicenseValid(license: License): boolean {
  if (license.status !== 'ACTIVE') return false
  if (license.expiresAt && license.expiresAt < new Date()) return false
  return true
}

function getUserUtilizationPercent(license: License, currentUsers: number): number {
  if (license.maxUsers === 0) return 0
  return Math.round((currentUsers / license.maxUsers) * 100)
}

function getDaysUntilExpiration(license: License): number | null {
  if (!license.expiresAt) return null
  const now = new Date()
  const diff = license.expiresAt.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function needsRenewalNotification(license: License): boolean {
  if (!license.expiresAt) return false
  const daysUntil = getDaysUntilExpiration(license)
  if (daysUntil === null) return false

  // Only notify at specific intervals: 30, 15, 7, 3, 1 days
  const notificationDays = [30, 15, 7, 3, 1]
  return notificationDays.includes(daysUntil)
}

@Injectable()
export class LicenseManagementService {
  private readonly logger = new Logger(LicenseManagementService.name)

  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService
  ) {}

  /**
   * Vérifier si une société peut authentifier un nouvel utilisateur
   */
  async checkLicenseForAuthentication(
    societeId: string,
    userId: string,
    allowConcurrent = true
  ): Promise<LicenseCheckResult> {
    const license = await this.prisma.license.findFirst({
      where: { societeId, status: 'ACTIVE' },
    })

    // Si aucune licence n'existe, appliquer le comportement par défaut
    if (!license) {
      const defaultBehavior = this.getDefaultLicenseBehavior()

      if (defaultBehavior.allowWithoutLicense) {
        // Mode permissif : autoriser avec limites par défaut
        this.logger.warn(
          `Aucune licence trouvée pour la société ${societeId}. Application des limites par défaut.`
        )

        // Créer automatiquement une licence d'essai si configuré
        if (defaultBehavior.autoCreateTrial) {
          await this.createDefaultTrialLicense(societeId)
        }

        return {
          isValid: true,
          reason: 'Fonctionnement en mode par défaut (sans licence)',
          availableSlots: defaultBehavior.defaultMaxUsers,
          utilizationPercent: 0,
        }
      } else {
        // Mode strict : bloquer si pas de licence
        return {
          isValid: false,
          reason: 'Aucune licence active trouvée pour cette société',
        }
      }
    }

    // Vérifier la validité de la licence
    if (!isLicenseValid(license)) {
      return {
        isValid: false,
        reason: 'Licence expirée ou invalide',
        license,
      }
    }

    // Vérifier les sessions concurrentes si nécessaire
    if (!allowConcurrent || !license.allowApiAccess) {
      const activeSessions = await this.getActiveSessionCount(societeId, userId)

      if (activeSessions > 0) {
        return {
          isValid: false,
          reason: 'Sessions concurrentes non autorisées. Veuillez fermer vos autres sessions.',
          license,
        }
      }
    }

    // Vérifier la limite de sessions concurrentes globale (stored in metadata)
    const maxConcurrent = (license.metadata as any)?.maxConcurrentSessions
    if (maxConcurrent && typeof maxConcurrent === 'number') {
      const totalActiveSessions = await this.getTotalActiveSessionCount(societeId)

      if (totalActiveSessions >= maxConcurrent) {
        return {
          isValid: false,
          reason: `Limite de ${maxConcurrent} sessions concurrentes atteinte`,
          license,
        }
      }
    }

    // Vérifier le nombre d'utilisateurs actifs
    const activeUsers = await this.getActiveUserCount(societeId)
    if (activeUsers >= license.maxUsers) {
      // Vérifier si l'utilisateur fait déjà partie des utilisateurs actifs
      const isExistingUser = await this.isUserActive(societeId, userId)

      if (!isExistingUser) {
        return {
          isValid: false,
          reason: `Limite de ${license.maxUsers} utilisateurs atteinte`,
          license,
          availableSlots: 0,
          utilizationPercent: 100,
        }
      }
    }

    // Mise à jour du compteur d'utilisateurs actifs
    await this.updateActiveUserCount(license, activeUsers)

    return {
      isValid: true,
      license,
      availableSlots: Math.max(0, license.maxUsers - activeUsers),
      utilizationPercent: getUserUtilizationPercent(license, activeUsers),
    }
  }

  /**
   * Créer une nouvelle licence pour une société
   */
  async createLicense(societeId: string, data: Prisma.LicenseCreateInput): Promise<License> {
    const societe = await this.prisma.societe.findUnique({ where: { id: societeId } })

    if (!societe) {
      throw new NotFoundException('Société non trouvée')
    }

    // Vérifier qu'il n'y a pas déjà une licence active
    const existingLicense = await this.prisma.license.findFirst({
      where: { societeId, status: 'ACTIVE' },
    })

    if (existingLicense) {
      throw new BadRequestException('Une licence active existe déjà pour cette société')
    }

    return await this.prisma.license.create({
      data: {
        ...data,
        societe: {
          connect: { id: societeId }
        },
        status: 'ACTIVE',
      },
    })
  }

  /**
   * Mettre à jour une licence existante
   */
  async updateLicense(licenseId: string, updates: Prisma.LicenseUpdateInput): Promise<License> {
    const license = await this.prisma.license.findUnique({ where: { id: licenseId } })

    if (!license) {
      throw new NotFoundException('Licence non trouvée')
    }

    // Get current user count for validation
    const currentUsers = await this.getActiveUserCount(license.societeId)
    const currentSites = await this.getActiveSiteCount(license.societeId)

    // Ne pas permettre de réduire les limites en dessous de l'utilisation actuelle
    if (updates.maxUsers && typeof updates.maxUsers === 'number' && updates.maxUsers < currentUsers) {
      throw new BadRequestException(
        `Impossible de réduire la limite à ${updates.maxUsers} utilisateurs. ${currentUsers} utilisateurs actifs actuellement.`
      )
    }

    if (updates.maxSites && typeof updates.maxSites === 'number' && updates.maxSites < currentSites) {
      throw new BadRequestException(
        `Impossible de réduire la limite à ${updates.maxSites} sites. ${currentSites} sites actifs actuellement.`
      )
    }

    return await this.prisma.license.update({
      where: { id: licenseId },
      data: updates,
    })
  }

  /**
   * Suspendre une licence
   */
  async suspendLicense(licenseId: string, reason?: string): Promise<void> {
    const license = await this.prisma.license.findUnique({ where: { id: licenseId } })

    if (!license) {
      throw new NotFoundException('Licence non trouvée')
    }

    // Get current metadata
    const metadata = (license.metadata as any) || {}
    const violationHistory = metadata.violationHistory || []
    violationHistory.push({
      date: new Date().toISOString(),
      type: 'SUSPENSION',
      details: reason || 'No reason provided',
      resolved: false,
    })

    await this.prisma.license.update({
      where: { id: licenseId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        metadata: {
          ...metadata,
          violationHistory,
          violationCount: (metadata.violationCount || 0) + 1,
        },
      },
    })

    // Déconnecter tous les utilisateurs de cette société
    await this.disconnectAllUsers(license.societeId)

    // Créer une notification de suspension
    await this.createSuspensionNotification(license, reason || 'Raison non spécifiée')

    this.logger.warn(`Licence suspendue pour la société ${license.societeId}: ${reason}`)
  }

  /**
   * Obtenir les statistiques d'utilisation d'une licence
   */
  async getLicenseUsageStats(societeId: string): Promise<LicenseUsageStats> {
    const license = await this.prisma.license.findFirst({
      where: { societeId, status: 'ACTIVE' },
    })

    if (!license) {
      throw new NotFoundException('Aucune licence active trouvée')
    }

    const activeUsers = await this.getActiveUserCount(societeId)
    const activeSessions = await this.getTotalActiveSessionCount(societeId)
    const activeSites = await this.getActiveSiteCount(societeId)

    const metadata = (license.metadata as any) || {}

    return {
      societeId,
      currentUsers: activeUsers,
      maxUsers: license.maxUsers,
      currentSites: activeSites,
      maxSites: license.maxSites,
      currentStorageGB: license.maxStorage,
      maxStorageGB: license.maxStorage,
      activeSessions,
      maxConcurrentSessions: metadata.maxConcurrentSessions,
      utilizationPercent: getUserUtilizationPercent(license, activeUsers),
      daysUntilExpiration: getDaysUntilExpiration(license) ?? undefined,
    }
  }

  /**
   * Vérifier et nettoyer les licences expirées (Cron job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkAndCleanupExpiredLicenses() {
    this.logger.log('Vérification des licences expirées...')

    const expiredLicenses = await this.prisma.license.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    for (const license of expiredLicenses) {
      await this.prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      })

      // Déconnecter tous les utilisateurs
      await this.disconnectAllUsers(license.societeId)

      this.logger.warn(`Licence expirée pour la société ${license.societeId}`)
    }

    this.logger.log(`${expiredLicenses.length} licence(s) expirée(s) traitée(s)`)
  }

  /**
   * Envoyer des notifications de renouvellement (Cron job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendRenewalNotifications() {
    this.logger.log('Envoi des notifications de renouvellement...')

    // Find licenses expiring in the next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const licensesToNotify = await this.prisma.license.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          not: null,
          gt: new Date(),
          lt: thirtyDaysFromNow,
        },
      },
    })

    for (const license of licensesToNotify) {
      if (needsRenewalNotification(license)) {
        const daysUntilExpiration = getDaysUntilExpiration(license)

        // Create renewal notification
        await this.createRenewalNotification(license, daysUntilExpiration || 0)

        this.logger.log(
          `Notification de renouvellement envoyée pour société ${license.societeId} - ${daysUntilExpiration} jours restants`
        )

        // Update last notification time
        await this.prisma.license.update({
          where: { id: license.id },
          data: {
            metadata: {
              ...((license.metadata as any) || {}),
              lastNotificationAt: new Date().toISOString(),
            },
          },
        })
      }
    }
  }

  // Méthodes privées utilitaires

  private async getActiveUserCount(societeId: string): Promise<number> {
    return await this.prisma.user.count({
      where: {
        societeRoles: {
          some: {
            societeId,
            isActive: true,
          },
        },
        actif: true,
      },
    })
  }

  private async isUserActive(societeId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        id: userId,
        societeRoles: {
          some: {
            societeId,
            isActive: true,
          },
        },
        actif: true,
      },
    })

    return count > 0
  }

  private async getActiveSessionCount(societeId: string, userId: string): Promise<number> {
    // Use raw SQL since userSession doesn't have expiresAt in schema
    const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count
       FROM user_sessions
       WHERE user_id = $1
       AND metadata::jsonb @> $2::jsonb
       AND is_active = true`,
      userId,
      JSON.stringify({ societeId })
    )

    return Number(result[0]?.count || 0)
  }

  private async getTotalActiveSessionCount(societeId: string): Promise<number> {
    // This requires raw SQL due to JSONB query (removed expires_at check as not in schema)
    const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count
       FROM user_sessions
       WHERE metadata::jsonb @> $1::jsonb
       AND is_active = true`,
      JSON.stringify({ societeId })
    )

    return Number(result[0]?.count || 0)
  }

  private async getActiveSiteCount(societeId: string): Promise<number> {
    return await this.prisma.site.count({
      where: {
        societeId,
        isActive: true,
      },
    })
  }

  private async updateActiveUserCount(license: License, activeUsers: number): Promise<void> {
    await this.prisma.license.update({
      where: { id: license.id },
      data: {
        metadata: {
          ...((license.metadata as any) || {}),
          currentUsers: activeUsers,
          lastCheckAt: new Date().toISOString(),
        },
      },
    })
  }

  private async disconnectAllUsers(societeId: string): Promise<void> {
    // Désactiver toutes les sessions actives de la société
    // This requires raw SQL due to JSONB path query
    await this.prisma.$executeRawUnsafe(
      `UPDATE user_sessions
       SET is_active = false, logout_time = NOW()
       WHERE metadata::jsonb @> $1::jsonb
       AND is_active = true`,
      JSON.stringify({ societeId })
    )

    this.logger.log(`Toutes les sessions déconnectées pour la société ${societeId}`)
  }

  /**
   * Vérifier si une fonctionnalité est disponible dans la licence
   */
  async isFeatureEnabled(societeId: string, feature: string): Promise<boolean> {
    const license = await this.prisma.license.findFirst({
      where: { societeId, status: 'ACTIVE' },
    })

    if (!license || !isLicenseValid(license)) {
      return false
    }

    // Check in restrictions JSON field
    const restrictions = license.restrictions as any
    return restrictions?.[feature] === true
  }

  /**
   * Vérifier une restriction quantitative
   */
  async checkRestriction(
    societeId: string,
    restriction: string,
    currentValue: number
  ): Promise<boolean> {
    const license = await this.prisma.license.findFirst({
      where: { societeId, status: 'ACTIVE' },
    })

    if (!license || !isLicenseValid(license)) {
      return false
    }

    const restrictions = license.restrictions as any
    const limit = restrictions?.[restriction]
    if (!limit) {
      return true // Pas de restriction
    }

    return currentValue < limit
  }

  /**
   * Obtenir la configuration par défaut pour les licences
   */
  private getDefaultLicenseBehavior(): {
    allowWithoutLicense: boolean
    autoCreateTrial: boolean
    defaultMaxUsers: number
    defaultMaxSites: number
    trialDurationDays: number
  } {
    return {
      allowWithoutLicense: this.configService.get('LICENSE_ALLOW_WITHOUT', 'true') === 'true',
      autoCreateTrial: this.configService.get('LICENSE_AUTO_CREATE_TRIAL', 'true') === 'true',
      defaultMaxUsers: parseInt(this.configService.get('LICENSE_DEFAULT_MAX_USERS', '5'), 10),
      defaultMaxSites: parseInt(this.configService.get('LICENSE_DEFAULT_MAX_SITES', '1'), 10),
      trialDurationDays: parseInt(this.configService.get('LICENSE_TRIAL_DAYS', '30'), 10),
    }
  }

  /**
   * Créer automatiquement une licence d'essai par défaut
   */
  private async createDefaultTrialLicense(societeId: string): Promise<void> {
    try {
      const existingLicense = await this.prisma.license.findFirst({
        where: { societeId },
      })

      // Ne pas créer si une licence existe déjà (même expirée)
      if (existingLicense) {
        return
      }

      const defaultConfig = this.getDefaultLicenseBehavior()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + defaultConfig.trialDurationDays)

      // Generate a simple license key
      const licenseKey = `TRIAL-${societeId.substring(0, 8).toUpperCase()}-${Date.now()}`

      await this.prisma.license.create({
        data: {
          licenseKey,
          societeId,
          customerName: 'Trial Customer',
          customerEmail: 'trial@example.com',
          type: 'TRIAL',
          status: 'ACTIVE',
          maxUsers: defaultConfig.defaultMaxUsers,
          maxSites: defaultConfig.defaultMaxSites,
          allowCustomModules: false,
          allowApiAccess: false,
          allowWhiteLabel: false,
          startsAt: new Date(),
          expiresAt,
          restrictions: {
            advancedReporting: false,
            apiAccess: false,
            customIntegrations: false,
            multiCurrency: false,
            advancedWorkflows: false,
          },
          metadata: {},
          notes: "Licence d'essai créée automatiquement",
        },
      })

      this.logger.log(
        `Licence d'essai créée automatiquement pour la société ${societeId} (expire le ${expiresAt.toISOString()})`
      )
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de la licence d'essai pour ${societeId}:`,
        (error as Error).message
      )
    }
  }

  /**
   * Créer une notification de renouvellement de licence
   */
  private async createRenewalNotification(
    license: License,
    daysUntilExpiration: number
  ): Promise<void> {
    const societe = await this.prisma.societe.findUnique({
      where: { id: license.societeId },
    })

    if (!societe) {
      this.logger.warn(
        `Société ${license.societeId} non trouvée pour notification de renouvellement`
      )
      return
    }

    const priority = this.getRenewalNotificationPriority(daysUntilExpiration)
    const urgencyLevel = this.getUrgencyLevel(daysUntilExpiration)

    const currentUsers = await this.getActiveUserCount(license.societeId)

    // Créer la notification pour les administrateurs de la société
    await this.prisma.notification.create({
      data: {
        societeId: license.societeId,
        userId: 'system', // Système notification
        title: `${urgencyLevel} - Renouvellement de licence requis`,
        message: this.buildRenewalMessage(license, daysUntilExpiration, societe.name),
        type: NotificationType.SYSTEM,
        category: NotificationCategory.LICENSE,
        priority,
        data: {
          societeId: license.societeId,
          societeDenomination: societe.name,
          licenseId: license.id,
          licenseType: license.type,
          expirationDate: license.expiresAt,
          daysUntilExpiration,
          currentUsers,
          maxUsers: license.maxUsers,
          utilizationPercent: getUserUtilizationPercent(license, currentUsers),
        },
        actionUrl: `/admin/licenses/${license.id}`,
        actionLabel: 'Renouveler maintenant',
        expiresAt: license.expiresAt, // Notification expire avec la licence
      },
    })

    // Créer des notifications individuelles pour les super-administrateurs
    const adminUsers = await this.prisma.user.findMany({
      where: {
        role: GlobalUserRole.SUPER_ADMIN,
        actif: true,
      },
    })

    for (const admin of adminUsers) {
      await this.prisma.notification.create({
        data: {
          societeId: license.societeId,
          userId: admin.id,
          title: `[${societe.name}] ${urgencyLevel} - Licence arrivant à expiration`,
          message: this.buildRenewalMessage(license, daysUntilExpiration, societe.name),
          type: NotificationType.SYSTEM,
          category: NotificationCategory.LICENSE,
          priority,
          data: {
            societeId: license.societeId,
            societeDenomination: societe.name,
            licenseId: license.id,
            licenseType: license.type,
            expirationDate: license.expiresAt,
            daysUntilExpiration,
            currentUsers,
            maxUsers: license.maxUsers,
            utilizationPercent: getUserUtilizationPercent(license, currentUsers),
          },
          actionUrl: `/admin/licenses/${license.id}`,
          actionLabel: 'Renouveler maintenant',
          expiresAt: license.expiresAt,
        },
      })
    }

    this.logger.log(
      `Notifications de renouvellement créées pour la société ${societe.name} (${daysUntilExpiration} jours restants)`
    )
  }

  /**
   * Construire le message de notification de renouvellement
   */
  private buildRenewalMessage(
    license: License,
    daysUntilExpiration: number,
    societeNom: string
  ): string {
    const baseMessage = `La licence ${license.type} de la société "${societeNom}" `

    if (daysUntilExpiration <= 0) {
      return `${baseMessage}a expiré. L'accès aux services est maintenant restreint. Veuillez renouveler immédiatement votre licence.`
    } else if (daysUntilExpiration <= 3) {
      return `${baseMessage}expire dans ${daysUntilExpiration} jour(s) ! Renouvellement urgent requis pour éviter l'interruption de service.`
    } else if (daysUntilExpiration <= 7) {
      return `${baseMessage}expire dans ${daysUntilExpiration} jours. Veuillez planifier le renouvellement rapidement.`
    } else if (daysUntilExpiration <= 15) {
      return `${baseMessage}expire dans ${daysUntilExpiration} jours. Il est temps de préparer le renouvellement.`
    } else {
      return `${baseMessage}expire dans ${daysUntilExpiration} jours. Pensez à planifier le renouvellement prochainement.`
    }
  }

  /**
   * Déterminer la priorité de la notification selon l'urgence
   */
  private getRenewalNotificationPriority(daysUntilExpiration: number): NotificationPriority {
    if (daysUntilExpiration <= 0) return NotificationPriority.URGENT
    if (daysUntilExpiration <= 3) return NotificationPriority.URGENT
    if (daysUntilExpiration <= 7) return NotificationPriority.HIGH
    if (daysUntilExpiration <= 15) return NotificationPriority.NORMAL
    return NotificationPriority.LOW
  }

  /**
   * Déterminer le niveau d'urgence pour le titre
   */
  private getUrgencyLevel(daysUntilExpiration: number): string {
    if (daysUntilExpiration <= 0) return 'LICENCE EXPIRÉE'
    if (daysUntilExpiration <= 3) return 'URGENT'
    if (daysUntilExpiration <= 7) return 'ATTENTION'
    return 'RAPPEL'
  }

  /**
   * Créer une notification de violation de licence
   */
  async createViolationNotification(
    license: License,
    violationType: string,
    details: string
  ): Promise<void> {
    const societe = await this.prisma.societe.findUnique({
      where: { id: license.societeId },
    })

    if (!societe) {
      return
    }

    await this.prisma.notification.create({
      data: {
        societeId: license.societeId,
        userId: 'system', // System notification
        title: `Violation de licence détectée - ${societe.name}`,
        message: `Une violation de licence de type "${violationType}" a été détectée pour la société "${societe.name}". ${details}`,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.URGENT,
        data: {
          societeId: license.societeId,
          societeDenomination: societe.name,
          licenseId: license.id,
          violationType,
          details,
          violationTime: new Date(),
        },
        actionUrl: `/admin/licenses/${license.id}/violations`,
        actionLabel: 'Examiner la violation',
      },
    })

    this.logger.warn(
      `Notification de violation de licence créée pour ${societe.name}: ${violationType} - ${details}`
    )
  }

  /**
   * Créer une notification de suspension de licence
   */
  async createSuspensionNotification(license: License, reason: string): Promise<void> {
    const societe = await this.prisma.societe.findUnique({
      where: { id: license.societeId },
    })

    if (!societe) {
      return
    }

    await this.prisma.notification.create({
      data: {
        societeId: license.societeId,
        userId: 'system', // System notification
        title: `Licence suspendue - ${societe.name}`,
        message: `La licence de la société "${societe.name}" a été suspendue. Raison: ${reason}. Tous les utilisateurs ont été déconnectés.`,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.URGENT,
        data: {
          societeId: license.societeId,
          societeDenomination: societe.name,
          licenseId: license.id,
          suspensionReason: reason,
          suspensionTime: new Date(),
        },
        actionUrl: `/admin/licenses/${license.id}`,
        actionLabel: 'Gérer la suspension',
      },
    })

    this.logger.error(`Notification de suspension créée pour ${societe.name}: ${reason}`)
  }
}
