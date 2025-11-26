#!/usr/bin/env node
/**
 * Script pour déployer les index manquants sur PostgreSQL
 * Usage: node deploy-missing-indexes.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const config = {
  host: '192.168.0.22',
  port: 5432,
  database: 'topsteel',
  user: 'topsteel',
  password: 'topsteel',
}

const INDEXES_TO_CREATE = [
  {
    name: 'idx_user_menu_preferences_societe',
    table: 'user_menu_preferences',
    columns: ['societe_id'],
    description: 'Index simple sur societe_id'
  },
  {
    name: 'idx_notifications_societe_created',
    table: 'notifications',
    columns: ['societe_id', 'created_at DESC'],
    description: 'Trier les notifications par date pour une société'
  },
  {
    name: 'idx_query_builders_societe_created',
    table: 'query_builders',
    columns: ['societe_id', 'created_at DESC'],
    description: 'Lister les query builders récents d\'une société'
  },
]

async function deployIndexes() {
  const client = new Client(config)

  try {
    console.log('🔌 Connexion à PostgreSQL...')
    await client.connect()
    console.log('✅ Connecté\n')

    console.log('📊 Création des index manquants...')
    console.log('─'.repeat(60))

    let created = 0
    let skipped = 0
    let errors = 0

    for (const index of INDEXES_TO_CREATE) {
      try {
        // Vérifier si l'index existe déjà
        const checkResult = await client.query(`
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = $1
        `, [index.name])

        if (checkResult.rows.length > 0) {
          console.log(`⏭️  ${index.name} - Déjà existant`)
          skipped++
          continue
        }

        // Créer l'index
        const createSQL = `CREATE INDEX ${index.name} ON ${index.table} (${index.columns.join(', ')})`
        await client.query(createSQL)

        console.log(`✅ ${index.name} - Créé`)
        console.log(`   Table: ${index.table}`)
        console.log(`   Colonnes: ${index.columns.join(', ')}`)
        console.log(`   💡 ${index.description}`)
        created++

      } catch (error) {
        console.error(`❌ ${index.name} - Erreur: ${error.message}`)
        errors++
      }
    }

    console.log('\n' + '─'.repeat(60))
    console.log('📋 RÉSUMÉ:')
    console.log(`   ✅ Créés: ${created}`)
    console.log(`   ⏭️  Existants: ${skipped}`)
    console.log(`   ❌ Erreurs: ${errors}`)

    // Vérifier les index créés
    if (created > 0) {
      console.log('\n📊 Vérification des index créés:')
      console.log('─'.repeat(60))

      const verifyResult = await client.query(`
        SELECT
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) AS size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND indexrelname IN ($1, $2, $3)
        ORDER BY tablename, indexrelname
      `, INDEXES_TO_CREATE.map(i => i.name))

      verifyResult.rows.forEach(row => {
        console.log(`   ${row.tablename}.${row.indexname} (${row.size})`)
      })
    }

    console.log('\n✅ Déploiement terminé!')

  } catch (error) {
    console.error('\n❌ Erreur lors du déploiement:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Déconnecté')
  }
}

deployIndexes()
