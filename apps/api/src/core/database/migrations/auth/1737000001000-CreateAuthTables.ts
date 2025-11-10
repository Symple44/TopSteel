import { type MigrationInterface, type QueryRunner, Table } from 'typeorm'

export class CreateAuthTables1737000001000 implements MigrationInterface {
  name = 'CreateAuthTables1737000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Installer l'extension UUID
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // 1. Table users (base d'authentification)
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'prenom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'OPERATEUR'",
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'acronyme',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'dernier_login',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'refreshToken',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // 2. Table societes
    await queryRunner.createTable(
      new Table({
        name: 'societes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'siret',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'adresse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'telephone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL'],
            default: "'TRIAL'",
          },
          {
            name: 'plan',
            type: 'enum',
            enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'],
            default: "'STARTER'",
          },
          {
            name: 'database_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'max_users',
            type: 'integer',
            default: 5,
          },
          {
            name: 'max_sites',
            type: 'integer',
            default: 1,
          },
          {
            name: 'date_activation',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'date_expiration',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'configuration',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // 3. Table sites
    await queryRunner.createTable(
      new Table({
        name: 'sites',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['PRODUCTION', 'WAREHOUSE', 'OFFICE', 'MIXED'],
            default: "'PRODUCTION'",
          },
          {
            name: 'is_principal',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'adresse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'telephone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'responsable',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'configuration',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // 4. Table societe_users (liaison utilisateur-société)
    await queryRunner.createTable(
      new Table({
        name: 'societe_users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['OWNER', 'ADMIN', 'MANAGER', 'USER', 'VIEWER', 'GUEST'],
            default: "'USER'",
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'permissions',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'restricted_permissions',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'allowed_site_ids',
            type: 'uuid',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'date_debut',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'date_fin',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_activity_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // 5. Table shared_data_registry (registre des données partagées)
    await queryRunner.createTable(
      new Table({
        name: 'shared_data_registry',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'owner_societe_id',
            type: 'uuid',
          },
          {
            name: 'shared_with_societe_ids',
            type: 'uuid',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'MATERIAL',
              'PRODUCT_TEMPLATE',
              'PRICE_LIST',
              'SUPPLIER',
              'DOCUMENT_TEMPLATE',
              'PROCESS',
              'QUALITY_STANDARD',
              'OTHER',
            ],
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'share_scope',
            type: 'enum',
            enum: ['PRIVATE', 'GROUP', 'PUBLIC'],
            default: "'PRIVATE'",
          },
          {
            name: 'shared_entity_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'shared_entity_id',
            type: 'uuid',
          },
          {
            name: 'share_config',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'usage_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'search_data',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // Créer les index
    await queryRunner.query('CREATE INDEX IDX_users_email ON users (email)')
    await queryRunner.query('CREATE INDEX IDX_users_actif ON users (actif)')
    await queryRunner.query('CREATE INDEX IDX_societes_code ON societes (code)')
    await queryRunner.query('CREATE INDEX IDX_societes_status ON societes (status)')
    await queryRunner.query('CREATE INDEX IDX_sites_societe_id ON sites (societe_id)')
    await queryRunner.query('CREATE INDEX IDX_sites_code ON sites (code)')
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_societe_users_user_societe ON societe_users (user_id, societe_id)'
    )
    await queryRunner.query(
      'CREATE INDEX IDX_shared_data_type_owner ON shared_data_registry (type, owner_societe_id)'
    )

    // Créer les contraintes de clés étrangères
    await queryRunner.query(
      'ALTER TABLE sites ADD CONSTRAINT FK_sites_societe_id FOREIGN KEY (societe_id) REFERENCES societes(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE societe_users ADD CONSTRAINT FK_societe_users_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE societe_users ADD CONSTRAINT FK_societe_users_societe_id FOREIGN KEY (societe_id) REFERENCES societes(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE shared_data_registry ADD CONSTRAINT FK_shared_data_registry_owner_societe_id FOREIGN KEY (owner_societe_id) REFERENCES societes(id) ON DELETE CASCADE'
    )

    // 6. Table roles
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isSystemRole',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 7. Table permissions
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'module',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 8. Table role_permissions
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'role_id',
            type: 'uuid',
          },
          {
            name: 'permission_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 9. Table user_roles
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'role_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 10. Table groups
    await queryRunner.createTable(
      new Table({
        name: 'groups',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 11. Table user_groups
    await queryRunner.createTable(
      new Table({
        name: 'user_groups',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'group_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 12. Table user_sessions
    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'session_token',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 13. Table user_mfa
    await queryRunner.createTable(
      new Table({
        name: 'user_mfa',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'secret_key',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'backup_codes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // 14. Table mfa_session
    await queryRunner.createTable(
      new Table({
        name: 'mfa_session',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Index supplémentaires pour les nouvelles tables
    await queryRunner.query('CREATE INDEX IDX_roles_nom ON roles (nom)')
    await queryRunner.query('CREATE INDEX IDX_permissions_module ON permissions (module)')
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_role_permissions_unique ON role_permissions (role_id, permission_id)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_user_roles_unique ON user_roles (user_id, role_id)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_user_groups_unique ON user_groups (user_id, group_id)'
    )
    await queryRunner.query('CREATE INDEX IDX_user_sessions_token ON user_sessions (session_token)')
    await queryRunner.query('CREATE INDEX IDX_user_sessions_expires ON user_sessions (expires_at)')
    await queryRunner.query('CREATE UNIQUE INDEX IDX_user_mfa_user ON user_mfa (user_id)')
    await queryRunner.query('CREATE INDEX IDX_mfa_session_token ON mfa_session (token)')

    // Contraintes de clés étrangères supplémentaires
    await queryRunner.query(
      'ALTER TABLE role_permissions ADD CONSTRAINT FK_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE role_permissions ADD CONSTRAINT FK_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE user_roles ADD CONSTRAINT FK_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE user_roles ADD CONSTRAINT FK_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE user_groups ADD CONSTRAINT FK_user_groups_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE user_groups ADD CONSTRAINT FK_user_groups_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE user_sessions ADD CONSTRAINT FK_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE user_mfa ADD CONSTRAINT FK_user_mfa_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE mfa_session ADD CONSTRAINT FK_mfa_session_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    )

    // Activer l'extension UUID si pas déjà fait
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse
    await queryRunner.dropTable('mfa_session')
    await queryRunner.dropTable('user_mfa')
    await queryRunner.dropTable('user_sessions')
    await queryRunner.dropTable('user_groups')
    await queryRunner.dropTable('groups')
    await queryRunner.dropTable('user_roles')
    await queryRunner.dropTable('role_permissions')
    await queryRunner.dropTable('permissions')
    await queryRunner.dropTable('roles')
    await queryRunner.dropTable('shared_data_registry')
    await queryRunner.dropTable('societe_users')
    await queryRunner.dropTable('sites')
    await queryRunner.dropTable('societes')
    await queryRunner.dropTable('users')
  }
}
