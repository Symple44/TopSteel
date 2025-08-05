import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

async function diagnosePermissionsTable() {
  const dataSource = new DataSource(authDataSourceOptions)

  try {
    await dataSource.initialize()
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    const _constraints = await dataSource.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      AND table_schema = 'public'
      AND is_nullable = 'NO'
    `)

    const columnNames = columns.map((col: any) => col.column_name)

    if (columnNames.includes('nom')) {
      const _nullNom = await dataSource.query(
        `SELECT COUNT(*) as count FROM permissions WHERE nom IS NULL`
      )
    }

    if (columnNames.includes('name')) {
      const _nullName = await dataSource.query(
        `SELECT COUNT(*) as count FROM permissions WHERE name IS NULL`
      )
    }
    const _sampleData = await dataSource.query(`SELECT * FROM permissions LIMIT 5`)
    const _recentMigrations = await dataSource.query(`
      SELECT name, timestamp 
      FROM migrations 
      WHERE name LIKE '%Permission%' OR name LIKE '%permissions%'
      ORDER BY timestamp DESC 
      LIMIT 10
    `)
  } catch (_error) {
  } finally {
    await dataSource.destroy()
  }
}

diagnosePermissionsTable()
