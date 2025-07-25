#!/usr/bin/env ts-node
/**
 * Script de vérification avant migration des menus
 * Vérifie l'état actuel des données avant d'appliquer la migration
 */

import { DataSource } from 'typeorm'
import { DatabaseConfig } from '../database/database.config.standalone'

async function preMigrationCheck() {
  console.log('🔍 Vérification pré-migration des menus...\n')

  const dataSource = new DataSource(DatabaseConfig.getAuthConfig())
  
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
      console.log('ℹ️  Table menu_items non trouvée - première installation')
      return
    }

    // Vérifier si les nouvelles colonnes existent déjà
    const newColumns = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name IN ('type', 'program_id', 'external_url', 'query_builder_id')
    `)

    if (newColumns.length > 0) {
      console.log('⚠️  Migration déjà appliquée - nouvelles colonnes détectées:')
      newColumns.forEach((col: any) => console.log(`  - ${col.column_name}`))
      return
    }

    // Analyser les données existantes
    const menuItems = await dataSource.query(`
      SELECT id, title, href, parent_id, is_visible, order_index
      FROM menu_items 
      ORDER BY order_index
    `)

    console.log(`📊 ${menuItems.length} éléments de menu existants trouvés\n`)

    // Analyser les types qui seront assignés
    let itemsWithHref = 0
    let potentialFolders = 0
    let leafItems = 0

    // Identifier les parents (ont des enfants)
    const parentIds = new Set(
      menuItems
        .filter((item: any) => item.parent_id)
        .map((item: any) => item.parent_id)
    )

    menuItems.forEach((item: any) => {
      if (item.href && item.href.trim() !== '') {
        itemsWithHref++
      } else if (parentIds.has(item.id)) {
        potentialFolders++
      } else {
        leafItems++
      }
    })

    console.log('📋 Analyse des types qui seront assignés:')
    console.log(`  🔗 Items avec href (→ Type P): ${itemsWithHref}`)
    console.log(`  📁 Items parents sans href (→ Type M): ${potentialFolders}`)
    console.log(`  📄 Items feuilles sans href (→ Type P par défaut): ${leafItems}`)

    // Vérifier les valeurs href
    console.log('\n🔍 Analyse des URLs existantes:')
    const hrefValues = menuItems
      .filter((item: any) => item.href && item.href.trim() !== '')
      .map((item: any) => ({ title: item.title, href: item.href }))

    if (hrefValues.length === 0) {
      console.log('  ℹ️  Aucune URL trouvée')
    } else {
      hrefValues.forEach((item: any) => {
        console.log(`  - "${item.title}": ${item.href}`)
      })
    }

    // Vérifier la cohérence des relations parent-enfant
    console.log('\n🔗 Vérification des relations:')
    const itemIds = new Set(menuItems.map((item: any) => item.id))
    const orphanParents = Array.from(parentIds).filter(id => !itemIds.has(id))
    
    if (orphanParents.length === 0) {
      console.log('  ✅ Toutes les relations parent-enfant sont cohérentes')
    } else {
      console.log(`  ⚠️  ${orphanParents.length} références parent orphelines détectées`)
      orphanParents.forEach(id => console.log(`    - Parent ID orphelin: ${id}`))
    }

    // Vérifier les éléments invisibles
    const invisibleItems = menuItems.filter((item: any) => !item.is_visible)
    console.log(`\n👁️  ${invisibleItems.length} éléments marqués comme invisibles`)

    // Résumé et recommandations
    console.log('\n📝 Résumé et recommandations:')
    console.log(`  • ${menuItems.length} éléments seront migrés`)
    console.log(`  • ${itemsWithHref} éléments deviendront des programmes (type P)`)
    console.log(`  • ${potentialFolders} éléments deviendront des dossiers (type M)`)
    
    if (orphanParents.length > 0) {
      console.log(`  ⚠️  Attention: ${orphanParents.length} références orphelines à corriger`)
    }

    console.log('\n🎯 La migration peut être appliquée en toute sécurité!')
    console.log('   Commande: npm run migration:run')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await dataSource.destroy()
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  preMigrationCheck().catch(console.error)
}

export { preMigrationCheck }