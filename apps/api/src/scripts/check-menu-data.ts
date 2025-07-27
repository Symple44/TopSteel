import { DataSource } from 'typeorm'

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_auth',
})

async function checkMenuData() {
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Vérifier les configurations
    const configs = await dataSource.query('SELECT * FROM menu_configurations ORDER BY createdat DESC')
    console.log('\n📋 Configurations de menu:')
    console.log(configs)

    // Vérifier le nombre d'items
    const itemCount = await dataSource.query('SELECT COUNT(*) FROM menu_items')
    console.log('\n📊 Nombre d\'items de menu:', itemCount[0].count)

    // Vérifier quelques items de menu
    const items = await dataSource.query(`
      SELECT id, title, type, "parentId", "orderIndex" 
      FROM menu_items 
      WHERE "parentId" IS NULL 
      ORDER BY "orderIndex" 
      LIMIT 10
    `)
    console.log('\n🏠 Items de menu racine:')
    console.log(items)

    await dataSource.destroy()
  } catch (error) {
    console.error('❌ Erreur:', error)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

checkMenuData()