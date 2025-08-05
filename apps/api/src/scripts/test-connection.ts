#!/usr/bin/env ts-node

/**
 * Script de test de connexion base de données
 * TopSteel ERP - Détection des bases disponibles
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'

// Charger les variables d'environnement
config()

async function testConnection() {
  console.log('🔍 Test de connexion aux bases de données TopSteel...\n')

  const dbConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  }

  console.log(`📋 Configuration de connexion:`)
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`)
  console.log(`   User: ${dbConfig.username}`)
  console.log(`   Password: ${'*'.repeat(dbConfig.password.length)}\n`)

  // Test des différentes bases possibles
  const possibleDatabases = [
    'erp_topsteel',
    'erp_topsteel_tenant',
    'erp_topsteel_auth',
    'topsteel_tenant',
    'topsteel_auth',
    'postgres', // Base par défaut
  ]

  for (const dbName of possibleDatabases) {
    const dataSource = new DataSource({
      ...dbConfig,
      database: dbName,
      logging: false,
    })

    try {
      console.log(`🔄 Test connexion à "${dbName}"...`)
      await dataSource.initialize()

      // Test simple: compter les tables
      const tables = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `)

      console.log(`✅ Connexion réussie à "${dbName}" (${tables.length} tables)`)

      // Rechercher spécifiquement les tables d'articles et sociétés
      const importantTables = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('articles', 'societes', 'users', 'system_settings')
        ORDER BY table_name
      `)

      if (importantTables.length > 0) {
        console.log(
          `   📦 Tables importantes trouvées: ${importantTables.map((t: any) => t.table_name).join(', ')}`
        )

        // Vérifier les sociétés existantes
        try {
          const societes = await dataSource.query(
            'SELECT code, raison_sociale FROM societes LIMIT 5'
          )
          if (societes.length > 0) {
            console.log(`   🏢 Sociétés trouvées: ${societes.map((s: any) => s.code).join(', ')}`)
          }
        } catch (e) {
          console.log(`   ⚠️  Table 'societes' non accessible`)
        }

        // Vérifier les articles existants
        try {
          const articleCount = await dataSource.query('SELECT COUNT(*) as count FROM articles')
          console.log(`   📄 Articles existants: ${articleCount[0].count}`)
        } catch (e) {
          console.log(`   ⚠️  Table 'articles' non accessible`)
        }
      }

      await dataSource.destroy()
      console.log('')
    } catch (error) {
      console.log(
        `❌ Échec connexion à "${dbName}": ${error instanceof Error ? error.message : String(error)}`
      )
      console.log('')
    }
  }

  console.log('🎯 Test terminé !')
}

// Exécution
testConnection().catch(console.error)
