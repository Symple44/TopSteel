import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkAuthTablesStructure() {
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

    // Tables à vérifier
    const tablesToCheck = [
      'users',
      'roles',
      'societes',
      'sites',
      'user_societe_roles',
      'societe_users',
      'permissions',
      'role_permissions',
    ]

    for (const table of tablesToCheck) {
      try {
        // Vérifier si la table existe
        const tableExists = await dataSource.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `,
          [table]
        )

        if (tableExists[0].exists) {
          // Vérifier les colonnes
          const columns = await dataSource.query(
            `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `,
            [table]
          )

          const hasDeletedAt = columns.some((col: any) => col.column_name === 'deleted_at')

          if (hasDeletedAt) {
          } else {
            columns.slice(0, 5).forEach((_col: any) => {})
          }
        } else {
        }
      } catch (_error: any) {}
    }

    for (const table of tablesToCheck) {
      try {
        const tableExists = await dataSource.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `,
          [table]
        )

        if (tableExists[0].exists) {
          const hasDeletedAt = await dataSource.query(
            `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 
              AND column_name = 'deleted_at'
            )
          `,
            [table]
          )

          if (!hasDeletedAt[0].exists) {
            await dataSource.query(`
              ALTER TABLE ${table} 
              ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL
            `)
          }
        }
      } catch (_error: any) {}
    }
  } catch (_error) {
  } finally {
    await dataSource.destroy()
  }
}

checkAuthTablesStructure().catch(console.error)
