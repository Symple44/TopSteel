#!/usr/bin/env ts-node
/**
 * Script pour vérifier les tables de préférences utilisateur
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

async function checkUserPrefsTables() {
  const dataSource = new DataSource(authDataSourceOptions)
  await dataSource.initialize()
  
  console.log('📋 Tables de préférences utilisateur existantes:')
  
  const tables = await dataSource.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%user%menu%'
    ORDER BY table_name
  `)
  
  tables.forEach((table: any) => {
    console.log(`  ✓ ${table.table_name}`)
  })
  
  console.log('\n📋 Toutes les tables liées aux menus:')
  
  const menuTables = await dataSource.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%menu%'
    ORDER BY table_name
  `)
  
  menuTables.forEach((table: any) => {
    console.log(`  ✓ ${table.table_name}`)
  })
  
  await dataSource.destroy()
}

checkUserPrefsTables().catch(console.error)