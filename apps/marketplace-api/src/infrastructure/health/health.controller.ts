import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { 
  HealthCheckService, 
  HealthCheck, 
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator
} from '@nestjs/terminus'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
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
}