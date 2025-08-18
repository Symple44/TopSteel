import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, LessThanOrEqual, type Repository } from 'typeorm'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { BillingCycle, License, LicenseStatus, LicenseType } from '../entities/license.entity'
import { ActivationStatus, LicenseActivation } from '../entities/license-activation.entity'
import {
  FeatureCategory,
  LicenseFeature,
  STANDARD_FEATURES,
} from '../entities/license-feature.entity'
import {
  AggregationPeriod,
  LicenseUsage,
  type UsageMetricType,
} from '../entities/license-usage.entity'
import type { LicenseValidationService } from './license-validation.service'

/**
 * License creation options
 */
export interface CreateLicenseOptions {
  societeId: string
  customerName: string
  customerEmail: string
  type: LicenseType
  billingCycle: BillingCycle
  startsAt?: Date
  expiresAt?: Date
  maxUsers?: number
  maxSites?: number
  maxTransactions?: number
  maxStorage?: number
  maxApiCalls?: number
  features?: string[]
  restrictions?: any
  autoActivate?: boolean
  price?: number
  currency?: string
  notes?: string
}

/**
 * License update options
 */
export interface UpdateLicenseOptions {
  type?: LicenseType
  status?: LicenseStatus
  expiresAt?: Date
  maxUsers?: number
  maxSites?: number
  maxTransactions?: number
  maxStorage?: number
  maxApiCalls?: number
  autoRenew?: boolean
  restrictions?: any
  notes?: string
}

/**
 * Usage statistics
 */
export interface UsageStatistics {
  period: AggregationPeriod
  startDate: Date
  endDate: Date
  metrics: Array<{
    type: UsageMetricType
    total: number
    average: number
    max: number
    min: number
    trend: number // percentage change
    data: Array<{ date: string; value: number }>
  }>
}

/**
 * License management service
 */
@Injectable()
export class LicenseManagementService {
  private readonly logger = new Logger(LicenseManagementService.name)
  private readonly PRIVATE_KEY: string // Should be loaded from secure storage

  constructor(
    @InjectRepository(License, 'auth')
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(LicenseFeature, 'auth')
    private readonly featureRepository: Repository<LicenseFeature>,
    @InjectRepository(LicenseActivation, 'auth')
    private readonly activationRepository: Repository<LicenseActivation>,
    @InjectRepository(LicenseUsage, 'auth')
    private readonly usageRepository: Repository<LicenseUsage>,
    readonly _validationService: LicenseValidationService,
    private readonly cacheService: OptimizedCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Load private key from environment or secure storage
    this.PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY || ''
  }

  /**
   * Create a new license
   */
  async createLicense(options: CreateLicenseOptions): Promise<License> {
    // Create license
    const license = this.licenseRepository.create({
      societeId: options.societeId,
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      type: options.type,
      billingCycle: options.billingCycle,
      status: options.autoActivate ? LicenseStatus.ACTIVE : LicenseStatus.PENDING,
      startsAt: options.startsAt || new Date(),
      expiresAt: options.expiresAt || this.calculateExpirationDate(options.billingCycle),
      maxUsers: options.maxUsers || this.getDefaultLimit('users', options.type),
      maxSites: options.maxSites || this.getDefaultLimit('sites', options.type),
      maxTransactions:
        options.maxTransactions || this.getDefaultLimit('transactions', options.type),
      maxStorage: options.maxStorage || this.getDefaultLimit('storage', options.type),
      maxApiCalls: options.maxApiCalls || this.getDefaultLimit('apiCalls', options.type),
      price: options.price,
      currency: options.currency || 'EUR',
      restrictions: options.restrictions || {},
      notes: options.notes,
      autoRenew: options.billingCycle !== BillingCycle.PERPETUAL,
    })

    // Generate and sign license key
    license.generateLicenseKey()
    if (this.PRIVATE_KEY) {
      license.sign(this.PRIVATE_KEY)
    }

    // Save license
    const savedLicense = await this.licenseRepository.save(license)

    // Add features
    const features = options.features || this.getDefaultFeatures(options.type)
    await this.addFeatures(savedLicense.id, features)

    // Reload with features
    const completeLicense = await this.licenseRepository.findOne({
      where: { id: savedLicense.id },
      relations: ['features'],
    })

    if (!completeLicense) {
      throw new Error('Failed to create license')
    }

    // Clear cache
    await this.cacheService.invalidateGroup('licenses')

    // Emit event
    this.eventEmitter.emit('license.created', {
      license: completeLicense,
      timestamp: new Date(),
    })

    this.logger.log(`Created license ${completeLicense.licenseKey} for ${options.customerName}`)

    return completeLicense
  }

