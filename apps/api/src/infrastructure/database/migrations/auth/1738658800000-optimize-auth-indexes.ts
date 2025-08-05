import type { MigrationInterface, QueryRunner } from 'typeorm'

export class OptimizeAuthIndexes1738658800000 implements MigrationInterface {
  name = 'OptimizeAuthIndexes1738658800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Critical performance indexes for authentication

    // 1. User sessions optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_session_user_active" 
      ON "user_sessions" ("sessionId", "userId", "isActive") 
      WHERE "isActive" = true
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_last_activity" 
      ON "user_sessions" ("lastActivity") 
      WHERE "status" = 'active'
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_expires_cleanup" 
      ON "user_sessions" ("expiresAt") 
      WHERE "isActive" = true
    `)

    // 2. User société roles optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_societe_roles_user_active" 
      ON "user_societe_roles" ("userId", "isActive") 
      WHERE "isActive" = true
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_societe_roles_societe_active" 
      ON "user_societe_roles" ("societeId", "isActive") 
      WHERE "isActive" = true
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_societe_roles_expires" 
      ON "user_societe_roles" ("expiresAt") 
      WHERE "expiresAt" IS NOT NULL
    `)

    // 3. Users table optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email_active" 
      ON "users" ("email", "actif") 
      WHERE "actif" = true
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_acronyme_active" 
      ON "users" ("acronyme", "actif") 
      WHERE "actif" = true AND "acronyme" IS NOT NULL
    `)

    // 4. Role and permission optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_role_permissions_role" 
      ON "role_permissions" ("roleId", "isActive") 
      WHERE "isActive" = true
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_permissions_code_active" 
      ON "permissions" ("code", "isActive") 
      WHERE "isActive" = true
    `)

    // 5. MFA optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_mfa_user_active" 
      ON "user_mfa" ("userId", "isActive") 
      WHERE "isActive" = true
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_mfa_sessions_expires" 
      ON "mfa_sessions" ("expiresAt") 
      WHERE "isCompleted" = false
    `)

    // 6. Composite index for complete authentication flow
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_complete_auth" 
      ON "users" ("email", "role", "actif", "dernier_login") 
      WHERE "actif" = true
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    const indexes = [
      'idx_users_complete_auth',
      'idx_mfa_sessions_expires',
      'idx_user_mfa_user_active',
      'idx_permissions_code_active',
      'idx_role_permissions_role',
      'idx_users_acronyme_active',
      'idx_users_email_active',
      'idx_user_societe_roles_expires',
      'idx_user_societe_roles_societe_active',
      'idx_user_societe_roles_user_active',
      'idx_user_sessions_expires_cleanup',
      'idx_user_sessions_last_activity',
      'idx_user_sessions_session_user_active',
    ]

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${index}"`)
    }
  }
}
