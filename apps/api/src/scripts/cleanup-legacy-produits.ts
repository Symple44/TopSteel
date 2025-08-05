#!/usr/bin/env ts-node

/**
 * Script de nettoyage de la table legacy 'produits'
 * TopSteel ERP - Clean Architecture
 *
 * Usage: npm run cleanup:produits
 * ou: npx ts-node src/scripts/cleanup-legacy-produits.ts
 */

import * as readline from 'node:readline'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function cleanupLegacyProduits() {
  // Configuration base de données
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

    // Vérifier si la table existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'produits'
      )
    `)

    if (!tableExists[0].exists) {
      return
    }

    // Vérifier le contenu de la table
    const countResult = await dataSource.query('SELECT COUNT(*) FROM produits')
    const count = parseInt(countResult[0].count)

    // Vérifier les contraintes de clé étrangère
    const fkConstraints = await dataSource.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name 
      WHERE constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'produits'
    `)

    if (fkConstraints.length > 0) {
      fkConstraints.forEach((_fk: any) => {})
      return
    }

    const confirmed = await askConfirmation('\n❓ Confirmez-vous la suppression? (y/N): ')

    if (!confirmed) {
      return
    }

    // Sauvegarder les données si il y en a
    if (count > 0) {
      const _data = await dataSource.query('SELECT * FROM produits')

      // Créer une table de sauvegarde
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS produits_backup_${Date.now()} AS 
        SELECT * FROM produits
      `)
    }
    await dataSource.query('DROP TABLE IF EXISTS produits CASCADE')

    // Supprimer la séquence associée si elle existe
    await dataSource.query('DROP SEQUENCE IF EXISTS produits_id_seq CASCADE')

    // Vérification finale
    const finalCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'produits'
      )
    `)

    if (finalCheck[0].exists) {
    } else {
    }
  } catch (error) {
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécution du script
async function main() {
  try {
    await cleanupLegacyProduits()
  } catch (_error) {
    process.exit(1)
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error)
}
