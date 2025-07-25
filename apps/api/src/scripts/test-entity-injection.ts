#!/usr/bin/env ts-node
/**
 * Script pour tester l'injection des entités menu
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

// Import des entités
import { MenuConfiguration } from '../modules/admin/entities/menu-configuration.entity'
import { MenuItem } from '../modules/admin/entities/menu-item.entity'
import { MenuItemPermission } from '../modules/admin/entities/menu-item-permission.entity'
import { MenuItemRole } from '../modules/admin/entities/menu-item-role.entity'
import { UserMenuPreference } from '../modules/menu/entities/user-menu-preference.entity'

async function testEntityInjection() {
  console.log('🔄 Test de l\'injection des entités...\n')

  // Créer une datasource avec les entités
  const dataSource = new DataSource({
    ...authDataSourceOptions,
    entities: [
      MenuConfiguration,
      MenuItem, 
      MenuItemPermission,
      MenuItemRole,
      UserMenuPreference
    ]
  })
  
  try {
    await dataSource.initialize()
    console.log('✅ DataSource initialisée avec succès')

    // Test de chaque repository
    console.log('\n📦 Test des repositories:')

    // MenuConfiguration
    const configRepo = dataSource.getRepository(MenuConfiguration)
    const configs = await configRepo.find({ take: 1 })
    console.log(`   ✅ MenuConfiguration: ${configs.length} configuration(s) trouvée(s)`)

    // MenuItem
    const itemRepo = dataSource.getRepository(MenuItem)
    const items = await itemRepo.find({ take: 1 })
    console.log(`   ✅ MenuItem: ${items.length} item(s) trouvé(s)`)

    // MenuItemPermission
    const permRepo = dataSource.getRepository(MenuItemPermission)
    const perms = await permRepo.find({ take: 1 })
    console.log(`   ✅ MenuItemPermission: ${perms.length} permission(s) trouvée(s)`)

    // MenuItemRole
    const roleRepo = dataSource.getRepository(MenuItemRole)
    const roles = await roleRepo.find({ take: 1 })
    console.log(`   ✅ MenuItemRole: ${roles.length} role(s) trouvé(s)`)

    // UserMenuPreference
    const prefRepo = dataSource.getRepository(UserMenuPreference)
    const prefs = await prefRepo.find({ take: 1 })
    console.log(`   ✅ UserMenuPreference: ${prefs.length} préférence(s) trouvée(s)`)

    // Test de requête avec relations
    console.log('\n🔗 Test des relations:')
    const configWithItems = await configRepo.findOne({
      where: { isActive: true },
      relations: ['items']
    })
    
    if (configWithItems) {
      console.log(`   ✅ Configuration active avec ${configWithItems.items?.length || 0} items`)
    } else {
      console.log('   ⚠️  Aucune configuration active trouvée')
    }

    console.log('\n🎉 Tous les tests d\'entités ont réussi!')

  } catch (error: any) {
    console.error('❌ Erreur lors du test:', error.message)
    if (error.query) console.error('   Query:', error.query)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

testEntityInjection().catch(console.error)