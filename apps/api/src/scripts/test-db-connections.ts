#!/usr/bin/env ts-node

/**
 * Script de test des connexions aux bases de données
 *
 * Ce script teste rapidement les connexions aux bases AUTH et TENANT
 * et affiche les informations de base de chaque base de données.
 */

import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'
import { tenantDataSourceOptions } from '../core/database/data-source-tenant'

config()

const configService = new ConfigService()

interface DatabaseConnectionInfo {
  name: string
  host: string
  port: number
  database: string
  connected: boolean
  version?: string
  tableCount?: number
  error?: string
}

class DatabaseConnectionTester {
  private results: DatabaseConnectionInfo[] = []

  async testConnections(): Promise<void> {
    // Tester la connexion AUTH
    await this.testConnection('AUTH', this.createAuthDataSource())

    // Tester la connexion TENANT
    await this.testConnection('TENANT', this.createTenantDataSource())

    // Afficher le résumé
    this.displayResults()
  }

  private createAuthDataSource(): DataSource {
    return new DataSource(authDataSourceOptions)
  }

  private createTenantDataSource(): DataSource {
    const tenantConfig = {
      ...tenantDataSourceOptions,
      database: configService.get('DB_TENANT_TEST_NAME', 'erp_topsteel_topsteel'),
    }
    return new DataSource(tenantConfig)
  }

  private async testConnection(name: string, dataSource: DataSource): Promise<void> {
    const connectionInfo: DatabaseConnectionInfo = {
      name,
      host: (dataSource.options as any).host as string,
      port: (dataSource.options as any).port as number,
      database: (dataSource.options as any).database as string,
      connected: false,
    }

    try {
      // Tenter la connexion
      await dataSource.initialize()
      connectionInfo.connected = true

      // Récupérer la version PostgreSQL
      const versionResult = await dataSource.query('SELECT version()')
      connectionInfo.version = versionResult[0].version.split(' ')[1] // Extraire juste le numéro de version

      // Compter les tables
      const tableCountResult = await dataSource.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `)
      connectionInfo.tableCount = parseInt(tableCountResult[0].count)

      // Lister quelques tables importantes
      await this.listImportantTables(dataSource, name)
    } catch (error) {
      connectionInfo.connected = false
      connectionInfo.error = error instanceof Error ? error.message : String(error)
    } finally {
      // Fermer la connexion
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    }

    this.results.push(connectionInfo)
  }

  private async listImportantTables(dataSource: DataSource, dbType: string): Promise<void> {
    try {
      const importantTables =
        dbType === 'AUTH'
          ? ['users', 'societes', 'user_sessions', 'roles', 'permissions']
          : ['articles', 'materials', 'partners', 'notifications']

      const existingTables = []

      for (const tableName of importantTables) {
        const result = await dataSource.query(
          `
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = $1 
          AND table_schema = 'public'
        `,
          [tableName]
        )

        if (result[0].count > 0) {
          // Compter les enregistrements
          try {
            const countResult = await dataSource.query(
              `SELECT COUNT(*) as count FROM "${tableName}"`
            )
            const rowCount = parseInt(countResult[0].count)
            existingTables.push(`${tableName} (${rowCount} rows)` as never)
          } catch {
            existingTables.push(`${tableName} (? rows)` as never)
          }
        }
      }

      if (existingTables.length > 0) {
      } else {
      }
    } catch (_error) {}
  }

  private displayResults(): void {
    const successCount = this.results.filter((r) => r.connected).length
    const totalCount = this.results.length

    for (const result of this.results) {
      const _status = result.connected ? '✅' : '❌'

      if (result.connected) {
      } else {
      }
    }

    if (successCount === totalCount) {
    } else {
      const failedConnections = this.results.filter((r) => !r.connected)
      for (const _failed of failedConnections) {
      }
    }
  }
}

// Fonction utilitaire pour vérifier les variables d'environnement
function checkEnvironmentVariables(): void {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_AUTH_NAME']

  const missingVars = requiredVars.filter((varName) => !configService.get(varName))

  if (missingVars.length > 0) {
    missingVars.forEach((_varName) => {})
  }
}

// Exécution du script
async function main() {
  // Vérifier les variables d'environnement
  checkEnvironmentVariables()

  const tester = new DatabaseConnectionTester()
  await tester.testConnections()
}

if (require.main === module) {
  main().catch((_error) => {
    process.exit(1)
  })
}

export { DatabaseConnectionTester }
