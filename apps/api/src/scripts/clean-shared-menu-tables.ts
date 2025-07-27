import { DataSource } from 'typeorm'

const sharedDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_shared',
})

async function cleanSharedMenuTables() {
  try {
    await sharedDataSource.initialize()
    console.log('✅ Connexion à SHARED établie')

    // Lister toutes les tables de menu dans SHARED
    const menuTables = await sharedDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%menu%'
      ORDER BY table_name
    `)

    console.log('\n🗑️  Tables de menu à supprimer dans SHARED:')
    menuTables.forEach(table => console.log(`   - ${table.table_name}`))

    if (menuTables.length === 0) {
      console.log('ℹ️  Aucune table de menu trouvée dans SHARED')
      await sharedDataSource.destroy()
      return
    }

    // Supprimer chaque table de menu
    for (const table of menuTables) {
      console.log(`🗑️  Suppression de ${table.table_name}...`)
      await sharedDataSource.query(`DROP TABLE IF EXISTS ${table.table_name} CASCADE`)
    }

    console.log('\n✅ Toutes les tables de menu supprimées de SHARED')
    console.log('ℹ️  Les données restent disponibles dans AUTH')

    // Vérifier qu'il ne reste plus de tables de menu
    const remainingTables = await sharedDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%menu%'
    `)

    if (remainingTables.length === 0) {
      console.log('✅ Confirmation: Aucune table de menu restante dans SHARED')
    } else {
      console.log('⚠️  Tables restantes:', remainingTables.map(t => t.table_name))
    }

    await sharedDataSource.destroy()

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (sharedDataSource.isInitialized) {
      await sharedDataSource.destroy()
    }
  }
}

cleanSharedMenuTables()