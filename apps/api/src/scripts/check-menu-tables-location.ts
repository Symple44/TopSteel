import { DataSource } from 'typeorm'

// Fonction pour vérifier les tables dans une base de données
async function checkDatabase(dbName: string, database: string) {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: database,
  })

  try {
    await dataSource.initialize()
    console.log(`\n🔍 === ${dbName.toUpperCase()} DATABASE ===`)

    // Vérifier si les tables de menu existent
    const menuTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%menu%'
      ORDER BY table_name
    `)

    if (menuTables.length > 0) {
      console.log('📋 Tables de menu trouvées:')
      for (const table of menuTables) {
        console.log(`   - ${table.table_name}`)
        
        // Compter les enregistrements
        try {
          const count = await dataSource.query(`SELECT COUNT(*) FROM ${table.table_name}`)
          console.log(`     └── ${count[0].count} enregistrements`)
        } catch (error) {
          console.log(`     └── Erreur lors du comptage`)
        }
      }
    } else {
      console.log('❌ Aucune table de menu trouvée')
    }

    await dataSource.destroy()
  } catch (error) {
    console.error(`❌ Erreur connexion ${dbName}:`, error.message)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

async function checkAllDatabases() {
  console.log('🔍 Vérification des tables de menu dans toutes les bases...')
  
  await checkDatabase('AUTH', 'erp_topsteel_auth')
  await checkDatabase('SHARED', 'erp_topsteel_shared')
  await checkDatabase('TENANT', 'erp_topsteel_tenant')
}

checkAllDatabases()