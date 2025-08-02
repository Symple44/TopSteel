import 'reflect-metadata'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

const TenantDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel_topsteel',

  synchronize: false,
  logging: true,

  // Migrations spécifiques aux tables tenant
  migrations: ['src/database/migrations/**/*.ts'],
  migrationsTableName: 'migrations',
})

async function runMigrations() {
  try {
    console.log('🔧 Initialisation de la connexion à la database tenant...')
    
    // Initialiser la source de données
    await TenantDataSource.initialize()
    console.log('✅ Connexion à la database tenant établie')

    console.log('🚀 Exécution des migrations tenant...')
    
    // Exécuter les migrations
    const migrations = await TenantDataSource.runMigrations({
      transaction: 'each'
    })

    if (migrations.length === 0) {
      console.log('ℹ️  Aucune migration à exécuter')
    } else {
      console.log(`✅ ${migrations.length} migration(s) exécutée(s) avec succès:`)
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error)
    process.exit(1)
  } finally {
    // Fermer la connexion
    if (TenantDataSource.isInitialized) {
      await TenantDataSource.destroy()
      console.log('🔒 Connexion fermée')
    }
  }
}

// Exécuter les migrations
runMigrations()