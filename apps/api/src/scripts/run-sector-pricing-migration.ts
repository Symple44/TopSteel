import 'reflect-metadata'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

const TenantDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
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
    // Initialiser la source de données
    await TenantDataSource.initialize()

    // Exécuter les migrations
    const migrations = await TenantDataSource.runMigrations({
      transaction: 'each',
    })

    if (migrations.length === 0) {
    } else {
      migrations.forEach(() => {})
    }
  } catch {
    process.exit(1)
  } finally {
    // Fermer la connexion
    if (TenantDataSource.isInitialized) {
      await TenantDataSource.destroy()
    }
  }
}

// Exécuter les migrations
runMigrations()
