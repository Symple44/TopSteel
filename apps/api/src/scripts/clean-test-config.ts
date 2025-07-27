import { DataSource } from 'typeorm'

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_auth',
})

async function cleanTestConfig() {
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Identifier la configuration de test
    const testConfig = await dataSource.query(`
      SELECT id, name, description 
      FROM menu_configurations 
      WHERE name = 'Configuration Test'
    `)

    if (testConfig.length === 0) {
      console.log('ℹ️  Aucune "Configuration Test" trouvée')
      await dataSource.destroy()
      return
    }

    const configId = testConfig[0].id
    console.log(`🎯 Configuration Test trouvée: ${configId}`)

    // Compter les items à supprimer
    const itemCount = await dataSource.query(`
      SELECT COUNT(*) as count 
      FROM menu_items 
      WHERE "configId" = $1
    `, [configId])

    console.log(`📊 Items à supprimer: ${itemCount[0].count}`)

    // Supprimer d'abord les items de menu
    console.log('🗑️  Suppression des items de menu...')
    await dataSource.query(`
      DELETE FROM menu_items 
      WHERE "configId" = $1
    `, [configId])

    // Supprimer la configuration
    console.log('🗑️  Suppression de la configuration...')
    await dataSource.query(`
      DELETE FROM menu_configurations 
      WHERE id = $1
    `, [configId])

    console.log('✅ Configuration Test supprimée avec succès')

    // Vérifier le résultat
    const remainingConfigs = await dataSource.query(`
      SELECT name, COUNT(mi.id) as item_count
      FROM menu_configurations mc
      LEFT JOIN menu_items mi ON mc.id = mi."configId"
      GROUP BY mc.id, mc.name
      ORDER BY mc.name
    `)

    console.log('\n📋 Configurations restantes:')
    remainingConfigs.forEach(config => {
      console.log(`   - ${config.name}: ${config.item_count} items`)
    })

    await dataSource.destroy()
  } catch (error) {
    console.error('❌ Erreur:', error)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

cleanTestConfig()