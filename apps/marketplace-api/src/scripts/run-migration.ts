import 'reflect-metadata'
import { config } from 'dotenv'
import { MarketplaceDataSource } from '../infrastructure/database/data-source'

// Charger les variables d'environnement
config()

async function runMigrations() {
  try {
    // Initialiser la source de données
    await MarketplaceDataSource.initialize()

    // Exécuter les migrations
    const migrations = await MarketplaceDataSource.runMigrations({
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
    if (MarketplaceDataSource.isInitialized) {
      await MarketplaceDataSource.destroy()
    }
  }
}

// Exécuter les migrations
runMigrations()
