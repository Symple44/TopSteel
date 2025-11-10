import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import { Repository } from 'typeorm'
import { MarketplaceShopConfiguration } from '../entities/marketplace-shop-configuration.entity'

export interface ShopConfiguration {
  id: string
  tenantId: string

  // General settings
  shopName: string
  shopDescription?: string
  shopLogo?: string
  shopBanner?: string
  contactEmail: string
  supportEmail?: string
  phone?: string

  // Business information
  companyName?: string
  companyAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
    region?: string
  }
  vatNumber?: string
  businessRegistration?: string

  // Appearance
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    linkColor: string
    font?: string
    layout?: 'grid' | 'list' | 'mixed'
  }

  // Catalog settings
  catalog: {
    defaultCurrency: string
    allowMultipleCurrencies: boolean
    supportedCurrencies: string[]
    showPricesWithTax: boolean
    taxRate: number
    categoryLayout: 'tree' | 'flat'
    productsPerPage: number
    allowProductReviews: boolean
    requireReviewApproval: boolean
    showStockLevels: boolean
    enableWishlist: boolean
    enableProductComparison: boolean
  }

  // Order settings
  orderSettings: {
    enableGuestCheckout: boolean
    requireAccountVerification: boolean
    defaultOrderStatus: string
    autoApproveOrders: boolean
    orderNumberPrefix: string
    orderNumberFormat: 'sequential' | 'random' | 'timestamp'
    allowOrderCancellation: boolean
    cancellationTimeLimit: number // hours
    enableOrderTracking: boolean
  }

  // Payment settings
  paymentSettings: {
    enableStripe: boolean
    enablePaypal: boolean
    enableBankTransfer: boolean
    enableCashOnDelivery: boolean
    minimumOrderAmount: number
    paymentTimeout: number // minutes
    autoRefundCancelled: boolean
  }

  // Shipping settings
  shippingSettings: {
    freeShippingThreshold: number
    defaultShippingCost: number
    enableExpressShipping: boolean
    expressShippingCost: number
    enableInternationalShipping: boolean
    handlingTime: number // days
    shippingZones: Array<{
      name: string
      countries: string[]
      cost: number
      freeThreshold?: number
    }>
  }

  // Marketing settings
  marketing: {
    enableNewsletterSignup: boolean
    enableProductRecommendations: boolean
    enableAbandonedCartRecovery: boolean
    enableCoupons: boolean
    enableLoyaltyProgram: boolean
    trackingPixels: Array<{
      name: string
      code: string
      enabled: boolean
    }>
  }

  // SEO settings
  seo: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string[]
    ogImage?: string
    sitemapEnabled: boolean
    robotsPolicy: 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow'
    structuredDataEnabled: boolean
  }

  // Legal settings
  legal: {
    termsOfServiceUrl?: string
    privacyPolicyUrl?: string
    returnPolicyUrl?: string
    cookiePolicyUrl?: string
    gdprCompliant: boolean
    ageVerificationRequired: boolean
    minimumAge?: number
  }

  // Notifications
  notifications: {
    emailNotifications: {
      orderConfirmation: boolean
      orderStatusUpdate: boolean
      paymentConfirmation: boolean
      shipmentUpdate: boolean
      stockAlerts: boolean
      lowStockThreshold: number
    }
    adminNotifications: {
      newOrders: boolean
      paymentFailures: boolean
      stockAlerts: boolean
      customerRegistrations: boolean
      reviewSubmissions: boolean
    }
  }

  // Advanced settings
  advanced: {
    enableCache: boolean
    cacheTimeout: number // seconds
    enableCdn: boolean
    cdnUrl?: string
    enableCompression: boolean
    apiRateLimit: number // requests per minute
    sessionTimeout: number // minutes
    enableMaintenance: boolean
    maintenanceMessage?: string
  }

  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UpdateShopConfigurationDto
  extends Partial<Omit<ShopConfiguration, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>> {}

@Injectable()
export class ShopConfigurationService {
  private readonly logger = new Logger(ShopConfigurationService.name)
  private readonly CACHE_TTL = 3600 // 1 hour

  constructor(
    @InjectRepository(MarketplaceShopConfiguration)
    private readonly configRepository: Repository<MarketplaceShopConfiguration>,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis
  ) {}

