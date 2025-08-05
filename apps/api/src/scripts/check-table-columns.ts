#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

config()

async function checkTableColumns() {
  const authDataSource = new DataSource(authDataSourceOptions)

  try {
    await authDataSource.initialize()
    console.log('✅ Connexion établie\n')

    const tables = ['user_sessions', 'user_societe_roles', 'roles', 'permissions']

    for (const tableName of tables) {
      console.log(`\n📋 Table ${tableName}:`)
      console.log('='.repeat(60))

      const columns = await authDataSource.query(
        `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `,
        [tableName]
      )

      if (columns.length === 0) {
        console.log('❌ Table non trouvée')
        continue
      }

      columns.forEach((col: any) => {
        console.log(
          `  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(25)} | ${col.is_nullable}`
        )
      })

      // Identifier les colonnes qui pourraient être camelCase vs snake_case
      const camelCaseColumns = columns.filter((col: any) => /[A-Z]/.test(col.column_name))
      const snakeCaseColumns = columns.filter((col: any) => col.column_name.includes('_'))

      if (camelCaseColumns.length > 0) {
        console.log('\n  🐪 Colonnes camelCase:')
        camelCaseColumns.forEach((col: any) => console.log(`    - ${col.column_name}`))
      }

      if (snakeCaseColumns.length > 0) {
        console.log('\n  🐍 Colonnes snake_case:')
        snakeCaseColumns.forEach((col: any) => console.log(`    - ${col.column_name}`))
      }
    }
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
    }
  }
}

checkTableColumns()
