import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkDatabaseStructure() {
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
    const mfaColumns = await dataSource.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_mfa'
      ORDER BY ordinal_position
    `)

    if (mfaColumns.length === 0) {
    } else {
      mfaColumns.forEach((_col: any) => {})
    }
    const sessionColumns = await dataSource.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_sessions'
      ORDER BY ordinal_position
    `)

    sessionColumns.forEach((col: any) => {
      if (col.column_name === 'accessToken' || col.column_name === 'refreshToken') {
      } else {
      }
    })
    const mfaTables = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE '%mfa%'
      ORDER BY table_name
    `)

    mfaTables.forEach((_table: any) => {})
  } catch (_error) {
  } finally {
    await dataSource.destroy()
  }
}

checkDatabaseStructure().catch(console.error)
