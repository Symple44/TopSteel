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
import { MultiTenantDatabaseConfig } from '../database/config/multi-tenant-database.config'

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
    private circuitBreaker: CircuitBreakerHealthIndicator,
    private multiTenantConfig: MultiTenantDatabaseConfig
  ) {}

  @Get()
  async check() {
    try {
      const healthChecks: Array<() => Promise<any>> = [
        // Vérifier les bases de données multi-tenant
        () => this.checkMultiTenantDatabase('auth'),
        () => this.checkMultiTenantDatabase('shared'),
        // Seuils mémoire plus réalistes pour une application moderne
        () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024), // 512MB au lieu de 150MB
        () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),   // 512MB au lieu de 150MB
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
      const isAuthDatabaseConnected = healthResult.details?.database_auth?.status === 'up'
      const isSharedDatabaseConnected = healthResult.details?.database_shared?.status === 'up'
      const activeUsers = await this.getActiveUsersCount()
      const version = await this.getApplicationVersion()
      
      return {
        ...healthResult,
        // Informations spécifiques pour le modal
        version,
        environment: process.env.NODE_ENV || 'development',
        uptime,
        database: {
          auth: {
            status: healthResult.details?.database_auth?.status || 'unknown',
            connectionStatus: isAuthDatabaseConnected ? 'connected' : 'disconnected'
          },
          shared: {
            status: healthResult.details?.database_shared?.status || 'not_configured',
            connectionStatus: isSharedDatabaseConnected ? 'connected' : 'not_configured'
          },
          // Status global (ok si au moins auth fonctionne)
          status: isAuthDatabaseConnected ? 'up' : 'down',
          connectionStatus: isAuthDatabaseConnected ? 'connected' : 'disconnected'
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

  /**
   * Vérifie une base de données multi-tenant directement
   */
  private async checkMultiTenantDatabase(type: 'auth' | 'shared') {
    try {
      let config
      const key = `database_${type}`
      
      if (type === 'auth') {
        config = this.multiTenantConfig.getAuthDatabaseConfig()
      } else {
        config = this.multiTenantConfig.getSharedDatabaseConfig()
      }

      // Test de connexion direct
      const { DataSource } = await import('typeorm')
      const testConnection = new DataSource({
        type: config.type as any,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: config.database,
        entities: []
      })

      await testConnection.initialize()
      await testConnection.query('SELECT 1')
      await testConnection.destroy()

      return {
        [key]: {
          status: 'up',
          message: `${type} database is connected`
        }
      }
    } catch (error) {
      return {
        [`database_${type}`]: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
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
          multiTenantReady: authCheck.database_auth?.status === 'up'
        }
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        auth: { status: 'error' },
        shared: { status: 'error' },
        summary: {
          authConnected: false,
          sharedConnected: false,
          multiTenantReady: false
        }
      }
    }
  }
}
