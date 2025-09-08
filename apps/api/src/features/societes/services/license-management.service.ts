import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThan, type Repository } from 'typeorm'
import { GlobalUserRole } from '../../../domains/auth/core/constants/roles.constants'
import { UserSession } from '../../../domains/auth/core/entities/user-session.entity'
import { User } from '../../../domains/users/entities/user.entity'
import {
  NotificationCategory,
  NotificationPriority,
  Notifications,
  NotificationType,
  RecipientType,
} from '../../../features/notifications/entities/notifications.entity'
import { Societe } from '../entities/societe.entity'
import { LicenseStatus, LicenseType, SocieteLicense } from '../entities/societe-license.entity'

export interface LicenseCheckResult {
  isValid: boolean
  reason?: string
  license?: SocieteLicense
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

@Injectable()
export class LicenseManagementService {
  private readonly logger = new Logger(LicenseManagementService.name)

  constructor(
    @InjectRepository(SocieteLicense, 'auth')
    private licenseRepository: Repository<SocieteLicense>,
    @InjectRepository(Societe, 'auth')
    private societeRepository: Repository<Societe>,
    @InjectRepository(User, 'auth')
    private userRepository: Repository<User>,
    @InjectRepository(UserSession, 'auth')
    private sessionRepository: Repository<UserSession>,
    @InjectRepository(Notifications, 'auth')
    private notificationRepository: Repository<Notifications>,
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
    const license = await this.licenseRepository.findOne({
      where: { societeId, status: LicenseStatus.ACTIVE },
      relations: ['societe'],
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
    if (!license.isValid()) {
      return {
        isValid: false,
        reason: 'Licence expirée ou invalide',
        license,
      }
    }

    // Vérifier les sessions concurrentes si nécessaire
    if (!allowConcurrent || !license.allowConcurrentSessions) {
      const activeSessions = await this.getActiveSessionCount(societeId, userId)

      if (activeSessions > 0) {
        return {
          isValid: false,
          reason: 'Sessions concurrentes non autorisées. Veuillez fermer vos autres sessions.',
          license,
        }
      }
    }

    // Vérifier la limite de sessions concurrentes globale
    if (license.maxConcurrentSessions) {
      const totalActiveSessions = await this.getTotalActiveSessionCount(societeId)

      if (totalActiveSessions >= license.maxConcurrentSessions) {
        return {
          isValid: false,
          reason: `Limite de ${license.maxConcurrentSessions} sessions concurrentes atteinte`,
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
    await this.updateActiveUserCount(license)

    return {
      isValid: true,
      license,
      availableSlots: Math.max(0, license.maxUsers - activeUsers),
      utilizationPercent: license.getUserUtilizationPercent(),
    }
  }

  /**
   * Créer une nouvelle licence pour une société
   */
  async createLicense(societeId: string, data: Partial<SocieteLicense>): Promise<SocieteLicense> {
    const societe = await this.societeRepository.findOne({ where: { id: societeId } })

    if (!societe) {
      throw new NotFoundException('Société non trouvée')
    }

    // Vérifier qu'il n'y a pas déjà une licence active
    const existingLicense = await this.licenseRepository.findOne({
      where: { societeId, status: LicenseStatus.ACTIVE },
    })

    if (existingLicense) {
      throw new BadRequestException('Une licence active existe déjà pour cette société')
    }

    const license = this.licenseRepository.create({
      ...data,
      societeId,
      status: LicenseStatus.ACTIVE,
      currentUsers: 0,
      currentSites: 0,
      currentStorageGB: 0,
    })

    return await this.licenseRepository.save(license)
  }

  /**
   * Mettre à jour une licence existante
   */
  async updateLicense(
    licenseId: string,
    updates: Partial<SocieteLicense>
  ): Promise<SocieteLicense> {
    const license = await this.licenseRepository.findOne({ where: { id: licenseId } })

    if (!license) {
      throw new NotFoundException('Licence non trouvée')
    }

    // Ne pas permettre de réduire les limites en dessous de l'utilisation actuelle
    if (updates.maxUsers && updates.maxUsers < license.currentUsers) {
      throw new BadRequestException(
        `Impossible de réduire la limite à ${updates.maxUsers} utilisateurs. ${license.currentUsers} utilisateurs actifs actuellement.`
      )
    }

    if (updates.maxSites && updates.maxSites < license.currentSites) {
      throw new BadRequestException(
        `Impossible de réduire la limite à ${updates.maxSites} sites. ${license.currentSites} sites actifs actuellement.`
      )
    }

    Object.assign(license, updates)
    license.updatedAt = new Date()

    return await this.licenseRepository.save(license)
  }

  /**
   * Suspendre une licence
   */
  async suspendLicense(licenseId: string, reason?: string): Promise<void> {
    const license = await this.licenseRepository.findOne({ where: { id: licenseId } })

    if (!license) {
      throw new NotFoundException('Licence non trouvée')
    }

    license.status = LicenseStatus.SUSPENDED
    license.violationCount++

    if (reason) {
      license.violationHistory = license.violationHistory || []
      license.violationHistory.push({
        date: new Date(),
        type: 'SUSPENSION',
        details: reason,
        resolved: false,
      })
    }

    await this.licenseRepository.save(license)

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
    const license = await this.licenseRepository.findOne({
      where: { societeId, status: LicenseStatus.ACTIVE },
    })

    if (!license) {
      throw new NotFoundException('Aucune licence active trouvée')
    }

    const activeUsers = await this.getActiveUserCount(societeId)
    const activeSessions = await this.getTotalActiveSessionCount(societeId)
    const activeSites = await this.getActiveSiteCount(societeId)

    return {
      societeId,
      currentUsers: activeUsers,
      maxUsers: license.maxUsers,
      currentSites: activeSites,
      maxSites: license.maxSites,
      currentStorageGB: Number(license.currentStorageGB),
      maxStorageGB: license.maxStorageGB,
      activeSessions,
      maxConcurrentSessions: license.maxConcurrentSessions,
      utilizationPercent: license.getUserUtilizationPercent(),
      daysUntilExpiration: license.getDaysUntilExpiration() ?? undefined,
    }
  }

  /**
   * Vérifier et nettoyer les licences expirées (Cron job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkAndCleanupExpiredLicenses(): Promise<void> {
    this.logger.log('Vérification des licences expirées...')

    const expiredLicenses = await this.licenseRepository.find({
      where: {
        status: LicenseStatus.ACTIVE,
        expiresAt: LessThan(new Date()),
      },
    })

    for (const license of expiredLicenses) {
      license.status = LicenseStatus.EXPIRED
      await this.licenseRepository.save(license)

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
  async sendRenewalNotifications(): Promise<void> {
    this.logger.log('Envoi des notifications de renouvellement...')

    const licensesToNotify = await this.licenseRepository
      .createQueryBuilder('license')
      .where('license.status = :status', { status: LicenseStatus.ACTIVE })
      .andWhere('license.expiresAt IS NOT NULL')
      .andWhere('license.expiresAt > NOW()')
      .andWhere("license.expiresAt < NOW() + INTERVAL '30 days'")
      .getMany()

    for (const license of licensesToNotify) {
      if (license.needsRenewalNotification()) {
        const daysUntilExpiration = license.getDaysUntilExpiration()

        // Create renewal notification
        await this.createRenewalNotification(license, daysUntilExpiration || 0)

        this.logger.log(
          `Notification de renouvellement envoyée pour société ${license.societeId} - ${daysUntilExpiration} jours restants`
        )

        license.lastNotificationAt = new Date()
        await this.licenseRepository.save(license)
      }
    }
  }

  // Méthodes privées utilitaires

  private async getActiveUserCount(societeId: string): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user_societe_roles', 'usr', 'usr.userId = user.id')
      .where('usr.societeId = :societeId', { societeId })
      .andWhere('usr.isActive = :usrActive', { usrActive: true })
      .andWhere('user.actif = :userActive', { userActive: true })
      .getCount()

    return result
  }

  private async isUserActive(societeId: string, userId: string): Promise<boolean> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user_societe_roles', 'usr', 'usr.userId = user.id')
      .where('usr.societeId = :societeId', { societeId })
      .andWhere('usr.userId = :userId', { userId })
      .andWhere('usr.isActive = :usrActive', { usrActive: true })
      .andWhere('user.actif = :userActive', { userActive: true })
      .getCount()

    return result > 0
  }

  private async getActiveSessionCount(societeId: string, userId: string): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.metadata ::jsonb @> :metadata', {
        metadata: JSON.stringify({ societeId }),
      })
      .andWhere('session.isActive = :isActive', { isActive: true })
      .andWhere('session.expiresAt > NOW()')
      .getCount()

    return result
  }

  private async getTotalActiveSessionCount(societeId: string): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.metadata ::jsonb @> :metadata', {
        metadata: JSON.stringify({ societeId }),
      })
      .andWhere('session.isActive = :isActive', { isActive: true })
      .andWhere('session.expiresAt > NOW()')
      .getCount()

    return result
  }

  private async getActiveSiteCount(societeId: string): Promise<number> {
    const result = await this.societeRepository
      .createQueryBuilder('societe')
      .leftJoin('societe.sites', 'site')
      .where('societe.id = :societeId', { societeId })
      .andWhere('site.isActive = true')
      .getCount()

    return result
  }

  private async updateActiveUserCount(license: SocieteLicense): Promise<void> {
    const activeUsers = await this.getActiveUserCount(license.societeId)
    license.currentUsers = activeUsers
    license.lastCheckAt = new Date()
    await this.licenseRepository.save(license)
  }

  private async disconnectAllUsers(societeId: string): Promise<void> {
    // Désactiver toutes les sessions actives de la société
    await this.sessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({ isActive: false, logoutTime: new Date() })
      .where('metadata ::jsonb @> :metadata', {
        metadata: JSON.stringify({ societeId }),
      })
      .execute()

    this.logger.log(`Toutes les sessions déconnectées pour la société ${societeId}`)
  }

  /**
   * Vérifier si une fonctionnalité est disponible dans la licence
   */
  async isFeatureEnabled(societeId: string, feature: string): Promise<boolean> {
    const license = await this.licenseRepository.findOne({
      where: { societeId, status: LicenseStatus.ACTIVE },
    })

    if (!license || !license.isValid()) {
      return false
    }

    return license.features?.[feature] === true
  }

  /**
   * Vérifier une restriction quantitative
   */
  async checkRestriction(
    societeId: string,
    restriction: string,
    currentValue: number
  ): Promise<boolean> {
    const license = await this.licenseRepository.findOne({
      where: { societeId, status: LicenseStatus.ACTIVE },
    })

    if (!license || !license.isValid()) {
      return false
    }

    const limit = license.restrictions?.[restriction]
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
      const existingLicense = await this.licenseRepository.findOne({
        where: { societeId },
      })

      // Ne pas créer si une licence existe déjà (même expirée)
      if (existingLicense) {
        return
      }

      const defaultConfig = this.getDefaultLicenseBehavior()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + defaultConfig.trialDurationDays)

      const trialLicense = this.licenseRepository.create({
        societeId,
        type: LicenseType.BASIC,
        status: LicenseStatus.ACTIVE,
        maxUsers: defaultConfig.defaultMaxUsers,
        maxSites: defaultConfig.defaultMaxSites,
        currentUsers: 0,
        currentSites: 0,
        currentStorageGB: 0,
        allowConcurrentSessions: true,
        features: {
          marketplace: false,
          advancedReporting: false,
          apiAccess: false,
          customIntegrations: false,
          multiCurrency: false,
          advancedWorkflows: false,
        },
        validFrom: new Date(),
        expiresAt,
        notes: "Licence d'essai créée automatiquement",
      })

      await this.licenseRepository.save(trialLicense)

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
    license: SocieteLicense,
    daysUntilExpiration: number
  ): Promise<void> {
    const societe = await this.societeRepository.findOne({
      where: { id: license.societeId },
      relations: ['administrateurs'],
    })

    if (!societe) {
      this.logger.warn(
        `Société ${license.societeId} non trouvée pour notification de renouvellement`
      )
      return
    }

    const priority = this.getRenewalNotificationPriority(daysUntilExpiration)
    const urgencyLevel = this.getUrgencyLevel(daysUntilExpiration)

    // Créer la notification pour les administrateurs de la société
    const notification = this.notificationRepository.create({
      title: `${urgencyLevel} - Renouvellement de licence requis`,
      message: this.buildRenewalMessage(license, daysUntilExpiration, societe.nom),
      type: NotificationType.SYSTEM,
      category: NotificationCategory.LICENSE,
      priority,
      source: 'license_management',
      entityType: 'societe_license',
      entityId: license.id,
      data: {
        societeId: license.societeId,
        societeDenomination: societe.nom,
        licenseId: license.id,
        licenseType: license.type,
        expirationDate: license.expiresAt,
        daysUntilExpiration,
        currentUsers: license.currentUsers,
        maxUsers: license.maxUsers,
        utilizationPercent: license.getUserUtilizationPercent(),
      },
      recipientType: RecipientType.ROLE,
      recipientId: 'admin', // Pour les administrateurs de la société
      actionUrl: `/admin/licenses/${license.id}`,
      actionLabel: 'Renouveler maintenant',
      actionType: 'primary',
      expiresAt: license.expiresAt, // Notification expire avec la licence
      persistent: true,
      autoRead: false,
      isArchived: false,
    })

    await this.notificationRepository.save(notification)

    // Créer des notifications individuelles pour les super-administrateurs
    const adminUsers = await this.userRepository.find({
      where: {
        role: GlobalUserRole.SUPER_ADMIN,
        actif: true,
      },
    })

    for (const admin of adminUsers) {
      const adminNotification = this.notificationRepository.create({
        ...notification,
        id: undefined, // Nouvelle notification
        recipientType: RecipientType.USER,
        recipientId: admin.id,
        title: `[${societe.nom}] ${urgencyLevel} - Licence arrivant à expiration`,
      })

      await this.notificationRepository.save(adminNotification)
    }

    this.logger.log(
      `Notifications de renouvellement créées pour la société ${societe.nom} (${daysUntilExpiration} jours restants)`
    )
  }

  /**
   * Construire le message de notification de renouvellement
   */
  private buildRenewalMessage(
    license: SocieteLicense,
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
    license: SocieteLicense,
    violationType: string,
    details: string
  ): Promise<void> {
    const societe = await this.societeRepository.findOne({
      where: { id: license.societeId },
    })

    if (!societe) {
      return
    }

    const notification = this.notificationRepository.create({
      title: `Violation de licence détectée - ${societe.nom}`,
      message: `Une violation de licence de type "${violationType}" a été détectée pour la société "${societe.nom}". ${details}`,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.URGENT,
      source: 'license_management',
      entityType: 'societe_license',
      entityId: license.id,
      data: {
        societeId: license.societeId,
        societeDenomination: societe.nom,
        licenseId: license.id,
        violationType,
        details,
        violationTime: new Date(),
      },
      recipientType: RecipientType.ROLE,
      recipientId: 'super_admin',
      actionUrl: `/admin/licenses/${license.id}/violations`,
      actionLabel: 'Examiner la violation',
      actionType: 'primary',
      persistent: true,
      autoRead: false,
      isArchived: false,
    })

    await this.notificationRepository.save(notification)

    this.logger.warn(
      `Notification de violation de licence créée pour ${societe.nom}: ${violationType} - ${details}`
    )
  }

  /**
   * Créer une notification de suspension de licence
   */
  async createSuspensionNotification(license: SocieteLicense, reason: string): Promise<void> {
    const societe = await this.societeRepository.findOne({
      where: { id: license.societeId },
    })

    if (!societe) {
      return
    }

    const notification = this.notificationRepository.create({
      title: `Licence suspendue - ${societe.nom}`,
      message: `La licence de la société "${societe.nom}" a été suspendue. Raison: ${reason}. Tous les utilisateurs ont été déconnectés.`,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.URGENT,
      source: 'license_management',
      entityType: 'societe_license',
      entityId: license.id,
      data: {
        societeId: license.societeId,
        societeDenomination: societe.nom,
        licenseId: license.id,
        suspensionReason: reason,
        suspensionTime: new Date(),
      },
      recipientType: RecipientType.ROLE,
      recipientId: 'super_admin',
      actionUrl: `/admin/licenses/${license.id}`,
      actionLabel: 'Gérer la suspension',
      actionType: 'primary',
      persistent: true,
      autoRead: false,
      isArchived: false,
    })

    await this.notificationRepository.save(notification)

    this.logger.error(`Notification de suspension créée pour ${societe.nom}: ${reason}`)
  }
}
