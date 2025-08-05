#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

config()

async function checkTableColumns() {
  const authDataSource = new DataSource(authDataSourceOptions)

  try {
    await authDataSource.initialize()

    const tables = ['user_sessions', 'user_societe_roles', 'roles', 'permissions']

    for (const tableName of tables) {
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
        continue
      }

      columns.forEach((_col: any) => {})

      // Identifier les colonnes qui pourraient être camelCase vs snake_case
      const camelCaseColumns = columns.filter((col: any) => /[A-Z]/.test(col.column_name))
      const snakeCaseColumns = columns.filter((col: any) => col.column_name.includes('_'))

      if (camelCaseColumns.length > 0) {
        camelCaseColumns.forEach((_col: any) => {})
      }

      if (snakeCaseColumns.length > 0) {
        snakeCaseColumns.forEach((_col: any) => {})
      }
    }
  } catch (_error) {
  } finally {
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
    }
  }
}

checkTableColumns()
