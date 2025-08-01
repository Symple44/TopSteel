import { Controller, Get, Headers } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AppService } from './app.service'
import { TenantResolver } from '../shared/tenant/tenant-resolver.service'

@ApiTags('health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
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

    try {
      const tenantContext = await this.tenantResolver.resolveTenantByDomain(tenant)
      return {
        success: true,
        tenant: tenant,
        context: {
          societeId: tenantContext.societeId,
          societeName: tenantContext.societe.nom,
          databaseName: tenantContext.societe.databaseName,
          marketplaceEnabled: tenantContext.marketplaceEnabled,
          connectionInitialized: tenantContext.erpTenantConnection.isInitialized
        }
      }
    } catch (error) {
      return {
        success: false,
        tenant: tenant,
        error: error.message,
        stack: error.stack
      }
    }
  }
}