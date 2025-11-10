import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AlignUserSessionsTable1738701000000 implements MigrationInterface {
  name = 'AlignUserSessionsTable1738701000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Check if table exists first
    const tableExists = await queryRunner.hasTable('user_sessions')

    let existingSessions = []
    if (tableExists) {
      // Sauvegarder les données existantes si nécessaire
      existingSessions = await queryRunner.query(`SELECT * FROM user_sessions`)

      if (existingSessions.length > 0) {
        // Créer une table temporaire pour sauvegarder les données
        await queryRunner.query(`
          CREATE TABLE user_sessions_backup AS
          SELECT * FROM user_sessions
        `)
      }
    }

    // 2. Supprimer les index existants
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_status"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "user_sessions_expires_at_idx"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "user_sessions_session_token_idx"`)

    // 3. Supprimer la table existante
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`)

    // 4. Créer la nouvelle table avec la structure correcte
    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "userId" UUID NOT NULL,
        "sessionId" VARCHAR(500) NOT NULL UNIQUE,
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT,
        "loginTime" TIMESTAMP NOT NULL,
        "logoutTime" TIMESTAMP,
        "lastActivity" TIMESTAMP NOT NULL,
        "ipAddress" VARCHAR(255),
        "userAgent" TEXT,
        "deviceInfo" JSONB,
        "location" JSONB,
        "isActive" BOOLEAN DEFAULT true NOT NULL,
        "isIdle" BOOLEAN DEFAULT false NOT NULL,
        "status" VARCHAR(50) DEFAULT 'active' NOT NULL,
        "warningCount" INTEGER DEFAULT 0 NOT NULL,
        "forcedLogoutBy" UUID,
        "forcedLogoutReason" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)

    // 5. Créer les index
    await queryRunner.query(`CREATE INDEX "IDX_user_sessions_userId" ON user_sessions ("userId")`)
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_sessionId" ON user_sessions ("sessionId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_loginTime" ON user_sessions ("loginTime")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_lastActivity" ON user_sessions ("lastActivity")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_isActive" ON user_sessions ("isActive")`
    )
    await queryRunner.query(`CREATE INDEX "IDX_user_sessions_status" ON user_sessions ("status")`)

    // 6. Créer les contraintes de clés étrangères
    await queryRunner.query(`
      ALTER TABLE user_sessions 
      ADD CONSTRAINT "FK_user_sessions_userId" 
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE user_sessions 
      ADD CONSTRAINT "FK_user_sessions_forcedLogoutBy" 
      FOREIGN KEY ("forcedLogoutBy") REFERENCES users(id) ON DELETE SET NULL
    `)

    // 7. Créer un trigger pour updatedAt
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_user_sessions_updated_at_trigger
      BEFORE UPDATE ON user_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_user_sessions_updated_at();
    `)

    // 8. Restaurer les données si nécessaire (avec mapping des colonnes)
    if (existingSessions.length > 0) {
      for (const session of existingSessions) {
        await queryRunner.query(
          `
          INSERT INTO user_sessions (
            id,
            "userId",
            "sessionId",
            "accessToken",
            "loginTime",
            "lastActivity",
            "ipAddress",
            "userAgent",
            "status",
            "createdAt"
          ) VALUES (
            $1, $2, $3, $3, $5, $5, $6, $7, $8, $9
          )
        `,
          [
            session.id,
            session.user_id,
            session.session_token, // session_token devient sessionId ET accessToken
            session.session_token,
            session.created_at,
            session.created_at, // lastActivity = created_at initialement
            session.ip_address,
            session.user_agent,
            session.status || 'active',
            session.created_at,
          ]
        )
      }

      // Supprimer la table de sauvegarde
      await queryRunner.query(`DROP TABLE IF EXISTS user_sessions_backup`)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Sauvegarder les données actuelles
    const currentSessions = await queryRunner.query(`SELECT * FROM user_sessions`)

    // 2. Supprimer les contraintes et triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_user_sessions_updated_at_trigger ON user_sessions`
    )
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_user_sessions_updated_at()`)
    await queryRunner.query(
      `ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS "FK_user_sessions_userId"`
    )
    await queryRunner.query(
      `ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS "FK_user_sessions_forcedLogoutBy"`
    )

    // 3. Supprimer les index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_userId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_sessionId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_loginTime"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_lastActivity"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_isActive"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_status"`)

    // 4. Supprimer la table
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`)

    // 5. Recréer l'ancienne structure
    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        session_token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'active'
      )
    `)

    // 6. Recréer les anciens index
    await queryRunner.query(`CREATE INDEX "IDX_user_sessions_status" ON user_sessions (status)`)
    await queryRunner.query(
      `CREATE INDEX "user_sessions_expires_at_idx" ON user_sessions (expires_at)`
    )
    await queryRunner.query(
      `CREATE INDEX "user_sessions_session_token_idx" ON user_sessions (session_token)`
    )

    // 7. Restaurer les données avec l'ancien format
    if (currentSessions.length > 0) {
      for (const session of currentSessions) {
        // Calculer expires_at (24h après loginTime)
        const expiresAt = new Date(session.loginTime)
        expiresAt.setHours(expiresAt.getHours() + 24)

        await queryRunner.query(
          `
          INSERT INTO user_sessions (
            id,
            user_id,
            session_token,
            expires_at,
            ip_address,
            user_agent,
            created_at,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            session.id,
            session.userId,
            session.sessionId,
            expiresAt,
            session.ipAddress,
            session.userAgent,
            session.createdAt,
            session.status,
          ]
        )
      }
    }
  }
}
