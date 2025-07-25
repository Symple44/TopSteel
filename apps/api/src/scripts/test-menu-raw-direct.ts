#!/usr/bin/env ts-node
/**
 * Test direct du service MenuRawService
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'
import { MenuRawService } from '../modules/admin/services/menu-raw.service'

async function testMenuRawDirect() {
  console.log('🔄 Test direct du MenuRawService...\n')

  const dataSource = new DataSource(authDataSourceOptions)
  
  try {
    await dataSource.initialize()
    console.log('✅ DataSource AUTH initialisée')

    // Créer le service
    const menuService = new MenuRawService(dataSource)

    // Test 1: Configurations
    console.log('\n📋 Test findAllConfigurations():')
    const configs = await menuService.findAllConfigurations()
    console.log(`   ✅ ${configs.length} configuration(s) trouvée(s)`)
    configs.forEach(config => {
      console.log(`      - ${config.name} (${config.isActive ? 'active' : 'inactive'})`)
    })

    // Test 2: Configuration active
    console.log('\n🎯 Test findActiveConfiguration():')
    const activeConfig = await menuService.findActiveConfiguration()
    if (activeConfig) {
      console.log(`   ✅ Configuration active: ${activeConfig.name}`)
    } else {
      console.log('   ⚠️  Aucune configuration active')
    }

    // Test 3: Arbre de menu
    console.log('\n🌳 Test getMenuTree():')
    const menuTree = await menuService.getMenuTree()
    console.log(`   ✅ ${menuTree.length} item(s) racine dans l'arbre`)
    
    function printTree(items: any[], level: number = 0) {
      const indent = '  '.repeat(level + 1)
      items.forEach(item => {
        const typeEmoji = item.type === 'M' ? '📁' : item.type === 'P' ? '🔗' : item.type === 'L' ? '🌐' : '📊'
        console.log(`${indent}${typeEmoji} ${item.title} (${item.type})`)
        if (item.children && item.children.length > 0) {
          printTree(item.children, level + 1)
        }
      })
    }
    
    printTree(menuTree)

    // Test 4: Menu filtré
    console.log('\n🎭 Test getFilteredMenuForUser():')
    const filteredMenu = await menuService.getFilteredMenuForUser(
      '0d2f2574-0ddf-4e50-ac45-58f7391367c8',
      ['ADMIN'],
      []
    )
    console.log(`   ✅ ${filteredMenu.length} item(s) après filtrage`)

    console.log('\n🎉 Tous les tests du MenuRawService ont réussi!')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'))
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

testMenuRawDirect().catch(console.error)