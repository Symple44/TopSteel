import { Controller, Get } from '@nestjs/common'
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import { IntegrityService } from './integrity.service'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private integrity: IntegrityService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          threshold: 250 * 1024 * 1024 * 1024,
        }),
    ])
  }

  @Get('integrity')
  async checkIntegrity() {
    return this.integrity.performFullCheck()
  }

  @Get('metrics')
  async getMetrics() {
    return this.integrity.getSystemMetrics()
  }
}
