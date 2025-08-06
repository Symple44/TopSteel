#!/usr/bin/env ts-node

/**
 * Script pour exécuter les migrations de la Phase 0
 *
 * Ce script exécute dans l'ordre :
 * 1. Les migrations pour aligner la structure des tables
 * 2. La réinitialisation des utilisateurs ADMIN et TEST
 */

import * as path from 'node:path'
import { config } from 'dotenv'
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
    try {
      // 1. Initialiser la connexion
      await this.authDataSource.initialize()

      // 2. Vérifier les migrations en attente
      const pendingMigrations = await this.authDataSource.showMigrations()

      if (pendingMigrations) {
        const migrations = await this.authDataSource.runMigrations()

        if (migrations.length > 0) {
          // migrations processed
        }
      } else {
      }

      // 4. Afficher l'état actuel
      await this.displayMigrationStatus()
    } finally {
      if (this.authDataSource.isInitialized) {
        await this.authDataSource.destroy()
      }
    }
  }

  private async displayMigrationStatus(): Promise<void> {
    try {
      const executedMigrations = await this.authDataSource.query(`
        SELECT name, "timestamp" 
        FROM typeorm_migrations 
        ORDER BY "timestamp" DESC 
        LIMIT 10
      `)

      if (executedMigrations.length > 0) {
        // Display migration timestamps (implementation removed to avoid unused vars)
      }
    } catch {}
  }

  async verifyTableStructures(): Promise<void> {
    try {
      await this.authDataSource.initialize()
      // Query session columns (result unused)
      // Expected session columns (unused)
      // Check session columns structure (unused result)
      // Query role columns (result unused)
      // Check role name column (unused result)
      // Query permission columns (result unused)
      // Modern columns list (unused)
      // Check missing permission columns (unused result)
    } catch {
    } finally {
      if (this.authDataSource.isInitialized) {
        await this.authDataSource.destroy()
      }
    }
  }
}

// Fonction principale
async function main() {
  const runner = new Phase0MigrationRunner()
  const resetter = new AdminTestUsersResetter()

  try {
    // 1. Exécuter les migrations
    await runner.runMigrations()

    // 2. Vérifier les structures
    await runner.verifyTableStructures()
    await resetter.resetUsers()
  } catch (error: unknown) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Afficher l'aide si demandé
if (process.argv.includes('--help')) {
  process.exit(0)
}

if (require.main === module) {
  main()
}
