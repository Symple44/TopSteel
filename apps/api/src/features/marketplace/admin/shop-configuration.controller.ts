import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import {
  MarketplacePermission,
  RequireMarketplacePermissions,
} from '../auth/decorators/marketplace-permissions.decorator'
import { MarketplacePermissionsGuard } from '../auth/guards/marketplace-permissions.guard'
import type {
  ShopConfiguration,
  ShopConfigurationService,
  UpdateShopConfigurationDto,
} from './shop-configuration.service'

@Controller('api/marketplace/admin/shop-configuration')
@UseGuards(JwtAuthGuard, MarketplacePermissionsGuard)
export class ShopConfigurationController {
  constructor(private readonly configService: ShopConfigurationService) {}

  @Get()
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getShopConfiguration(@CurrentTenant() tenantId: string): Promise<ShopConfiguration> {
    return this.configService.getShopConfiguration(tenantId)
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateShopConfiguration(
    @CurrentTenant() tenantId: string,
    @Body() updates: UpdateShopConfigurationDto
  ): Promise<ShopConfiguration> {
    return this.configService.updateShopConfiguration(tenantId, updates)
  }

  @Get('section/:section')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getConfigurationSection(
    @CurrentTenant() tenantId: string,
    @Param('section') section: keyof ShopConfiguration
  ): Promise<unknown> {
    return this.configService.getConfigurationSection(tenantId, section)
  }

  @Put('section/:section')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateConfigurationSection(
    @CurrentTenant() tenantId: string,
    @Param('section') section: keyof ShopConfiguration,
    @Body() sectionData: any
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, section, sectionData)
  }

