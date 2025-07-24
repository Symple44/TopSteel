import { Client } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../../../.env') })

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = parseInt(process.env.DB_PORT || '5432')
const DB_USERNAME = process.env.DB_USERNAME || 'postgres'
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'

const databases = [
  'erp_topsteel_auth',
  'erp_topsteel_shared',
  'erp_topsteel_topsteel'
]

async function dropDatabases() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: 'postgres' // Se connecter à la base système
  })

  try {
    await client.connect()
    console.log('🔗 Connecté à PostgreSQL')

    for (const dbName of databases) {
      try {
        // Terminer toutes les connexions actives
        await client.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
        `)
        
        // Supprimer la base
        await client.query(`DROP DATABASE IF EXISTS "${dbName}"`)
        console.log(`✅ Base supprimée : ${dbName}`)
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${dbName}:`, (error as Error).message)
      }
    }

    console.log('🎯 Suppression terminée')
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

dropDatabases().catch(console.error)