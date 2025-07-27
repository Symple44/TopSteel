import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import { IntegrityService } from './integrity.service'
import { SystemHealthService } from './system-health-simple.service'
import { CircuitBreakerHealthIndicator } from './circuit-breaker-health.indicator'

@Controller('health')
export class HealthController {
  private startTime = Date.now()
  
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private integrity: IntegrityService,
    private configService: ConfigService,
    private systemHealth: SystemHealthService,
    private circuitBreaker: CircuitBreakerHealthIndicator
  ) {}

  @Get()
  async check() {
    try {
      const healthChecks: Array<() => Promise<any>> = [
        () => this.db.pingCheck('database', { connection: 'auth' }),
        () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      ]

      // Désactiver le check disque en développement car souvent problématique
      if (process.env.NODE_ENV === 'production') {
        healthChecks.push(() =>
          this.disk.checkStorage('storage', {
            path: process.platform === 'win32' ? 'C:\\' : '/',
            threshold: 10 * 1024 * 1024 * 1024, // 10GB seulement
          })
        )
      }

      const healthResult = await this.health.check(healthChecks)

      // Informations additionnelles pour le modal ERP
      const uptime = this.formatUptime(Date.now() - this.startTime)
      const isDatabaseConnected = healthResult.details?.database?.status === 'up'
      const activeUsers = await this.getActiveUsersCount()
      const version = await this.getApplicationVersion()
      
      return {
        ...healthResult,
        // Informations spécifiques pour le modal
        version,
        environment: process.env.NODE_ENV || 'development',
        uptime,
        database: {
          ...healthResult.details?.database,
          connectionStatus: isDatabaseConnected ? 'connected' : 'disconnected'
        },
        activeUsers,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      // En cas d'erreur, retourner des informations basiques
      const version = await this.getApplicationVersion()
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        version,
        environment: process.env.NODE_ENV || 'development',
        uptime: this.formatUptime(Date.now() - this.startTime),
        database: {
          status: 'down',
          connectionStatus: 'disconnected'
        },
        activeUsers: null,
        timestamp: new Date().toISOString()
      }
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      return await this.integrity.getActiveUsersCount()
    } catch (error) {
      console.error('Erreur lors du comptage des utilisateurs actifs:', error)
      return 0
    }
  }

  private async getApplicationVersion(): Promise<string> {
    try {
      // Utiliser la configuration NestJS qui lit APP_VERSION depuis .env
      return this.configService.get<string>('app.version', '1.0.0')
    } catch (error) {
      console.error('Erreur lors de la lecture de la version:', error)
      return '1.0.0'
    }
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}j ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  @Get('integrity')
  async checkIntegrity() {
    return this.integrity.performFullCheck()
  }

  @Get('metrics')
  async getMetrics() {
    return this.integrity.getSystemMetrics()
  }

  @Get('system')
  async getSystemHealth() {
    return this.systemHealth.checkSystemHealth()
  }

  @Get('summary')
  async getHealthSummary() {
    return this.systemHealth.getHealthSummary()
  }

  @Get('circuit-breakers')
  @HealthCheck()
  async checkCircuitBreakers() {
    return this.health.check([
      () => this.circuitBreaker.check(),
    ])
  }
}