  /**
   * Get shop configuration for tenant
   */
  async getShopConfiguration(tenantId: string): Promise<MarketplaceShopConfiguration> {
    try {
      // Check cache first
      const cacheKey = `shop-config:${tenantId}`
      const cached = await this.redisService.get(cacheKey)

      if (cached) {
        return JSON.parse(cached)
      }

      // Get from database
      let config = await this.configRepository.findOne({
        where: { tenantId },
      })

      // Create default configuration if none exists
      if (!config) {
        config = await this.createDefaultConfiguration(tenantId)
      }

      // Cache for 1 hour
      await this.redisService.setex(cacheKey, this.CACHE_TTL, JSON.stringify(config))

      return config
    } catch (error) {
      this.logger.error(`Failed to get shop configuration for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Update shop configuration
   */
  async updateShopConfiguration(
    tenantId: string,
    updates: UpdateShopConfigurationDto
  ): Promise<MarketplaceShopConfiguration> {
    try {
      let config = await this.configRepository.findOne({
        where: { tenantId },
      })

      if (!config) {
        // Create new configuration if none exists
        config = await this.createDefaultConfiguration(tenantId)
      }

      // Deep merge updates with existing configuration
      const updatedConfig = this.deepMerge(
        config as unknown as Record<string, unknown>,
        updates as Record<string, unknown>
      ) as unknown as MarketplaceShopConfiguration
      updatedConfig.updatedAt = new Date()

      // Validate configuration
      this.validateConfiguration(updatedConfig as ShopConfiguration)

      // Save to database
      const savedConfig = await this.configRepository.save(updatedConfig)

      // Clear cache
      await this.clearConfigurationCache(tenantId)

      // Emit configuration updated event
      this.eventEmitter.emit('marketplace.shop.configuration_updated', {
        tenantId,
        changes: updates,
        previousConfig: config,
        newConfig: savedConfig,
      })

      this.logger.log(`Shop configuration updated for tenant ${tenantId}`)

      return savedConfig
    } catch (error) {
      this.logger.error(`Failed to update shop configuration for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Get specific configuration section
   */
  async getConfigurationSection<T extends keyof ShopConfiguration>(
    tenantId: string,
    section: T
  ): Promise<ShopConfiguration[T]> {
    const config = await this.getShopConfiguration(tenantId)
    return config[section]
  }

  /**
   * Update specific configuration section
   */
  async updateConfigurationSection<T extends keyof ShopConfiguration>(
    tenantId: string,
    section: T,
    sectionData: Partial<ShopConfiguration[T]>
  ): Promise<MarketplaceShopConfiguration> {
    const updates = { [section]: sectionData } as UpdateShopConfigurationDto
    return this.updateShopConfiguration(tenantId, updates)
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(tenantId: string): Promise<MarketplaceShopConfiguration> {
    try {
      // Get current config to preserve basic info
      const currentConfig = await this.getShopConfiguration(tenantId)

      // Delete current configuration
      await this.configRepository.delete({ tenantId })

      // Create new default configuration, preserving shop name and contact email
      const defaultConfig = await this.createDefaultConfiguration(tenantId, {
        shopName: currentConfig.shopName,
        contactEmail: currentConfig.contactEmail,
      })

      // Clear cache
      await this.clearConfigurationCache(tenantId)

      this.eventEmitter.emit('marketplace.shop.configuration_reset', {
        tenantId,
        previousConfig: currentConfig,
        newConfig: defaultConfig,
      })

      this.logger.log(`Shop configuration reset to defaults for tenant ${tenantId}`)

      return defaultConfig
    } catch (error) {
      this.logger.error(`Failed to reset shop configuration for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Validate shop configuration
   */
  validateShopConfiguration(tenantId: string): Promise<{ valid: boolean; errors: string[] }> {
    return this.getShopConfiguration(tenantId).then((config) => {
      const errors: string[] = []

      // Required fields
      if (!config.shopName?.trim()) {
        errors.push('Shop name is required')
      }

      if (!config.contactEmail?.trim()) {
        errors.push('Contact email is required')
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (config.contactEmail && !emailRegex.test(config.contactEmail)) {
        errors.push('Contact email is invalid')
      }

      // Theme validation
      if (!config.theme?.primaryColor) {
        errors.push('Primary color is required')
      }

      // Currency validation
      if (!config.catalog?.defaultCurrency) {
        errors.push('Default currency is required')
      }

      // Shipping threshold validation
      if (config.shippingSettings?.freeShippingThreshold < 0) {
        errors.push('Free shipping threshold must be positive')
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    })
  }

  /**
   * Export configuration
   */
  async exportConfiguration(
    tenantId: string
  ): Promise<{ config: ShopConfiguration; exportedAt: Date }> {
    const config = await this.getShopConfiguration(tenantId)

    return {
      config,
      exportedAt: new Date(),
    }
  }

  /**
   * Import configuration
   */
  async importConfiguration(
    tenantId: string,
    configData: Partial<ShopConfiguration>,
    overwrite: boolean = false
  ): Promise<MarketplaceShopConfiguration> {
    try {
      if (overwrite) {
        // Delete existing configuration
        await this.configRepository.delete({ tenantId })
      }

      // Remove system fields
      const cleanData = { ...configData }
      delete cleanData.id
      delete cleanData.tenantId
      delete cleanData.createdAt
      delete cleanData.updatedAt

      return this.updateShopConfiguration(tenantId, cleanData)
    } catch (error) {
      this.logger.error(`Failed to import shop configuration for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Create default configuration
   */
  private async createDefaultConfiguration(
    tenantId: string,
    overrides: Partial<ShopConfiguration> = {}
  ): Promise<MarketplaceShopConfiguration> {
    const defaultConfig: Omit<ShopConfiguration, 'id'> = {
      tenantId,
      shopName: overrides.shopName || 'My Marketplace',
      shopDescription: 'Welcome to our marketplace',
      contactEmail: overrides.contactEmail || 'contact@example.com',

      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        accentColor: '#28a745',
        backgroundColor: '#ffffff',
        textColor: '#212529',
        linkColor: '#007bff',
        font: 'Inter, sans-serif',
        layout: 'grid',
      },

      catalog: {
        defaultCurrency: 'EUR',
        allowMultipleCurrencies: false,
        supportedCurrencies: ['EUR', 'USD'],
        showPricesWithTax: true,
        taxRate: 20,
        categoryLayout: 'tree',
        productsPerPage: 20,
        allowProductReviews: true,
        requireReviewApproval: true,
        showStockLevels: true,
        enableWishlist: true,
        enableProductComparison: true,
      },

      orderSettings: {
        enableGuestCheckout: true,
        requireAccountVerification: false,
        defaultOrderStatus: 'PENDING',
        autoApproveOrders: false,
        orderNumberPrefix: 'ORD',
        orderNumberFormat: 'sequential',
        allowOrderCancellation: true,
        cancellationTimeLimit: 24,
        enableOrderTracking: true,
      },

      paymentSettings: {
        enableStripe: true,
        enablePaypal: false,
        enableBankTransfer: true,
        enableCashOnDelivery: false,
        minimumOrderAmount: 10,
        paymentTimeout: 30,
        autoRefundCancelled: false,
      },

      shippingSettings: {
        freeShippingThreshold: 100,
        defaultShippingCost: 9.99,
        enableExpressShipping: true,
        expressShippingCost: 19.99,
        enableInternationalShipping: false,
        handlingTime: 2,
        shippingZones: [
          {
            name: 'Domestic',
            countries: ['FR'],
            cost: 9.99,
            freeThreshold: 100,
          },
        ],
      },

      marketing: {
        enableNewsletterSignup: true,
        enableProductRecommendations: true,
        enableAbandonedCartRecovery: true,
        enableCoupons: true,
        enableLoyaltyProgram: false,
        trackingPixels: [],
      },

      seo: {
        sitemapEnabled: true,
        robotsPolicy: 'index,follow',
        structuredDataEnabled: true,
      },

      legal: {
        gdprCompliant: true,
        ageVerificationRequired: false,
      },

      notifications: {
        emailNotifications: {
          orderConfirmation: true,
          orderStatusUpdate: true,
          paymentConfirmation: true,
          shipmentUpdate: true,
          stockAlerts: true,
          lowStockThreshold: 10,
        },
        adminNotifications: {
          newOrders: true,
          paymentFailures: true,
          stockAlerts: true,
          customerRegistrations: false,
          reviewSubmissions: false,
        },
      },

      advanced: {
        enableCache: true,
        cacheTimeout: 3600,
        enableCdn: false,
        enableCompression: true,
        apiRateLimit: 1000,
        sessionTimeout: 1440,
        enableMaintenance: false,
      },

      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),

      ...overrides,
    }

    return this.configRepository.save(defaultConfig)
  }

  /**
   * Validate configuration data
   */
  private validateConfiguration(config: ShopConfiguration): void {
    const errors: string[] = []

    // Required fields
    if (!config.shopName?.trim()) {
      errors.push('Shop name is required')
    }

    if (!config.contactEmail?.trim()) {
      errors.push('Contact email is required')
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (config.contactEmail && !emailRegex.test(config.contactEmail)) {
      errors.push('Contact email is invalid')
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Configuration validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = Object.assign({}, target)

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        const targetValue = target[key]
        const sourceValue = source[key]
        result[key] = this.deepMerge(
          typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)
            ? (targetValue as Record<string, unknown>)
            : {},
          sourceValue as Record<string, unknown>
        )
      } else {
        result[key] = source[key]
      }
    }

    return result
  }

  /**
   * Clear configuration cache
   */
  private async clearConfigurationCache(tenantId: string): Promise<void> {
    try {
      const patterns = [`shop-config:${tenantId}`, `config-section:${tenantId}:*`]

      for (const pattern of patterns) {
        const keys = await this.redisService.keys(pattern)
        if (keys.length > 0) {
          await this.redisService.del(...keys)
        }
      }
    } catch (error) {
      this.logger.error('Failed to clear configuration cache:', error)
    }
  }
}
