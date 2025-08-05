import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function runMigration() {
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

    console.log('🔧 Exécution de la migration de correction MFA et Sessions...\n')

    // 1. Correction de la table user_mfa
    console.log('📝 Étape 1: Correction de la table user_mfa')
    try {
      await dataSource.query(`DROP TABLE IF EXISTS user_mfa CASCADE`)
      await dataSource.query(`
        CREATE TABLE user_mfa (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          type VARCHAR(50) NOT NULL,
          is_enabled BOOLEAN NOT NULL DEFAULT true,
          is_verified BOOLEAN NOT NULL DEFAULT false,
          secret VARCHAR(255),
          backup_codes JSONB,
          phone_number VARCHAR(50),
          email VARCHAR(255),
          webauthn_credentials JSONB,
          metadata JSONB DEFAULT '{}',
          last_used_at TIMESTAMP,
          verified_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_user_mfa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
      await dataSource.query(`CREATE INDEX idx_user_mfa_user_id ON user_mfa(user_id)`)
      await dataSource.query(`CREATE INDEX idx_user_mfa_type ON user_mfa(type)`)
      await dataSource.query(
        `CREATE INDEX idx_user_mfa_enabled_verified ON user_mfa(is_enabled, is_verified)`
      )
      console.log('   ✅ Table user_mfa créée avec la colonne type')
    } catch (error: any) {
      console.error('   ❌ Erreur lors de la création de user_mfa:', error.message)
    }

    // 2. Correction des colonnes JWT
    console.log('\n📝 Étape 2: Correction des colonnes JWT dans user_sessions')
    try {
      await dataSource.query(`
        ALTER TABLE user_sessions 
          ALTER COLUMN "accessToken" TYPE TEXT,
          ALTER COLUMN "refreshToken" TYPE TEXT
      `)
      console.log('   ✅ Colonnes accessToken et refreshToken converties en TEXT')
    } catch (error: any) {
      console.error('   ❌ Erreur lors de la modification des colonnes:', error.message)
    }

    // 3. Création de mfa_session
    console.log('\n📝 Étape 3: Création de la table mfa_session')
    try {
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS mfa_session (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          session_token VARCHAR(255) NOT NULL UNIQUE,
          mfa_type VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          attempts JSONB DEFAULT '[]',
          ip_address VARCHAR(255),
          user_agent TEXT,
          metadata JSONB DEFAULT '{}',
          expires_at TIMESTAMP NOT NULL,
          verified_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_mfa_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
      await dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_mfa_session_user_id ON mfa_session(user_id)`
      )
      await dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_mfa_session_token ON mfa_session(session_token)`
      )
      console.log('   ✅ Table mfa_session créée')
    } catch (error: any) {
      console.error('   ❌ Erreur lors de la création de mfa_session:', error.message)
    }

    // 4. Vérification finale
    console.log('\n🔍 Vérification de la structure finale:')

    // Vérifier user_mfa
    const mfaCheck = await dataSource.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_mfa' AND column_name = 'type'
    `)
    console.log(
      `   - Colonne 'type' dans user_mfa: ${mfaCheck.length > 0 ? '✅ Présente' : '❌ Manquante'}`
    )

    // Vérifier user_sessions
    const tokenCheck = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions' 
      AND column_name IN ('accessToken', 'refreshToken')
    `)
    tokenCheck.forEach((col: any) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type === 'text' ? '✅ TEXT' : '❌ ' + col.data_type}`
      )
    })

    console.log('\n✅ Migration terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

runMigration().catch(console.error)
