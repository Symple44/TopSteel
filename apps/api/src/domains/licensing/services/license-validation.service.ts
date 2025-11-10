import * as crypto from 'node:crypto'
import * as os from 'node:os'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, type Repository } from 'typeorm'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { License, LicenseStatus } from '../entities/license.entity'
import { ActivationStatus, LicenseActivation } from '../entities/license-activation.entity'
import { LicenseFeature } from '../entities/license-feature.entity'
import { LicenseUsage, UsageMetricType } from '../entities/license-usage.entity'

/**
 * License validation result
 */
export interface LicenseValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  license?: License
  activation?: LicenseActivation
  limits?: {
    users: { current: number; max: number; available: number }
    sites: { current: number; max: number; available: number }
    transactions: { current: number; max: number; available: number }
    storage: { current: number; max: number; available: number }
    apiCalls: { current: number; max: number; available: number }
  }
  features?: Array<{
    code: string
    name: string
    enabled: boolean
    available: boolean
    limit?: number
    used?: number
  }>
}

/**
 * Machine information
 */
interface HardwareInfo {
  cpu?: {
    model: string
    cores: number
    speed: number
  }
  memory?: {
    total: number
    available: number
  }
  disk?: {
    total: number
    free: number
  }
}

interface SoftwareInfo {
  nodeVersion: string
  npmVersion?: string
  platform: string
  arch: string
  environmentType?: 'development' | 'staging' | 'production'
}

interface UsageLimits {
  users: { current: number; max: number; available: number }
  sites: { current: number; max: number; available: number }
  transactions: { current: number; max: number; available: number }
  storage: { current: number; max: number; available: number }
  apiCalls: { current: number; max: number; available: number }
}

export interface MachineInfo {
  machineId: string
  machineName: string
  osType: string
  osVersion: string
  hostname: string
  ipAddress?: string
  macAddress?: string
  hardwareInfo?: HardwareInfo
  softwareInfo?: SoftwareInfo
}

/**
 * License validation service
 */
@Injectable()
export class LicenseValidationService {
  private readonly logger = new Logger(LicenseValidationService.name)
  private readonly PUBLIC_KEY: string // Should be loaded from config

  constructor(
    @InjectRepository(License, 'auth')
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(LicenseFeature, 'auth')
    readonly _featureRepository: Repository<LicenseFeature>,
    @InjectRepository(LicenseActivation, 'auth')
    private readonly activationRepository: Repository<LicenseActivation>,
    @InjectRepository(LicenseUsage, 'auth')
    private readonly usageRepository: Repository<LicenseUsage>,
    private readonly cacheService: OptimizedCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Load public key from environment or config
    this.PUBLIC_KEY = process.env.LICENSE_PUBLIC_KEY || ''
  }

