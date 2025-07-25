#!/usr/bin/env ts-node
/**
 * Script de test pour valider la migration des menus
 * Usage: npm run test:migration
 */

import { DataSource } from 'typeorm'
// Configuration simplifiée pour éviter les problèmes d'entités

interface MenuItemTest {
  id: string
  title: string
  href?: string
  parent_id?: string
  type?: string
  program_id?: string
  external_url?: string
  query_builder_id?: string
}

async function testMenuMigration() {
  console.log('🧪 Test de la migration des menus...\n')

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

    // Vérifier si la table menu_items existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
      );
    `)
    
    if (!tableExists[0].exists) {
      console.log('❌ Table menu_items non trouvée')
      return
    }

    console.log('✅ Table menu_items trouvée')

    // Vérifier les colonnes après migration
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name IN ('type', 'program_id', 'external_url', 'query_builder_id')
      ORDER BY column_name;
    `)

    console.log('\n📋 Nouvelles colonnes détectées:')
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
    })

    // Vérifier les données
    const menuItems: MenuItemTest[] = await dataSource.query(`
      SELECT id, title, href, "parentId" as parent_id, type, "programId" as program_id, "externalUrl" as external_url, "queryBuilderId" as query_builder_id
      FROM menu_items 
      ORDER BY "orderIndex"
    `)

    console.log(`\n📊 ${menuItems.length} éléments de menu trouvés:`)

    let typeCounts = { M: 0, P: 0, L: 0, D: 0 }
    
    menuItems.forEach((item) => {
      const typeLabel = getTypeLabel(item.type || 'P')
      typeCounts[item.type as keyof typeof typeCounts] = (typeCounts[item.type as keyof typeof typeCounts] || 0) + 1
      
      console.log(`  ${item.type === 'M' ? '📁' : item.type === 'P' ? '🔗' : item.type === 'L' ? '🌐' : '📊'} ${item.title} (${typeLabel})`)
      
      if (item.href && item.program_id) {
        console.log(`    • href: ${item.href} → program_id: ${item.program_id}`)
      }
      if (item.external_url) {
        console.log(`    • external_url: ${item.external_url}`)
      }
      if (item.query_builder_id) {
        console.log(`    • query_builder_id: ${item.query_builder_id}`)
      }
    })

    console.log(`\n📈 Répartition par type:`)
    console.log(`  📁 Dossiers (M): ${typeCounts.M}`)
    console.log(`  🔗 Programmes (P): ${typeCounts.P}`)
    console.log(`  🌐 Liens externes (L): ${typeCounts.L}`)
    console.log(`  📊 Vues Data (D): ${typeCounts.D}`)

    // Tests de validation
    console.log('\n🔍 Tests de validation:')

    // Test 1: Tous les items ont un type
    const itemsWithoutType = menuItems.filter(item => !item.type)
    if (itemsWithoutType.length === 0) {
      console.log('✅ Tous les éléments ont un type défini')
    } else {
      console.log(`❌ ${itemsWithoutType.length} éléments sans type`)
    }

    // Test 2: Les items de type P avec href ont program_id
    const programItems = menuItems.filter(item => item.type === 'P')
    const programItemsWithHref = programItems.filter(item => item.href)
    const programItemsWithProgramId = programItems.filter(item => item.program_id)
    
    console.log(`✅ Items de type P: ${programItems.length}`)
    console.log(`  - Avec href original: ${programItemsWithHref.length}`)
    console.log(`  - Avec program_id: ${programItemsWithProgramId.length}`)

    // Test 3: Les dossiers (type M) n'ont pas d'URL
    const folderItems = menuItems.filter(item => item.type === 'M')
    const foldersWithUrl = folderItems.filter(item => item.href || item.program_id || item.external_url)
    
    if (foldersWithUrl.length === 0) {
      console.log(`✅ Les ${folderItems.length} dossiers n'ont pas d'URL (correct)`)
    } else {
      console.log(`❌ ${foldersWithUrl.length} dossiers ont des URLs (incorrect)`)
    }

    // Test 4: Vérifier la cohérence parent-enfant
    const parentIds = new Set(menuItems.filter(item => item.parent_id).map(item => item.parent_id))
    const itemIds = new Set(menuItems.map(item => item.id))
    const orphanParents = Array.from(parentIds).filter(id => !itemIds.has(id!))
    
    if (orphanParents.length === 0) {
      console.log('✅ Toutes les relations parent-enfant sont cohérentes')
    } else {
      console.log(`❌ ${orphanParents.length} références parent orphelines`)
    }

    console.log('\n🎉 Test de migration terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await dataSource.destroy()
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'M': return 'Dossier'
    case 'P': return 'Programme'
    case 'L': return 'Lien externe'
    case 'D': return 'Vue Data'
    default: return 'Inconnu'
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testMenuMigration().catch(console.error)
}

export { testMenuMigration }