#!/usr/bin/env ts-node
/**
 * Script pour lister toutes les bases de données
 */

import { DataSource } from 'typeorm'

async function listDatabases() {
  console.log('📋 Liste des bases de données disponibles...\n')

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Se connecter à la base système
    logging: false
  })
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à PostgreSQL établie')

    const databases = await dataSource.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname
    `)
    
    console.log('\n📋 Bases de données trouvées:')
    databases.forEach((db: any) => {
      const isTopsteel = db.datname.includes('topsteel')
      const emoji = isTopsteel ? '🏭' : '📊'
      console.log(`   ${emoji} ${db.datname}`)
    })

    // Vérifier spécifiquement les bases TopSteel
    const topsteelDbs = databases.filter((db: any) => db.datname.includes('topsteel'))
    console.log(`\n🏭 ${topsteelDbs.length} base(s) TopSteel trouvée(s)`)

  } catch (error: any) {
    console.error('❌ Erreur lors de la liste:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  listDatabases().catch(console.error)
}

export { listDatabases }