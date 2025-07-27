import { DataSource } from 'typeorm'

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_auth',
})

async function detailedAnalysis() {
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Afficher tous les items racine avec leur config
    console.log('\n🏠 TOUS LES ITEMS RACINE (parentId IS NULL):')
    const rootItems = await dataSource.query(`
      SELECT 
        mi.id,
        mi.title,
        mi.type,
        mi."orderIndex",
        mi."configId",
        mc.name as config_name
      FROM menu_items mi
      JOIN menu_configurations mc ON mi."configId" = mc.id
      WHERE mi."parentId" IS NULL
      ORDER BY mc.name, mi."orderIndex"
    `)
    
    let currentConfig = ''
    rootItems.forEach(item => {
      if (item.config_name !== currentConfig) {
        console.log(`\n📁 Configuration: ${item.config_name}`)
        currentConfig = item.config_name
      }
      console.log(`   ${item.orderIndex}: ${item.title} (${item.type}) - ID: ${item.id}`)
    })

    // Vérifier s'il y a des items avec des orderIndex identiques dans la même config
    console.log('\n🔍 VÉRIFICATION DES ORDERINDEX PAR CONFIGURATION:')
    const configs = await dataSource.query('SELECT id, name FROM menu_configurations')
    
    for (const config of configs) {
      console.log(`\n📋 Configuration: ${config.name}`)
      const items = await dataSource.query(`
        SELECT title, type, "orderIndex", "parentId"
        FROM menu_items 
        WHERE "configId" = $1 AND "parentId" IS NULL
        ORDER BY "orderIndex"
      `, [config.id])
      
      items.forEach(item => {
        console.log(`   Index ${item.orderIndex}: ${item.title} (${item.type})`)
      })
    }

    await dataSource.destroy()
  } catch (error) {
    console.error('❌ Erreur:', error)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

detailedAnalysis()