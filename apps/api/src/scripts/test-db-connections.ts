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
    console.log('🔌 Test des connexions aux bases de données...\n')

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

    console.log(`🔍 Test de connexion ${name}...`)
    console.log(`   📍 ${connectionInfo.host}:${connectionInfo.port}/${connectionInfo.database}`)

    try {
      // Tenter la connexion
      await dataSource.initialize()
      connectionInfo.connected = true
      console.log(`   ✅ Connexion établie`)

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

      console.log(`   📊 PostgreSQL version: ${connectionInfo.version}`)
      console.log(`   📋 Tables trouvées: ${connectionInfo.tableCount}`)

      // Lister quelques tables importantes
      await this.listImportantTables(dataSource, name)
    } catch (error) {
      connectionInfo.connected = false
      connectionInfo.error = error instanceof Error ? error.message : String(error)
      console.log(`   ❌ Échec de connexion: ${connectionInfo.error}`)
    } finally {
      // Fermer la connexion
      if (dataSource.isInitialized) {
        await dataSource.destroy()
        console.log(`   🔐 Connexion fermée`)
      }
    }

    this.results.push(connectionInfo)
    console.log('')
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
        console.log(`   📝 Tables importantes: ${existingTables.join(', ')}`)
      } else {
        console.log(`   ⚠️  Aucune table importante trouvée`)
      }
    } catch (error) {
      console.log(`   ⚠️  Impossible de lister les tables: ${error}`)
    }
  }

  private displayResults(): void {
    console.log('='.repeat(80))
    console.log('📋 RÉSUMÉ DES CONNEXIONS')
    console.log('='.repeat(80))

    const successCount = this.results.filter((r) => r.connected).length
    const totalCount = this.results.length

    console.log(`\n📊 Statut global: ${successCount}/${totalCount} connexions réussies\n`)

    for (const result of this.results) {
      const status = result.connected ? '✅' : '❌'
      console.log(`${status} ${result.name}`)
      console.log(`   📍 Serveur: ${result.host}:${result.port}`)
      console.log(`   🗄️  Base: ${result.database}`)

      if (result.connected) {
        console.log(`   📊 Version: PostgreSQL ${result.version}`)
        console.log(`   📋 Tables: ${result.tableCount}`)
      } else {
        console.log(`   ❌ Erreur: ${result.error}`)
      }
      console.log('')
    }

    // Recommandations
    console.log('💡 RECOMMANDATIONS:')
    console.log('-'.repeat(50))

    if (successCount === totalCount) {
      console.log('✅ Toutes les connexions fonctionnent correctement!')
      console.log('✅ Vous pouvez exécuter les scripts de vérification de cohérence.')
    } else {
      console.log('❌ Certaines connexions échouent. Vérifiez:')
      console.log("   1. Variables d'environnement (.env)")
      console.log('   2. Serveur PostgreSQL démarré')
      console.log('   3. Permissions utilisateur')
      console.log('   4. Existence des bases de données')

      const failedConnections = this.results.filter((r) => !r.connected)
      for (const failed of failedConnections) {
        console.log(`\n   Pour ${failed.name}:`)
        console.log(
          `   createdb -h ${failed.host} -p ${failed.port} -U postgres ${failed.database}`
        )
      }
    }

    console.log('\n🔧 Scripts disponibles:')
    console.log('   npm run db:check-consistency  - Vérification de cohérence')
    console.log('   npm run db:detailed-report    - Rapport détaillé JSON')
    console.log('   npm run db:quick-fix          - Corrections interactives')

    console.log('\n' + '='.repeat(80))
  }
}

// Fonction utilitaire pour vérifier les variables d'environnement
function checkEnvironmentVariables(): void {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_AUTH_NAME']

  const missingVars = requiredVars.filter((varName) => !configService.get(varName))

  if (missingVars.length > 0) {
    console.log("⚠️  Variables d'environnement manquantes:")
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`)
    })
    console.log('\nVeuillez configurer ces variables dans votre fichier .env\n')
  }
}

// Exécution du script
async function main() {
  console.log('🧪 Script de test des connexions aux bases de données\n')

  // Vérifier les variables d'environnement
  checkEnvironmentVariables()

  const tester = new DatabaseConnectionTester()
  await tester.testConnections()
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}

export { DatabaseConnectionTester }
