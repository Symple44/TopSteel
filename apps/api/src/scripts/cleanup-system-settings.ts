#!/usr/bin/env ts-node

/**
 * Script de nettoyage direct de la table system_settings
 * TopSteel ERP - Clean Architecture
 *
 * Supprime la table system_settings devenue obsolète après migration vers auth
 * Usage: npm run cleanup:system-settings
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

async function cleanupSystemSettings() {
  // Connexion base tenant
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel',
    logging: false,
  })

  try {
    await dataSource.initialize()

    // Vérifier si la table existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      )
    `)

    if (!tableExists[0].exists) {
      return
    }

    // Vérifier le contenu
    const count = await dataSource.query('SELECT COUNT(*) FROM system_settings')

    if (count[0].count > 0) {
      // Afficher le contenu avant suppression
      const _content = await dataSource.query(
        'SELECT category, key FROM system_settings ORDER BY category, key'
      )
      // Content rows found
    }
    await dataSource.query('DELETE FROM system_settings')
    await dataSource.query('DROP TABLE IF EXISTS system_settings CASCADE')

    // Vérification finale
    const finalCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      )
    `)

    if (finalCheck[0].exists) {
    } else {
    }
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécution du script
async function main() {
  try {
    await cleanupSystemSettings()
  } catch (_error: unknown) {
    process.exit(1)
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error)
}
