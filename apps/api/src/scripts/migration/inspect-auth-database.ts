#!/usr/bin/env ts-node

/**
 * Script d'inspection de la base AUTH de test
 * Pour comprendre pourquoi la table users n'existe pas
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

class AuthDatabaseInspector {
  private authDataSource: DataSource

  constructor(authDbName: string) {
    this.authDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: authDbName,
    })
  }

  async initialize(): Promise<void> {
    await this.authDataSource.initialize()
    console.log('🔗 Connexion à la base AUTH établie')
  }

  async destroy(): Promise<void> {
    if (this.authDataSource.isInitialized) {
      await this.authDataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }

  async inspectDatabase(): Promise<void> {
    console.log('🔍 INSPECTION DE LA BASE AUTH')
    console.log('=' + '='.repeat(39))

    try {
      // Lister toutes les tables
      const tables = await this.authDataSource.query(`
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)

      console.log('\\n📋 TABLES EXISTANTES:')
      if (tables.length === 0) {
        console.log('   ❌ Aucune table trouvée!')
      } else {
        tables.forEach((table, index) => {
          console.log(`   ${index + 1}. ${table.table_name}`)
        })
      }

      // Vérifier spécifiquement la table users
      const usersExists = await this.authDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `)

      console.log(`\\n👥 TABLE USERS:`)
      if (usersExists[0].exists) {
        console.log('   ✅ La table users existe')
        
        // Obtenir la structure
        const columns = await this.authDataSource.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = 'users'
          ORDER BY ordinal_position
        `)

        console.log('\\n   📊 STRUCTURE:')
        columns.forEach(col => {
          console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
        })
      } else {
        console.log('   ❌ La table users N\'EXISTE PAS!')
      }

      // Vérifier les migrations exécutées
      const migrationsTableExists = await this.authDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        )
      `)

      console.log(`\\n🔄 MIGRATIONS:`)
      if (migrationsTableExists[0].exists) {
        const migrations = await this.authDataSource.query(`
          SELECT id, timestamp, name 
          FROM migrations 
          ORDER BY timestamp
        `)

        console.log('   📋 Migrations exécutées:')
        if (migrations.length === 0) {
          console.log('     ❌ Aucune migration exécutée!')
        } else {
          migrations.forEach(migration => {
            console.log(`     ✓ ${migration.timestamp} - ${migration.name}`)
          })
        }
      } else {
        console.log('   ❌ Table migrations n\'existe pas!')
      }

      // Vérifier les extensions PostgreSQL
      const extensions = await this.authDataSource.query(`
        SELECT extname 
        FROM pg_extension 
        WHERE extname IN ('uuid-ossp', 'pgcrypto')
      `)

      console.log(`\\n🔧 EXTENSIONS:`)
      if (extensions.length > 0) {
        extensions.forEach(ext => {
          console.log(`   ✅ ${ext.extname} installée`)
        })
      } else {
        console.log('   ⚠️ Aucune extension UUID trouvée')
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'inspection:', (error as Error).message)
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize()
      await this.inspectDatabase()
    } catch (error) {
      console.error('💥 Erreur fatale:', error)
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const authDbName = process.argv[2]
  
  if (!authDbName) {
    console.error('❌ Usage: npx ts-node inspect-auth-database.ts <auth_db_name>')
    console.error('   Exemple: npx ts-node inspect-auth-database.ts topsteel_test_auth_2025-07-24T07-18-41')
    process.exit(1)
  }

  console.log(`🎯 INSPECTION DE LA BASE AUTH: ${authDbName}`)

  const inspector = new AuthDatabaseInspector(authDbName)
  inspector.run()
    .then(() => {
      console.log('\\n✅ Inspection terminée.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Inspection échouée:', error)
      process.exit(1)
    })
}

export { AuthDatabaseInspector }