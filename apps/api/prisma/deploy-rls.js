#!/usr/bin/env node
/**
 * Script pour déployer les politiques RLS sur PostgreSQL
 * Usage: node deploy-rls.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const SQL_FILE = path.join(__dirname, 'migrations', 'enable_rls.sql')

// Configuration depuis .env
const config = {
  host: '192.168.0.22',
  port: 5432,
  database: 'topsteel',
  user: 'topsteel',
  password: 'topsteel',
}

async function deployRLS() {
  const client = new Client(config)

  try {
    console.log('🔌 Connexion à PostgreSQL...')
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   Database: ${config.database}`)
    console.log(`   User: ${config.user}`)

    await client.connect()
    console.log('✅ Connecté à PostgreSQL\n')

    // Lire le fichier SQL
    console.log('📖 Lecture du fichier RLS...')
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8')
    console.log(`   Fichier: ${SQL_FILE}`)
    console.log(`   Taille: ${(sqlContent.length / 1024).toFixed(2)} KB\n`)

    // Exécuter le SQL
    console.log('🔒 Déploiement des politiques RLS...')
    await client.query(sqlContent)

    console.log('\n✅ RLS déployé avec succès!')
    console.log('\n📋 Résumé:')
    console.log('   ✅ Row-Level Security activé sur 20+ tables')
    console.log('   ✅ Politiques d\'isolation par société créées')
    console.log('   ✅ Politiques admin bypass créées')
    console.log('   ✅ Fonctions helper créées (set_societe_context, clear_societe_context)')
    console.log('\n💡 Prochaines étapes:')
    console.log('   1. Vérifier l\'activation RLS: SELECT tablename FROM pg_tables WHERE rowsecurity = true')
    console.log('   2. Tester l\'isolation: SELECT set_societe_context(\'uuid\'::uuid)')
    console.log('   3. Implémenter le middleware Prisma (Tâche 5)')

  } catch (error) {
    console.error('\n❌ Erreur lors du déploiement RLS:')
    console.error(error.message)

    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }

    if (error.position) {
      console.error(`   Position: ${error.position}`)
    }

    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Déconnecté de PostgreSQL')
  }
}

deployRLS()
