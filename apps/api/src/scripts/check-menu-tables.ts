#!/usr/bin/env ts-node
/**
 * Script pour vérifier l'existence des tables de menu
 */

import { DataSource } from 'typeorm'

async function checkMenuTables() {
  console.log('🔍 Vérification des tables de menu...\n')

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

    // Vérifier les tables de menu
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%menu%'
      ORDER BY table_name
    `)
    
    console.log('\n📋 Tables de menu trouvées:')
    if (tables.length === 0) {
      console.log('   ❌ Aucune table de menu trouvée')
    } else {
      tables.forEach((table: any) => {
        console.log(`   ✅ ${table.table_name}`)
      })
    }

    // Vérifier spécifiquement menu_configurations
    const menuConfigExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_configurations'
      );
    `)
    
    console.log(`\n🔧 Table menu_configurations: ${menuConfigExists[0].exists ? '✅ Existe' : '❌ N\'existe pas'}`)

    if (!menuConfigExists[0].exists) {
      console.log('\n⚠️  La table menu_configurations n\'existe pas!')
      console.log('   Il faut créer et exécuter une migration pour cette table.')
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
  checkMenuTables().catch(console.error)
}

export { checkMenuTables }