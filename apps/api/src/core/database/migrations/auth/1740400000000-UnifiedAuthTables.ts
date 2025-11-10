import { type MigrationInterface, type QueryRunner } from 'typeorm'

/**
 * Migration unifiée qui crée toutes les tables AUTH dans le bon ordre
 * Cette migration remplace et corrige toutes les migrations précédentes
 */
export class UnifiedAuthTables1740400000000 implements MigrationInterface {
  name = 'UnifiedAuthTables1740400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si les tables existent déjà
    const tablesExist = await queryRunner.hasTable('users')
    if (tablesExist) {
      console.log('✅ Tables already exist, skipping creation')
      return
    }

    console.log('🔄 Creating all AUTH tables...')

    // 1. Extension UUID
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // 2. Table users (base)
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "nom" varchar(255) NOT NULL,
        "prenom" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "role" varchar(50) DEFAULT 'OPERATEUR',
        "actif" boolean DEFAULT true,
        "acronyme" varchar(10),
        "dernier_login" timestamp,
        "version" integer DEFAULT 1,
        "refreshToken" varchar(500),
        "metadata" jsonb,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamp
      )
    `)

    // 3. Table societes
    await queryRunner.query(`
      CREATE TABLE "societes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "nom" varchar(255) NOT NULL,
        "code" varchar(50) NOT NULL UNIQUE,
        "siret" varchar(20),
        "adresse" text,
        "telephone" varchar(20),
        "email" varchar(255),
        "status" varchar(50) DEFAULT 'TRIAL',
        "plan" varchar(50) DEFAULT 'STARTER',
        "database_name" varchar(100) NOT NULL,
        "max_users" integer DEFAULT 5,
        "max_sites" integer DEFAULT 1,
        "date_activation" date,
        "date_expiration" date,
        "configuration" jsonb DEFAULT '{}',
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamp,
        "version" integer DEFAULT 1,
        "created_by_id" uuid,
        "updated_by_id" uuid
      )
    `)

    // 4. Table sites
    await queryRunner.query(`
      CREATE TABLE "sites" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "societe_id" uuid NOT NULL REFERENCES societes(id) ON DELETE CASCADE,
        "nom" varchar(255) NOT NULL,
        "code" varchar(50) NOT NULL,
        "adresse" text,
        "actif" boolean DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamp
      )
    `)

    // 5. Table societe_users (lien users-societes)
    await queryRunner.query(`
      CREATE TABLE "societe_users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "societe_id" uuid NOT NULL REFERENCES societes(id) ON DELETE CASCADE,
        "role" varchar(50) DEFAULT 'OPERATEUR',
        "actif" boolean DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "societe_id")
      )
    `)

    // 6. Table roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(100) NOT NULL UNIQUE,
        "nom" varchar(255) NOT NULL,
        "description" text,
        "niveau" integer DEFAULT 0,
        "isSystem" boolean DEFAULT false,
        "isActive" boolean DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamp
      )
    `)

    // 7. Table permissions
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(100) NOT NULL UNIQUE,
        "nom" varchar(255) NOT NULL,
        "description" text,
        "module" varchar(100),
        "resource" varchar(100),
        "action" varchar(50),
        "isActive" boolean DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 8. Table role_permissions
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "role_id" uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        "permission_id" uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("role_id", "permission_id")
      )
    `)

    // 9. Table user_roles
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "role_id" uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "role_id")
      )
    `)

    // 10. Table user_societe_roles
    await queryRunner.query(`
      CREATE TABLE "user_societe_roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "societe_id" uuid NOT NULL REFERENCES societes(id) ON DELETE CASCADE,
        "role_id" uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "societe_id", "role_id")
      )
    `)

    // 11. Table user_sessions
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "sessionId" varchar(500) NOT NULL UNIQUE,
        "accessToken" text NOT NULL,
        "refreshToken" text,
        "loginTime" timestamp NOT NULL,
        "logoutTime" timestamp,
        "lastActivity" timestamp NOT NULL,
        "ipAddress" varchar(255),
        "userAgent" text,
        "deviceInfo" jsonb,
        "location" jsonb,
        "isActive" boolean DEFAULT true NOT NULL,
        "isIdle" boolean DEFAULT false NOT NULL,
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "warningCount" integer DEFAULT 0 NOT NULL,
        "forcedLogoutBy" uuid REFERENCES users(id) ON DELETE SET NULL,
        "forcedLogoutReason" text,
        "metadata" jsonb,
        "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)

    // 12. Table user_mfa
    await queryRunner.query(`
      CREATE TABLE "user_mfa" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "method" varchar(50) NOT NULL,
        "secret" text,
        "enabled" boolean DEFAULT false,
        "phone" varchar(20),
        "backup_codes" jsonb,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "method")
      )
    `)

    // 13. Table parameters_system
    await queryRunner.query(`
      CREATE TABLE "parameters_system" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group" varchar(100) NOT NULL,
        "key" varchar(100) NOT NULL,
        "value" text,
        "type" varchar(50) DEFAULT 'string',
        "scope" varchar(50) DEFAULT 'SYSTEM',
        "description" text,
        "metadata" jsonb,
        "arrayValues" jsonb,
        "objectValues" jsonb,
        "isActive" boolean DEFAULT true,
        "isReadonly" boolean DEFAULT false,
        "translationKey" varchar(255),
        "customTranslations" jsonb,
        "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("group", "key")
      )
    `)

    // 14. Table user_settings
    await queryRunner.query(`
      CREATE TABLE "user_settings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "key" varchar(255) NOT NULL,
        "value" jsonb,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "key")
      )
    `)

    // 15. Table menu_items
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(100) NOT NULL UNIQUE,
        "label" varchar(255) NOT NULL,
        "parent_id" uuid REFERENCES menu_items(id) ON DELETE CASCADE,
        "route" varchar(500),
        "icon" varchar(100),
        "order_index" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "required_permission" varchar(100),
        "metadata" jsonb,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 16. Indexes
    await queryRunner.query('CREATE INDEX "IDX_users_email" ON users(email)')
    await queryRunner.query('CREATE INDEX "IDX_societes_code" ON societes(code)')
    await queryRunner.query('CREATE INDEX "IDX_sites_societe_id" ON sites(societe_id)')
    await queryRunner.query(
      'CREATE INDEX "IDX_user_sessions_userId" ON user_sessions("userId")'
    )
    await queryRunner.query(
      'CREATE INDEX "IDX_user_sessions_status" ON user_sessions(status)'
    )
    await queryRunner.query('CREATE INDEX "IDX_parameters_group_key" ON parameters_system("group", "key")')

    console.log('✅ All AUTH tables created successfully!')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer toutes les tables dans l'ordre inverse
    const tables = [
      'menu_items',
      'user_settings',
      'parameters_system',
      'user_mfa',
      'user_sessions',
      'user_societe_roles',
      'user_roles',
      'role_permissions',
      'permissions',
      'roles',
      'societe_users',
      'sites',
      'societes',
      'users',
    ]

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`)
    }

    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"')
  }
}
