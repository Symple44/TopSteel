#!/usr/bin/env ts-node

/**
 * Script de vérification des bases de données de test créées
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

const testDatabases = [
  'topsteel_test_auth',
  'topsteel_test_shared',
  'topsteel_test_societe1',
  'topsteel_test_original'
]

async function verifyDatabases() {
  console.log('🔍 VÉRIFICATION DES BASES DE DONNÉES DE TEST')
  console.log('=' + '='.repeat(59))

  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  })

  try {
    await adminDataSource.initialize()
    console.log('🔗 Connexion établie')

    for (const dbName of testDatabases) {
      try {
        const exists = await adminDataSource.query(
          'SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datname = $1',
          [dbName]
        )

        if (exists.length > 0) {
          console.log(`✅ ${dbName} - Taille: ${exists[0].size}`)
          
          // Vérifier quelques tables dans chaque base
          if (dbName === 'topsteel_test_auth') {
            const authDS = new DataSource({
              type: 'postgres',
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432'),
              username: process.env.DB_USERNAME || 'postgres',
              password: process.env.DB_PASSWORD || 'postgres',
              database: dbName,
            })
            await authDS.initialize()
            
            const userCount = await authDS.query('SELECT COUNT(*) as count FROM users')
            const societeCount = await authDS.query('SELECT COUNT(*) as count FROM societes')
            console.log(`   👥 Utilisateurs: ${userCount[0].count}`)
            console.log(`   🏢 Sociétés: ${societeCount[0].count}`)
            
            await authDS.destroy()
          }
          
          if (dbName === 'topsteel_test_societe1') {
            const tenantDS = new DataSource({
              type: 'postgres',
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432'),
              username: process.env.DB_USERNAME || 'postgres',
              password: process.env.DB_PASSWORD || 'postgres',
              database: dbName,
            })
            await tenantDS.initialize()
            
            const tables = await tenantDS.query(`
              SELECT table_name FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
              ORDER BY table_name
            `)
            console.log(`   📋 Tables: ${tables.map((t: any) => t.table_name).join(', ')}`)
            
            await tenantDS.destroy()
          }
          
        } else {
          console.log(`❌ ${dbName} - N'EXISTE PAS`)
        }
      } catch (error) {
        console.error(`💥 Erreur vérification ${dbName}:`, (error as Error).message)
      }
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  } finally {
    if (adminDataSource.isInitialized) {
      await adminDataSource.destroy()
    }
  }
}

if (require.main === module) {
  verifyDatabases()
    .then(() => {
      console.log('\n✅ Vérification terminée')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Vérification échouée:', error)
      process.exit(1)
    })
}