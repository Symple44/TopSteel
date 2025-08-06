#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

async function testTenantDatabases() {
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

    for (const societe of societes) {
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

        if (tables.find((t: { table_name: string }) => t.table_name === 'articles')) {
          await tenantDataSource.query('SELECT COUNT(*) as count FROM articles')
        }

        if (tables.find((t: { table_name: string }) => t.table_name === 'system_settings')) {
          await tenantDataSource.query('SELECT COUNT(*) as count FROM system_settings')
        }

        await tenantDataSource.destroy()
      } catch {}
    }

    await authDataSource.destroy()
  } catch {}
}

testTenantDatabases().catch(console.error)
