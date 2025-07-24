import { Client } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../../../.env') })

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = parseInt(process.env.DB_PORT || '5432')
const DB_USERNAME = process.env.DB_USERNAME || 'postgres'
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'

async function checkDatabases() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: 'postgres' // Se connecter à la base système
  })

  try {
    await client.connect()
    console.log('🔗 Connecté à PostgreSQL\n')

    // Vérifier l'existence des bases
    const dbQuery = `
      SELECT datname 
      FROM pg_database 
      WHERE datname LIKE 'erp_topsteel_%'
      ORDER BY datname
    `
    const dbResult = await client.query(dbQuery)
    
    console.log('📊 Bases de données trouvées:')
    if (dbResult.rows.length === 0) {
      console.log('   ❌ Aucune base de données trouvée')
    } else {
      for (const row of dbResult.rows) {
        console.log(`   ✅ ${row.datname}`)
      }
    }
    console.log('')

    // Vérifier les tables dans chaque base
    const databases = ['erp_topsteel_auth', 'erp_topsteel_shared', 'erp_topsteel_topsteel']
    
    for (const dbName of databases) {
      // Vérifier si la base existe
      const exists = dbResult.rows.some(row => row.datname === dbName)
      if (!exists) {
        console.log(`⚠️  Base ${dbName} n'existe pas`)
        continue
      }

      // Se connecter à la base spécifique
      const dbClient = new Client({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: dbName
      })

      try {
        await dbClient.connect()
        
        const tableQuery = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
        const tableResult = await dbClient.query(tableQuery)
        
        console.log(`📋 Tables dans ${dbName}:`)
        if (tableResult.rows.length === 0) {
          console.log('   ❌ Aucune table trouvée')
        } else {
          for (const row of tableResult.rows) {
            console.log(`   - ${row.table_name}`)
          }
        }
        console.log('')
        
      } catch (error) {
        console.error(`❌ Erreur lors de la connexion à ${dbName}:`, (error as Error).message)
      } finally {
        await dbClient.end()
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

checkDatabases().catch(console.error)