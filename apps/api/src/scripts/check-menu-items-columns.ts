#!/usr/bin/env ts-node
/**
 * Script pour vérifier les colonnes de menu_items
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

async function checkItemsTable() {
  const dataSource = new DataSource(authDataSourceOptions)
  await dataSource.initialize()
  
  const result = await dataSource.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'menu_items' 
    ORDER BY ordinal_position
  `)
  
  console.log('Colonnes menu_items:')
  result.forEach((col: any) => console.log(`  ${col.column_name}`))
  
  await dataSource.destroy()
}

checkItemsTable().catch(console.error)