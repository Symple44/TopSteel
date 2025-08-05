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
    console.log('✅ Connecté à la base de données\n')

    // 1. Vérifier la structure de la table role
    console.log('📊 Vérification de la table role:')
    const roleColumns = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'role'
      ORDER BY ordinal_position
    `)

    if (roleColumns.length === 0) {
      console.log("   ❌ La table role n'existe pas!")

      // Vérifier si c'est plutôt "roles"
      const rolesColumns = await dataSource.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'roles'
        ORDER BY ordinal_position
      `)

      if (rolesColumns.length > 0) {
        console.log('   ℹ️  La table s\'appelle "roles" (avec un s)')
        rolesColumns.forEach((col: any) => {
          console.log(`   - ${col.column_name}: ${col.data_type}`)
        })
      }
    } else {
      roleColumns.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
    }

    // 2. Ajouter la colonne deleted_at si elle n'existe pas
    console.log('\n🔧 Ajout de la colonne deleted_at...')

    // Essayer sur "role" d'abord
    try {
      await dataSource.query(`
        ALTER TABLE role 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `)
      console.log('   ✅ Colonne deleted_at ajoutée à la table role')
    } catch (error: any) {
      console.log('   ❌ Erreur sur table role:', error.message)

      // Essayer sur "roles"
      try {
        await dataSource.query(`
          ALTER TABLE roles 
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
        `)
        console.log('   ✅ Colonne deleted_at ajoutée à la table roles')
      } catch (error2: any) {
        console.log('   ❌ Erreur sur table roles:', error2.message)
      }
    }

    // 3. Vérifier toutes les tables qui pourraient avoir besoin de deleted_at
    console.log('\n🔍 Vérification des autres tables pour soft delete:')
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
          console.log(`   ✅ Colonne deleted_at ajoutée à ${table}`)
        } else {
          console.log(`   ℹ️  ${table} a déjà deleted_at`)
        }
      } catch (error: any) {
        console.log(`   ⚠️  ${table}: ${error.message}`)
      }
    }

    console.log('\n✅ Correction terminée!')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

fixRoleDeletedAt().catch(console.error)
