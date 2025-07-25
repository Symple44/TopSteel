#!/usr/bin/env ts-node
/**
 * Script direct pour appliquer la migration des menus
 */

import { DataSource } from 'typeorm'

async function applyMenuMigration() {
  console.log('🚀 Application de la migration des types de menu...\n')

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

    // Étape 1: Ajouter la colonne type
    console.log('🔧 Ajout de la colonne type...')
    await dataSource.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS type varchar(1) DEFAULT 'P'
    `)
    console.log('✅ Colonne type ajoutée')

    // Étape 2: Ajouter la colonne programId
    console.log('🔧 Ajout de la colonne programId...')
    await dataSource.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS "programId" varchar(255)
    `)
    console.log('✅ Colonne programId ajoutée')

    // Étape 3: Ajouter la colonne externalUrl
    console.log('🔧 Ajout de la colonne externalUrl...')
    await dataSource.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS "externalUrl" varchar(1000)
    `)
    console.log('✅ Colonne externalUrl ajoutée')

    // Étape 4: Ajouter la colonne queryBuilderId
    console.log('🔧 Ajout de la colonne queryBuilderId...')
    await dataSource.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS "queryBuilderId" uuid
    `)
    console.log('✅ Colonne queryBuilderId ajoutée')

    // Étape 5: Migrer les données existantes
    console.log('🔄 Migration des données existantes...')

    // 5.1: Items avec href deviennent des programmes (P)
    const programUpdated = await dataSource.query(`
      UPDATE menu_items 
      SET type = 'P', "programId" = href
      WHERE href IS NOT NULL AND href != ''
    `)
    console.log(`✅ ${programUpdated[1]} items convertis en programmes (P)`)

    // 5.2: Identifier et convertir les dossiers (M)
    const folderUpdated = await dataSource.query(`
      UPDATE menu_items 
      SET type = 'M'
      WHERE (href IS NULL OR href = '') 
      AND id IN (
        SELECT DISTINCT "parentId" 
        FROM menu_items 
        WHERE "parentId" IS NOT NULL
      )
    `)
    console.log(`✅ ${folderUpdated[1]} items convertis en dossiers (M)`)

    // Étape 6: Enregistrer la migration dans la table migrations
    console.log('📝 Enregistrement de la migration...')
    await dataSource.query(`
      INSERT INTO migrations (timestamp, name) 
      VALUES (1737826400000, 'AddMenuItemTypes1737826400000')
      ON CONFLICT (timestamp) DO NOTHING
    `)
    console.log('✅ Migration enregistrée')

    console.log('\n🎉 Migration des types de menu terminée avec succès!')
    console.log('   Vous pouvez maintenant tester avec: npm run migration:test')

  } catch (error: any) {
    console.error('❌ Erreur lors de la migration:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  applyMenuMigration().catch(console.error)
}

export { applyMenuMigration }