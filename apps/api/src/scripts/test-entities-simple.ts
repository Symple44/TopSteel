import { config } from 'dotenv'
import { resolve } from 'path'
import { DataSource } from 'typeorm'

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') })

// Import quelques entités manuellement pour tester
import { User } from '../modules/users/entities/user.entity'
import { Clients } from '../modules/clients/entities/clients.entity'

const testEntities = async () => {
  console.log('🔧 Test de chargement des entités...')
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel',
    ssl: false,
    logging: true,
    entities: [User, Clients], // Test avec quelques entités
    synchronize: false,
  })
  
  try {
    console.log('🚀 Tentative d\'initialisation avec entités...')
    await dataSource.initialize()
    console.log('✅ Initialisation réussie!')
    
    const entities = dataSource.entityMetadatas
    console.log('📋 Entités chargées:', entities.length)
    
    entities.forEach(entity => {
      console.log(`  - ${entity.name} (${entity.tableName})`)
    })
    
    await dataSource.destroy()
    console.log('✅ Connexion fermée proprement')
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des entités:', error instanceof Error ? error.message : error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

testEntities()