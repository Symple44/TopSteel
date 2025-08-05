#!/usr/bin/env ts-node

import { DataSource } from 'typeorm'
import { config } from 'dotenv'

config()

async function testTenantDatabases() {
  console.log('🔍 Test des bases de données tenant...\n')

  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_auth',
    logging: false,
  })

  try {
    await authDataSource.initialize()

    // Récupérer les sociétés
    const societes = await authDataSource.query(`
      SELECT code, nom, "databaseName" 
      FROM societes 
      WHERE status = 'ACTIVE' OR status = 'TRIAL'
      ORDER BY code
    `)

    console.log(`📋 Sociétés trouvées: ${societes.length}\n`)

    for (const societe of societes) {
      console.log(`🏢 Société: ${societe.code} (${societe.nom})`)
      console.log(`   Database: ${societe.databaseName}`)

      // Tester la connexion à la base tenant
      const tenantDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: societe.databaseName,
        logging: false,
      })

      try {
        await tenantDataSource.initialize()

        // Vérifier les tables importantes
        const tables = await tenantDataSource.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('articles', 'system_settings')
          ORDER BY table_name
        `)

        console.log(`   ✅ Connexion réussie (${tables.length} tables importantes)`)

        if (tables.find((t: any) => t.table_name === 'articles')) {
          const articleCount = await tenantDataSource.query(
            'SELECT COUNT(*) as count FROM articles'
          )
          console.log(`   📄 Articles: ${articleCount[0].count}`)
        }

        if (tables.find((t: any) => t.table_name === 'system_settings')) {
          const settingsCount = await tenantDataSource.query(
            'SELECT COUNT(*) as count FROM system_settings'
          )
          console.log(`   ⚙️  Paramètres: ${settingsCount[0].count}`)
        }

        await tenantDataSource.destroy()
      } catch (error) {
        console.log(`   ❌ Erreur: ${error instanceof Error ? error.message : String(error)}`)
      }

      console.log('')
    }

    await authDataSource.destroy()
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testTenantDatabases().catch(console.error)
