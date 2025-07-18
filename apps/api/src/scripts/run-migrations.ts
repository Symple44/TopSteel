import { config } from 'dotenv'
import { resolve } from 'path'
import { DataSource } from 'typeorm'

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') })

const runMigrations = async () => {
  console.log('🔄 Exécution des migrations...')
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel',
    ssl: false,
    logging: true,
    entities: [], // Pas besoin d'entités pour les migrations
    migrations: [resolve(__dirname, '../database/migrations/*.ts')],
    migrationsTableName: 'migrations',
  })
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion initialisée')
    
    const pendingMigrations = await dataSource.showMigrations()
    console.log(`📋 ${Array.isArray(pendingMigrations) ? pendingMigrations.length : 0} migration(s) en attente`)
    
    await dataSource.runMigrations()
    console.log('✅ Migrations exécutées avec succès')
    
    await dataSource.destroy()
    console.log('✅ Connexion fermée')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error)
    process.exit(1)
  }
}

runMigrations()