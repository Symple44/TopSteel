import { join } from 'node:path'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger .env.local depuis la racine
const rootDir = join(__dirname, '../../../../')
const envLocalPath = join(rootDir, '.env.local')
config({ path: envLocalPath })

async function listDatabases() {
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Base admin pour lister les autres
  })

  try {
    await adminDataSource.initialize()

    // Lister toutes les bases de données
    const result = await adminDataSource.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname
    `)

    result.forEach((db: any) => {
      const dbName = db.datname
      // Mettre en évidence les bases TopSteel
      if (dbName.includes('topsteel')) {
      } else {
      }
    })
    const topsteelDbs = result
      .filter((db: any) => db.datname.includes('topsteel'))
      .map((db: any) => db.datname)

    topsteelDbs.forEach((_db: string) => {})

    // Vérifier spécifiquement la base attendue
    const expectedDb = `erp_topsteel_${process.env.DEFAULT_TENANT_CODE?.toLowerCase() || 'default'}`

    const _exists = topsteelDbs.includes(expectedDb)
  } catch (_error) {
  } finally {
    if (adminDataSource.isInitialized) {
      await adminDataSource.destroy()
    }
  }
}

listDatabases().catch(console.error)
