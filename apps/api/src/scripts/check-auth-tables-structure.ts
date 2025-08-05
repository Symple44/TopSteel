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
    console.log('✅ Connecté à la base de données AUTH\n')

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

    console.log('📊 Vérification de la présence de deleted_at dans les tables:\n')

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
            console.log(`✅ ${table}: deleted_at existe`)
          } else {
            console.log(`❌ ${table}: deleted_at MANQUANTE`)

            // Afficher la structure actuelle
            console.log(`   Structure actuelle:`)
            columns.slice(0, 5).forEach((col: any) => {
              console.log(`   - ${col.column_name}: ${col.data_type}`)
            })
            console.log(`   ... (${columns.length} colonnes au total)`)
          }
        } else {
          console.log(`⚠️  ${table}: table n'existe pas`)
        }
      } catch (error: any) {
        console.error(`❌ Erreur pour ${table}: ${error.message}`)
      }
    }

    // Ajouter deleted_at aux tables qui n'en ont pas
    console.log('\n🔧 Ajout de deleted_at aux tables manquantes...\n')

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
            console.log(`   ✅ Colonne deleted_at ajoutée à ${table}`)
          }
        }
      } catch (error: any) {
        console.error(`   ❌ Erreur pour ${table}: ${error.message}`)
      }
    }

    console.log('\n✅ Vérification et correction terminées!')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

checkAuthTablesStructure().catch(console.error)
