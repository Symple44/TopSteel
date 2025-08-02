import 'reflect-metadata'
import { config } from 'dotenv'
import { MarketplaceDataSource } from '../infrastructure/database/data-source'

// Charger les variables d'environnement
config()

async function runMigrations() {
  try {
    console.log('🔧 Initialisation de la connexion à la database...')
    
    // Initialiser la source de données
    await MarketplaceDataSource.initialize()
    console.log('✅ Connexion à la database établie')

    console.log('🚀 Exécution des migrations...')
    
    // Exécuter les migrations
    const migrations = await MarketplaceDataSource.runMigrations({
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
    if (MarketplaceDataSource.isInitialized) {
      await MarketplaceDataSource.destroy()
      console.log('🔒 Connexion fermée')
    }
  }
}

// Exécuter les migrations
runMigrations()