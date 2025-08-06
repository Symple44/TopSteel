import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { DataSource, type DataSourceOptions } from 'typeorm'

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name)
  private readonly connections = new Map<string, DataSource>()

  constructor(private readonly configService: ConfigService) {}

  /**
   * Configuration de base PostgreSQL
   */
  private getBaseConfig(): Partial<DataSourceOptions> {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      synchronize: false,
      logging: this.configService.get('DB_LOGGING', false),
    }
  }

  /**
   * Obtenir une connexion pour un tenant
   */
  async getTenantConnection(tenantCode: string): Promise<DataSource> {
    const key = `tenant_${tenantCode.toLowerCase()}`

    // Vérifier si la connexion existe déjà
    if (this.connections.has(key)) {
      const connection = this.connections.get(key)
      if (connection?.isInitialized) {
        return connection
      }
    }

    // Créer une nouvelle connexion
    const config: DataSourceOptions = {
      ...this.getBaseConfig(),
      name: key,
      database: `erp_topsteel_${tenantCode.toLowerCase()}`,
      entities: [],
      migrations: [`dist/database/migrations/tenant/*.js`],
    } as DataSourceOptions

    try {
      const dataSource = new DataSource(config)
      await dataSource.initialize()

      this.connections.set(key, dataSource)
      this.logger.log(`✅ Connexion établie pour tenant: ${tenantCode}`)

      return dataSource
    } catch (error) {
      this.logger.error(`❌ Erreur connexion tenant ${tenantCode}:`, error)
      throw error
    }
  }

  /**
   * Fermer une connexion tenant
   */
  async closeTenantConnection(tenantCode: string): Promise<void> {
    const key = `tenant_${tenantCode.toLowerCase()}`
    const connection = this.connections.get(key)

    if (connection?.isInitialized) {
      await connection.destroy()
      this.connections.delete(key)
      this.logger.log(`Connexion fermée pour tenant: ${tenantCode}`)
    }
  }

  /**
   * Obtenir toutes les connexions actives
   */
  getActiveConnections(): { tenant: string; isInitialized: boolean; isCurrent?: boolean }[] {
    return Array.from(this.connections.entries()).map(([key, conn]) => ({
      tenant: key.replace('tenant_', ''),
      isInitialized: conn.isInitialized,
    }))
  }

  /**
   * Cleanup à la destruction du module
   */
  async onModuleDestroy() {
    this.logger.log('Fermeture de toutes les connexions tenant...')

    const promises = Array.from(this.connections.values())
      .filter((conn) => conn.isInitialized)
      .map((conn) => conn.destroy())

    await Promise.all(promises)
    this.connections.clear()

    this.logger.log('Toutes les connexions fermées')
  }
}
