#!/usr/bin/env ts-node
/**
 * Script pour créer des données de test dans la base AUTH
 */

import { DataSource } from 'typeorm'

async function createAuthMenuData() {
  console.log('🔄 Création de données de test dans la base AUTH...\n')

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

    // Vérifier si des données existent déjà
    const existingConfigs = await dataSource.query('SELECT COUNT(*) as count FROM menu_configurations')
    if (parseInt(existingConfigs[0].count) > 0) {
      console.log('⚠️  Des configurations existent déjà, nettoyage...')
      await dataSource.query('DELETE FROM menu_item_permissions')
      await dataSource.query('DELETE FROM menu_item_roles')
      await dataSource.query('DELETE FROM menu_items')
      await dataSource.query('DELETE FROM menu_configurations')
      console.log('✅ Données nettoyées')
    }

    // 1. Créer une configuration de test
    const configId = 'c5e865d7-f220-460f-a0fc-83fb6646f457'
    await dataSource.query(`
      INSERT INTO menu_configurations (id, name, description, isactive, issystem, createdat, updatedat)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [configId, 'Configuration Test', 'Configuration de test avec tous les types de menu', true, false])
    console.log('✅ Configuration créée')

    // 2. Créer les items de menu
    const menuItems = [
      {
        id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
        title: 'Tableau de bord',
        type: 'P',
        programId: '/dashboard',
        orderIndex: 0,
        parentId: null
      },
      {
        id: '2a2b3c4d-5e6f-7890-abcd-ef1234567890',
        title: 'Administration',
        type: 'M',
        orderIndex: 1,
        parentId: null
      },
      {
        id: '3a2b3c4d-5e6f-7890-abcd-ef1234567890',
        title: 'Gestion des utilisateurs',
        type: 'P',
        programId: '/admin/users',
        orderIndex: 0,
        parentId: '2a2b3c4d-5e6f-7890-abcd-ef1234567890'
      },
      {
        id: '4a2b3c4d-5e6f-7890-abcd-ef1234567890',
        title: 'Documentation',
        type: 'L',
        externalUrl: 'https://docs.example.com',
        orderIndex: 1,
        parentId: '2a2b3c4d-5e6f-7890-abcd-ef1234567890'
      },
      {
        id: '5a2b3c4d-5e6f-7890-abcd-ef1234567890',
        title: 'Query Builder',
        type: 'P',
        programId: '/query-builder',
        orderIndex: 2,
        parentId: null
      }
    ]

    for (const item of menuItems) {
      await dataSource.query(`
        INSERT INTO menu_items (
          id, "configId", "parentId", title, type, "programId", "externalUrl", 
          "orderIndex", "isVisible", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        item.id,
        configId,
        item.parentId,
        item.title,
        item.type,
        item.programId || null,
        item.externalUrl || null,
        item.orderIndex,
        true
      ])
    }
    console.log(`✅ ${menuItems.length} items de menu créés`)

    // 3. Vérification finale
    const finalCount = await dataSource.query('SELECT COUNT(*) as count FROM menu_items')
    console.log(`\n📊 Total: ${finalCount[0].count} item(s) de menu créé(s)`)

    // 4. Afficher la structure
    const items = await dataSource.query(`
      SELECT id, title, type, "programId", "externalUrl", "parentId", "orderIndex"
      FROM menu_items 
      WHERE "configId" = $1
      ORDER BY "orderIndex", "parentId" NULLS FIRST
    `, [configId])
    
    console.log('\n🌳 Structure du menu:')
    const rootItems = items.filter((item: any) => !item.parentId)
    const childItems = items.filter((item: any) => item.parentId)
    
    rootItems.forEach((root: any) => {
      const typeEmoji = root.type === 'M' ? '📁' : root.type === 'P' ? '🔗' : root.type === 'L' ? '🌐' : '📊'
      console.log(`   ${typeEmoji} ${root.title} (${root.type})`)
      
      if (root.programId) console.log(`      → ${root.programId}`)
      if (root.externalUrl) console.log(`      → ${root.externalUrl}`)
      
      const children = childItems.filter((child: any) => child.parentId === root.id)
      children.forEach((child: any) => {
        const childEmoji = child.type === 'M' ? '📁' : child.type === 'P' ? '🔗' : child.type === 'L' ? '🌐' : '📊'
        console.log(`      └─ ${childEmoji} ${child.title}`)
        if (child.programId) console.log(`         → ${child.programId}`)
        if (child.externalUrl) console.log(`         → ${child.externalUrl}`)
      })
    })

    console.log('\n🎉 Données de test créées avec succès dans la base AUTH!')

  } catch (error: any) {
    console.error('❌ Erreur lors de la création:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createAuthMenuData().catch(console.error)
}

export { createAuthMenuData }