import { Controller, Get, Headers, Inject } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantResolver } from '../shared/tenant/tenant-resolver.service'
import { AppService } from './app.service'

@ApiTags('health')
@Controller()
export class AppController {
  constructor(
    @Inject(AppService)
    private readonly appService: AppService,
    @Inject(TenantResolver)
    private readonly tenantResolver: TenantResolver
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('version')
  @ApiOperation({ summary: 'Get API version' })
  getVersion() {
    return this.appService.getVersion()
  }

  @Get('debug/tenant')
  @ApiOperation({ summary: 'Debug tenant resolution' })
  async debugTenant(@Headers('x-tenant') tenant?: string) {
    if (!tenant) {
      return { error: 'No X-Tenant header provided' }
    }

    const nodeEnv = process.env.NODE_ENV
    const isDev = !nodeEnv || nodeEnv === 'development'

    try {
      const tenantContext = await this.tenantResolver.resolveTenantByDomain(tenant)
      return {
        success: true,
        tenant: tenant,
        debug: {
          nodeEnv,
          isDev,
          shouldUseDemoMode: (tenant === 'demo' || tenant === 'topsteel') && isDev,
        },
        context: {
          societeId: tenantContext.societeId,
          societeName: tenantContext.societe.nom,
          databaseName: tenantContext.societe.databaseName,
          marketplaceEnabled: tenantContext.marketplaceEnabled,
          connectionInitialized: tenantContext.erpTenantConnection.isInitialized,
        },
      }
    } catch (error) {
      return {
        success: false,
        tenant: tenant,
        debug: {
          nodeEnv,
          isDev,
          shouldUseDemoMode: (tenant === 'demo' || tenant === 'topsteel') && isDev,
        },
        error: error.message,
      }
    }
  }

  @Get('temp-storefront-config')
  @ApiOperation({ summary: 'Temporary storefront config for testing' })
  tempStorefrontConfig() {
    return {
      storeName: 'TopSteel',
      description: 'Boutique en ligne TopSteel',
      contactInfo: {
        email: 'contact@topsteel.fr',
        address: '123 Rue de la Métallurgie, 75000 Paris',
      },
      features: {
        allowGuestCheckout: true,
        requiresAuth: false,
        showPrices: true,
        showStock: true,
        enableWishlist: false,
        enableCompare: false,
        enableReviews: false,
      },
      social: {},
      seo: {
        title: 'TopSteel - Boutique en ligne',
        description: 'Découvrez nos produits sur la boutique en ligne de TopSteel',
        keywords: ['TopSteel', 'boutique', 'produits', 'métallurgie'],
      },
    }
  }
}
