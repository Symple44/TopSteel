#!/usr/bin/env ts-node
/**
 * Script pour tester les endpoints de menu sans authentification
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

async function testMenuEndpoints() {
  console.log('🔄 Test des endpoints de menu...\n')

  const dataSource = new DataSource(authDataSourceOptions)
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base AUTH établie')

    // 1. Tester la récupération de la configuration active
    const activeConfig = await dataSource.query(`
      SELECT * FROM menu_configurations 
      WHERE isactive = true 
      ORDER BY createdat DESC 
      LIMIT 1
    `)
    
    console.log('\n📋 Configuration active:')
    if (activeConfig.length > 0) {
      const config = activeConfig[0]
      console.log(`   ID: ${config.id}`)
      console.log(`   Nom: ${config.name}`)
      console.log(`   Description: ${config.description}`)
      console.log(`   Actif: ${config.isactive}`)
      
      // 2. Récupérer les items de menu de cette configuration
      const menuItems = await dataSource.query(`
        SELECT * FROM menu_items 
        WHERE "configId" = $1 
        ORDER BY "orderIndex", "parentId" NULLS FIRST
      `, [config.id])
      
      console.log(`\n🍽️ Items de menu (${menuItems.length}):`)
      menuItems.forEach((item: any) => {
        const indent = item.parentId ? '   └─ ' : '   '
        const typeEmoji = item.type === 'M' ? '📁' : item.type === 'P' ? '🔗' : item.type === 'L' ? '🌐' : '📊'
        console.log(`${indent}${typeEmoji} ${item.title} (${item.type})`)
        if (item.programId) console.log(`${indent}   → ${item.programId}`)
        if (item.externalUrl) console.log(`${indent}   → ${item.externalUrl}`)
      })
      
    } else {
      console.log('   ⚠️  Aucune configuration active trouvée')
      
      // Activer la première configuration disponible
      const firstConfig = await dataSource.query(`
        SELECT * FROM menu_configurations 
        ORDER BY createdat DESC 
        LIMIT 1
      `)
      
      if (firstConfig.length > 0) {
        await dataSource.query(`
          UPDATE menu_configurations 
          SET isactive = true 
          WHERE id = $1
        `, [firstConfig[0].id])
        
        console.log(`   ✅ Configuration "${firstConfig[0].name}" activée`)
      }
    }

    // 3. Tester la création d'une préférence utilisateur
    const testUserId = '0d2f2574-0ddf-4e50-ac45-58f7391367c8' // admin@topsteel.tech
    
    const existingPrefs = await dataSource.query(`
      SELECT COUNT(*) as count FROM user_menu_preference_items 
      WHERE user_id = $1
    `, [testUserId])
    
    console.log(`\n👤 Préférences utilisateur pour ${testUserId}:`)
    console.log(`   Existantes: ${existingPrefs[0].count}`)
    
    if (parseInt(existingPrefs[0].count) === 0) {
      // Créer une préférence de test
      await dataSource.query(`
        INSERT INTO user_menu_preference_items (user_id, menu_id, is_visible, "order", custom_label)
        VALUES ($1, $2, $3, $4, $5)
      `, [testUserId, 'dashboard', true, 1, 'Mon Tableau de bord'])
      
      console.log('   ✅ Préférence de test créée')
    }

    console.log('\n🎉 Tests des endpoints terminés avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur lors des tests:', error.message)
    if (error.detail) console.error(`   Détail: ${error.detail}`)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

testMenuEndpoints().catch(console.error)