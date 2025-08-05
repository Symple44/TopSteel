#!/usr/bin/env ts-node

/**
 * Script pour exécuter les migrations de la Phase 0
 *
 * Ce script exécute dans l'ordre :
 * 1. Les migrations pour aligner la structure des tables
 * 2. La réinitialisation des utilisateurs ADMIN et TEST
 */

import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'
import { AdminTestUsersResetter } from './reset-admin-test-users'

config()

class Phase0MigrationRunner {
  private authDataSource: DataSource

  constructor() {
    // Configurer la datasource avec les migrations
    const migrationsPath = path.join(__dirname, '../core/database/migrations/auth/*.ts')

    this.authDataSource = new DataSource({
      ...authDataSourceOptions,
      migrations: [migrationsPath],
      logging: true,
    })
  }

  async runMigrations(): Promise<void> {
    console.log('🚀 Exécution des migrations de la Phase 0...\n')

    try {
      // 1. Initialiser la connexion
      await this.authDataSource.initialize()
      console.log('✅ Connexion établie à la base AUTH\n')

      // 2. Vérifier les migrations en attente
      const pendingMigrations = await this.authDataSource.showMigrations()
      console.log('📋 Vérification des migrations...')

      if (pendingMigrations) {
        console.log(`📝 ${pendingMigrations} migration(s) en attente\n`)

        // 3. Exécuter les migrations
        console.log('🔄 Exécution des migrations...')
        const migrations = await this.authDataSource.runMigrations()

        if (migrations.length > 0) {
          console.log(`\n✅ ${migrations.length} migration(s) exécutée(s) avec succès:`)
          migrations.forEach((migration) => {
            console.log(`   - ${migration.name}`)
          })
        }
      } else {
        console.log('✅ Toutes les migrations sont déjà exécutées\n')
      }

      // 4. Afficher l'état actuel
      await this.displayMigrationStatus()
    } catch (error) {
      console.error("❌ Erreur lors de l'exécution des migrations:", error)
      throw error
    } finally {
      if (this.authDataSource.isInitialized) {
        await this.authDataSource.destroy()
      }
    }
  }

  private async displayMigrationStatus(): Promise<void> {
    console.log('\n📊 État actuel des migrations:')

    try {
      const executedMigrations = await this.authDataSource.query(`
        SELECT name, "timestamp" 
        FROM typeorm_migrations 
        ORDER BY "timestamp" DESC 
        LIMIT 10
      `)

      if (executedMigrations.length > 0) {
        console.log('   Dernières migrations exécutées:')
        executedMigrations.forEach((migration: any) => {
          const date = new Date(migration.timestamp)
          console.log(`   - ${migration.name} (${date.toLocaleString()})`)
        })
      }
    } catch (error) {
      // La table typeorm_migrations pourrait ne pas exister
      console.log("   ⚠️  Impossible de récupérer l'historique des migrations")
    }
  }

  async verifyTableStructures(): Promise<void> {
    console.log('\n🔍 Vérification des structures de tables après migration...\n')

    try {
      await this.authDataSource.initialize()

      // Vérifier user_sessions
      console.log('📋 Table user_sessions:')
      const sessionColumns = await this.authDataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_sessions' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `)
      console.log(`   - ${sessionColumns.length} colonnes`)
      const expectedSessionColumns = [
        'userId',
        'sessionId',
        'accessToken',
        'refreshToken',
        'deviceInfo',
        'location',
      ]
      const hasAllSessionColumns = expectedSessionColumns.every((col) =>
        sessionColumns.some((dbCol: any) => dbCol.column_name === col)
      )
      console.log(`   - Structure ${hasAllSessionColumns ? '✅ correcte' : '⚠️  incomplète'}`)

      // Vérifier roles
      console.log('\n📋 Table roles:')
      const roleColumns = await this.authDataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND table_schema = 'public'
        AND column_name IN ('name', 'nom')
      `)
      const hasCorrectNameColumn = roleColumns.some((col: any) => col.column_name === 'name')
      console.log(`   - Colonne 'name' ${hasCorrectNameColumn ? '✅ présente' : '❌ manquante'}`)

      // Vérifier permissions
      console.log('\n📋 Table permissions:')
      const permissionColumns = await this.authDataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'permissions' 
        AND table_schema = 'public'
        AND column_name IN ('resource', 'scope', 'isActive', 'metadata')
      `)
      const modernColumns = ['resource', 'scope', 'isActive', 'metadata']
      const hasMissingColumns = modernColumns.filter(
        (col) => !permissionColumns.some((dbCol: any) => dbCol.column_name === col)
      )
      console.log(
        `   - Colonnes modernes ${hasMissingColumns.length === 0 ? '✅ toutes présentes' : `⚠️  manquantes: ${hasMissingColumns.join(', ')}`}`
      )
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error)
    } finally {
      if (this.authDataSource.isInitialized) {
        await this.authDataSource.destroy()
      }
    }
  }
}

// Fonction principale
async function main() {
  console.log('='.repeat(80))
  console.log('🔧 PHASE 0 - MIGRATION ET RÉINITIALISATION')
  console.log('='.repeat(80))
  console.log()

  const runner = new Phase0MigrationRunner()
  const resetter = new AdminTestUsersResetter()

  try {
    // 1. Exécuter les migrations
    await runner.runMigrations()

    // 2. Vérifier les structures
    await runner.verifyTableStructures()

    // 3. Réinitialiser les utilisateurs
    console.log('\n' + '='.repeat(80))
    console.log('👥 RÉINITIALISATION DES UTILISATEURS')
    console.log('='.repeat(80))
    await resetter.resetUsers()

    console.log('\n' + '='.repeat(80))
    console.log('✅ PHASE 0 TERMINÉE AVEC SUCCÈS!')
    console.log('='.repeat(80))
    console.log('\n🎯 Prochaines étapes:')
    console.log('   1. Tester la connexion avec les utilisateurs réinitialisés')
    console.log('   2. Vérifier que les sessions sont correctement créées')
    console.log("   3. Passer à la Phase 1 du plan d'implémentation")
  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error)
    process.exit(1)
  }
}

// Afficher l'aide si demandé
if (process.argv.includes('--help')) {
  console.log(`
🔧 Script d'exécution des migrations Phase 0

Ce script exécute dans l'ordre :
1. Les migrations pour aligner la structure des tables
2. La vérification des structures après migration
3. La réinitialisation des utilisateurs ADMIN et TEST

Usage:
  ts-node apps/api/src/scripts/run-phase0-migrations.ts

Options:
  --help    Afficher cette aide

⚠️  ATTENTION: Ce script modifie la structure de la base de données !
             Assurez-vous d'avoir une sauvegarde avant de l'exécuter.
`)
  process.exit(0)
}

if (require.main === module) {
  main()
}
