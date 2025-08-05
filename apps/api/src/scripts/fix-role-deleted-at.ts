import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function fixRoleDeletedAt() {
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
    const roleColumns = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'role'
      ORDER BY ordinal_position
    `)

    if (roleColumns.length === 0) {
      // Vérifier si c'est plutôt "roles"
      const rolesColumns = await dataSource.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'roles'
        ORDER BY ordinal_position
      `)

      if (rolesColumns.length > 0) {
        rolesColumns.forEach((_col: any) => {})
      }
    } else {
      roleColumns.forEach((_col: any) => {})
    }

    // Essayer sur "role" d'abord
    try {
      await dataSource.query(`
        ALTER TABLE role 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `)
    } catch (_error: any) {
      // Essayer sur "roles"
      try {
        await dataSource.query(`
          ALTER TABLE roles 
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
        `)
      } catch (_error2: any) {}
    }
    const tables = [
      'users',
      'user_sessions',
      'user_societe_role',
      'societe_users',
      'permissions',
      'role_permissions',
    ]

    for (const table of tables) {
      try {
        const hasDeletedAt = await dataSource.query(
          `
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = 'deleted_at'
        `,
          [table]
        )

        if (hasDeletedAt.length === 0) {
          await dataSource.query(`
            ALTER TABLE ${table} 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
          `)
        } else {
        }
      } catch (_error: any) {}
    }
  } catch (_error) {
  } finally {
    await dataSource.destroy()
  }
}

fixRoleDeletedAt().catch(console.error)
