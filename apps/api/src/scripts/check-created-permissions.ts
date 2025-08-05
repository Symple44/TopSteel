import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

async function checkCreatedPermissions() {
  const dataSource = new DataSource(authDataSourceOptions)

  try {
    await dataSource.initialize()
    console.log('\n=== VÉRIFICATION DES PERMISSIONS CRÉÉES ===\n')

    // Chercher les permissions commerciales
    const commercialPermissions = await dataSource.query(`
      SELECT name, description, resource, action, category
      FROM permissions 
      WHERE category = 'commercial'
      ORDER BY name
    `)

    console.log('Permissions commerciales créées:')
    console.table(commercialPermissions)

    // Vérifier les permissions dans les rôles COMMERCIAL
    const rolePermissions = await dataSource.query(`
      SELECT r.name as role_name, p.name as permission_name, p.description
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.parent_role_type = 'COMMERCIAL'
      ORDER BY r.name, p.name
    `)

    console.log('\nPermissions attribuées aux rôles COMMERCIAL:')
    console.table(rolePermissions)
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

checkCreatedPermissions()
