import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function fixSocieteDeletedAt() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_SHARED_NAME || 'erp_topsteel_shared', // Les sociétés sont dans la base shared
  })

  try {
    await dataSource.initialize()
    const societeColumns = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'societe'
      ORDER BY ordinal_position
    `)

    if (societeColumns.length === 0) {
      // Essayer avec 's'
      const societesColumns = await dataSource.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'societes'
        ORDER BY ordinal_position
      `)

      if (societesColumns.length > 0) {
        societesColumns.forEach((_col: any) => {})
      }
    } else {
      societeColumns.forEach((_col: any) => {})
    }

    const tables = ['societe', 'societes', 'sites', 'contacts', 'fournisseurs', 'clients']

    for (const table of tables) {
      try {
        const hasDeletedAt = await dataSource.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'deleted_at'
          )
        `,
          [table]
        )

        const tableExists = await dataSource.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `,
          [table]
        )

        if (tableExists[0].exists) {
          if (hasDeletedAt[0].exists) {
          } else {
            await dataSource.query(`
              ALTER TABLE ${table} 
              ADD COLUMN deleted_at TIMESTAMP NULL
            `)
          }
        } else {
        }
      } catch (_error: any) {}
    }
  } catch (_error) {
  } finally {
    await dataSource.destroy()
  }
}

// Vérifier aussi dans la base AUTH
async function fixAuthTables() {
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

    // Corriger les tables qui pourraient référencer societe
    const tables = ['user_societe_roles', 'societe', 'societes']

    for (const table of tables) {
      try {
        const tableExists = await dataSource.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `,
          [table]
        )

        if (tableExists[0].exists) {
          const hasDeletedAt = await dataSource.query(
            `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = 'deleted_at'
            )
          `,
            [table]
          )

          if (hasDeletedAt[0].exists) {
          } else {
            await dataSource.query(`
              ALTER TABLE ${table} 
              ADD COLUMN deleted_at TIMESTAMP NULL
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

// Exécuter les deux corrections
async function runFix() {
  await fixSocieteDeletedAt()
  await fixAuthTables()
}

runFix().catch(console.error)
