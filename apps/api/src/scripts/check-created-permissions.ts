import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

async function checkCreatedPermissions() {
  const dataSource = new DataSource(authDataSourceOptions)

  try {
    await dataSource.initialize()

    // Chercher les permissions commerciales
    await dataSource.query(`
      SELECT name, description, resource, action, category
      FROM permissions 
      WHERE category = 'commercial'
      ORDER BY name
    `)

    // Vérifier les permissions dans les rôles COMMERCIAL
    await dataSource.query(`
      SELECT r.name as role_name, p.name as permission_name, p.description
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.parent_role_type = 'COMMERCIAL'
      ORDER BY r.name, p.name
    `)
  } catch (_error: unknown) {
  } finally {
    await dataSource.destroy()
  }
}

checkCreatedPermissions()
