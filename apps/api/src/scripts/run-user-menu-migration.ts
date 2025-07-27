import { DataSource } from 'typeorm'
import { CreateUserMenuPreferenceTable1737894800000 } from '../database/migrations/auth/008-CreateUserMenuPreferenceTable'

async function runMigration() {
  const authDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'topsteel_auth',
    synchronize: false,
    logging: true,
  })

  try {
    console.log('🔄 Connexion à la base de données AUTH...')
    await authDataSource.initialize()
    console.log('✅ Connecté à la base AUTH')

    console.log('🔄 Exécution de la migration CreateUserMenuPreferenceTable...')
    const migration = new CreateUserMenuPreferenceTable1737894800000()
    await migration.up(authDataSource.createQueryRunner())
    
    console.log('✅ Migration exécutée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error instanceof Error ? error.message : error)
  } finally {
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }
}

runMigration()