import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkUserSocieteRolesStructure() {
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
      WHERE table_name = 'user_societe_roles'
      ORDER BY ordinal_position
    `)

    columns.forEach((_col: any) => {})
    const data = await dataSource.query(`
      SELECT * FROM user_societe_roles LIMIT 5
    `)

    if (data.length === 0) {
    } else {
      data.forEach((_row: any) => {})
    }
    const constraints = await dataSource.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'user_societe_roles'::regclass
    `)

    constraints.forEach((_c: any) => {})

    // Test 1: roleId
    try {
      const _test1 = await dataSource.query(`
        SELECT COUNT(*) FROM user_societe_roles usr
        LEFT JOIN roles r ON usr."roleId" = r.id
      `)
    } catch (_e: any) {}

    // Test 2: role_id
    try {
      const _test2 = await dataSource.query(`
        SELECT COUNT(*) FROM user_societe_roles usr
        LEFT JOIN roles r ON usr.role_id = r.id
      `)
    } catch (_e: any) {}

    // Test 3: roleType
    try {
      const _test3 = await dataSource.query(`
        SELECT COUNT(*) FROM user_societe_roles 
        WHERE role_type IS NOT NULL
      `)
    } catch (_e: any) {}
    const correctQuery = await dataSource.query(`
      SELECT 
        usr.*,
        s.nom as societe_nom,
        s.code as societe_code
      FROM user_societe_roles usr
      LEFT JOIN societes s ON usr.societe_id = s.id
      WHERE usr.user_id = '0d2f2574-0ddf-4e50-ac45-58f7391367c8'
        AND usr.societe_id = '73416fa9-f693-42f6-99d3-7c919cefe4d5'
    `)

    if (correctQuery.length > 0) {
    } else {
    }
  } catch (_error) {
  } finally {
    await dataSource.destroy()
  }
}

checkUserSocieteRolesStructure().catch(console.error)
