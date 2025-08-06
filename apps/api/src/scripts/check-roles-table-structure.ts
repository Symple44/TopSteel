import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkRolesTableStructure() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  })

  try {
    await dataSource.initialize()
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `)

    columns.forEach(() => {})
    const expectedColumns = ['version', 'created_by_id', 'updated_by_id', 'deleted_by_id']
    expectedColumns.forEach((colName) => {
      columns.some((col: unknown) => (col as { column_name: string }).column_name === colName)
    })
    for (const colName of expectedColumns) {
      const exists = columns.some(
        (col: unknown) => (col as { column_name: string }).column_name === colName
      )
      if (!exists) {
        try {
          if (colName === 'version') {
            await dataSource.query(`ALTER TABLE roles ADD COLUMN version INTEGER DEFAULT 1`)
          } else {
            await dataSource.query(`ALTER TABLE roles ADD COLUMN "${colName}" UUID NULL`)
          }
        } catch (_error: unknown) {}
      }
    }
    const societesColumns = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'societes' 
      AND column_name IN ('version', 'created_by_id', 'updated_by_id', 'deleted_by_id')
    `)

    expectedColumns.forEach((colName) => {
      societesColumns.some(
        (col: unknown) => (col as { column_name: string }).column_name === colName
      )
    })
    for (const colName of expectedColumns) {
      const exists = societesColumns.some(
        (col: unknown) => (col as { column_name: string }).column_name === colName
      )
      if (!exists) {
        try {
          if (colName === 'version') {
            await dataSource.query(`ALTER TABLE societes ADD COLUMN version INTEGER DEFAULT 1`)
          } else {
            await dataSource.query(`ALTER TABLE societes ADD COLUMN "${colName}" UUID NULL`)
          }
        } catch (_error: unknown) {}
      }
    }
  } catch (_error: unknown) {
  } finally {
    await dataSource.destroy()
  }
}

checkRolesTableStructure().catch(console.error)