  /**
   * Validate a license
   */
  async validateLicense(
    licenseKey: string,
    societeId: string,
    machineInfo?: MachineInfo
  ): Promise<LicenseValidationResult> {
    const result: LicenseValidationResult = {
      valid: false,
      errors: [],
      warnings: [],
    }

    try {
      // Check cache first
      const cacheKey = `license:validation:${licenseKey}:${societeId}`
      const cached = await this.cacheService.get<LicenseValidationResult>(cacheKey)
      if (cached) {
        return cached
      }

      // Load license with features
      const license = await this.licenseRepository.findOne({
        where: { licenseKey, societeId },
        relations: ['features', 'activations'],
      })

      if (!license) {
        result.errors.push('License not found')
        return result
      }

      result.license = license

      // Check license status
      if (license.status !== LicenseStatus.ACTIVE) {
        result.errors.push(`License is ${license.status.toLowerCase()}`)
        return result
      }

      // Check expiration
      if (license.isExpired()) {
        result.errors.push('License has expired')
        license.status = LicenseStatus.EXPIRED
        await this.licenseRepository.save(license)
        return result
      }

      // Check signature if available
      if (this.PUBLIC_KEY && license.signature) {
        if (!license.verifySignature(this.PUBLIC_KEY)) {
          result.errors.push('Invalid license signature')
          return result
        }
      }

      // Check activation if machine info provided
      if (machineInfo) {
        const activation = await this.validateActivation(license, machineInfo)
        if (!activation) {
          result.errors.push('License activation failed')
          return result
        }
        result.activation = activation
      }

      // Check restrictions
      const restrictionCheck = await this.checkRestrictions(license, machineInfo)
      if (!restrictionCheck.valid) {
        result.errors.push(...restrictionCheck.errors)
        return result
      }

      // Check usage limits
      const usageCheck = await this.checkUsageLimits(license)
      result.limits = usageCheck.limits

      if (!usageCheck.valid) {
        result.errors.push(...usageCheck.errors)
      }

      if (usageCheck.warnings.length > 0) {
        result.warnings.push(...usageCheck.warnings)
      }

      // Check features
      const features = await this.getFeatureStatus(license)
      result.features = features

      // Check for renewal needed
      if (license.needsRenewal()) {
        const days = license.getDaysUntilExpiration()
        result.warnings.push(`License expires in ${days} days. Renewal recommended.`)
      }

      // If we have errors, it's not valid
      if (result.errors.length > 0) {
        result.valid = false
      } else {
        result.valid = true
      }

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, result, 300)

      // Emit validation event
      this.eventEmitter.emit('license.validated', {
        licenseKey,
        societeId,
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
      })

      return result
    } catch (error) {
      this.logger.error('License validation error:', error)
      result.errors.push('Validation error occurred')
      return result
    }
  }

  /**
   * Validate activation
   */
  private async validateActivation(
    license: License,
    machineInfo: MachineInfo
  ): Promise<LicenseActivation | null> {
    // Check for existing activation
    let activation = await this.activationRepository.findOne({
      where: {
        licenseId: license.id,
        machineId: machineInfo.machineId,
        status: ActivationStatus.ACTIVE,
      },
    })

    if (activation) {
      // Update heartbeat
      activation.updateHeartbeat()
      await this.activationRepository.save(activation)
      return activation
    }

    // Check if we can create new activation
    const activeActivations = await this.activationRepository.count({
      where: {
        licenseId: license.id,
        status: ActivationStatus.ACTIVE,
      },
    })

    // Check concurrent activation limit
    const maxActivations = license.restrictions?.maxConcurrentSessions || license.maxSites
    if (maxActivations && activeActivations >= maxActivations) {
      this.logger.warn(`Max activations reached for license ${license.licenseKey}`)
      return null
    }

    // Create new activation
    activation = this.activationRepository.create({
      licenseId: license.id,
      activationKey: LicenseActivation.generateActivationKey(
        license.licenseKey,
        machineInfo.machineId
      ),
      machineId: machineInfo.machineId,
      machineName: machineInfo.machineName,
      osType: machineInfo.osType,
      osVersion: machineInfo.osVersion,
      hostname: machineInfo.hostname,
      ipAddress: machineInfo.ipAddress,
      macAddress: machineInfo.macAddress,
      hardwareInfo: machineInfo.hardwareInfo,
      softwareInfo: machineInfo.softwareInfo,
      status: ActivationStatus.ACTIVE,
      activatedAt: new Date(),
      lastSeenAt: new Date(),
    })

    await this.activationRepository.save(activation)

    // Update license activation status
    if (!license.activatedAt) {
      license.activatedAt = new Date()
      await this.licenseRepository.save(license)
    }

    return activation
  }

  /**
   * Check restrictions
   */
  private async checkRestrictions(
    license: License,
    machineInfo?: MachineInfo
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Check IP restriction
    if (machineInfo?.ipAddress && license.restrictions?.ipWhitelist?.length) {
      if (!license.isIpAllowed(machineInfo.ipAddress)) {
        errors.push(`IP address ${machineInfo.ipAddress} is not whitelisted`)
      }
    }

    // Check domain restriction (would need to be passed in context)
    // This is typically checked at the API level

    // Check country restriction (would need geolocation)
    // This is typically checked at the API level

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Check usage limits
   */
  private async checkUsageLimits(license: License): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
    limits: UsageLimits
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    const limits: Partial<UsageLimits> = {}

    // Get current usage for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check users
    const userUsage = await this.getCurrentUsage(license.id, UsageMetricType.USERS)
    limits.users = {
      current: userUsage,
      max: license.maxUsers,
      available: Math.max(0, license.maxUsers - userUsage),
    }
    if (userUsage > license.maxUsers) {
      errors.push(`User limit exceeded (${userUsage}/${license.maxUsers})`)
    } else if (userUsage >= license.maxUsers * 0.9) {
      warnings.push(`Approaching user limit (${userUsage}/${license.maxUsers})`)
    }

    // Check sites
    const siteUsage = await this.getCurrentUsage(license.id, UsageMetricType.SITES)
    limits.sites = {
      current: siteUsage,
      max: license.maxSites,
      available: Math.max(0, license.maxSites - siteUsage),
    }
    if (siteUsage > license.maxSites) {
      errors.push(`Site limit exceeded (${siteUsage}/${license.maxSites})`)
    }

    // Check transactions (if limited)
    if (license.maxTransactions > 0) {
      const transactionUsage = await this.getCurrentUsage(
        license.id,
        UsageMetricType.TRANSACTIONS,
        'monthly'
      )
      limits.transactions = {
        current: transactionUsage,
        max: license.maxTransactions,
        available: Math.max(0, license.maxTransactions - transactionUsage),
      }
      if (transactionUsage > license.maxTransactions) {
        errors.push(`Transaction limit exceeded (${transactionUsage}/${license.maxTransactions})`)
      } else if (transactionUsage >= license.maxTransactions * 0.9) {
        warnings.push(
          `Approaching transaction limit (${transactionUsage}/${license.maxTransactions})`
        )
      }
    }

    // Check storage (if limited)
    if (license.maxStorage > 0) {
      const storageUsage = await this.getCurrentUsage(license.id, UsageMetricType.STORAGE)
      limits.storage = {
        current: storageUsage,
        max: license.maxStorage,
        available: Math.max(0, license.maxStorage - storageUsage),
      }
      if (storageUsage > license.maxStorage) {
        errors.push(`Storage limit exceeded (${storageUsage}/${license.maxStorage} GB)`)
      } else if (storageUsage >= license.maxStorage * 0.9) {
        warnings.push(`Approaching storage limit (${storageUsage}/${license.maxStorage} GB)`)
      }
    }

    // Check API calls (if limited)
    if (license.maxApiCalls > 0) {
      const apiUsage = await this.getCurrentUsage(license.id, UsageMetricType.API_CALLS, 'daily')
      limits.apiCalls = {
        current: apiUsage,
        max: license.maxApiCalls,
        available: Math.max(0, license.maxApiCalls - apiUsage),
      }
      if (apiUsage > license.maxApiCalls) {
        errors.push(`API call limit exceeded (${apiUsage}/${license.maxApiCalls})`)
      } else if (apiUsage >= license.maxApiCalls * 0.9) {
        warnings.push(`Approaching API call limit (${apiUsage}/${license.maxApiCalls})`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      limits: limits as UsageLimits,
    }
  }

  /**
   * Get current usage for a metric
   */
  private async getCurrentUsage(
    licenseId: string,
    metricType: UsageMetricType,
    period: 'daily' | 'monthly' = 'daily'
  ): Promise<number> {
    const now = new Date()
    let startDate: Date

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    const usage = await this.usageRepository.findOne({
      where: {
        licenseId,
        metricType,
        recordedAt: MoreThanOrEqual(startDate),
      },
      order: {
        recordedAt: 'DESC',
      },
    })

    return usage?.value || 0
  }

  /**
   * Get feature status
   */
  private async getFeatureStatus(license: License): Promise<
    Array<{
      code: string
      name: string
      enabled: boolean
      available: boolean
      limit?: number
      used?: number
    }>
  > {
    const features = license.features || []

    return features.map((feature) => ({
      code: feature.featureCode,
      name: feature.featureName,
      enabled: feature.isEnabled,
      available: feature.isAvailable(),
      limit: feature.limit,
      used: feature.used,
    }))
  }

  /**
   * Check if a specific feature is available
   */
  async checkFeature(licenseKey: string, societeId: string, featureCode: string): Promise<boolean> {
    const cacheKey = `license:feature:${licenseKey}:${featureCode}`

    // Check cache
    const cached = await this.cacheService.get<boolean>(cacheKey)
    if (cached !== null) {
      return cached
    }

    const license = await this.licenseRepository.findOne({
      where: { licenseKey, societeId },
      relations: ['features'],
    })

    if (!license || !license.isValid()) {
      return false
    }

    const hasFeature = license.hasFeature(featureCode)

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, hasFeature, 300)

    return hasFeature
  }

  /**
   * Record usage
   */
  async recordUsage(
    licenseId: string,
    metricType: UsageMetricType,
    value: number,
    breakdown?: Record<string, unknown>
  ): Promise<void> {
    const now = new Date()

    const usage = this.usageRepository.create({
      licenseId,
      metricType,
      value,
      recordedAt: now,
      date: now.toISOString().split('T')[0],
      hour: now.getHours(),
      week: this.getWeekNumber(now),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      breakdown,
    })

    await this.usageRepository.save(usage)

    // Check for alerts
    await this.checkUsageAlerts(licenseId, metricType, value)
  }

  /**
   * Check usage alerts
   */
  private async checkUsageAlerts(
    licenseId: string,
    metricType: UsageMetricType,
    value: number
  ): Promise<void> {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId },
    })

    if (!license) {
      return
    }

    let limit: number | null = null
    const _metricName: string = metricType

    switch (metricType) {
      case UsageMetricType.USERS:
        limit = license.maxUsers
        break
      case UsageMetricType.TRANSACTIONS:
        limit = license.maxTransactions
        break
      case UsageMetricType.STORAGE:
        limit = license.maxStorage
        break
      case UsageMetricType.API_CALLS:
        limit = license.maxApiCalls
        break
    }

    if (limit && limit > 0) {
      const percentage = (value / limit) * 100

      if (percentage >= 95) {
        this.eventEmitter.emit('license.usage.critical', {
          licenseId,
          metricType,
          value,
          limit,
          percentage,
        })
      } else if (percentage >= 80) {
        this.eventEmitter.emit('license.usage.warning', {
          licenseId,
          metricType,
          value,
          limit,
          percentage,
        })
      }
    }
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  /**
   * Get machine info
   */
  async getMachineInfo(): Promise<MachineInfo> {
    const interfaces = os.networkInterfaces()
    const primaryInterface = Object.values(interfaces)
      .flat()
      .find((iface) => iface && !iface.internal && iface.family === 'IPv4')

    return {
      machineId: this.generateMachineId(),
      machineName: os.hostname(),
      osType: os.platform(),
      osVersion: os.release(),
      hostname: os.hostname(),
      ipAddress: primaryInterface?.address,
      macAddress: primaryInterface?.mac,
      hardwareInfo: {
        cpu: {
          model: os.cpus()[0]?.model,
          cores: os.cpus().length,
          speed: os.cpus()[0]?.speed,
        },
        memory: {
          total: os.totalmem(),
          available: os.freemem(),
        },
      },
      softwareInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    }
  }

  /**
   * Generate machine ID
   */
  private generateMachineId(): string {
    const interfaces = os.networkInterfaces()
    const macs = Object.values(interfaces)
      .flat()
      .filter((iface) => iface && !iface.internal && iface.mac)
      .map((iface) => iface?.mac)
      .sort()

    const data = [os.hostname(), os.platform(), os.arch(), ...macs].join('-')

    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex').substring(0, 32)
  }
}
