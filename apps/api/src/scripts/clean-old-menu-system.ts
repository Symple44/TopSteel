import { DataSource } from 'typeorm'

async function cleanOldMenuSystem() {
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

    // Tables de l'ancien système à supprimer
    const oldTables = [
      'user_menu_preferences_admin',
      'user_menu_preference_items', 
      'user_menu_item_preferences',
      'user_menu_preferences',
      'menu_item_permissions',
      'menu_item_roles'
    ]

    console.log('\n🗑️  Suppression des tables de l\'ancien système de menu...')

    for (const tableName of oldTables) {
      try {
        // Vérifier si la table existe
        const exists = await authDataSource.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          )
        `)

        if (exists[0].exists) {
          console.log(`🗑️  Suppression de ${tableName}...`)
          await authDataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
          console.log(`✅ ${tableName} supprimée`)
        } else {
          console.log(`ℹ️  ${tableName} n'existe pas`)
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${tableName}:`, error.message)
      }
    }

    // Vérifier les tables restantes
    const remainingMenuTables = await authDataSource.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%menu%'
      ORDER BY table_name
    `)

    console.log('\n📋 Tables de menu restantes (système nouveau):')
    remainingMenuTables.forEach(table => {
      console.log(`   ✅ ${table.table_name}`)
    })

    console.log('\n✅ Nettoyage de l\'ancien système de menu terminé')
    console.log('ℹ️  Seules les tables du nouveau système (menu-raw) sont conservées')

    await authDataSource.destroy()

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
    }
  }
}

cleanOldMenuSystem()