  // General Settings
  @Put('general')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateGeneralSettings(
    @CurrentTenant() tenantId: string,
    @Body() generalData: {
      shopName?: string
      shopDescription?: string
      shopLogo?: string
      shopBanner?: string
      contactEmail?: string
      supportEmail?: string
      phone?: string
      companyName?: string
      companyAddress?: any
      vatNumber?: string
      businessRegistration?: string
    }
  ): Promise<ShopConfiguration> {
    const updates: UpdateShopConfigurationDto = {
      shopName: generalData.shopName,
      shopDescription: generalData.shopDescription,
      shopLogo: generalData.shopLogo,
      shopBanner: generalData.shopBanner,
      contactEmail: generalData.contactEmail,
      supportEmail: generalData.supportEmail,
      phone: generalData.phone,
      companyName: generalData.companyName,
      companyAddress: generalData.companyAddress,
      vatNumber: generalData.vatNumber,
      businessRegistration: generalData.businessRegistration,
    }

    // Remove undefined values
    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof UpdateShopConfigurationDto] === undefined) {
        delete updates[key as keyof UpdateShopConfigurationDto]
      }
    })

    return this.configService.updateShopConfiguration(tenantId, updates)
  }

  // Theme Settings
  @Put('theme')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateThemeSettings(
    @CurrentTenant() tenantId: string,
    @Body() themeData: {
      primaryColor?: string
      secondaryColor?: string
      accentColor?: string
      backgroundColor?: string
      textColor?: string
      linkColor?: string
      font?: string
      layout?: 'grid' | 'list' | 'mixed'
    }
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'theme', themeData)
  }

  // Catalog Settings
  @Put('catalog')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateCatalogSettings(
    @CurrentTenant() tenantId: string,
    @Body() catalogData: Partial<ShopConfiguration['catalog']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'catalog', catalogData)
  }

  // Order Settings
  @Put('orders')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateOrderSettings(
    @CurrentTenant() tenantId: string,
    @Body() orderData: Partial<ShopConfiguration['orderSettings']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'orderSettings', orderData)
  }

  // Payment Settings
  @Put('payments')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updatePaymentSettings(
    @CurrentTenant() tenantId: string,
    @Body() paymentData: Partial<ShopConfiguration['paymentSettings']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'paymentSettings', paymentData)
  }

  // Shipping Settings
  @Put('shipping')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateShippingSettings(
    @CurrentTenant() tenantId: string,
    @Body() shippingData: Partial<ShopConfiguration['shippingSettings']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'shippingSettings', shippingData)
  }

  // Marketing Settings
  @Put('marketing')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateMarketingSettings(
    @CurrentTenant() tenantId: string,
    @Body() marketingData: Partial<ShopConfiguration['marketing']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'marketing', marketingData)
  }

  // SEO Settings
  @Put('seo')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateSeoSettings(
    @CurrentTenant() tenantId: string,
    @Body() seoData: Partial<ShopConfiguration['seo']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'seo', seoData)
  }

  // Legal Settings
  @Put('legal')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateLegalSettings(
    @CurrentTenant() tenantId: string,
    @Body() legalData: Partial<ShopConfiguration['legal']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'legal', legalData)
  }

  // Notification Settings
  @Put('notifications')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async updateNotificationSettings(
    @CurrentTenant() tenantId: string,
    @Body() notificationData: Partial<ShopConfiguration['notifications']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(
      tenantId,
      'notifications',
      notificationData
    )
  }

  // Advanced Settings
  @Put('advanced')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.SUPER_ADMIN)
  async updateAdvancedSettings(
    @CurrentTenant() tenantId: string,
    @Body() advancedData: Partial<ShopConfiguration['advanced']>
  ): Promise<ShopConfiguration> {
    return this.configService.updateConfigurationSection(tenantId, 'advanced', advancedData)
  }

  // Validation
  @Get('validate')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async validateConfiguration(
    @CurrentTenant() tenantId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    return this.configService.validateShopConfiguration(tenantId)
  }

  // Reset to defaults
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.SUPER_ADMIN)
  async resetToDefaults(@CurrentTenant() tenantId: string): Promise<ShopConfiguration> {
    return this.configService.resetToDefaults(tenantId)
  }

  // Export configuration
  @Get('export')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async exportConfiguration(
    @CurrentTenant() tenantId: string,
    @Query('format', new DefaultValuePipe('json')) format: 'json' | 'yaml'
  ) {
    const exportData = await this.configService.exportConfiguration(tenantId)

    if (format === 'yaml') {
      // Convert to YAML format (simplified)
      const yamlContent = this.convertToYaml(exportData.config)
      return {
        content: yamlContent,
        filename: `shop-configuration-${tenantId}-${new Date().toISOString().split('T')[0]}.yaml`,
        mimeType: 'text/yaml',
        exportedAt: exportData.exportedAt,
      }
    }

    return {
      content: JSON.stringify(exportData.config, null, 2),
      filename: `shop-configuration-${tenantId}-${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json',
      exportedAt: exportData.exportedAt,
    }
  }

  // Import configuration
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.SUPER_ADMIN)
  async importConfiguration(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      configData: Partial<ShopConfiguration>
      overwrite?: boolean
    }
  ): Promise<ShopConfiguration> {
    return this.configService.importConfiguration(
      tenantId,
      body.configData,
      body.overwrite || false
    )
  }

  // Get configuration templates
  @Get('templates')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getConfigurationTemplates() {
    return {
      templates: [
        {
          name: 'E-commerce Store',
          description: 'Standard e-commerce configuration',
          features: ['guest-checkout', 'product-reviews', 'wishlist', 'coupons'],
        },
        {
          name: 'B2B Marketplace',
          description: 'Business-to-business focused settings',
          features: ['account-verification', 'bulk-orders', 'custom-pricing', 'approval-workflow'],
        },
        {
          name: 'Digital Products',
          description: 'Optimized for digital/downloadable products',
          features: ['instant-delivery', 'license-keys', 'no-shipping'],
        },
        {
          name: 'Subscription Service',
          description: 'Recurring billing and subscriptions',
          features: ['recurring-payments', 'trial-periods', 'usage-tracking'],
        },
      ],
    }
  }

  // Apply configuration template
  @Post('templates/:templateName/apply')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.MANAGE_SETTINGS)
  async applyConfigurationTemplate(
    @CurrentTenant() tenantId: string,
    @Param('templateName') templateName: string,
    @Body() body: { preserveExisting?: boolean }
  ): Promise<ShopConfiguration> {
    // Get template configuration based on name
    const templateConfig = this.getTemplateConfiguration(templateName)

    if (body.preserveExisting) {
      // Merge with existing configuration
      return this.configService.updateShopConfiguration(tenantId, templateConfig)
    } else {
      // Replace configuration
      return this.configService.importConfiguration(tenantId, templateConfig, true)
    }
  }

  // Get maintenance status
  @Get('maintenance')
  @RequireMarketplacePermissions(MarketplacePermission.VIEW_ANALYTICS)
  async getMaintenanceStatus(@CurrentTenant() tenantId: string) {
    const config = await this.configService.getShopConfiguration(tenantId)
    return {
      enabled: config.advanced.enableMaintenance,
      message: config.advanced.maintenanceMessage || 'Site is under maintenance',
    }
  }

  // Toggle maintenance mode
  @Post('maintenance/toggle')
  @HttpCode(HttpStatus.OK)
  @RequireMarketplacePermissions(MarketplacePermission.SUPER_ADMIN)
  async toggleMaintenanceMode(
    @CurrentTenant() tenantId: string,
    @Body() body: { enabled: boolean; message?: string }
  ): Promise<{ success: boolean; enabled: boolean }> {
    await this.configService.updateConfigurationSection(tenantId, 'advanced', {
      enableMaintenance: body.enabled,
      maintenanceMessage: body.message,
    })

    return {
      success: true,
      enabled: body.enabled,
    }
  }

  /**
   * Convert configuration to YAML format (simplified)
   */
  private convertToYaml(obj: unknown, indent: number = 0): string {
    const spaces = '  '.repeat(indent)
    let yaml = ''

    if (typeof obj !== 'object' || obj === null) {
      return String(obj)
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value === null || value === undefined) continue

      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.convertToYaml(value, indent + 1)}`
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`
        value.forEach((item) => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.convertToYaml(item, indent + 2)}`
          } else {
            yaml += `${spaces}  - ${item}\n`
          }
        })
      } else {
        const valueStr = typeof value === 'string' ? `"${value}"` : value
        yaml += `${spaces}${key}: ${valueStr}\n`
      }
    }

    return yaml
  }

  /**
   * Get template configuration by name
   */
  private getTemplateConfiguration(templateName: string): Partial<ShopConfiguration> {
    const templates = {
      'e-commerce': {
        orderSettings: {
          enableGuestCheckout: true,
          autoApproveOrders: true,
          allowOrderCancellation: true,
        },
        catalog: {
          allowProductReviews: true,
          enableWishlist: true,
          enableProductComparison: true,
        },
        marketing: {
          enableCoupons: true,
          enableAbandonedCartRecovery: true,
        },
      },
      b2b: {
        orderSettings: {
          enableGuestCheckout: false,
          requireAccountVerification: true,
          autoApproveOrders: false,
        },
        paymentSettings: {
          enableCashOnDelivery: false,
          minimumOrderAmount: 100,
        },
        advanced: {
          apiRateLimit: 2000,
        },
      },
      digital: {
        shippingSettings: {
          freeShippingThreshold: 0,
          defaultShippingCost: 0,
          enableExpressShipping: false,
        },
        orderSettings: {
          enableOrderTracking: false,
        },
      },
      subscription: {
        paymentSettings: {
          autoRefundCancelled: true,
        },
        orderSettings: {
          allowOrderCancellation: false,
        },
      },
    }

    return templates[templateName as keyof typeof templates] as Partial<ShopConfiguration> || {}
  }
}
