import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { TenantConnectionService } from './tenant-connection.service'

export interface MigrationStatus {
  database: string
  pending: string[]
  executed: string[]
  status: 'up-to-date' | 'pending' | 'error'
  error?: string
}

export interface MigrationResult {
  database: string
  success: boolean
  migrations: string[]
  error?: string
}

@Injectable()
export class MigrationManagerService {
  private readonly logger = new Logger(MigrationManagerService.name)

  constructor(
    @InjectDataSource('auth') private authDataSource: DataSource,
    @InjectDataSource('shared') private sharedDataSource: DataSource,
    @InjectDataSource('tenant') private tenantDataSource: DataSource,
    private tenantConnectionService: TenantConnectionService,
  ) {}

  /**
   * Obtenir le statut des migrations pour une base
   */
  private async getDatabaseMigrationStatus(
    dataSource: DataSource,
    databaseName: string
  ): Promise<MigrationStatus> {
    try {
      if (!dataSource.isInitialized) {
        return {
          database: databaseName,
          pending: [],
          executed: [],
          status: 'error',
          error: 'DataSource not initialized',
        }
      }

      // Vérifier s'il y a des migrations en attente
      const hasPendingMigrations = await dataSource.showMigrations()
      
      // Obtenir la liste des migrations disponibles
      const allMigrations = dataSource.migrations.map(migration => migration.name || migration.constructor.name)
      
      // Obtenir les migrations exécutées
      let executedMigrations: string[] = []
      try {
        const result = await dataSource.query(
          'SELECT name FROM migrations ORDER BY timestamp DESC'
        )
        executedMigrations = result.map((row: any) => row.name)
      } catch (error) {
        // La table migrations n'existe peut-être pas encore
        this.logger.debug(`Table migrations non trouvée pour ${databaseName}`)
      }

      // Calculer les migrations en attente
      const pendingMigrations = allMigrations.filter(
        migration => !executedMigrations.includes(migration)
      )

      const status = hasPendingMigrations ? 'pending' : 'up-to-date'

      return {
        database: databaseName,
        pending: pendingMigrations,
        executed: executedMigrations,
        status,
      }
    } catch (error) {
      return {
        database: databaseName,
        pending: [],
        executed: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Exécuter les migrations pour une base
   */
  private async runDatabaseMigrations(
    dataSource: DataSource,
    databaseName: string
  ): Promise<MigrationResult> {
    try {
      if (!dataSource.isInitialized) {
        throw new Error('DataSource not initialized')
      }

      const migrations = await dataSource.runMigrations({
        transaction: 'each',
      })

      this.logger.log(
        `✅ ${migrations.length} migration(s) exécutée(s) pour ${databaseName}`
      )

      return {
        database: databaseName,
        success: true,
        migrations: migrations.map(m => m.name),
      }
    } catch (error) {
      this.logger.error(`❌ Erreur migrations ${databaseName}:`, error)
      return {
        database: databaseName,
        success: false,
        migrations: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Obtenir le statut de toutes les migrations
   */
  async getAllMigrationStatus(): Promise<MigrationStatus[]> {
    const results = await Promise.all([
      this.getDatabaseMigrationStatus(this.authDataSource, 'auth'),
      this.getDatabaseMigrationStatus(this.sharedDataSource, 'shared'),
      this.getDatabaseMigrationStatus(this.tenantDataSource, 'tenant_topsteel'),
    ])

    return results
  }

  /**
   * Exécuter toutes les migrations
   */
  async runAllMigrations(): Promise<MigrationResult[]> {
    this.logger.log('🔄 Exécution des migrations pour toutes les bases...')

    const results = await Promise.all([
      this.runDatabaseMigrations(this.authDataSource, 'auth'),
      this.runDatabaseMigrations(this.sharedDataSource, 'shared'),
      this.runDatabaseMigrations(this.tenantDataSource, 'tenant_topsteel'),
    ])

    return results
  }

  /**
   * Obtenir le statut des migrations pour un tenant
   */
  async getTenantMigrationStatus(tenantCode: string): Promise<MigrationStatus> {
    try {
      const connection = await this.tenantConnectionService.getTenantConnection(tenantCode)
      return await this.getDatabaseMigrationStatus(connection, `tenant_${tenantCode}`)
    } catch (error) {
      return {
        database: `tenant_${tenantCode}`,
        pending: [],
        executed: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Exécuter les migrations pour un tenant
   */
  async runTenantMigrations(tenantCode: string): Promise<MigrationResult> {
    try {
      const connection = await this.tenantConnectionService.getTenantConnection(tenantCode)
      return await this.runDatabaseMigrations(connection, `tenant_${tenantCode}`)
    } catch (error) {
      return {
        database: `tenant_${tenantCode}`,
        success: false,
        migrations: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}