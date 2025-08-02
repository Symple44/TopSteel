import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { 
  HealthCheckService, 
  HealthCheck, 
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator
} from '@nestjs/terminus'
import { TenantResolver } from '../../shared/tenant/tenant-resolver.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private tenantResolver: TenantResolver,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @HealthCheck()
  check() {
    return this.health.check([
      // Database connections
      () => this.db.pingCheck('marketplace-db', { connection: 'marketplace' }),
      () => this.db.pingCheck('erp-auth-db', { connection: 'erpAuth' }),
      
      // Memory check
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      
      // Disk space check
      () => this.disk.checkStorage('storage', { 
        thresholdPercent: 0.9, 
        path: '/' 
      }),
    ])
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('marketplace-db', { connection: 'marketplace' }),
      () => this.db.pingCheck('erp-auth-db', { connection: 'erpAuth' }),
    ])
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check' })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }
  }

  @Get('tenant/topsteel')
  @ApiOperation({ summary: 'Test topsteel tenant resolution' })
  async testTopsteelTenant() {
    try {
      // Test de résolution du tenant topsteel
      const tenantContext = await this.tenantResolver.resolveTenantByDomain('topsteel.localhost')
      
      return {
        status: 'success',
        tenant: {
          societeId: tenantContext.societeId,
          nom: tenantContext.societe.nom,
          hasConnection: !!tenantContext.erpTenantConnection,
          isInitialized: tenantContext.erpTenantConnection?.isInitialized,
          marketplaceEnabled: tenantContext.marketplaceEnabled
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }
  }
}