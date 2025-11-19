import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import {
  License,
  LicenseFeature,
  LicenseActivation,
  LicenseUsage,
  LicenseType,
  LicenseStatus,
  BillingCycle,
  FeatureCategory,
  ActivationStatus,
  UsageMetricType,
  Prisma
} from '@prisma/client'
import * as crypto from 'node:crypto'

/**
 * LicensePrismaService
 *
 * Service Prisma pour la gestion complète du domaine Licensing:
 * - CRUD licenses
 * - Gestion features
 * - Tracking activations machines
 * - Monitoring usage
 * - Validation et vérification
 */
@Injectable()
export class LicensePrismaService {
  private readonly logger = new Logger(LicensePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // LICENSE CRUD OPERATIONS
  // ============================================

  /**
   * Créer une license avec génération automatique de clé
   */
  async createLicense(data: {
    societeId: string
    customerName: string
    customerEmail: string
    type?: LicenseType
    billingCycle?: BillingCycle
    startsAt: Date
    expiresAt?: Date
    maxUsers?: number
    maxSites?: number
    maxTransactions?: number
    maxStorage?: number
    maxApiCalls?: number
    allowCustomModules?: boolean
    allowApiAccess?: boolean
    allowWhiteLabel?: boolean
    autoRenew?: boolean
    price?: number
    currency?: string
    restrictions?: Prisma.JsonValue
    metadata?: Prisma.JsonValue
    notes?: string
    createdBy?: string
  }): Promise<License> {
    this.logger.log(`Creating license for societe: ${data.societeId}`)

    const licenseKey = this.generateLicenseKey(data.type || LicenseType.BASIC)

    try {
      const license = await this.prisma.license.create({
        data: {
          licenseKey,
          societeId: data.societeId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          type: data.type || LicenseType.BASIC,
          status: LicenseStatus.PENDING,
          billingCycle: data.billingCycle || BillingCycle.ANNUAL,
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
          maxUsers: data.maxUsers ?? 1,
          maxSites: data.maxSites ?? 1,
          maxTransactions: data.maxTransactions ?? -1,
          maxStorage: data.maxStorage ?? -1,
          maxApiCalls: data.maxApiCalls ?? 1000,
          allowCustomModules: data.allowCustomModules ?? false,
          allowApiAccess: data.allowApiAccess ?? false,
          allowWhiteLabel: data.allowWhiteLabel ?? false,
          autoRenew: data.autoRenew ?? true,
          price: data.price,
          currency: data.currency || 'EUR',
          restrictions: data.restrictions || {},
          metadata: data.metadata || {},
          notes: data.notes,
          createdBy: data.createdBy,
        },
        include: {
          societe: true,
          features: true,
        },
      })

      this.logger.log(`License created successfully: ${license.id}`)
      return license
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver une license par ID avec toutes les relations
   */
  async findById(id: string): Promise<License | null> {
    this.logger.debug(`Finding license by ID: ${id}`)

    try {
      return await this.prisma.license.findUnique({
        where: { id },
        include: {
          societe: true,
          features: true,
          activations: {
            where: { status: ActivationStatus.ACTIVE },
            orderBy: { activatedAt: 'desc' },
          },
          usage: {
            orderBy: { recordedAt: 'desc' },
            take: 100,
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver une license par clé
   */
  async findByLicenseKey(licenseKey: string): Promise<License | null> {
    this.logger.debug(`Finding license by key: ${licenseKey}`)

    try {
      return await this.prisma.license.findUnique({
        where: { licenseKey },
        include: {
          societe: true,
          features: true,
          activations: {
            where: { status: ActivationStatus.ACTIVE },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding license by key: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver toutes les licenses d'une société
   */
  async findBySocieteId(societeId: string): Promise<License[]> {
    this.logger.debug(`Finding licenses for societe: ${societeId}`)

    try {
      return await this.prisma.license.findMany({
        where: { societeId },
        include: {
          features: true,
          activations: {
            where: { status: ActivationStatus.ACTIVE },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding licenses by societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une license
   */
  async updateLicense(
    id: string,
    data: Prisma.LicenseUpdateInput
  ): Promise<License> {
    this.logger.log(`Updating license: ${id}`)

    try {
      return await this.prisma.license.update({
        where: { id },
        data,
        include: {
          societe: true,
          features: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une license (soft delete si possible, sinon cascade)
   */
  async deleteLicense(id: string): Promise<License> {
    this.logger.log(`Deleting license: ${id}`)

    try {
      return await this.prisma.license.delete({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting license: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // LICENSE STATUS OPERATIONS
  // ============================================

  /**
   * Activer une license
   */
  async activateLicense(id: string, activatedBy?: string): Promise<License> {
    this.logger.log(`Activating license: ${id}`)

    try {
      return await this.prisma.license.update({
        where: { id },
        data: {
          status: LicenseStatus.ACTIVE,
          activatedAt: new Date(),
          activatedBy,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error activating license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Suspendre une license
   */
  async suspendLicense(id: string, reason?: string): Promise<License> {
    this.logger.log(`Suspending license: ${id}`)

    try {
      return await this.prisma.license.update({
        where: { id },
        data: {
          status: LicenseStatus.SUSPENDED,
          suspendedAt: new Date(),
          suspendedReason: reason,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error suspending license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Révoquer une license
   */
  async revokeLicense(id: string, reason?: string): Promise<License> {
    this.logger.log(`Revoking license: ${id}`)

    try {
      // Désactiver toutes les activations
      await this.prisma.licenseActivation.updateMany({
        where: {
          licenseId: id,
          status: ActivationStatus.ACTIVE,
        },
        data: {
          status: ActivationStatus.DEACTIVATED,
          deactivatedAt: new Date(),
          deactivationReason: 'License revoked',
        },
      })

      return await this.prisma.license.update({
        where: { id },
        data: {
          status: LicenseStatus.REVOKED,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error revoking license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Renouveler une license
   */
  async renewLicense(
    id: string,
    data: {
      expiresAt: Date
      price?: number
      updatedBy?: string
    }
  ): Promise<License> {
    this.logger.log(`Renewing license: ${id}`)

    const now = new Date()
    const nextRenewalAt = this.calculateNextRenewalDate(
      data.expiresAt,
      BillingCycle.ANNUAL
    )

    try {
      return await this.prisma.license.update({
        where: { id },
        data: {
          expiresAt: data.expiresAt,
          lastRenewalAt: now,
          nextRenewalAt,
          price: data.price,
          updatedBy: data.updatedBy,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error renewing license: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // LICENSE VALIDATION OPERATIONS
  // ============================================

  /**
   * Valider une license (vérification complète)
   */
  async validateLicense(licenseKey: string): Promise<{
    valid: boolean
    license?: License
    reason?: string
  }> {
    this.logger.debug(`Validating license: ${licenseKey}`)

    try {
      const license = await this.findByLicenseKey(licenseKey)

      if (!license) {
        return { valid: false, reason: 'License not found' }
      }

      if (license.status !== LicenseStatus.ACTIVE) {
        return { valid: false, reason: `License is ${license.status}`, license }
      }

      if (license.expiresAt && new Date() > license.expiresAt) {
        return { valid: false, reason: 'License expired', license }
      }

      return { valid: true, license }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error validating license: ${err.message}`, err.stack)
      return { valid: false, reason: 'Validation error' }
    }
  }

  /**
   * Vérifier si une license est expirée
   */
  async checkExpiration(id: string): Promise<{
    expired: boolean
    expiresAt?: Date
    daysUntilExpiration?: number
  }> {
    const license = await this.findById(id)

    if (!license?.expiresAt) {
      return { expired: false }
    }

    const now = new Date()
    const expired = now > license.expiresAt
    const daysUntilExpiration = Math.floor(
      (license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      expired,
      expiresAt: license.expiresAt,
      daysUntilExpiration: expired ? 0 : daysUntilExpiration,
    }
  }

  /**
   * Vérifier les limites d'une license
   */
  async checkLimits(id: string): Promise<{
    withinLimits: boolean
    limits: Record<string, { current: number; max: number; exceeded: boolean }>
  }> {
    const license = await this.findById(id)

    if (!license) {
      throw new NotFoundException('License not found')
    }

    // Count active users, sites, etc.
    // Note: activations will be available once Prisma client is regenerated
    const activeActivations = 0 // TODO: Count from license.activations after Prisma generate

    const limits = {
      users: {
        current: activeActivations,
        max: license.maxUsers,
        exceeded: activeActivations > license.maxUsers,
      },
      sites: {
        current: 0, // TODO: Count from societe.sites
        max: license.maxSites,
        exceeded: false,
      },
    }

    const withinLimits = !Object.values(limits).some((l) => l.exceeded)

    return { withinLimits, limits }
  }

  // ============================================
  // FEATURE MANAGEMENT OPERATIONS
  // ============================================

  /**
   * Ajouter une feature à une license
   */
  async addFeature(
    licenseId: string,
    data: {
      featureCode: string
      featureName: string
      description?: string
      category?: FeatureCategory
      isEnabled?: boolean
      limit?: number
      expiresAt?: Date
      configuration?: Prisma.JsonValue
    }
  ): Promise<LicenseFeature> {
    this.logger.log(`Adding feature ${data.featureCode} to license: ${licenseId}`)

    try {
      return await this.prisma.licenseFeature.create({
        data: {
          licenseId,
          featureCode: data.featureCode,
          featureName: data.featureName,
          description: data.description,
          category: data.category || FeatureCategory.CORE,
          isEnabled: data.isEnabled ?? true,
          limit: data.limit,
          expiresAt: data.expiresAt,
          configuration: data.configuration || {},
          enabledAt: data.isEnabled !== false ? new Date() : undefined,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error adding feature: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer une feature
   */
  async enableFeature(licenseId: string, featureCode: string): Promise<LicenseFeature> {
    this.logger.log(`Enabling feature ${featureCode} for license: ${licenseId}`)

    try {
      return await this.prisma.licenseFeature.update({
        where: {
          licenseId_featureCode: {
            licenseId,
            featureCode,
          },
        },
        data: {
          isEnabled: true,
          enabledAt: new Date(),
          disabledAt: null,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error enabling feature: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Désactiver une feature
   */
  async disableFeature(licenseId: string, featureCode: string): Promise<LicenseFeature> {
    this.logger.log(`Disabling feature ${featureCode} for license: ${licenseId}`)

    try {
      return await this.prisma.licenseFeature.update({
        where: {
          licenseId_featureCode: {
            licenseId,
            featureCode,
          },
        },
        data: {
          isEnabled: false,
          disabledAt: new Date(),
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error disabling feature: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si une feature est disponible
   */
  async checkFeatureAvailability(
    licenseId: string,
    featureCode: string
  ): Promise<{ available: boolean; feature?: LicenseFeature; reason?: string }> {
    try {
      const feature = await this.prisma.licenseFeature.findUnique({
        where: {
          licenseId_featureCode: {
            licenseId,
            featureCode,
          },
        },
      })

      if (!feature) {
        return { available: false, reason: 'Feature not found' }
      }

      if (!feature.isEnabled) {
        return { available: false, reason: 'Feature is disabled', feature }
      }

      if (feature.expiresAt && new Date() > feature.expiresAt) {
        return { available: false, reason: 'Feature expired', feature }
      }

      if (feature.limit !== null && feature.used >= feature.limit) {
        return { available: false, reason: 'Feature limit reached', feature }
      }

      return { available: true, feature }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking feature availability: ${err.message}`, err.stack)
      return { available: false, reason: 'Check error' }
    }
  }

  /**
   * Incrémenter l'usage d'une feature
   */
  async incrementFeatureUsage(
    licenseId: string,
    featureCode: string,
    amount: number = 1
  ): Promise<LicenseFeature> {
    this.logger.debug(`Incrementing usage for feature ${featureCode}`)

    try {
      const feature = await this.prisma.licenseFeature.findUnique({
        where: {
          licenseId_featureCode: {
            licenseId,
            featureCode,
          },
        },
      })

      if (!feature) {
        throw new NotFoundException('Feature not found')
      }

      if (feature.limit !== null && feature.used + amount > feature.limit) {
        throw new BadRequestException('Feature limit would be exceeded')
      }

      return await this.prisma.licenseFeature.update({
        where: {
          licenseId_featureCode: {
            licenseId,
            featureCode,
          },
        },
        data: {
          used: { increment: amount },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error incrementing feature usage: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // ACTIVATION MANAGEMENT OPERATIONS
  // ============================================

  /**
   * Créer une activation pour une machine
   */
  async createActivation(
    licenseId: string,
    data: {
      machineId: string
      machineName?: string
      osType?: string
      osVersion?: string
      hostname?: string
      ipAddress?: string
      macAddress?: string
      hardwareInfo?: Prisma.JsonValue
      softwareInfo?: Prisma.JsonValue
    }
  ): Promise<LicenseActivation> {
    this.logger.log(`Creating activation for license: ${licenseId}`)

    const activationKey = this.generateActivationKey(licenseId, data.machineId)

    try {
      return await this.prisma.licenseActivation.create({
        data: {
          licenseId,
          activationKey,
          machineId: data.machineId,
          machineName: data.machineName,
          osType: data.osType,
          osVersion: data.osVersion,
          hostname: data.hostname,
          ipAddress: data.ipAddress,
          macAddress: data.macAddress,
          status: ActivationStatus.ACTIVE,
          activatedAt: new Date(),
          lastSeenAt: new Date(),
          hardwareInfo: data.hardwareInfo as Prisma.InputJsonValue,
          softwareInfo: data.softwareInfo as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating activation: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Désactiver une activation
   */
  async deactivateActivation(activationKey: string, reason?: string): Promise<LicenseActivation> {
    this.logger.log(`Deactivating activation: ${activationKey}`)

    try {
      return await this.prisma.licenseActivation.update({
        where: { activationKey },
        data: {
          status: ActivationStatus.DEACTIVATED,
          deactivatedAt: new Date(),
          deactivationReason: reason,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deactivating activation: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour le heartbeat d'une activation
   */
  async updateHeartbeat(activationKey: string): Promise<LicenseActivation> {
    try {
      return await this.prisma.licenseActivation.update({
        where: { activationKey },
        data: {
          lastSeenAt: new Date(),
          heartbeatCount: { increment: 1 },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating heartbeat: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir les activations actives d'une license
   */
  async getActiveActivations(licenseId: string): Promise<LicenseActivation[]> {
    try {
      return await this.prisma.licenseActivation.findMany({
        where: {
          licenseId,
          status: ActivationStatus.ACTIVE,
        },
        orderBy: { activatedAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting active activations: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // USAGE TRACKING OPERATIONS
  // ============================================

  /**
   * Enregistrer une métrique d'usage
   */
  async recordUsage(
    licenseId: string,
    data: {
      metricType: UsageMetricType
      metricName?: string
      value: number
      limit?: number
      breakdown?: Prisma.JsonValue
      metadata?: Prisma.JsonValue
    }
  ): Promise<LicenseUsage> {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const hour = now.getHours()
    const week = this.getWeekNumber(now)
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const percentage = data.limit
      ? Math.min(100, (data.value / data.limit) * 100)
      : null

    try {
      return await this.prisma.licenseUsage.create({
        data: {
          licenseId,
          metricType: data.metricType,
          metricName: data.metricName,
          value: data.value,
          limit: data.limit,
          percentage,
          recordedAt: now,
          date: new Date(date),
          hour,
          week,
          month,
          year,
          breakdown: data.breakdown as Prisma.InputJsonValue,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error recording usage: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir les statistiques d'usage
   */
  async getUsageStats(
    licenseId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<any> {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    try {
      return await this.prisma.licenseUsage.findMany({
        where: {
          licenseId,
          recordedAt: { gte: startDate },
        },
        orderBy: { recordedAt: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting usage stats: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Générer une clé de license unique
   */
  private generateLicenseKey(type: LicenseType): string {
    const prefix = type.substring(0, 3).toUpperCase()
    const random = crypto.randomBytes(16).toString('hex').toUpperCase()
    const formatted = random.match(/.{1,4}/g)?.join('-') || random
    return `${prefix}-${formatted}`
  }

  /**
   * Générer une clé d'activation
   */
  private generateActivationKey(licenseId: string, machineId: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(`${licenseId}-${machineId}-${Date.now()}`)
    return hash.digest('hex').substring(0, 32).toUpperCase()
  }

  /**
   * Calculer la prochaine date de renouvellement
   */
  private calculateNextRenewalDate(expiresAt: Date, billingCycle: BillingCycle): Date {
    const nextDate = new Date(expiresAt)

    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case BillingCycle.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case BillingCycle.SEMI_ANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6)
        break
      case BillingCycle.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
      case BillingCycle.PERPETUAL:
        // No next renewal for perpetual licenses
        return expiresAt
    }

    return nextDate
  }

  /**
   * Obtenir le numéro de semaine
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }
}
