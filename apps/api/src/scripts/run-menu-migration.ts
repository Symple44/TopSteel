#!/usr/bin/env ts-node
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { CreateMenuTables20250812 } from '../core/database/migrations/auth/20250812-CreateMenuTables'

async function runMenuMigration() {
  console.log('🔄 Démarrage de la migration des tables de menu...')

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    synchronize: false,
    logging: true,
  })

  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    const migration = new CreateMenuTables20250812()
    await migration.up(dataSource.createQueryRunner())

    console.log('✅ Migration des tables de menu terminée avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }
}

// Exécution du script
runMenuMigration().catch(console.error)