  /**
   * Update a license
   */
  async updateLicense(licenseId: string, options: UpdateLicenseOptions): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
      relations: ['features'],
    })

    if (!license) {
      throw new NotFoundException('License not found')
    }

    // Update fields
    Object.assign(license, options)

    // Re-sign if needed
    if (this.PRIVATE_KEY) {
      license.sign(this.PRIVATE_KEY)
    }

    // Save
    const updated = await this.licenseRepository.save(license)

    // Clear cache
    await this.cacheService.invalidateGroup('licenses')

    // Emit event
    this.eventEmitter.emit('license.updated', {
      license: updated,
      changes: options,
      timestamp: new Date(),
    })

    return updated
  }

  /**
   * Activate a license
   */
  async activateLicense(licenseKey: string, societeId: string, userId: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { licenseKey, societeId },
    })

    if (!license) {
      throw new NotFoundException('License not found')
    }

    if (license.status === LicenseStatus.ACTIVE) {
      return license
    }

    if (license.status === LicenseStatus.REVOKED) {
      throw new BadRequestException('License has been revoked')
    }

    license.status = LicenseStatus.ACTIVE
    license.activatedAt = new Date()
    license.activatedBy = userId

    const activated = await this.licenseRepository.save(license)

    // Clear cache
    await this.cacheService.invalidateGroup('licenses')

    // Emit event
    this.eventEmitter.emit('license.activated', {
      license: activated,
      userId,
      timestamp: new Date(),
    })

    this.logger.log(`Activated license ${licenseKey}`)

    return activated
  }

  /**
   * Suspend a license
   */
  async suspendLicense(licenseId: string, reason: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
    })

    if (!license) {
      throw new NotFoundException('License not found')
    }

    license.status = LicenseStatus.SUSPENDED
    license.suspendedAt = new Date()
    license.suspendedReason = reason

    const suspended = await this.licenseRepository.save(license)

    // Deactivate all activations
    await this.activationRepository.update(
      { licenseId },
      {
        status: ActivationStatus.DEACTIVATED,
        deactivatedAt: new Date(),
        deactivationReason: reason,
      }
    )

    // Clear cache
    await this.cacheService.invalidateGroup('licenses')

    // Emit event
    this.eventEmitter.emit('license.suspended', {
      license: suspended,
      reason,
      timestamp: new Date(),
    })

    this.logger.warn(`Suspended license ${license.licenseKey}: ${reason}`)

    return suspended
  }

  /**
   * Revoke a license
   */
  async revokeLicense(licenseId: string, reason: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
    })

    if (!license) {
      throw new NotFoundException('License not found')
    }

    license.status = LicenseStatus.REVOKED
    license.revokedAt = new Date()
    license.revokedReason = reason

    const revoked = await this.licenseRepository.save(license)

    // Block all activations
    await this.activationRepository.update(
      { licenseId },
      { status: ActivationStatus.BLOCKED, deactivatedAt: new Date(), deactivationReason: reason }
    )

    // Clear cache
    await this.cacheService.invalidateGroup('licenses')

    // Emit event
    this.eventEmitter.emit('license.revoked', {
      license: revoked,
      reason,
      timestamp: new Date(),
    })

    this.logger.warn(`Revoked license ${license.licenseKey}: ${reason}`)

    return revoked
  }

  /**
   * Renew a license
   */
  async renewLicense(licenseId: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
    })

    if (!license) {
      throw new NotFoundException('License not found')
    }

    if (license.billingCycle === BillingCycle.PERPETUAL) {
      throw new BadRequestException('Perpetual licenses do not need renewal')
    }

    const nextExpiration = license.calculateNextRenewalDate()
    if (!nextExpiration) {
      throw new BadRequestException('Cannot calculate next renewal date')
    }

    license.expiresAt = nextExpiration
    license.lastRenewalAt = new Date()
    license.nextRenewalAt = license.calculateNextRenewalDate()
    license.status = LicenseStatus.ACTIVE

    const renewed = await this.licenseRepository.save(license)

    // Clear cache
    await this.cacheService.invalidateGroup('licenses')

    // Emit event
    this.eventEmitter.emit('license.renewed', {
      license: renewed,
      previousExpiration: license.expiresAt,
      newExpiration: nextExpiration,
      timestamp: new Date(),
    })

    this.logger.log(`Renewed license ${license.licenseKey} until ${nextExpiration}`)

    return renewed
  }

  /**
   * Add features to a license
   */
  async addFeatures(licenseId: string, featureCodes: string[]): Promise<LicenseFeature[]> {
    const features: LicenseFeature[] = []

    for (const code of featureCodes) {
      const feature = this.featureRepository.create({
        licenseId,
        featureCode: code,
        featureName: this.getFeatureName(code),
        category: this.getFeatureCategory(code),
        isEnabled: true,
        enabledAt: new Date(),
      })

      features.push(await this.featureRepository.save(feature))
    }

    return features
  }

  /**
   * Enable/disable a feature
   */
  async toggleFeature(
    licenseId: string,
    featureCode: string,
    enabled: boolean
  ): Promise<LicenseFeature> {
    const feature = await this.featureRepository.findOne({
      where: { licenseId, featureCode },
    })

    if (!feature) {
      throw new NotFoundException('Feature not found')
    }

    if (enabled) {
      feature.enable()
    } else {
      feature.disable()
    }

    return await this.featureRepository.save(feature)
  }

  /**
   * Get usage statistics
   */
  async getUsageStatistics(
    licenseId: string,
    period: AggregationPeriod = AggregationPeriod.DAILY,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageStatistics> {
    const now = new Date()
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate || now

    const usage = await this.usageRepository.find({
      where: {
        licenseId,
        recordedAt: Between(start, end),
      },
      order: {
        recordedAt: 'ASC',
      },
    })

    // Group by metric type
    const metricGroups = new Map<UsageMetricType, LicenseUsage[]>()
    usage.forEach((u) => {
      const group = metricGroups.get(u.metricType) || []
      group.push(u)
      metricGroups.set(u.metricType, group)
    })

    // Calculate statistics for each metric
    const metrics = Array.from(metricGroups.entries()).map(([type, data]) => {
      const values = data.map((d) => d.value)
      const total = values.reduce((sum, val) => sum + val, 0)
      const average = values.length > 0 ? total / values.length : 0
      const max = Math.max(...values, 0)
      const min = Math.min(...values, 0)

      // Calculate trend (compare last period with previous)
      const midPoint = Math.floor(data.length / 2)
      const firstHalf = data.slice(0, midPoint)
      const secondHalf = data.slice(midPoint)

      const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / (firstHalf.length || 1)
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / (secondHalf.length || 1)
      const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

      return {
        type,
        total,
        average,
        max,
        min,
        trend,
        data: data.map((d) => ({
          date: d.date,
          value: d.value,
        })),
      }
    })

    return {
      period,
      startDate: start,
      endDate: end,
      metrics,
    }
  }

  /**
   * Check licenses that need renewal
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkLicensesForRenewal(): Promise<void> {
    this.logger.debug('Checking licenses for renewal...')

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const licensesNeedingRenewal = await this.licenseRepository.find({
      where: {
        status: LicenseStatus.ACTIVE,
        autoRenew: true,
        expiresAt: LessThanOrEqual(thirtyDaysFromNow),
      },
    })

    for (const license of licensesNeedingRenewal) {
      const daysUntilExpiration = license.getDaysUntilExpiration()

      // Emit renewal reminder events
      if (
        daysUntilExpiration === 30 ||
        daysUntilExpiration === 14 ||
        daysUntilExpiration === 7 ||
        daysUntilExpiration === 1
      ) {
        this.eventEmitter.emit('license.renewal.reminder', {
          license,
          daysUntilExpiration,
          timestamp: new Date(),
        })
      }

      // Auto-renew if configured and expiring today
      if (license.autoRenew && daysUntilExpiration === 0) {
        try {
          await this.renewLicense(license.id)
          this.logger.log(`Auto-renewed license ${license.licenseKey}`)
        } catch (error) {
          this.logger.error(`Failed to auto-renew license ${license.licenseKey}:`, error)
        }
      }
    }
  }

  /**
   * Clean up stale activations
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleActivations(): Promise<void> {
    this.logger.debug('Cleaning up stale activations...')

    const staleThreshold = new Date()
    staleThreshold.setHours(staleThreshold.getHours() - 24) // 24 hours

    const result = await this.activationRepository.update(
      {
        status: ActivationStatus.ACTIVE,
        lastSeenAt: LessThanOrEqual(staleThreshold),
      },
      {
        status: ActivationStatus.DEACTIVATED,
        deactivatedAt: new Date(),
        deactivationReason: 'Stale activation (no heartbeat for 24 hours)',
      }
    )

    if (result.affected && result.affected > 0) {
      this.logger.log(`Deactivated ${result.affected} stale activations`)
    }
  }

  /**
   * Get default limits based on license type
   */
  private getDefaultLimit(limit: string, type: LicenseType): number {
    const defaults: Record<LicenseType, Record<string, number>> = {
      [LicenseType.TRIAL]: {
        users: 5,
        sites: 1,
        transactions: 100,
        storage: 1,
        apiCalls: 1000,
      },
      [LicenseType.BASIC]: {
        users: 10,
        sites: 2,
        transactions: 1000,
        storage: 10,
        apiCalls: 10000,
      },
      [LicenseType.PROFESSIONAL]: {
        users: 50,
        sites: 5,
        transactions: 10000,
        storage: 100,
        apiCalls: 100000,
      },
      [LicenseType.ENTERPRISE]: {
        users: -1, // unlimited
        sites: -1,
        transactions: -1,
        storage: -1,
        apiCalls: -1,
      },
      [LicenseType.CUSTOM]: {
        users: 10,
        sites: 2,
        transactions: 1000,
        storage: 10,
        apiCalls: 10000,
      },
    }

    return defaults[type]?.[limit] ?? 1
  }

  /**
   * Get default features based on license type
   */
  private getDefaultFeatures(type: LicenseType): string[] {
    const features: Record<LicenseType, string[]> = {
      [LicenseType.TRIAL]: [
        STANDARD_FEATURES.INVENTORY_MANAGEMENT,
        STANDARD_FEATURES.ORDERS_MANAGEMENT,
        STANDARD_FEATURES.DASHBOARDS,
      ],
      [LicenseType.BASIC]: [
        STANDARD_FEATURES.MULTI_USER,
        STANDARD_FEATURES.INVENTORY_MANAGEMENT,
        STANDARD_FEATURES.STOCK_MOVEMENTS,
        STANDARD_FEATURES.ORDERS_MANAGEMENT,
        STANDARD_FEATURES.INVOICING,
        STANDARD_FEATURES.DASHBOARDS,
        STANDARD_FEATURES.DATA_EXPORT,
      ],
      [LicenseType.PROFESSIONAL]: [
        STANDARD_FEATURES.MULTI_USER,
        STANDARD_FEATURES.INVENTORY_MANAGEMENT,
        STANDARD_FEATURES.STOCK_MOVEMENTS,
        STANDARD_FEATURES.ORDERS_MANAGEMENT,
        STANDARD_FEATURES.INVOICING,
        STANDARD_FEATURES.DASHBOARDS,
        STANDARD_FEATURES.DATA_EXPORT,
        STANDARD_FEATURES.MULTI_SITE,
        STANDARD_FEATURES.PRODUCTION_PLANNING,
        STANDARD_FEATURES.WORK_ORDERS,
        STANDARD_FEATURES.PRICING_RULES,
        STANDARD_FEATURES.CUSTOM_REPORTS,
        STANDARD_FEATURES.API_ACCESS,
        STANDARD_FEATURES.TWO_FACTOR_AUTH,
        STANDARD_FEATURES.MULTI_SITE,
        STANDARD_FEATURES.PRODUCTION_PLANNING,
        STANDARD_FEATURES.WORK_ORDERS,
        STANDARD_FEATURES.PRICING_RULES,
        STANDARD_FEATURES.CUSTOM_REPORTS,
        STANDARD_FEATURES.API_ACCESS,
        STANDARD_FEATURES.TWO_FACTOR_AUTH,
      ],
      [LicenseType.ENTERPRISE]: [
        ...Object.values(STANDARD_FEATURES), // All features
      ],
      [LicenseType.CUSTOM]: [
        // Custom licenses get features specified during creation
      ],
    }

    return features[type] || []
  }

  /**
   * Calculate expiration date based on billing cycle
   */
  private calculateExpirationDate(cycle: BillingCycle): Date | undefined {
    if (cycle === BillingCycle.PERPETUAL) {
      return undefined
    }

    const date = new Date()

    switch (cycle) {
      case BillingCycle.MONTHLY:
        date.setMonth(date.getMonth() + 1)
        break
      case BillingCycle.QUARTERLY:
        date.setMonth(date.getMonth() + 3)
        break
      case BillingCycle.SEMI_ANNUAL:
        date.setMonth(date.getMonth() + 6)
        break
      case BillingCycle.ANNUAL:
        date.setFullYear(date.getFullYear() + 1)
        break
    }

    return date
  }

  /**
   * Get feature name from code
   */
  private getFeatureName(code: string): string {
    // Convert SNAKE_CASE to Title Case
    return code
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  /**
   * Get feature category from code
   */
  private getFeatureCategory(code: string): FeatureCategory {
    // Map feature codes to categories
    const categoryMap: Record<string, FeatureCategory> = {
      MULTI_USER: FeatureCategory.CORE,
      MULTI_SITE: FeatureCategory.CORE,
      INVENTORY_MANAGEMENT: FeatureCategory.INVENTORY,
      PRODUCTION_PLANNING: FeatureCategory.PRODUCTION,
      ORDERS_MANAGEMENT: FeatureCategory.SALES,
      ACCOUNTING: FeatureCategory.FINANCE,
      CUSTOM_REPORTS: FeatureCategory.REPORTING,
      API_ACCESS: FeatureCategory.INTEGRATION,
      CUSTOM_MODULES: FeatureCategory.CUSTOMIZATION,
      TWO_FACTOR_AUTH: FeatureCategory.SECURITY,
      PRIORITY_SUPPORT: FeatureCategory.SUPPORT,
    }

    // Find category by prefix match
    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (code.startsWith(prefix.split('_')[0])) {
        return category
      }
    }

    return FeatureCategory.CORE
  }
}
