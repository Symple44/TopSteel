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
    console.log('✅ Connecté à la base de données SHARED\n')

    // 1. Vérifier la structure de la table societe
    console.log('📊 Vérification de la table societe dans SHARED:')
    const societeColumns = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'societe'
      ORDER BY ordinal_position
    `)

    if (societeColumns.length === 0) {
      console.log("   ❌ La table societe n'existe pas dans SHARED!")

      // Essayer avec 's'
      const societesColumns = await dataSource.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'societes'
        ORDER BY ordinal_position
      `)

      if (societesColumns.length > 0) {
        console.log('   ℹ️  La table s\'appelle "societes"')
        societesColumns.forEach((col: any) => {
          console.log(`   - ${col.column_name}: ${col.data_type}`)
        })
      }
    } else {
      societeColumns.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
    }

    // 2. Ajouter deleted_at si nécessaire
    console.log('\n🔧 Ajout de deleted_at...')

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
            console.log(`   ℹ️  ${table} a déjà deleted_at`)
          } else {
            await dataSource.query(`
              ALTER TABLE ${table} 
              ADD COLUMN deleted_at TIMESTAMP NULL
            `)
            console.log(`   ✅ Colonne deleted_at ajoutée à ${table}`)
          }
        } else {
          console.log(`   ⚠️  Table ${table} n'existe pas`)
        }
      } catch (error: any) {
        console.log(`   ❌ ${table}: ${error.message}`)
      }
    }

    console.log('\n✅ Correction terminée!')
  } catch (error) {
    console.error('❌ Erreur:', error)
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
    console.log('\n✅ Connecté à la base de données AUTH\n')

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
            console.log(`   ℹ️  ${table} a déjà deleted_at (AUTH)`)
          } else {
            await dataSource.query(`
              ALTER TABLE ${table} 
              ADD COLUMN deleted_at TIMESTAMP NULL
            `)
            console.log(`   ✅ Colonne deleted_at ajoutée à ${table} (AUTH)`)
          }
        }
      } catch (error: any) {
        console.log(`   ⚠️  ${table}: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Erreur AUTH:', error)
  } finally {
    await dataSource.destroy()
  }
}

// Exécuter les deux corrections
async function runFix() {
  console.log('🔧 Correction des colonnes deleted_at pour societe...\n')
  await fixSocieteDeletedAt()
  await fixAuthTables()
  console.log('\n✅ Toutes les corrections sont terminées!')
}

runFix().catch(console.error)
