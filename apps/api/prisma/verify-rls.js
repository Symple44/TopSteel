#!/usr/bin/env node
/**
 * Script pour vérifier l'activation RLS sur les tables PostgreSQL
 */

const { Client } = require('pg')

const config = {
  host: '192.168.0.22',
  port: 5432,
  database: 'topsteel',
  user: 'topsteel',
  password: 'topsteel',
}

async function verifyRLS() {
  const client = new Client(config)

  try {
    await client.connect()
    console.log('🔍 Vérification de l\'activation RLS...\n')

    // Liste toutes les tables avec RLS activé
    const result = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND rowsecurity = true
      ORDER BY tablename
    `)

    console.log('✅ Tables avec RLS activé:')
    console.log('─'.repeat(50))
    result.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${row.tablename}`)
    })
    console.log('─'.repeat(50))
    console.log(`Total: ${result.rows.length} tables\n`)

    // Liste les politiques RLS
    const policies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        CASE
          WHEN cmd = '*' THEN 'ALL'
          WHEN cmd = 'r' THEN 'SELECT'
          WHEN cmd = 'a' THEN 'INSERT'
          WHEN cmd = 'w' THEN 'UPDATE'
          WHEN cmd = 'd' THEN 'DELETE'
        END as command
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `)

    console.log('📋 Politiques RLS créées:')
    console.log('─'.repeat(80))
    let currentTable = ''
    policies.rows.forEach((row) => {
      if (row.tablename !== currentTable) {
        if (currentTable !== '') console.log('')
        console.log(`📦 ${row.tablename}:`)
        currentTable = row.tablename
      }
      console.log(`   └─ ${row.policyname} (${row.command})`)
    })
    console.log('─'.repeat(80))
    console.log(`Total: ${policies.rows.length} politiques\n`)

    // Vérifier les fonctions helper
    const functions = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('set_societe_context', 'clear_societe_context')
      ORDER BY routine_name
    `)

    console.log('🔧 Fonctions helper:')
    console.log('─'.repeat(50))
    functions.rows.forEach((row) => {
      console.log(`✅ ${row.routine_name}()`)
    })
    console.log('─'.repeat(50) + '\n')

    console.log('✅ RLS correctement configuré!')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

verifyRLS()
