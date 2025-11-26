#!/usr/bin/env node
/**
 * Script pour vérifier les index multi-tenant sur PostgreSQL
 * Usage: node check-indexes.js
 */

const { Client } = require('pg')

const config = {
  host: '192.168.0.22',
  port: 5432,
  database: 'topsteel',
  user: 'topsteel',
  password: 'topsteel',
}

// Index composites recommandés pour performance
const RECOMMENDED_INDEXES = [
  // Notifications (queries fréquentes par user et type)
  { table: 'notifications', columns: ['societe_id', 'user_id'], name: 'idx_notifications_societe_user' },
  { table: 'notifications', columns: ['societe_id', 'type'], name: 'idx_notifications_societe_type' },
  { table: 'notifications', columns: ['societe_id', 'created_at'], name: 'idx_notifications_societe_created' },

  // Notification Events
  { table: 'notification_events', columns: ['societe_id', 'type'], name: 'idx_notification_events_societe_type' },

  // Notification Templates
  { table: 'notification_templates', columns: ['societe_id', 'code'], name: 'idx_notification_templates_societe_code' },

  // Notification Rules
  { table: 'notification_rules', columns: ['societe_id', 'type'], name: 'idx_notification_rules_societe_type' },

  // Query Builders
  { table: 'query_builders', columns: ['societe_id', 'created_by'], name: 'idx_query_builders_societe_created_by' },
  { table: 'query_builders', columns: ['societe_id', 'created_at'], name: 'idx_query_builders_societe_created' },

  // Parameters
  { table: 'parameter_system', columns: ['societe_id', 'category'], name: 'idx_parameter_system_societe_category' },
  { table: 'parameter_application', columns: ['societe_id', 'category'], name: 'idx_parameter_app_societe_category' },
  { table: 'parameter_client', columns: ['societe_id', 'category'], name: 'idx_parameter_client_societe_category' },

  // System Settings
  { table: 'system_settings', columns: ['societe_id', 'category'], name: 'idx_system_settings_societe_category' },

  // Menus
  { table: 'menu_configurations', columns: ['societe_id', 'is_active'], name: 'idx_menu_configs_societe_active' },

  // Audit Logs (queries par date)
  { table: 'audit_logs', columns: ['societe_id', 'created_at'], name: 'idx_audit_logs_societe_created' },
]

