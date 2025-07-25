#!/usr/bin/env ts-node
/**
 * Script pour vérifier les tables dans la base AUTH
 */

import { DataSource } from 'typeorm'

async function checkAuthDbTables() {
  console.log('🔍 Vérification des tables dans la base AUTH...\n')

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
    console.log(`📂 Base de données: ${process.env.DB_AUTH_NAME || 'erp_topsteel_auth'}`)

    // Vérifier les tables de menu dans AUTH
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%menu%'
      ORDER BY table_name
    `)
    
    console.log('\n📋 Tables de menu trouvées dans AUTH:')
    if (tables.length === 0) {
      console.log('   ❌ Aucune table de menu trouvée dans AUTH')
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
    
    console.log(`\n🔧 Table menu_configurations dans AUTH: ${menuConfigExists[0].exists ? '✅ Existe' : '❌ N\'existe pas'}`)

    if (menuConfigExists[0].exists) {
      // Compter les données
      const count = await dataSource.query('SELECT COUNT(*) as count FROM menu_configurations')
      console.log(`📊 Nombre de configurations: ${count[0].count}`)
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️  La base de données AUTH n\'existe pas!')
      console.log(`   Tentative de connexion à: ${process.env.DB_AUTH_NAME || 'erp_topsteel_auth'}`)
      console.log('   Les tables de menu pourraient être dans la base principale.')
    }
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  checkAuthDbTables().catch(console.error)
}

export { checkAuthDbTables }