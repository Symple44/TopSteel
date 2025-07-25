#!/usr/bin/env ts-node
/**
 * Script pour activer la configuration de test
 */

import { DataSource } from 'typeorm'

async function activateTestConfig() {
  console.log('🔄 Activation de la configuration de test...\n')

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

    // Lister toutes les configurations
    const configs = await dataSource.query(`
      SELECT id, name, description, "isActive", "isSystem" 
      FROM menu_configurations 
      ORDER BY "createdAt"
    `)
    
    console.log('📋 Configurations disponibles:')
    configs.forEach((config: any, index: number) => {
      const status = config.isActive ? '[ACTIVE]' : '[INACTIVE]'
      const type = config.isSystem ? '[SYSTEM]' : '[CUSTOM]'
      console.log(`   ${index + 1}. ${config.name} ${status} ${type}`)
      console.log(`      ID: ${config.id}`)
      if (config.description) {
        console.log(`      Description: ${config.description}`)
      }
    })

    // Trouver la configuration de test
    const testConfig = configs.find((c: any) => c.name.includes('Test'))
    
    if (!testConfig) {
      console.log('❌ Aucune configuration de test trouvée')
      return
    }

    console.log(`\n🎯 Configuration de test trouvée: ${testConfig.name}`)

    // Désactiver toutes les autres configurations
    await dataSource.query(`
      UPDATE menu_configurations 
      SET "isActive" = false
    `)
    console.log('✅ Toutes les configurations désactivées')

    // Activer la configuration de test
    await dataSource.query(`
      UPDATE menu_configurations 
      SET "isActive" = true 
      WHERE id = $1
    `, [testConfig.id])
    console.log(`✅ Configuration de test activée: ${testConfig.name}`)

    // Vérifier les items de menu de cette configuration
    const items = await dataSource.query(`
      SELECT 
        id, title, type, "programId", "externalUrl", "queryBuilderId",
        "parentId", "orderIndex", "isVisible"
      FROM menu_items 
      WHERE "configId" = $1
      ORDER BY "orderIndex", "parentId" NULLS FIRST
    `, [testConfig.id])
    
    console.log(`\n📊 ${items.length} item(s) de menu dans cette configuration:`)
    
    // Grouper par parent
    const rootItems = items.filter((item: any) => !item.parentId)
    const childItems = items.filter((item: any) => item.parentId)
    
    rootItems.forEach((root: any) => {
      const typeEmoji = root.type === 'M' ? '📁' : root.type === 'P' ? '🔗' : root.type === 'L' ? '🌐' : '📊'
      console.log(`   ${typeEmoji} ${root.title} (${root.type})`)
      
      if (root.programId) console.log(`      → ${root.programId}`)
      if (root.externalUrl) console.log(`      → ${root.externalUrl}`)
      
      const children = childItems.filter((child: any) => child.parentId === root.id)
      children.forEach((child: any) => {
        const childEmoji = child.type === 'M' ? '📁' : child.type === 'P' ? '🔗' : child.type === 'L' ? '🌐' : '📊'
        console.log(`      └─ ${childEmoji} ${child.title}`)
        if (child.programId) console.log(`         → ${child.programId}`)
        if (child.externalUrl) console.log(`         → ${child.externalUrl}`)
      })
    })

    console.log('\n🎉 Configuration de test activée avec succès!')
    console.log('   Vous pouvez maintenant tester l\'API avec cette configuration.')

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'activation:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  activateTestConfig().catch(console.error)
}

export { activateTestConfig }