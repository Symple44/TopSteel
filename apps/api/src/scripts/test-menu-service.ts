#!/usr/bin/env ts-node
/**
 * Script pour tester le service MenuConfiguration directement
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

// Import des entités corrigées
import { MenuConfiguration } from '../modules/admin/entities/menu-configuration.entity'
import { MenuItem } from '../modules/admin/entities/menu-item.entity'
import { MenuItemPermission } from '../modules/admin/entities/menu-item-permission.entity'
import { MenuItemRole } from '../modules/admin/entities/menu-item-role.entity'

// Import du service
import { MenuConfigurationService } from '../modules/admin/services/menu-configuration.service'

async function testMenuService() {
  console.log('🔄 Test direct du service MenuConfiguration...\n')

  // Créer une datasource avec les entités corrigées
  const dataSource = new DataSource({
    ...authDataSourceOptions,
    entities: [
      MenuConfiguration,
      MenuItem, 
      MenuItemPermission,
      MenuItemRole
    ]
  })
  
  try {
    await dataSource.initialize()
    console.log('✅ DataSource initialisée avec succès')

    // Créer les repositories
    const configRepo = dataSource.getRepository(MenuConfiguration)
    const itemRepo = dataSource.getRepository(MenuItem)
    const permissionRepo = dataSource.getRepository(MenuItemPermission)
    const roleRepo = dataSource.getRepository(MenuItemRole)

    // Créer le service
    const menuService = new MenuConfigurationService(
      configRepo,
      itemRepo,
      permissionRepo,
      roleRepo
    )

    console.log('\n📋 Test findAllConfigurations():')
    const allConfigs = await menuService.findAllConfigurations()
    console.log(`   ✅ ${allConfigs.length} configuration(s) trouvée(s)`)
    allConfigs.forEach(config => {
      console.log(`      - ${config.name} (${config.isActive ? 'active' : 'inactive'})`)
    })

    console.log('\n🌳 Test getMenuTree():')
    const menuTree = await menuService.getMenuTree()
    console.log(`   ✅ ${menuTree.length} item(s) racine(s) dans l'arbre`)
    
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

    console.log('\n🔍 Test findActiveConfiguration():')
    const activeConfig = await menuService.findActiveConfiguration()
    if (activeConfig) {
      console.log(`   ✅ Configuration active: ${activeConfig.name}`)
      console.log(`      Items associés: ${activeConfig.items?.length || 0}`)
    } else {
      console.log('   ⚠️  Aucune configuration active')
    }

    console.log('\n🎉 Tous les tests du service ont réussi!')

  } catch (error: any) {
    console.error('❌ Erreur lors du test:', error.message)
    if (error.stack) console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'))
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

testMenuService().catch(console.error)