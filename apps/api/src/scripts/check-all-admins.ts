import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkAllAdmins() {
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

    const admins = await dataSource.query(`
      SELECT id, email, role, actif, nom, prenom, created_at, updated_at
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN')
         OR LOWER(email) LIKE '%admin%'
         OR LOWER(email) LIKE '%topsteel.tech%'
      ORDER BY role, email
    `)

    if (admins.length === 0) {
    } else {
      admins.forEach((_admin: any, _index: number) => {})
    }

    const variations = await dataSource.query(
      `
      SELECT email, role 
      FROM users 
      WHERE LOWER(REPLACE(email, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
    `,
      ['admin@topsteel.tech']
    )

    if (variations.length > 0) {
      variations.forEach((_v: any) => {})
    } else {
    }
  } catch (_error) {
  } finally {
    await dataSource.destroy()
  }
}

checkAllAdmins().catch(console.error)
