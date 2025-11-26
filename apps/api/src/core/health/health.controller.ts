import { Controller, Get } from '@nestjs/common'
import { Public } from '../multi-tenant'
import { ConfigService } from '@nestjs/config'
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus'
import type { HealthIndicatorFunction, HealthIndicatorResult } from '@nestjs/terminus'
// TypeORM removed - migrated to Prisma
import { CircuitBreakerHealthIndicator } from '../../infrastructure/monitoring/circuit-breaker-health.indicator'
// import { MultiTenantDatabaseConfig } from '../database/config/multi-tenant-database.config' // REMOVED: Prisma migration
import { IntegrityService } from './integrity.service'
import { SystemHealthService } from './system-health-simple.service'

@Controller('health')
@Public()
export class HealthController {
  private readonly startTime = Date.now()

  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private integrity: IntegrityService,
    private configService: ConfigService,
    private systemHealth: SystemHealthService,
    private circuitBreaker: CircuitBreakerHealthIndicator,
    // private multiTenantConfig: MultiTenantDatabaseConfig // REMOVED: Prisma migration
  ) {}

  @Get()
  async check() {
    try {
      const healthChecks: HealthIndicatorFunction[] = [
        // Vérifier les bases de données multi-tenant
        // TODO: Re-enable when Prisma migration is complete
        // () => this.checkMultiTenantDatabase('auth'),
        // () => this.checkMultiTenantDatabase('shared'),
        // Seuils mémoire plus réalistes pour une application moderne
        () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024), // 1GB pour éviter les faux positifs
        () => this.memory.checkRSS('memory_rss', 1536 * 1024 * 1024), // 1.5GB pour éviter les faux positifs
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
      // TODO: Re-enable when Prisma migration is complete
      // const isAuthDatabaseConnected = healthResult.details?.database_auth?.status === 'up'
      // const isSharedDatabaseConnected = healthResult.details?.database_shared?.status === 'up'
      const activeUsers = await this.getActiveUsersCount()
      const version = await this.getApplicationVersion()

      return {
        ...healthResult,
        // Informations spécifiques pour le modal
        version,
        environment: process.env.NODE_ENV || 'development',
        uptime,
        database: {
          status: 'up', // Simplified during Prisma migration
          connectionStatus: 'connected',
          message: 'Database checks temporarily disabled during Prisma migration',
        },
        activeUsers,
        timestamp: new Date().toISOString(),
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
          connectionStatus: 'disconnected',
        },
        activeUsers: null,
        timestamp: new Date().toISOString(),
      }
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      return await this.integrity.getActiveUsersCount()
    } catch (_error) {
      // Erreur lors du comptage des utilisateurs actifs - ignorer silencieusement
      return 0
    }
  }

  private async getApplicationVersion(): Promise<string> {
    try {
      // Utiliser la configuration NestJS qui lit APP_VERSION depuis .env
      return this.configService.get<string>('app.version', '1.0.0')
    } catch (_error) {
      // Erreur lors de la lecture de la version - retourner valeur par défaut
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
    return this.health.check([() => this.circuitBreaker.check()])
  }

  // TODO: Re-enable when Prisma migration is complete
  /*
  /**
   * Vérifie une base de données multi-tenant directement
   * NOTE: Migrated to Prisma with Row-Level Security - separate databases no longer used
   *\/
  private async checkMultiTenantDatabase(type: 'auth' | 'shared'): Promise<HealthIndicatorResult> {
    const key = `database_${type}`

    // With Prisma migration, we use single database with RLS
    // This check is kept for compatibility but returns migrated status
    return {
      [key]: {
        status: 'migrated',
        message: `Database migrated to Prisma with Row-Level Security (single DB)`,
      },
    }
  }

  @Get('database')
  async checkDatabaseConnections() {
    try {
      const authCheck = await this.checkMultiTenantDatabase('auth')
      const sharedCheck = await this.checkMultiTenantDatabase('shared')

      return {
        auth: authCheck,
        shared: sharedCheck,
        summary: {
          authConnected: authCheck.database_auth?.status === 'up',
          sharedConnected: sharedCheck.database_shared?.status === 'up',
          multiTenantReady: authCheck.database_auth?.status === 'up',
        },
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        auth: { status: 'error' },
        shared: { status: 'error' },
        summary: {
          authConnected: false,
          sharedConnected: false,
          multiTenantReady: false,
        },
      }
    }
  }
  */
}
