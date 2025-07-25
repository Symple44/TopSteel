#!/usr/bin/env ts-node
/**
 * Script pour vérifier les tables de permissions et rôles
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

async function checkPermissionTables() {
  const dataSource = new DataSource(authDataSourceOptions)
  await dataSource.initialize()
  
  // Vérifier menu_item_permissions
  console.log('Colonnes menu_item_permissions:')
  try {
    const permResult = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_item_permissions' 
      ORDER BY ordinal_position
    `)
    
    permResult.forEach((col: any) => console.log(`  ${col.column_name}`))
  } catch (error) {
    console.log('  Table n\'existe pas')
  }
  
  // Vérifier menu_item_roles
  console.log('\nColonnes menu_item_roles:')
  try {
    const roleResult = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_item_roles' 
      ORDER BY ordinal_position
    `)
    
    roleResult.forEach((col: any) => console.log(`  ${col.column_name}`))
  } catch (error) {
    console.log('  Table n\'existe pas')
  }
  
  await dataSource.destroy()
}

checkPermissionTables().catch(console.error)