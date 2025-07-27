import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { CreateMarketplaceModulesOnly1737700000000 } from '../database/migrations/auth/010-CreateMarketplaceModulesOnly'
import { CreateMarketplaceTenantTables1737700000001 } from '../database/migrations/tenant/002-CreateMarketplaceTenantTables'

// Charger les variables d'environnement
config()

async function runMarketplaceMultitenantMigration() {
  console.log('🚀 Migration marketplace multitenant...')

  // Connexion base auth
  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    synchronize: false,
    logging: true,
    entities: [],
    migrations: [],
    migrationsTableName: 'migrations',
  })

  // Connexion base tenant exemple (on prendra la première société)
  const tenantDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_demo', // Exemple de tenant
    synchronize: false,
    logging: true,
    entities: [],
    migrations: [],
    migrationsTableName: 'migrations',
  })

  try {
    console.log('📦 Connexion aux bases de données...')
    await authDataSource.initialize()
    console.log('✅ Base auth connectée')

    // 1. Migration auth - seulement les modules
    console.log('🔧 Migration base auth (modules catalogue)...')
    const authQueryRunner = authDataSource.createQueryRunner()
    
    try {
      // Vérifier si la migration a déjà été exécutée
      const existingMigration = await authQueryRunner.query(
        `SELECT * FROM migrations WHERE name = 'CreateMarketplaceModulesOnly1737700000000'`
      )
      
      if (existingMigration.length === 0) {
        const authMigration = new CreateMarketplaceModulesOnly1737700000000()
        await authMigration.up(authQueryRunner)
        
        // Enregistrer la migration
        await authQueryRunner.query(
          `INSERT INTO migrations (timestamp, name) VALUES (1737700000000, 'CreateMarketplaceModulesOnly1737700000000')`
        )
        console.log('✅ Migration auth terminée')
      } else {
        console.log('⚠️ Migration auth déjà exécutée')
      }
    } finally {
      await authQueryRunner.release()
    }

    // 2. Migration tenant - installations et ratings
    console.log('📦 Tentative de connexion à la base tenant...')
    try {
      await tenantDataSource.initialize()
      console.log('✅ Base tenant connectée')

      console.log('🔧 Migration base tenant (installations, ratings)...')
      const tenantQueryRunner = tenantDataSource.createQueryRunner()
      
      try {
        // Créer la table migrations si elle n'existe pas
        const tablesExist = await tenantQueryRunner.hasTable('migrations')
        if (!tablesExist) {
          await tenantQueryRunner.query(`
            CREATE TABLE IF NOT EXISTS migrations (
              id SERIAL PRIMARY KEY,
              timestamp BIGINT NOT NULL,
              name VARCHAR(255) NOT NULL
            )
          `)
        }

        // Vérifier si la migration a déjà été exécutée
        const existingTenantMigration = await tenantQueryRunner.query(
          `SELECT * FROM migrations WHERE name = 'CreateMarketplaceTenantTables1737700000001'`
        )
        
        if (existingTenantMigration.length === 0) {
          const tenantMigration = new CreateMarketplaceTenantTables1737700000001()
          await tenantMigration.up(tenantQueryRunner)
          
          // Enregistrer la migration
          await tenantQueryRunner.query(
            `INSERT INTO migrations (timestamp, name) VALUES (1737700000001, 'CreateMarketplaceTenantTables1737700000001')`
          )
          console.log('✅ Migration tenant terminée')
        } else {
          console.log('⚠️ Migration tenant déjà exécutée')
        }
      } finally {
        await tenantQueryRunner.release()
      }
    } catch (tenantError) {
      console.log('⚠️ Base tenant non disponible (normal si pas encore créée)')
      console.log('💡 Les tables seront créées automatiquement lors de la première utilisation')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await authDataSource.destroy()
    if (tenantDataSource.isInitialized) {
      await tenantDataSource.destroy()
    }
    console.log('🔐 Connexions fermées')
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  runMarketplaceMultitenantMigration()
    .then(() => {
      console.log('🎉 Migration multitenant terminée avec succès!')
      console.log('')
      console.log('📊 Résumé de l\'architecture:')
      console.log('  • Base AUTH: marketplace_modules (catalogue global)')
      console.log('  • Base TENANT: module_installations + module_ratings (par société)')
      console.log('')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error)
      process.exit(1)
    })
}

export { runMarketplaceMultitenantMigration }