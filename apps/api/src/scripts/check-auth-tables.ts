#!/usr/bin/env ts-node
/**
 * Script pour vérifier la structure des tables dans la base AUTH
 */

import { DataSource } from 'typeorm'

async function checkAuthTables() {
  console.log('🔍 Vérification de la structure de la base AUTH...\n')

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

    // Lister toutes les tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('\n📋 Tables trouvées:')
    tables.forEach((table: any) => {
      const hasMenu = table.table_name.includes('menu')
      const emoji = hasMenu ? '🍽️' : '📊'
      console.log(`   ${emoji} ${table.table_name}`)
    })

    // Vérifier spécifiquement les tables de menu
    const menuTables = tables.filter((table: any) => table.table_name.includes('menu'))
    
    if (menuTables.length > 0) {
      console.log('\n🍽️ Structure des tables de menu:')
      
      for (const table of menuTables) {
        console.log(`\n--- ${table.table_name} ---`)
        const columns = await dataSource.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table.table_name])
        
        columns.forEach((col: any) => {
          const nullable = col.is_nullable === 'YES' ? '?' : ''
          const defaultVal = col.column_default ? ` = ${col.column_default}` : ''
          console.log(`   ${col.column_name}${nullable}: ${col.data_type}${defaultVal}`)
        })
      }
    } else {
      console.log('\n⚠️  Aucune table de menu trouvée!')
      
      // Vérifier si des migrations existent
      const migrations = await dataSource.query(`
        SELECT name, timestamp 
        FROM migrations 
        WHERE name LIKE '%menu%'
        ORDER BY timestamp DESC
      `).catch(() => [])
      
      if (migrations.length > 0) {
        console.log('\n📝 Migrations menu trouvées:')
        migrations.forEach((mig: any) => {
          console.log(`   ${mig.timestamp} - ${mig.name}`)
        })
      } else {
        console.log('\n⚠️  Aucune migration menu trouvée')
      }
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

// Exécuter si appelé directement
if (require.main === module) {
  checkAuthTables().catch(console.error)
}

export { checkAuthTables }