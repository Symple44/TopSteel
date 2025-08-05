#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

async function listAllDatabases() {
  console.log('🔍 Recherche de toutes les bases de données TopSteel...\n')

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Base système pour lister les autres
    logging: false,
  })

  try {
    await dataSource.initialize()

    // Lister toutes les bases de données
    const databases = await dataSource.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      AND (
        datname LIKE '%erp%' 
        OR datname LIKE '%topsteel%' 
        OR datname LIKE '%produit%'
        OR datname LIKE '%tsr%'
      )
      ORDER BY datname
    `)

    console.log(`📋 Bases de données trouvées: ${databases.length}\n`)

    for (const db of databases) {
      console.log(`📁 ${db.datname}`)

      // Tester la connexion et compter les tables
      const testDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: db.datname,
        logging: false,
      })

      try {
        await testDataSource.initialize()

        const tableCount = await testDataSource.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `)

        const importantTables = await testDataSource.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('articles', 'societes', 'system_settings', 'products', 'produits')
          ORDER BY table_name
        `)

        console.log(`   Tables: ${tableCount[0].count}`)
        if (importantTables.length > 0) {
          console.log(
            `   Tables importantes: ${importantTables.map((t: any) => t.table_name).join(', ')}`
          )
        }

        await testDataSource.destroy()
      } catch (error) {
        console.log(`   ❌ Erreur connexion`)
      }

      console.log('')
    }

    await dataSource.destroy()
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

listAllDatabases().catch(console.error)
