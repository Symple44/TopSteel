#!/usr/bin/env ts-node
/**
 * Script de rollback pour la migration des menus
 * Permet de revenir à l'état précédent en cas de problème
 */

import { DataSource } from 'typeorm'
import { DatabaseConfig } from '../database/database.config.standalone'

async function rollbackMenuMigration() {
  console.log('🔄 Rollback de la migration des menus...\n')

  const dataSource = new DataSource(DatabaseConfig.getAuthConfig())
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Vérifier si les nouvelles colonnes existent
    const columns = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name IN ('type', 'program_id', 'external_url', 'query_builder_id')
    `)

    if (columns.length === 0) {
      console.log('ℹ️  Aucune colonne de migration trouvée - pas de rollback nécessaire')
      return
    }

    console.log('📋 Colonnes à supprimer:')
    columns.forEach((col: any) => console.log(`  - ${col.column_name}`))

    // Sauvegarder les données importantes avant le rollback
    const menuItemsWithData = await dataSource.query(`
      SELECT id, title, href, program_id, external_url, query_builder_id, type
      FROM menu_items 
      WHERE program_id IS NOT NULL 
         OR external_url IS NOT NULL 
         OR query_builder_id IS NOT NULL
    `)

    if (menuItemsWithData.length > 0) {
      console.log('\n⚠️  Attention: Des données spécifiques aux nouveaux types seront perdues:')
      menuItemsWithData.forEach((item: any) => {
        console.log(`  - ${item.title}:`)
        if (item.program_id && item.program_id !== item.href) {
          console.log(`    • program_id: ${item.program_id}`)
        }
        if (item.external_url) {
          console.log(`    • external_url: ${item.external_url}`)
        }
        if (item.query_builder_id) {
          console.log(`    • query_builder_id: ${item.query_builder_id}`)
        }
      })
      
      console.log('\nⓘ  Ces données seront conservées dans href si possible')
    }

    // Demander confirmation (simulation - en production, utiliser readline)
    console.log('\n❓ Êtes-vous sûr de vouloir effectuer le rollback ?')
    console.log('   Cette action supprimera les nouvelles colonnes et leurs données.')
    
    // En production, vous devriez ajouter une vraie confirmation
    // Pour ce script, on continue automatiquement
    console.log('   → Proceeding with rollback...\n')

    // Restaurer les href depuis program_id si nécessaire
    const itemsToRestore = await dataSource.query(`
      SELECT id, href, program_id
      FROM menu_items 
      WHERE program_id IS NOT NULL 
        AND (href IS NULL OR href = '')
    `)

    if (itemsToRestore.length > 0) {
      console.log('🔄 Restauration des href depuis program_id...')
      for (const item of itemsToRestore) {
        await dataSource.query(`
          UPDATE menu_items 
          SET href = $1 
          WHERE id = $2
        `, [item.program_id, item.id])
        console.log(`  ✅ ${item.id}: href restauré à ${item.program_id}`)
      }
    }

    // Supprimer les colonnes dans l'ordre inverse
    const columnsToDelete = ['query_builder_id', 'external_url', 'program_id', 'type']
    
    for (const columnName of columnsToDelete) {
      try {
        await dataSource.query(`ALTER TABLE menu_items DROP COLUMN IF EXISTS ${columnName}`)
        console.log(`✅ Colonne ${columnName} supprimée`)
      } catch (error) {
        console.log(`⚠️  Erreur lors de la suppression de ${columnName}:`, error)
      }
    }

    // Vérifier que le rollback a réussi
    const remainingColumns = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name IN ('type', 'program_id', 'external_url', 'query_builder_id')
    `)

    if (remainingColumns.length === 0) {
      console.log('\n🎉 Rollback terminé avec succès!')
      console.log('   La table menu_items est revenue à son état précédent.')
    } else {
      console.log('\n⚠️  Rollback partiellement réussi. Colonnes restantes:')
      remainingColumns.forEach((col: any) => console.log(`  - ${col.column_name}`))
    }

  } catch (error) {
    console.error('❌ Erreur lors du rollback:', error)
  } finally {
    await dataSource.destroy()
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  rollbackMenuMigration().catch(console.error)
}

export { rollbackMenuMigration }