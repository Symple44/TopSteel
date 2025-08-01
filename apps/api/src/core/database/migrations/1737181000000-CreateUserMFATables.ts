import { QueryRunner } from 'typeorm'
import type { MigrationInterface } from 'typeorm'

export class CreateUserMFATables1737181000000 implements MigrationInterface {
  name = 'CreateUserMFATables1737181000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_mfa table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_mfa" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL DEFAULT 'totp',
                "isEnabled" boolean NOT NULL DEFAULT false,
                "isVerified" boolean NOT NULL DEFAULT false,
                "secret" character varying(255),
                "backupCodes" character varying(255),
                "phoneNumber" character varying(255),
                "email" character varying(255),
                "webauthnCredentials" jsonb,
                "metadata" jsonb,
                "lastUsedAt" TIMESTAMP,
                "verifiedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_mfa" PRIMARY KEY ("id")
            )
        `)

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_user_mfa_userId" ON "user_mfa" ("userId")`)
    await queryRunner.query(`CREATE INDEX "IDX_user_mfa_type" ON "user_mfa" ("type")`)
    await queryRunner.query(`CREATE INDEX "IDX_user_mfa_isEnabled" ON "user_mfa" ("isEnabled")`)
    await queryRunner.query(`CREATE INDEX "IDX_user_mfa_isVerified" ON "user_mfa" ("isVerified")`)
    await queryRunner.query(`CREATE INDEX "IDX_user_mfa_lastUsedAt" ON "user_mfa" ("lastUsedAt")`)

    // Create mfa_session table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mfa_session" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "sessionToken" character varying NOT NULL,
                "mfaType" character varying NOT NULL,
                "isVerified" boolean NOT NULL DEFAULT false,
                "isExpired" boolean NOT NULL DEFAULT false,
                "challenge" text,
                "challengeId" character varying,
                "challengeOptions" jsonb,
                "attempts" integer NOT NULL DEFAULT 0,
                "maxAttempts" integer NOT NULL DEFAULT 5,
                "ipAddress" character varying,
                "userAgent" text,
                "expiresAt" TIMESTAMP NOT NULL,
                "verifiedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_mfa_session" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_mfa_session_sessionToken" UNIQUE ("sessionToken")
            )
        `)

    // Create indexes for mfa_session
    await queryRunner.query(`CREATE INDEX "IDX_mfa_session_userId" ON "mfa_session" ("userId")`)
    await queryRunner.query(
      `CREATE INDEX "IDX_mfa_session_sessionToken" ON "mfa_session" ("sessionToken")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_mfa_session_expiresAt" ON "mfa_session" ("expiresAt")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_mfa_session_isVerified" ON "mfa_session" ("isVerified")`
    )

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "user_mfa" 
            ADD CONSTRAINT "FK_user_mfa_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "mfa_session" 
            ADD CONSTRAINT "FK_mfa_session_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    // Add enum constraint for user_mfa.type
    await queryRunner.query(`
            ALTER TABLE "user_mfa" 
            ADD CONSTRAINT "CHK_user_mfa_type" 
            CHECK ("type" IN ('totp', 'sms', 'email', 'webauthn'))
        `)

    // Add enum constraint for mfa_session.mfaType
    await queryRunner.query(`
            ALTER TABLE "mfa_session" 
            ADD CONSTRAINT "CHK_mfa_session_mfaType" 
            CHECK ("mfaType" IN ('totp', 'sms', 'email', 'webauthn'))
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(`ALTER TABLE "mfa_session" DROP CONSTRAINT "FK_mfa_session_userId"`)
    await queryRunner.query(`ALTER TABLE "user_mfa" DROP CONSTRAINT "FK_user_mfa_userId"`)

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_mfa_session_isVerified"`)
    await queryRunner.query(`DROP INDEX "IDX_mfa_session_expiresAt"`)
    await queryRunner.query(`DROP INDEX "IDX_mfa_session_sessionToken"`)
    await queryRunner.query(`DROP INDEX "IDX_mfa_session_userId"`)
    await queryRunner.query(`DROP INDEX "IDX_user_mfa_lastUsedAt"`)
    await queryRunner.query(`DROP INDEX "IDX_user_mfa_isVerified"`)
    await queryRunner.query(`DROP INDEX "IDX_user_mfa_isEnabled"`)
    await queryRunner.query(`DROP INDEX "IDX_user_mfa_type"`)
    await queryRunner.query(`DROP INDEX "IDX_user_mfa_userId"`)

    // Drop tables
    await queryRunner.query(`DROP TABLE "mfa_session"`)
    await queryRunner.query(`DROP TABLE "user_mfa"`)
  }
}
