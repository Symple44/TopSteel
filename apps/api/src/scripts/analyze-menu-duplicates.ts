import { DataSource } from 'typeorm'

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_auth',
})

async function analyzeDuplicates() {
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Vérifier les configurations en double
    console.log('\n📋 ANALYSE DES CONFIGURATIONS:')
    const configDuplicates = await dataSource.query(`
      SELECT name, COUNT(*) as count, STRING_AGG(id::text, ', ') as ids
      FROM menu_configurations 
      GROUP BY name 
      ORDER BY count DESC, name
    `)
    configDuplicates.forEach(row => {
      if (row.count > 1) {
        console.log(`❌ DOUBLON - "${row.name}": ${row.count} fois (IDs: ${row.ids})`)
      } else {
        console.log(`✅ OK - "${row.name}": ${row.count} fois`)
      }
    })

    // Vérifier les items en double par configuration
    console.log('\n📊 ANALYSE DES ITEMS PAR CONFIGURATION:')
    const itemsByConfig = await dataSource.query(`
      SELECT 
        mc.name as config_name,
        mc.id as config_id,
        COUNT(mi.id) as item_count
      FROM menu_configurations mc
      LEFT JOIN menu_items mi ON mc.id = mi."configId"
      GROUP BY mc.id, mc.name
      ORDER BY item_count DESC
    `)
    itemsByConfig.forEach(row => {
      console.log(`📁 Config "${row.config_name}": ${row.item_count} items`)
    })

    // Vérifier les items dupliqués
    console.log('\n🔍 ANALYSE DES ITEMS DUPLIQUÉS:')
    const itemDuplicates = await dataSource.query(`
      SELECT 
        title, 
        type, 
        "parentId",
        "configId",
        COUNT(*) as count,
        STRING_AGG(id::text, ', ') as ids
      FROM menu_items 
      GROUP BY title, type, "parentId", "configId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC, title
    `)
    
    if (itemDuplicates.length > 0) {
      console.log('❌ DOUBLONS D\'ITEMS TROUVÉS:')
      itemDuplicates.forEach(row => {
        console.log(`   - "${row.title}" (${row.type}): ${row.count} fois dans config ${row.configId}`)
        console.log(`     IDs: ${row.ids}`)
      })
    } else {
      console.log('✅ Aucun doublon d\'items détecté')
    }

    // Vérifier les orderIndex en conflit
    console.log('\n📋 ANALYSE DES ORDER INDEX:')
    const orderConflicts = await dataSource.query(`
      SELECT 
        "configId",
        "parentId",
        "orderIndex",
        COUNT(*) as count,
        STRING_AGG(title, ', ') as titles
      FROM menu_items 
      GROUP BY "configId", "parentId", "orderIndex"
      HAVING COUNT(*) > 1
      ORDER BY "configId", "parentId", "orderIndex"
    `)
    
    if (orderConflicts.length > 0) {
      console.log('⚠️ CONFLITS D\'ORDER INDEX:')
      orderConflicts.forEach(row => {
        console.log(`   - Config ${row.configId}, Parent ${row.parentId || 'NULL'}, Index ${row.orderIndex}: ${row.count} items`)
        console.log(`     Titres: ${row.titles}`)
      })
    } else {
      console.log('✅ Aucun conflit d\'orderIndex détecté')
    }

    await dataSource.destroy()
  } catch (error) {
    console.error('❌ Erreur:', error)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

analyzeDuplicates()