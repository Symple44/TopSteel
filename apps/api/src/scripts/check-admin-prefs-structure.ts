#!/usr/bin/env ts-node
/**
 * Script pour vérifier la structure de user_menu_preferences_admin
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

async function checkAdminPrefsStructure() {
  const dataSource = new DataSource(authDataSourceOptions)
  await dataSource.initialize()
  
  console.log('📋 Structure de user_menu_preferences_admin:')
  const result = await dataSource.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'user_menu_preferences_admin'
    ORDER BY ordinal_position
  `)
  
  result.forEach((col: any) => {
    console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
  })
  
  console.log('\n📋 Structure de user_menu_item_preferences:')
  const result2 = await dataSource.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'user_menu_item_preferences'
    ORDER BY ordinal_position
  `)
  
  result2.forEach((col: any) => {
    console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
  })
  
  await dataSource.destroy()
}

checkAdminPrefsStructure().catch(console.error)