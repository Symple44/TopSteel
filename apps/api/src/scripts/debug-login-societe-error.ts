import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function debugLoginSocieteError() {
  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  })

  try {
    await authDataSource.initialize()
    const users = await authDataSource.query(`
      SELECT id, email, role, actif, nom, prenom
      FROM users 
      WHERE email = 'admin@topsteel.tech'
    `)

    if (users.length === 0) {
      return
    }

    const adminUser = users[0]
    const societes = await authDataSource.query(`
      SELECT id, nom, code, status, deleted_at
      FROM societes
      WHERE deleted_at IS NULL
    `)
    societes.forEach((_s: any) => {})

    if (societes.length === 0) {
      return
    }

    const firstSociete = societes[0]
    const userSocieteRoles = await authDataSource.query(
      `
      SELECT usr.*, r.name as role_name
      FROM user_societe_roles usr
      LEFT JOIN roles r ON usr.role_id = r.id
      WHERE usr.user_id = $1 AND usr.societe_id = $2
    `,
      [adminUser.id, firstSociete.id]
    )

    if (userSocieteRoles.length === 0) {
      // Pour SUPER_ADMIN, c'est normal de ne pas avoir de rôle explicite
      if (adminUser.role === 'SUPER_ADMIN') {
      }
    } else {
      userSocieteRoles.forEach((_r: any) => {})
    }

    // Vérifier les colonnes de user_societe_roles
    const usrColumns = await authDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_societe_roles'
      ORDER BY ordinal_position
    `)
    const requiredColumns = ['user_id', 'societe_id', 'role_type', 'is_active', 'deleted_at']
    requiredColumns.forEach((col) => {
      const found = usrColumns.find((c: any) => c.column_name === col)
      if (found) {
      } else {
      }
    })
    try {
      const testQuery = await authDataSource.query(
        `
        SELECT 
          usr.*,
          s.id as societe_id,
          s.nom as societe_nom,
          s.code as societe_code,
          r.id as role_id,
          r.name as role_name
        FROM user_societe_roles usr
        LEFT JOIN societes s ON usr.societe_id = s.id
        LEFT JOIN roles r ON usr.role_id = r.id
        WHERE usr.user_id = $1 
          AND usr.societe_id = $2
          AND usr.is_active = true
          AND (usr.deleted_at IS NULL)
          AND (s.deleted_at IS NULL)
          AND (r.deleted_at IS NULL OR r.deleted_at IS NULL)
      `,
        [adminUser.id, firstSociete.id]
      )

      if (testQuery.length === 0) {
      } else {
      }
    } catch (_error: any) {}
    const roles = await authDataSource.query(`
      SELECT id, name, type, deleted_at
      FROM roles
      WHERE deleted_at IS NULL
    `)
    roles.forEach((_r: any) => {})
  } catch (_error) {
  } finally {
    await authDataSource.destroy()
  }
}

debugLoginSocieteError().catch(console.error)
