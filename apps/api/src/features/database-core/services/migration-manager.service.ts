import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
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

/**
 * Migration Manager Service
 *
 * NOTE: This service was originally designed for TypeORM's programmatic migration API.
 * Prisma handles migrations differently - they are managed via CLI commands:
 *
 * Development: `prisma migrate dev`
 * Production: `prisma migrate deploy`
 * Status: `prisma migrate status`
 * Reset: `prisma migrate reset`
 *
 * Prisma does not expose Node.js APIs for running migrations programmatically.
 * For programmatic migration management, you would need to use child_process
 * to execute Prisma CLI commands.
 *
 * This service is kept for structural compatibility but most migration
 * execution functionality has been disabled. Use Prisma CLI for migrations.
 */
@Injectable()
export class MigrationManagerService {
  private readonly logger = new Logger(MigrationManagerService.name)

  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Obtenir le statut des migrations pour une base
   *
   * NOTE: Partially disabled - Prisma migrations are CLI-managed
   */
  private async getDatabaseMigrationStatus(databaseName: string): Promise<MigrationStatus> {
    try {
      // Get executed migrations from Prisma's _prisma_migrations table
      let executedMigrations: string[] = []
      try {
        const result = await this.prisma.$queryRawUnsafe<Array<{ migration_name: string }>>(
          'SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC'
        )
        executedMigrations = result.map((row) => row.migration_name)
      } catch (_error) {
        // The _prisma_migrations table might not exist yet
        this.logger.debug(`_prisma_migrations table not found for ${databaseName}`)
      }

      // Get available migrations from filesystem
      const fs = require('node:fs')
      const path = require('node:path')

      let migrationDir = path.join(process.cwd(), 'prisma', 'migrations')

      let allMigrations: string[] = []
      try {
        if (fs.existsSync(migrationDir)) {
          const migrationFolders = fs
            .readdirSync(migrationDir)
            .filter((item: string) => {
              const itemPath = path.join(migrationDir, item)
              return fs.statSync(itemPath).isDirectory()
            })
            .sort()

          allMigrations = migrationFolders
        }
      } catch (_error) {
        this.logger.warn(`Error reading migration directory: ${migrationDir}`)
      }

      // Calculate pending migrations
      const pendingMigrations = allMigrations.filter(
        (migration) => !executedMigrations.includes(migration)
      )

      const status = pendingMigrations.length > 0 ? 'pending' : 'up-to-date'

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
   *
   * DISABLED: Prisma migrations must be run via CLI
   * Use: `npx prisma migrate deploy` or `npx prisma migrate dev`
   */
  private async runDatabaseMigrations(databaseName: string): Promise<MigrationResult> {
    this.logger.warn(
      `Migration execution disabled for ${databaseName}. Use Prisma CLI: npx prisma migrate deploy`
    )

    return {
      database: databaseName,
      success: false,
      migrations: [],
      error:
        'Prisma migrations must be run via CLI. Use: npx prisma migrate deploy (production) or npx prisma migrate dev (development)',
    }
  }

  /**
   * Obtenir le statut de toutes les migrations
   */
  async getAllMigrationStatus(): Promise<MigrationStatus[]> {
    const results = await Promise.all([
      this.getDatabaseMigrationStatus('prisma'),
      // Add additional databases if using multiple Prisma schemas
    ])

    return results
  }

  /**
   * Exécuter toutes les migrations
   *
   * DISABLED: Use Prisma CLI instead
   */
  async runAllMigrations(): Promise<MigrationResult[]> {
    this.logger.warn('Migration execution disabled. Use Prisma CLI: npx prisma migrate deploy')

    return [
      {
        database: 'prisma',
        success: false,
        migrations: [],
        error: 'Use Prisma CLI: npx prisma migrate deploy',
      },
    ]
  }

  /**
   * Obtenir le statut des migrations pour un tenant
   *
   * NOTE: Multi-tenant migrations require separate Prisma schema files or custom solution
   */
  async getTenantMigrationStatus(tenantCode: string): Promise<MigrationStatus> {
    try {
      // This would require multi-schema support or connection URL switching
      return await this.getDatabaseMigrationStatus(`tenant_${tenantCode}`)
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
   *
   * DISABLED: Use Prisma CLI with appropriate DATABASE_URL
   */
  async runTenantMigrations(tenantCode: string): Promise<MigrationResult> {
    this.logger.warn(
      `Tenant migration execution disabled for ${tenantCode}. Use Prisma CLI with appropriate DATABASE_URL`
    )

    return {
      database: `tenant_${tenantCode}`,
      success: false,
      migrations: [],
      error: 'Use Prisma CLI with tenant-specific DATABASE_URL: npx prisma migrate deploy',
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

      const migrationDir = path.join(process.cwd(), 'prisma', 'migrations')

      // Prisma migrations are in folders named with timestamps
      const migrationPath = path.join(migrationDir, migrationName)

      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration not found: ${migrationName}`)
      }

      // Read the migration.sql file
      const sqlFile = path.join(migrationPath, 'migration.sql')
      if (!fs.existsSync(sqlFile)) {
        throw new Error(`migration.sql not found for: ${migrationName}`)
      }

      const content = fs.readFileSync(sqlFile, 'utf8')
      const stats = fs.statSync(sqlFile)

      return {
        database,
        migrationName,
        content,
        size: content.length,
        lastModified: stats.mtime.toISOString(),
        path: migrationPath.replace(process.cwd(), ''),
        description: this.getMigrationDescription(migrationName),
        type: this.getMigrationType(migrationName),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Error reading migration file: ${errorMessage}`)
      throw new Error(`Error reading migration file: ${errorMessage}`)
    }
  }

  private getMigrationDescription(migrationName: string): string {
    if (migrationName.includes('create')) return 'Création de nouvelles tables'
    if (migrationName.includes('add')) return 'Ajout de colonnes ou fonctionnalités'
    if (migrationName.includes('update')) return 'Mise à jour de structures existantes'
    if (migrationName.includes('drop')) return "Suppression d'éléments"
    if (migrationName.includes('init')) return 'Migration initiale'
    return 'Migration de base de données'
  }

  private getMigrationType(migrationName: string): string {
    if (migrationName.includes('user') || migrationName.includes('auth'))
      return 'Authentification'
    if (migrationName.includes('production')) return 'Production'
    if (migrationName.includes('inventory')) return 'Inventaire'
    if (migrationName.includes('translation')) return 'Internationalisation'
    if (migrationName.includes('menu')) return 'Interface'
    if (migrationName.includes('init')) return 'Initialisation'
    return 'Structure'
  }

  /**
   * Helper method to check if Prisma CLI is available
   */
  async checkPrismaCLI(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { execSync } = require('node:child_process')
      const version = execSync('npx prisma --version', {
        encoding: 'utf8',
        stdio: 'pipe',
      })

      return {
        available: true,
        version: version.trim(),
      }
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
