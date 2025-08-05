import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkRolesTableStructure() {
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
    console.log('✅ Connecté à la base de données AUTH\n')

    // 1. Vérifier la structure de la table roles
    console.log('📊 Structure de la table roles:')
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `)

    columns.forEach((col: any) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`
      )
    })

    // 2. Colonnes manquantes par rapport à BaseEntity
    console.log('\n🔍 Colonnes attendues par BaseEntity:')
    const expectedColumns = ['version', 'created_by_id', 'updated_by_id', 'deleted_by_id']
    expectedColumns.forEach((colName) => {
      const exists = columns.some((col: any) => col.column_name === colName)
      console.log(`   - ${colName}: ${exists ? '✅ Existe' : '❌ MANQUANTE'}`)
    })

    // 3. Ajouter les colonnes manquantes
    console.log('\n🔧 Ajout des colonnes manquantes...')
    for (const colName of expectedColumns) {
      const exists = columns.some((col: any) => col.column_name === colName)
      if (!exists) {
        try {
          if (colName === 'version') {
            await dataSource.query(`ALTER TABLE roles ADD COLUMN version INTEGER DEFAULT 1`)
          } else {
            await dataSource.query(`ALTER TABLE roles ADD COLUMN "${colName}" UUID NULL`)
          }
          console.log(`   ✅ Colonne ${colName} ajoutée`)
        } catch (error: any) {
          console.log(`   ❌ Erreur pour ${colName}: ${error.message}`)
        }
      }
    }

    // 4. Vérifier aussi societes
    console.log('\n📊 Structure de la table societes (colonnes BaseEntity):')
    const societesColumns = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'societes' 
      AND column_name IN ('version', 'created_by_id', 'updated_by_id', 'deleted_by_id')
    `)

    expectedColumns.forEach((colName) => {
      const exists = societesColumns.some((col: any) => col.column_name === colName)
      console.log(`   - ${colName}: ${exists ? '✅ Existe' : '❌ MANQUANTE'}`)
    })

    // Ajouter les colonnes manquantes à societes aussi
    console.log('\n🔧 Ajout des colonnes manquantes à societes...')
    for (const colName of expectedColumns) {
      const exists = societesColumns.some((col: any) => col.column_name === colName)
      if (!exists) {
        try {
          if (colName === 'version') {
            await dataSource.query(`ALTER TABLE societes ADD COLUMN version INTEGER DEFAULT 1`)
          } else {
            await dataSource.query(`ALTER TABLE societes ADD COLUMN "${colName}" UUID NULL`)
          }
          console.log(`   ✅ Colonne ${colName} ajoutée à societes`)
        } catch (error: any) {
          console.log(`   ❌ Erreur pour ${colName}: ${error.message}`)
        }
      }
    }

    console.log('\n✅ Vérification et correction terminées!')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

checkRolesTableStructure().catch(console.error)
