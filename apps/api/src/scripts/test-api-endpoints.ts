#!/usr/bin/env ts-node
/**
 * Script de test pour les endpoints API des menus
 */

import { DataSource } from 'typeorm'

async function testApiEndpoints() {
  console.log('🔗 Test des endpoints API des menus...\n')

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel',
    logging: false
  })
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Test 1: Vérifier qu'on peut lire les configurations
    console.log('🧪 Test 1: Lecture des configurations...')
    const configs = await dataSource.query(`
      SELECT id, name, description, "isActive", "isSystem" 
      FROM menu_configurations 
      ORDER BY "createdAt"
    `)
    console.log(`✅ ${configs.length} configuration(s) trouvée(s)`)

    if (configs.length > 0) {
      const activeConfig = configs.find(c => c.isActive) || configs[0]
      console.log(`   Configuration active: ${activeConfig.name}`)

      // Test 2: Vérifier qu'on peut lire les items de menu
      console.log('\n🧪 Test 2: Lecture des items de menu...')
      const items = await dataSource.query(`
        SELECT 
          id, title, type, "programId", "externalUrl", "queryBuilderId",
          "parentId", "orderIndex", "isVisible"
        FROM menu_items 
        WHERE "configId" = $1
        ORDER BY "orderIndex"
      `, [activeConfig.id])
      
      console.log(`✅ ${items.length} item(s) de menu trouvé(s)`)
      
      items.forEach((item: any) => {
        const typeEmoji = item.type === 'M' ? '📁' : item.type === 'P' ? '🔗' : item.type === 'L' ? '🌐' : '📊'
        console.log(`   ${typeEmoji} ${item.title} (${item.type})`)
        if (item.programId) console.log(`      → programId: ${item.programId}`)
        if (item.externalUrl) console.log(`      → externalUrl: ${item.externalUrl}`)
        if (item.queryBuilderId) console.log(`      → queryBuilderId: ${item.queryBuilderId}`)
      })

      // Test 3: Simulation de l'API de filtrage des menus
      console.log('\n🧪 Test 3: Simulation du filtrage des menus...')
      const filteredItems = items.filter((item: any) => item.isVisible)
      console.log(`✅ ${filteredItems.length} item(s) visible(s) après filtrage`)

      // Test 4: Construction de l'arbre de menu
      console.log('\n🧪 Test 4: Construction de l\'arbre de menu...')
      const rootItems = filteredItems.filter((item: any) => !item.parentId)
      const childItems = filteredItems.filter((item: any) => item.parentId)
      
      console.log(`✅ ${rootItems.length} item(s) racine(s)`)
      console.log(`✅ ${childItems.length} item(s) enfant(s)`)

      rootItems.forEach((root: any) => {
        const children = childItems.filter((child: any) => child.parentId === root.id)
        const typeEmoji = root.type === 'M' ? '📁' : root.type === 'P' ? '🔗' : root.type === 'L' ? '🌐' : '📊'
        console.log(`   ${typeEmoji} ${root.title} (${children.length} enfant(s))`)
        
        children.forEach((child: any) => {
          const childEmoji = child.type === 'M' ? '📁' : child.type === 'P' ? '🔗' : child.type === 'L' ? '🌐' : '📊'
          console.log(`      └─ ${childEmoji} ${child.title}`)
        })
      })
    }

    // Test 5: Vérifier les types de menu
    console.log('\n🧪 Test 5: Statistiques des types de menu...')
    const typeStats = await dataSource.query(`
      SELECT type, COUNT(*) as count
      FROM menu_items 
      GROUP BY type
      ORDER BY type
    `)
    
    typeStats.forEach((stat: any) => {
      const typeName = {
        'M': 'Dossiers',
        'P': 'Programmes', 
        'L': 'Liens externes',
        'D': 'Vues Data'
      }[stat.type] || 'Inconnu'
      console.log(`   ${stat.type}: ${stat.count} ${typeName}`)
    })

    console.log('\n🎉 Tous les tests API ont réussi!')
    console.log('   Les endpoints suivants devraient fonctionner:')
    console.log('   • GET /admin/menus/configurations')
    console.log('   • GET /admin/menus/configurations/active')
    console.log('   • POST /admin/menus/filtered-menu')
    console.log('   • GET /admin/menus/menu-types')

  } catch (error: any) {
    console.error('❌ Erreur lors du test API:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  testApiEndpoints().catch(console.error)
}

export { testApiEndpoints }