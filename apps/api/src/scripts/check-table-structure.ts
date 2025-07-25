#!/usr/bin/env ts-node
/**
 * Script pour vérifier la structure des tables menu
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

async function checkTableStructure() {
  console.log('🔄 Vérification de la structure des tables...\n')

  const dataSource = new DataSource(authDataSourceOptions)
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion établie')

    // Vérifier menu_configurations
    console.log('\n📋 Structure de menu_configurations:')
    const configCols = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_configurations'
      ORDER BY ordinal_position
    `)
    
    configCols.forEach((col: any) => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

    // Vérifier menu_items
    console.log('\n🍽️ Structure de menu_items:')
    const itemCols = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_items'
      ORDER BY ordinal_position
    `)
    
    itemCols.forEach((col: any) => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

    // Vérifier user_menu_preference_items
    console.log('\n👤 Structure de user_menu_preference_items:')
    const prefCols = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_menu_preference_items'
      ORDER BY ordinal_position
    `)
    
    prefCols.forEach((col: any) => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

checkTableStructure().catch(console.error)