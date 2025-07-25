#!/usr/bin/env ts-node
/**
 * Script pour vérifier les utilisateurs dans la base AUTH
 */

import { DataSource } from 'typeorm'

async function checkUsers() {
  console.log('🔍 Vérification des utilisateurs dans la base AUTH...\n')

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

    // Voir la structure de la table users
    const columns = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Structure de la table users:')
    columns.forEach((col: any) => {
      console.log(`   ${col.column_name}: ${col.data_type}`)
    })

    // Lister les utilisateurs avec colonnes correctes
    const users = await dataSource.query(`
      SELECT id, email
      FROM users 
      LIMIT 10
    `)
    
    console.log('\n📋 Utilisateurs trouvés:')
    users.forEach((user: any) => {
      console.log(`   📧 ${user.email}`)
      console.log(`      ID: ${user.id}`)
    })

    console.log(`\n📊 Total: ${users.length} utilisateur(s) trouvé(s)`)

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

checkUsers().catch(console.error)