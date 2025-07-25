#!/usr/bin/env ts-node
/**
 * Script pour vérifier la structure de la table user_sessions
 */

import { DataSource } from 'typeorm'

async function checkUserSessions() {
  console.log('🔍 Vérification de la structure de user_sessions...\n')

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

    // Structure de la table user_sessions
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Structure de user_sessions:')
    columns.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? '?' : ''
      const defaultVal = col.column_default ? ` = ${col.column_default}` : ''
      console.log(`   ${col.column_name}${nullable}: ${col.data_type}${defaultVal}`)
    })

    // Compter les enregistrements
    const count = await dataSource.query('SELECT COUNT(*) as count FROM user_sessions')
    console.log(`\n📊 ${count[0].count} enregistrement(s) dans user_sessions`)

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

checkUserSessions().catch(console.error)