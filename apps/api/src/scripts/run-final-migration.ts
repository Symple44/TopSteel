import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function runFinalMigration() {
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

    console.log('🔧 Ajout de toutes les colonnes deleted_at manquantes...\n')

    const tables = [
      'roles',
      'permissions',
      'role_permissions',
      'users',
      'user_sessions',
      'user_societe_roles',
      'societe_users',
      'societes',
      'sites',
      'groupes',
      'group_roles',
      'user_groups',
      'parameter_system',
      'user_mfa',
      'mfa_session',
      'webauthn_credential',
    ]

    let addedCount = 0
    let existingCount = 0

    for (const table of tables) {
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
          // Vérifier si deleted_at existe déjà
          const columnExists = await dataSource.query(
            `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 
              AND column_name = 'deleted_at'
            )
          `,
            [table]
          )

          if (columnExists[0].exists) {
            console.log(`   ℹ️  ${table}: deleted_at existe déjà`)
            existingCount++
          } else {
            await dataSource.query(`
              ALTER TABLE ${table} 
              ADD COLUMN deleted_at TIMESTAMP NULL
            `)
            console.log(`   ✅ ${table}: deleted_at ajoutée`)
            addedCount++
          }
        } else {
          console.log(`   ⚠️  ${table}: table n'existe pas`)
        }
      } catch (error: any) {
        console.error(`   ❌ ${table}: ${error.message}`)
      }
    }

    console.log(`\n📊 Résumé:`)
    console.log(`   - ${addedCount} colonnes ajoutées`)
    console.log(`   - ${existingCount} colonnes existantes`)
    console.log(`\n✅ Migration terminée!`)
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

runFinalMigration().catch(console.error)
