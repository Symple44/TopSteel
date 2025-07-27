import { DataSource } from 'typeorm'

async function listMenuTables() {
  const authDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
  })

  try {
    await authDataSource.initialize()
    console.log('✅ Connexion à AUTH établie')

    const menuTables = await authDataSource.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%menu%'
      ORDER BY table_name
    `)

    console.log('\n📋 Tables contenant "menu" dans AUTH:')
    menuTables.forEach(table => {
      console.log(`   - ${table.table_name}`)
    })

    if (menuTables.length === 0) {
      console.log('ℹ️  Aucune table contenant "menu" trouvée')
    }

    await authDataSource.destroy()

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
    }
  }
}

listMenuTables()