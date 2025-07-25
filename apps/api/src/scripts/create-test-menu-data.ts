#!/usr/bin/env ts-node
/**
 * Script pour créer des données de test pour les menus
 */

import { DataSource } from 'typeorm'

async function createTestMenuData() {
  console.log('🧪 Création de données de test pour les menus...\n')

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

    // Vérifier s'il existe déjà une configuration
    const existingConfig = await dataSource.query(`
      SELECT COUNT(*) FROM menu_configurations
    `)

    if (parseInt(existingConfig[0].count) > 0) {
      console.log('ℹ️  Des configurations existent déjà. Ajout de nouveaux éléments...')
    }

    // Créer une configuration de test
    console.log('🏗️  Création d\'une configuration de menu de test...')
    
    const configResult = await dataSource.query(`
      INSERT INTO menu_configurations (id, name, description, "isActive", "isSystem", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'Configuration Test',
        'Configuration de test avec tous les types de menu',
        true,
        false,
        NOW(),
        NOW()
      )
      RETURNING id
    `)
    
    const configId = configResult[0].id
    console.log(`✅ Configuration créée avec l'ID: ${configId}`)

    // Créer des éléments de menu de test
    console.log('📋 Création d\'éléments de menu de test...')

    // 1. Dossier principal (Type M)
    const folderResult = await dataSource.query(`
      INSERT INTO menu_items (
        id, "configId", title, type, icon, "orderIndex", "isVisible", "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Administration',
        'M',
        'Shield',
        1,
        true,
        NOW()
      )
      RETURNING id
    `, [configId])
    
    const folderId = folderResult[0].id
    console.log('✅ Dossier "Administration" créé')

    // 2. Programme dans le dossier (Type P)
    await dataSource.query(`
      INSERT INTO menu_items (
        id, "configId", "parentId", title, type, "programId", icon, "orderIndex", "isVisible", "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'Gestion des utilisateurs',
        'P',
        '/admin/users',
        'Users',
        1,
        true,
        NOW()
      )
    `, [configId, folderId])
    console.log('✅ Programme "Gestion des utilisateurs" créé')

    // 3. Lien externe (Type L)
    await dataSource.query(`
      INSERT INTO menu_items (
        id, "configId", "parentId", title, type, "externalUrl", icon, "orderIndex", "isVisible", target, "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'Documentation',
        'L',
        'https://docs.example.com',
        'ExternalLink',
        2,
        true,
        '_blank',
        NOW()
      )
    `, [configId, folderId])
    console.log('✅ Lien externe "Documentation" créé')

    // 4. Programme racine (Type P)
    await dataSource.query(`
      INSERT INTO menu_items (
        id, "configId", title, type, "programId", icon, "orderIndex", "isVisible", "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Tableau de bord',
        'P',
        '/dashboard',
        'Home',
        0,
        true,
        NOW()
      )
    `, [configId])
    console.log('✅ Programme "Tableau de bord" créé')

    // 5. Query Builder (Type P)
    await dataSource.query(`
      INSERT INTO menu_items (
        id, "configId", title, type, "programId", icon, "orderIndex", "isVisible", "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Query Builder',
        'P',
        '/query-builder',
        'Database',
        2,
        true,
        NOW()
      )
    `, [configId])
    console.log('✅ Programme "Query Builder" créé')

    // Compter les éléments créés
    const itemCount = await dataSource.query(`
      SELECT COUNT(*) FROM menu_items WHERE "configId" = $1
    `, [configId])

    console.log(`\n🎉 Données de test créées avec succès!`)
    console.log(`   Configuration ID: ${configId}`)
    console.log(`   ${itemCount[0].count} éléments de menu créés`)
    console.log(`   Vous pouvez maintenant tester l'interface d'administration`)

  } catch (error: any) {
    console.error('❌ Erreur lors de la création des données de test:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createTestMenuData().catch(console.error)
}

export { createTestMenuData }