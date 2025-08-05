import type { MigrationInterface, QueryRunner } from 'typeorm'

export class FixMfaAndSessions1754419500000 implements MigrationInterface {
  name = 'FixMfaAndSessions1754419500000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Correction de la structure MFA et Sessions...')

    // 1. Créer la table user_mfa correcte si elle n'existe pas dans le bon format
    await queryRunner.query(`
      -- Supprimer l'ancienne table user_mfa si elle existe
      DROP TABLE IF EXISTS user_mfa CASCADE;

      -- Créer la nouvelle structure user_mfa
      CREATE TABLE user_mfa (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL, -- TOTP, SMS, EMAIL, WEBAUTHN
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
      );

      -- Index pour les requêtes fréquentes
      CREATE INDEX idx_user_mfa_user_id ON user_mfa(user_id);
      CREATE INDEX idx_user_mfa_type ON user_mfa(type);
      CREATE INDEX idx_user_mfa_enabled_verified ON user_mfa(is_enabled, is_verified);
    `)

    // 2. Corriger les colonnes JWT dans user_sessions (varchar(255) → text)
    await queryRunner.query(`
      -- Modifier les colonnes pour supporter les longs tokens JWT
      ALTER TABLE user_sessions 
        ALTER COLUMN "accessToken" TYPE TEXT,
        ALTER COLUMN "refreshToken" TYPE TEXT;
    `)

    // 3. Créer la table mfa_session si elle n'existe pas
    await queryRunner.query(`
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
      );

      -- Index pour les requêtes
      CREATE INDEX IF NOT EXISTS idx_mfa_session_user_id ON mfa_session(user_id);
      CREATE INDEX IF NOT EXISTS idx_mfa_session_token ON mfa_session(session_token);
      CREATE INDEX IF NOT EXISTS idx_mfa_session_status ON mfa_session(status);
      CREATE INDEX IF NOT EXISTS idx_mfa_session_expires ON mfa_session(expires_at);
    `)

    // 4. Ajouter les colonnes manquantes pour WebAuthn si nécessaire
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS webauthn_credential (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_mfa_id UUID NOT NULL,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL DEFAULT 0,
        device_type VARCHAR(100),
        device_name VARCHAR(255),
        transports JSONB,
        backed_up BOOLEAN DEFAULT false,
        authenticator_attachment VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        last_used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_webauthn_user_mfa FOREIGN KEY (user_mfa_id) REFERENCES user_mfa(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credential(credential_id);
      CREATE INDEX IF NOT EXISTS idx_webauthn_user_mfa_id ON webauthn_credential(user_mfa_id);
    `)

    console.log('✅ Structure MFA et Sessions corrigée')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurer les colonnes varchar(255) pour les tokens
    await queryRunner.query(`
      ALTER TABLE user_sessions 
        ALTER COLUMN "accessToken" TYPE VARCHAR(255),
        ALTER COLUMN "refreshToken" TYPE VARCHAR(255);
    `)

    // Supprimer les tables créées
    await queryRunner.query(`DROP TABLE IF EXISTS webauthn_credential CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS mfa_session CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS user_mfa CASCADE`)

    // Recréer l'ancienne structure user_mfa
    await queryRunner.query(`
      CREATE TABLE user_mfa (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL,
        secret_key VARCHAR(255) NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        backup_codes JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_mfa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)
  }
}