async function checkIndexes() {
  const client = new Client(config)

  try {
    console.log('🔌 Connexion à PostgreSQL...')
    await client.connect()
    console.log('✅ Connecté\n')

    // 1. Tables avec societe_id
    console.log('📊 1. Tables avec colonne societe_id:')
    console.log('─'.repeat(60))
    const tablesResult = await client.query(`
      SELECT
          table_name,
          is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'societe_id'
      ORDER BY table_name
    `)
    console.log(`   Trouvées: ${tablesResult.rows.length} tables`)
    tablesResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)'
      console.log(`   - ${row.table_name} ${nullable}`)
    })
    console.log('')

    // 2. Vérifier les index simples sur societe_id
    console.log('📊 2. Index simples sur societe_id:')
    console.log('─'.repeat(60))
    const simpleIndexResult = await client.query(`
      SELECT DISTINCT
          t.tablename AS table_name,
          COUNT(i.indexname) AS index_count
      FROM pg_tables t
      LEFT JOIN pg_indexes i
          ON i.tablename = t.tablename
          AND i.schemaname = 'public'
          AND i.indexdef LIKE '%societe_id%'
      WHERE t.schemaname = 'public'
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_name = t.tablename
              AND c.column_name = 'societe_id'
              AND c.table_schema = 'public'
        )
      GROUP BY t.tablename
      ORDER BY t.tablename
    `)

    const tablesWithoutIndex = simpleIndexResult.rows.filter(r => r.index_count === '0')
    const tablesWithIndex = simpleIndexResult.rows.filter(r => r.index_count !== '0')

    console.log(`   ✅ Avec index: ${tablesWithIndex.length} tables`)
    tablesWithIndex.forEach(row => {
      console.log(`      - ${row.table_name} (${row.index_count} index)`)
    })

    if (tablesWithoutIndex.length > 0) {
      console.log(`   ❌ Sans index: ${tablesWithoutIndex.length} tables`)
      tablesWithoutIndex.forEach(row => {
        console.log(`      - ${row.table_name}`)
      })
    }
    console.log('')

    // 3. Vérifier les index composites recommandés
    console.log('📊 3. Index composites recommandés:')
    console.log('─'.repeat(60))

    const missingIndexes = []
    const existingIndexes = []

    for (const rec of RECOMMENDED_INDEXES) {
      const columnsPattern = rec.columns.join('%')
      const result = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = $1
          AND schemaname = 'public'
          AND indexdef LIKE $2
        LIMIT 1
      `, [rec.table, `%${columnsPattern}%`])

      if (result.rows.length > 0) {
        existingIndexes.push(rec)
      } else {
        missingIndexes.push(rec)
      }
    }

    console.log(`   ✅ Index existants: ${existingIndexes.length}`)
    existingIndexes.forEach(idx => {
      console.log(`      - ${idx.table} (${idx.columns.join(', ')})`)
    })

    if (missingIndexes.length > 0) {
      console.log(`   ❌ Index manquants: ${missingIndexes.length}`)
      missingIndexes.forEach(idx => {
        console.log(`      - ${idx.table} (${idx.columns.join(', ')})`)
      })
    }
    console.log('')

    // 4. Statistiques d'utilisation
    console.log('📊 4. Statistiques d\'utilisation des index:')
    console.log('─'.repeat(60))
    const statsResult = await client.query(`
      SELECT
          tablename,
          indexrelname AS index_name,
          idx_scan AS scans,
          idx_tup_read AS tuples_read,
          idx_tup_fetch AS tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND indexrelname LIKE '%societe%'
      ORDER BY idx_scan DESC
      LIMIT 10
    `)

    if (statsResult.rows.length > 0) {
      console.log('   Top 10 index les plus utilisés:')
      statsResult.rows.forEach(row => {
        const status = row.scans === '0' ? '⚠️  UNUSED' :
                      parseInt(row.scans) < 100 ? '🔸 LOW' :
                      parseInt(row.scans) < 1000 ? '✅ MODERATE' : '🚀 HIGH'
        console.log(`      ${status} ${row.tablename}.${row.index_name} (${row.scans} scans)`)
      })
    } else {
      console.log('   ⚠️  Aucune statistique disponible')
    }
    console.log('')

    // 5. Générer SQL pour créer les index manquants
    if (missingIndexes.length > 0) {
      console.log('🔧 5. Commandes SQL pour créer les index manquants:')
      console.log('─'.repeat(60))
      missingIndexes.forEach(idx => {
        const sql = `CREATE INDEX ${idx.name} ON ${idx.table} (${idx.columns.join(', ')});`
        console.log(`   ${sql}`)
      })
      console.log('')

      // Générer un fichier SQL
      const fs = require('fs')
      const sqlContent = [
        '-- Index composites multi-tenant manquants',
        '-- Généré automatiquement par check-indexes.js',
        '',
        ...missingIndexes.map(idx =>
          `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table} (${idx.columns.join(', ')});`
        ),
        '',
        '-- Vérifier les index créés:',
        '-- SELECT * FROM pg_indexes WHERE schemaname = \'public\' AND indexname LIKE \'%societe%\';'
      ].join('\n')

      const outputFile = require('path').join(__dirname, 'create-missing-indexes.sql')
      fs.writeFileSync(outputFile, sqlContent, 'utf8')
      console.log(`   📝 Fichier SQL créé: ${outputFile}`)
      console.log('')
    }

    // Résumé
    console.log('📋 RÉSUMÉ:')
    console.log('─'.repeat(60))
    console.log(`   Tables avec societe_id: ${tablesResult.rows.length}`)
    console.log(`   Tables sans index simple: ${tablesWithoutIndex.length}`)
    console.log(`   Index composites existants: ${existingIndexes.length}/${RECOMMENDED_INDEXES.length}`)
    console.log(`   Index composites manquants: ${missingIndexes.length}/${RECOMMENDED_INDEXES.length}`)

    if (missingIndexes.length === 0 && tablesWithoutIndex.length === 0) {
      console.log('\n   ✅ Tous les index recommandés sont présents!')
    } else {
      console.log('\n   ⚠️  Des index sont manquants - voir les recommandations ci-dessus')
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Déconnecté')
  }
}

checkIndexes()
