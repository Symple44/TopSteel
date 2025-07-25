#!/usr/bin/env ts-node
/**
 * Script pour ajouter une clé primaire à menu_configurations
 */

import { DataSource } from 'typeorm'

async function fixMenuConfigPK() {
  console.log('🔧 Ajout de la clé primaire à menu_configurations...\n')

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

    // Ajouter la contrainte de clé primaire
    await dataSource.query(`
      ALTER TABLE menu_configurations 
      ADD CONSTRAINT PK_menu_configurations PRIMARY KEY (id)
    `)
    
    console.log('✅ Clé primaire ajoutée à menu_configurations')

    // Vérifier la contrainte
    const constraints = await dataSource.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'menu_configurations' AND constraint_type = 'PRIMARY KEY'
    `)

    if (constraints.length > 0) {
      console.log(`✅ Contrainte vérifiée: ${constraints[0].constraint_name}`)
    } else {
      console.log('⚠️  Contrainte non trouvée après ajout')
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'ajout:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

fixMenuConfigPK().catch(console.error)