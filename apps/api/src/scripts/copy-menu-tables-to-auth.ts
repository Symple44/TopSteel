#!/usr/bin/env ts-node
/**
 * Script pour copier les tables de menu vers la base AUTH
 */

import { DataSource } from 'typeorm'

async function copyMenuTablesToAuth() {
  console.log('🔄 Copie des tables de menu vers la base AUTH...\n')

  const mainSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel',
    logging: false
  })

  const authSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    logging: false
  })
  
  try {
    await mainSource.initialize()
    await authSource.initialize()
    console.log('✅ Connexions établies')

    // Tables à copier dans l'ordre (dépendances)
    const tablesToCopy = [
      'menu_configurations',
      'menu_items',
      'menu_item_permissions', 
      'menu_item_roles'
    ]

    for (const tableName of tablesToCopy) {
      console.log(`\n🔄 Copie de ${tableName}...`)

      // Vérifier si la table existe dans la source
      const sourceExists = await mainSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName])

      if (!sourceExists[0].exists) {
        console.log(`   ⚠️  Table ${tableName} introuvable dans la base principale`)
        continue
      }

      // Obtenir la structure de la table
      const createTableQuery = await mainSource.query(`
        SELECT 
          'CREATE TABLE ' || table_name || ' (' ||
          string_agg(
            column_name || ' ' || 
            CASE 
              WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
              WHEN data_type = 'text' THEN 'TEXT'
              WHEN data_type = 'integer' THEN 'INTEGER'
              WHEN data_type = 'bigint' THEN 'BIGINT'
              WHEN data_type = 'boolean' THEN 'BOOLEAN'
              WHEN data_type = 'uuid' THEN 'UUID'
              WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
              WHEN data_type = 'json' THEN 'JSON'
              ELSE data_type
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', '
          ) || ');'
        FROM information_schema.columns 
        WHERE table_name = $1 
        GROUP BY table_name;
      `, [tableName])

      if (createTableQuery.length === 0) {
        console.log(`   ❌ Impossible d'obtenir la structure de ${tableName}`)
        continue
      }

      // Supprimer la table si elle existe dans AUTH
      await authSource.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`)

      // Créer la table dans AUTH
      await authSource.query(createTableQuery[0]['?column?'])
      console.log(`   ✅ Structure de ${tableName} créée`)

      // Copier les données
      const data = await mainSource.query(`SELECT * FROM ${tableName}`)
      
      if (data.length > 0) {
        // Obtenir les colonnes
        const columns = await authSource.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName])

        const columnNames = columns.map((col: any) => col.column_name)
        const placeholders = columnNames.map((_, index) => `$${index + 1}`).join(', ')
        
        for (const row of data) {
          const values = columnNames.map(col => row[col])
          await authSource.query(
            `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`,
            values
          )
        }
        
        console.log(`   ✅ ${data.length} enregistrement(s) copiés`)
      } else {
        console.log(`   ℹ️  Aucune donnée à copier pour ${tableName}`)
      }
    }

    console.log('\n🎉 Copie terminée avec succès!')
    
    // Vérification finale
    const menuConfigCount = await authSource.query('SELECT COUNT(*) as count FROM menu_configurations')
    const menuItemCount = await authSource.query('SELECT COUNT(*) as count FROM menu_items')
    
    console.log('\n📊 Résultat:')
    console.log(`   • ${menuConfigCount[0].count} configuration(s) de menu`)
    console.log(`   • ${menuItemCount[0].count} item(s) de menu`)

  } catch (error: any) {
    console.error('❌ Erreur lors de la copie:', error.message)
    throw error
  } finally {
    if (mainSource.isInitialized) {
      await mainSource.destroy()
    }
    if (authSource.isInitialized) {
      await authSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  copyMenuTablesToAuth().catch(console.error)
}

export { copyMenuTablesToAuth }