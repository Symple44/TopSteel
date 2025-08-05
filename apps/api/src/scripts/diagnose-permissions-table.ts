import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

async function diagnosePermissionsTable() {
  const dataSource = new DataSource(authDataSourceOptions)

  try {
    await dataSource.initialize()
    console.log('\n=== DIAGNOSTIC DE LA TABLE PERMISSIONS ===\n')

    // 1. Vérifier la structure de la table permissions
    console.log('1. Structure de la table permissions:')
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    console.table(columns)

    // 2. Vérifier les contraintes NOT NULL
    console.log('\n2. Contraintes NOT NULL sur permissions:')
    const constraints = await dataSource.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      AND table_schema = 'public'
      AND is_nullable = 'NO'
    `)

    console.table(constraints)

    // 3. Compter les lignes avec des valeurs NULL
    console.log('\n3. Analyse des valeurs NULL:')

    const columnNames = columns.map((col: any) => col.column_name)

    if (columnNames.includes('nom')) {
      const nullNom = await dataSource.query(
        `SELECT COUNT(*) as count FROM permissions WHERE nom IS NULL`
      )
      console.log(`Lignes avec nom IS NULL: ${nullNom[0].count}`)
    }

    if (columnNames.includes('name')) {
      const nullName = await dataSource.query(
        `SELECT COUNT(*) as count FROM permissions WHERE name IS NULL`
      )
      console.log(`Lignes avec name IS NULL: ${nullName[0].count}`)
    }

    // 4. Vérifier quelques lignes de données
    console.log('\n4. Échantillon de données:')
    const sampleData = await dataSource.query(`SELECT * FROM permissions LIMIT 5`)
    console.table(sampleData)

    // 5. Vérifier les migrations exécutées
    console.log('\n5. Migrations exécutées récemment:')
    const recentMigrations = await dataSource.query(`
      SELECT name, timestamp 
      FROM migrations 
      WHERE name LIKE '%Permission%' OR name LIKE '%permissions%'
      ORDER BY timestamp DESC 
      LIMIT 10
    `)
    console.table(recentMigrations)
  } catch (error) {
    console.error('Erreur lors du diagnostic:', error)
  } finally {
    await dataSource.destroy()
  }
}

diagnosePermissionsTable()
