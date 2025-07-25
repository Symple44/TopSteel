#!/usr/bin/env ts-node
/**
 * Script de vérification simple de la base de données
 * Sans import d'entités problématiques
 */

import { DataSource } from 'typeorm'

async function simpleDbCheck() {
  console.log('🔍 Vérification simple de la base de données...\n')

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

    // Vérifier si la table menu_items existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
      );
    `)
    
    if (!tableExists[0].exists) {
      console.log('❌ Table menu_items non trouvée')
      console.log('🏗️  Il faut d\'abord créer les tables de menu de base')
      return
    }

    console.log('✅ Table menu_items trouvée')

    // Vérifier les colonnes existantes
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      ORDER BY ordinal_position;
    `)

    console.log('\n📋 Structure actuelle de menu_items:')
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })

    // Vérifier si les nouvelles colonnes existent déjà
    const newColumns = columns.filter((col: any) => 
      ['type', 'program_id', 'external_url', 'query_builder_id'].includes(col.column_name)
    )

    if (newColumns.length > 0) {
      console.log('\n⚠️  Migration déjà appliquée - nouvelles colonnes détectées:')
      newColumns.forEach((col: any) => console.log(`  - ${col.column_name}`))
      return
    }

    // Compter les éléments de menu
    const menuCount = await dataSource.query(`SELECT COUNT(*) FROM menu_items`)
    console.log(`\n📊 ${menuCount[0].count} éléments de menu existants`)

    // Analyser les données pour prédire la migration
    const itemsWithHref = await dataSource.query(`
      SELECT COUNT(*) FROM menu_items 
      WHERE href IS NOT NULL AND href != ''
    `)

    const parentIds = await dataSource.query(`
      SELECT COUNT(DISTINCT "parentId") FROM menu_items 
      WHERE "parentId" IS NOT NULL
    `)

    console.log('\n🔮 Prédiction de migration:')
    console.log(`  🔗 Items avec href (→ Type P): ${itemsWithHref[0].count}`)
    console.log(`  📁 Items parents potentiels (→ Type M): ${parentIds[0].count}`)

    console.log('\n🚀 Prêt pour la migration!')
    console.log('   Commande: npm run migration:run')

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  simpleDbCheck().catch(console.error)
}

export { simpleDbCheck }