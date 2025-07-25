#!/usr/bin/env ts-node
/**
 * Script pour vérifier les contraintes de menu_configurations
 */

import { DataSource } from 'typeorm'

async function checkMenuConfigConstraints() {
  console.log('🔍 Vérification des contraintes de menu_configurations...\n')

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    logging: false
  })
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base AUTH établie')

    // Vérifier les contraintes sur menu_configurations
    const constraints = await dataSource.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        tc.is_deferrable,
        tc.initially_deferred
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'menu_configurations'
      ORDER BY tc.constraint_type, kcu.ordinal_position
    `)
    
    console.log('\n📋 Contraintes de menu_configurations:')
    if (constraints.length === 0) {
      console.log('   ⚠️  Aucune contrainte trouvée!')
    } else {
      constraints.forEach((constraint: any) => {
        const emoji = constraint.constraint_type === 'PRIMARY KEY' ? '🔑' : 
                     constraint.constraint_type === 'FOREIGN KEY' ? '🔗' : 
                     constraint.constraint_type === 'UNIQUE' ? '⭐' : '📝'
        console.log(`   ${emoji} ${constraint.constraint_name} (${constraint.constraint_type}) sur ${constraint.column_name}`)
      })
    }

    // Vérifier les index
    const indexes = await dataSource.query(`
      SELECT 
        indexname,
        indexdef,
        tablename
      FROM pg_indexes 
      WHERE tablename = 'menu_configurations'
      ORDER BY indexname
    `)
    
    console.log('\n📋 Index de menu_configurations:')
    if (indexes.length === 0) {
      console.log('   ⚠️  Aucun index trouvé!')
    } else {
      indexes.forEach((index: any) => {
        console.log(`   📊 ${index.indexname}`)
        console.log(`      ${index.indexdef}`)
      })
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

checkMenuConfigConstraints().catch(console.error)