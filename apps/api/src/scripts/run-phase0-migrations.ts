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
          migrations.forEach((_migration) => {})
        }
      } else {
      }

      // 4. Afficher l'état actuel
      await this.displayMigrationStatus()
    } catch (error) {
      throw error
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
        executedMigrations.forEach((migration: any) => {
          const _date = new Date(migration.timestamp)
        })
      }
    } catch (_error) {}
  }

  async verifyTableStructures(): Promise<void> {
    try {
      await this.authDataSource.initialize()
      const sessionColumns = await this.authDataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_sessions' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `)
      const expectedSessionColumns = [
        'userId',
        'sessionId',
        'accessToken',
        'refreshToken',
        'deviceInfo',
        'location',
      ]
      const _hasAllSessionColumns = expectedSessionColumns.every((col) =>
        sessionColumns.some((dbCol: any) => dbCol.column_name === col)
      )
      const roleColumns = await this.authDataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND table_schema = 'public'
        AND column_name IN ('name', 'nom')
      `)
      const _hasCorrectNameColumn = roleColumns.some((col: any) => col.column_name === 'name')
      const permissionColumns = await this.authDataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'permissions' 
        AND table_schema = 'public'
        AND column_name IN ('resource', 'scope', 'isActive', 'metadata')
      `)
      const modernColumns = ['resource', 'scope', 'isActive', 'metadata']
      const _hasMissingColumns = modernColumns.filter(
        (col) => !permissionColumns.some((dbCol: any) => dbCol.column_name === col)
      )
    } catch (_error) {
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
  } catch (_error) {
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
