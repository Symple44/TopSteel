#!/usr/bin/env ts-node

/**
 * Script de nettoyage de l'historique des migrations liées aux produits
 * TopSteel ERP - Clean Architecture
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

async function cleanupMigrationHistory() {
  const dbName = process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel'

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: dbName,
    logging: false,
  })

  try {
    await dataSource.initialize()

    // Vérifier les migrations exécutées
    const migrations = await dataSource.query(`
      SELECT * FROM migrations 
      WHERE name LIKE '%produits%' OR name LIKE '%Product%'
      ORDER BY timestamp DESC
    `)
    if (migrations.length === 0) {
    } else {
      // Migrations found
    }

    // Vérifier les tables de sauvegarde créées
    const backupTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'produits_backup_%'
    `)
    if (backupTables.length === 0) {
    } else {
      // Backup tables found
    }
    const _articlesTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%article%'
    `)

    // Articles tables found
  } catch (_error: unknown) {
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

cleanupMigrationHistory().catch(console.error)
