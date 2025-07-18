import { config } from 'dotenv'
import { resolve } from 'path'
import { DataSource } from 'typeorm'

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') })

const testConnection = async () => {
  console.log('🔧 Configuration de test:')
  console.log('- Host:', process.env.DB_HOST)
  console.log('- Port:', process.env.DB_PORT)
  console.log('- Database:', process.env.DB_NAME)
  console.log('- Username:', process.env.DB_USERNAME)
  console.log('- SSL:', process.env.DB_SSL)
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel',
    ssl: process.env.DB_SSL === 'true',
    logging: true,
    entities: [], // Pas d'entités pour ce test
  })
  
  try {
    console.log('🚀 Tentative de connexion...')
    await dataSource.initialize()
    console.log('✅ Connexion réussie!')
    
    const result = await dataSource.query('SELECT version()')
    console.log('📋 Version PostgreSQL:', result[0].version)
    
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('📊 Tables existantes:', tables.map(t => t.table_name))
    
    await dataSource.destroy()
    console.log('✅ Connexion fermée proprement')
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    process.exit(1)
  }
}

testConnection()