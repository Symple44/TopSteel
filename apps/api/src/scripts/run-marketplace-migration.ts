import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { CreateMarketplaceTables1737600000000 } from '../database/migrations/auth/009-CreateMarketplaceTables'

// Charger les variables d'environnement
config()

async function runMarketplaceMigration() {
  console.log('🚀 Démarrage de la migration marketplace...')

  // Créer une connexion à la base auth
  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    
    synchronize: false,
    logging: true,
    
    // Pas besoin d'entités pour les migrations
    entities: [],
    
    // Migrations spécifiques à auth
    migrations: ['src/database/migrations/auth/*.ts'],
    migrationsTableName: 'migrations',
  })

  try {
    console.log('📦 Initialisation de la connexion à la base auth...')
    await authDataSource.initialize()
    
    console.log('✅ Connexion établie')
    
    // Vérifier si la migration a déjà été exécutée
    const queryRunner = authDataSource.createQueryRunner()
    
    try {
      // Vérifier si la table migrations existe
      const tablesExist = await queryRunner.hasTable('migrations')
      if (!tablesExist) {
        console.log('📋 Création de la table migrations...')
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            name VARCHAR(255) NOT NULL
          )
        `)
      }
      
      // Vérifier si la migration marketplace a déjà été exécutée
      const existingMigration = await queryRunner.query(
        `SELECT * FROM migrations WHERE name = 'CreateMarketplaceTables1737600000000'`
      )
      
      if (existingMigration.length > 0) {
        console.log('⚠️ La migration marketplace a déjà été exécutée')
        return
      }
      
      // Exécuter la migration
      console.log('🔧 Exécution de la migration marketplace...')
      const migration = new CreateMarketplaceTables1737600000000()
      await migration.up(queryRunner)
      
      // Enregistrer la migration comme exécutée
      await queryRunner.query(
        `INSERT INTO migrations (timestamp, name) VALUES (1737600000000, 'CreateMarketplaceTables1737600000000')`
      )
      
      console.log('✅ Migration marketplace exécutée avec succès!')
      
    } finally {
      await queryRunner.release()
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await authDataSource.destroy()
    console.log('🔐 Connexion fermée')
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  runMarketplaceMigration()
    .then(() => {
      console.log('🎉 Migration terminée avec succès!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error)
      process.exit(1)
    })
}

export { runMarketplaceMigration }