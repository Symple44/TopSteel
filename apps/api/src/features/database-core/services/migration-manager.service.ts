import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import type { TenantConnectionService } from './tenant-connection.service'

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
    @InjectDataSource('auth') private _authDataSource: DataSource,
    @InjectDataSource('shared') private _sharedDataSource: DataSource,
    @InjectDataSource('tenant') private _tenantDataSource: DataSource,
    private readonly tenantConnectionService: TenantConnectionService
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

      // Obtenir la liste des migrations disponibles à partir des fichiers
      const fs = require('node:fs')
      const path = require('node:path')

      let migrationDir = ''
      if (databaseName === 'auth') {
        migrationDir = path.join(process.cwd(), 'src', 'core', 'database', 'migrations', 'auth')
      } else if (databaseName === 'shared') {
        migrationDir = path.join(process.cwd(), 'src', 'core', 'database', 'migrations', 'shared')
      } else if (databaseName.startsWith('tenant_')) {
        migrationDir = path.join(process.cwd(), 'src', 'core', 'database', 'migrations', 'tenant')
      }

      let allMigrations: string[] = []
      try {
        if (fs.existsSync(migrationDir)) {
          const files = fs.readdirSync(migrationDir).filter((file: string) => file.endsWith('.ts'))

          // Extraire les noms de classe des migrations depuis les fichiers
          allMigrations = files
            .map((file: string) => {
              try {
                const content = fs.readFileSync(path.join(migrationDir, file), 'utf8')
                const nameMatch = content.match(/name = '([^']+)'/)
                if (nameMatch) {
                  return nameMatch[1]
                }

                // Fallback : extraire le nom de classe
                const classMatch = content.match(/export class (\w+)/)
                if (classMatch) {
                  return classMatch[1]
                }

                // Dernier fallback : nom de fichier sans extension
                return file.replace('.ts', '')
              } catch (_error) {
                this.logger.warn(`Erreur lors de la lecture du fichier ${file}`)
                return file.replace('.ts', '')
              }
            })
            .sort()
        }
      } catch (_error) {
        this.logger.warn(`Erreur lors de la lecture du dossier ${migrationDir}`)
      }

      // Obtenir les migrations exécutées
      let executedMigrations: string[] = []
      try {
        const result = await dataSource.query('SELECT name FROM migrations ORDER BY timestamp DESC')
        executedMigrations = result.map((row: { name: string }) => row.name)
      } catch (_error) {
        // La table migrations n'existe peut-être pas encore
        this.logger.debug(`Table migrations non trouvée pour ${databaseName}`)
      }

      // Calculer les migrations en attente
      const pendingMigrations = allMigrations.filter(
        (migration) => !executedMigrations.includes(migration)
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

      this.logger.log(`🔄 Début exécution migrations pour ${databaseName}`)
      this.logger.debug(`DataSource config:`, {
        database: dataSource.options.database,
        migrations: dataSource.options.migrations,
        name: dataSource.name,
      })

      // Vérifier s'il y a des migrations en attente
      const pendingMigrations = await dataSource.showMigrations()
      this.logger.log(
        `📋 ${pendingMigrations ? 'Des migrations sont en attente' : 'Aucune migration en attente'} pour ${databaseName}`
      )

      if (!pendingMigrations) {
        return {
          database: databaseName,
          success: true,
          migrations: [],
        }
      }

      const migrations = await dataSource.runMigrations({
        transaction: 'each',
      })

      this.logger.log(
        `✅ ${migrations.length} migration(s) exécutée(s) pour ${databaseName}:`,
        migrations.map((m) => m.name)
      )

      return {
        database: databaseName,
        success: true,
        migrations: migrations.map((m) => m.name),
      }
    } catch (error) {
      this.logger.error(`❌ Erreur migrations ${databaseName}:`, error)
      this.logger.error(`Stack trace:`, error instanceof Error ? error.stack : 'No stack trace')
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
      this.getDatabaseMigrationStatus(this._authDataSource, 'auth'),
      this.getDatabaseMigrationStatus(this._sharedDataSource, 'shared'),
      this.getDatabaseMigrationStatus(this._tenantDataSource, 'tenant_topsteel'),
    ])

    return results
  }

  /**
   * Exécuter toutes les migrations
   */
  async runAllMigrations(): Promise<MigrationResult[]> {
    this.logger.log('🔄 Exécution des migrations pour toutes les bases...')

    const results = await Promise.all([
      this.runDatabaseMigrations(this._authDataSource, 'auth'),
      this.runDatabaseMigrations(this._sharedDataSource, 'shared'),
      this.runDatabaseMigrations(this._tenantDataSource, 'tenant_topsteel'),
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

  /**
   * Obtenir les détails d'une migration spécifique
   */
  async getMigrationDetails(
    database: string,
    migrationName: string
  ): Promise<Record<string, unknown>> {
    try {
      const fs = require('node:fs')
      const path = require('node:path')

      let migrationDir = ''

      if (database === 'auth') {
        migrationDir = path.join(process.cwd(), 'src', 'core', 'database', 'migrations', 'auth')
      } else if (database === 'shared') {
        migrationDir = path.join(process.cwd(), 'src', 'core', 'database', 'migrations', 'shared')
      } else if (database.startsWith('tenant_')) {
        migrationDir = path.join(process.cwd(), 'src', 'core', 'database', 'migrations', 'tenant')
      }

      // Chercher le fichier qui contient le nom de la migration
      const files = fs.readdirSync(migrationDir)
      const migrationFile = files.find(
        (file: string) =>
          file.includes(migrationName) ||
          migrationName.includes(file.replace(/\.(ts|js)$/, '').replace(/^\d{3}-/, ''))
      )

      if (!migrationFile) {
        this.logger.warn(`Migration recherchée: ${migrationName}`)
        this.logger.warn(`Fichiers disponibles: ${files.join(', ')}`)
        throw new Error(`Fichier de migration non trouvé pour: ${migrationName} dans ${database}`)
      }

      const migrationPath = path.join(migrationDir, migrationFile)
      const content = fs.readFileSync(migrationPath, 'utf8')
      const stats = fs.statSync(migrationPath)

      return {
        database,
        migrationName: migrationFile.replace(/\.(ts|js)$/, ''),
        content,
        size: content.length,
        lastModified: stats.mtime.toISOString(),
        path: migrationPath.replace(process.cwd(), ''),
        description: this.getMigrationDescription(migrationFile),
        type: this.getMigrationType(migrationFile),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Erreur lors de la lecture du fichier de migration: ${errorMessage}`)
      throw new Error(`Erreur lors de la lecture du fichier de migration: ${errorMessage}`)
    }
  }

  private getMigrationDescription(migrationName: string): string {
    if (migrationName.includes('Create')) return 'Création de nouvelles tables'
    if (migrationName.includes('Add')) return 'Ajout de colonnes ou fonctionnalités'
    if (migrationName.includes('Update')) return 'Mise à jour de structures existantes'
    if (migrationName.includes('Drop')) return "Suppression d'éléments"
    return 'Migration de base de données'
  }

  private getMigrationType(migrationName: string): string {
    if (migrationName.includes('User') || migrationName.includes('Auth')) return 'Authentification'
    if (migrationName.includes('Production')) return 'Production'
    if (migrationName.includes('Inventory')) return 'Inventaire'
    if (migrationName.includes('Translation')) return 'Internationalisation'
    if (migrationName.includes('Menu')) return 'Interface'
    return 'Structure'
  }
}
