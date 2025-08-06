#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

async function listAllDatabases() {
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

    for (const db of databases) {
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

        // Query table count (result unused)

        // Query important tables (result unused)
        // Check important tables (unused branch)

        await testDataSource.destroy()
      } catch {}
    }

    await dataSource.destroy()
  } catch {}
}

listAllDatabases().catch(console.error)
