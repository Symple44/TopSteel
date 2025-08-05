#!/usr/bin/env ts-node

/**
 * Script de nettoyage de l'historique des migrations liées aux produits
 * TopSteel ERP - Clean Architecture
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

async function cleanupMigrationHistory() {
  console.log("🧹 NETTOYAGE DE L'HISTORIQUE DES MIGRATIONS")
  console.log('===========================================\n')

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
    console.log('✅ Connexion établie\n')

    // Vérifier les migrations exécutées
    const migrations = await dataSource.query(`
      SELECT * FROM migrations 
      WHERE name LIKE '%produits%' OR name LIKE '%Product%'
      ORDER BY timestamp DESC
    `)

    console.log('📊 Migrations liées aux produits:')
    if (migrations.length === 0) {
      console.log('   ✅ Aucune migration liée aux produits trouvée')
    } else {
      migrations.forEach((migration: any) => {
        console.log(`   - ${migration.name} (${new Date(migration.timestamp).toLocaleString()})`)
      })
    }

    // Vérifier les tables de sauvegarde créées
    const backupTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'produits_backup_%'
    `)

    console.log('\n💾 Tables de sauvegarde:')
    if (backupTables.length === 0) {
      console.log('   ✅ Aucune table de sauvegarde trouvée')
    } else {
      backupTables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`)
      })
    }

    // État final du schéma
    console.log('\n📋 État final du schéma:')
    const articlesTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%article%'
    `)

    articlesTables.forEach((table: any) => {
      console.log(`   ✅ ${table.table_name}`)
    })
  } catch (error) {
    console.error('\n💥 ERREUR:', error)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

cleanupMigrationHistory().catch(console.error)
