import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkDatabaseStructure() {
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

    // 1. Vérifier la table user_mfa
    console.log('📊 Structure de la table user_mfa:')
    const mfaColumns = await dataSource.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_mfa'
      ORDER BY ordinal_position
    `)

    if (mfaColumns.length === 0) {
      console.log("   ❌ La table user_mfa n'existe pas!")
    } else {
      mfaColumns.forEach((col: any) => {
        console.log(
          `   - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`
        )
      })
    }

    // 2. Vérifier la table user_sessions
    console.log('\n📊 Structure de la table user_sessions:')
    const sessionColumns = await dataSource.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_sessions'
      ORDER BY ordinal_position
    `)

    sessionColumns.forEach((col: any) => {
      if (col.column_name === 'accessToken' || col.column_name === 'refreshToken') {
        console.log(
          `   ⚠️  ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} - TROP COURT POUR JWT`
        )
      } else {
        console.log(
          `   - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`
        )
      }
    })

    // 3. Vérifier les tables MFA
    console.log('\n📊 Tables liées à MFA:')
    const mfaTables = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE '%mfa%'
      ORDER BY table_name
    `)

    mfaTables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`)
    })
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

checkDatabaseStructure().catch(console.error)
