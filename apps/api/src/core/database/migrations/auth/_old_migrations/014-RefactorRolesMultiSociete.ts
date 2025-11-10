import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm'

export class RefactorRolesMultiSociete1737500000014 implements MigrationInterface {
  name = 'RefactorRolesMultiSociete1737500000014'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roleTypes = [
      {
        key: 'SUPER_ADMIN',
        value: 'Super Administrateur',
        description: 'Accès complet à tous les systèmes et sociétés',
      },
      {
        key: 'ADMIN',
        value: 'Administrateur',
        description: 'Accès administratif complet à une société',
      },
      { key: 'MANAGER', value: 'Manager', description: 'Gestion business et équipes' },
      { key: 'COMMERCIAL', value: 'Commercial', description: 'Gestion des ventes et clients' },
      { key: 'TECHNICIEN', value: 'Technicien', description: 'Production et aspects techniques' },
      { key: 'OPERATEUR', value: 'Opérateur', description: 'Accès limité à la production' },
    ]

    for (const roleType of roleTypes) {
      // Vérifier d'abord si l'entrée existe déjà
      const existing = await queryRunner.query(
        `
          SELECT id FROM parameters_system 
          WHERE "group" = 'user_roles' AND "key" = $1
        `,
        [roleType.key]
      )

      if (existing.length === 0) {
        await queryRunner.query(
          `
            INSERT INTO parameters_system ("group", "key", "value", "type", "description", "scope", "isActive")
            VALUES ('user_roles', $1, $2, 'STRING', $3, 'AUTH', true)
          `,
          [roleType.key, roleType.value, roleType.description]
        )
      }
    }

    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS migration_backup_roles AS 
        SELECT * FROM roles
      `)

    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS migration_backup_societe_users AS 
        SELECT * FROM societe_users
      `)

    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS migration_backup_user_roles AS 
        SELECT * FROM user_roles
      `)

    // Ajouter les nouvelles colonnes à la table roles
    await queryRunner.query(`
        ALTER TABLE roles 
        ADD COLUMN IF NOT EXISTS societe_id UUID REFERENCES societes(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS parent_role_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'
      `)

    await queryRunner.query(`
        ALTER TABLE permissions 
        ADD COLUMN IF NOT EXISTS societe_id UUID REFERENCES societes(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
      `)

    await queryRunner.createTable(
      new Table({
        name: 'user_societe_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Référence vers un rôle spécifique, null = utiliser le rôle par défaut',
          },
          {
            name: 'role_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Type de rôle (référence vers parameters_system.user_roles)',
          },
          {
            name: 'is_default_societe',
            type: 'boolean',
            default: false,
            comment: 'Société par défaut pour cet utilisateur',
          },
          {
            name: 'additional_permissions',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Permissions supplémentaires accordées',
          },
          {
            name: 'restricted_permissions',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Permissions retirées pour cet utilisateur',
          },
          {
            name: 'allowed_site_ids',
            type: 'uuid',
            isArray: true,
            isNullable: true,
            comment: 'Sites autorisés pour cet utilisateur dans cette société',
          },
          {
            name: 'granted_by_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Utilisateur qui a accordé ce rôle',
          },
          {
            name: 'granted_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
            comment: "Date d'expiration du rôle",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Métadonnées additionnelles',
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
      })
    )

    // Contraintes de clés étrangères
    await queryRunner.createForeignKey(
      'user_societe_roles',
      new TableForeignKey({
        name: 'FK_user_societe_roles_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'user_societe_roles',
      new TableForeignKey({
        name: 'FK_user_societe_roles_societe',
        columnNames: ['societe_id'],
        referencedTableName: 'societes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'user_societe_roles',
      new TableForeignKey({
        name: 'FK_user_societe_roles_role',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    )

    await queryRunner.createForeignKey(
      'user_societe_roles',
      new TableForeignKey({
        name: 'FK_user_societe_roles_granted_by',
        columnNames: ['granted_by_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    )

    // Index pour les performances
    await queryRunner.createIndex(
      'user_societe_roles',
      new TableIndex({
        name: 'IDX_user_societe_roles_user_societe',
        columnNames: ['user_id', 'societe_id'],
      })
    )

    await queryRunner.createIndex(
      'user_societe_roles',
      new TableIndex({
        name: 'IDX_user_societe_roles_user_default',
        columnNames: ['user_id', 'is_default_societe'],
        isUnique: false,
      })
    )

    await queryRunner.createIndex(
      'user_societe_roles',
      new TableIndex({
        name: 'IDX_user_societe_roles_role_type',
        columnNames: ['role_type'],
      })
    )

    await queryRunner.createIndex(
      'user_societe_roles',
      new TableIndex({
        name: 'IDX_user_societe_roles_active',
        columnNames: ['is_active'],
      })
    )

    // Contrainte unique pour éviter les doublons
    await queryRunner.query(`
        CREATE UNIQUE INDEX IDX_user_societe_roles_unique 
        ON user_societe_roles (user_id, societe_id) 
        WHERE is_active = true
      `)

    // Contrainte pour s'assurer qu'un utilisateur n'a qu'une seule société par défaut
    await queryRunner.query(`
        CREATE UNIQUE INDEX IDX_user_default_societe_unique 
        ON user_societe_roles (user_id) 
        WHERE is_default_societe = true AND is_active = true
      `)
    const _columns = await queryRunner.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'societe_users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `)

    // Vérifier s'il y a des données
    const dataCount = await queryRunner.query('SELECT COUNT(*) as count FROM societe_users')

    if (dataCount[0].count === '0') {
      // Passer à l'étape suivante
    } else {
      // Migrer les données de societe_users vers user_societe_roles
      // Utiliser les vrais noms de colonnes de la base (camelCase)
      await queryRunner.query(`
        INSERT INTO user_societe_roles (
          user_id, 
          societe_id, 
          role_type, 
          is_default_societe,
          additional_permissions,
          restricted_permissions,
          allowed_site_ids,
          granted_at,
          is_active,
          created_at,
          updated_at
        )
        SELECT 
          su."userId",
          su."societeId",
          -- Mapper les anciens rôles vers les nouveaux types
          CASE 
            WHEN su.role = 'OWNER' THEN 'ADMIN'
            WHEN su.role = 'ADMIN' THEN 'ADMIN'
            WHEN su.role = 'MANAGER' THEN 'MANAGER'
            WHEN su.role = 'USER' THEN 'OPERATEUR'
            WHEN su.role = 'VIEWER' THEN 'OPERATEUR'
            WHEN su.role = 'GUEST' THEN 'OPERATEUR'
            ELSE 'OPERATEUR'
          END as role_type,
          su."isDefault",
          COALESCE(su.permissions, '[]'::jsonb),
          COALESCE(su."restrictedPermissions", '[]'::jsonb),
          su."allowedSiteIds",
          COALESCE(su.created_at, CURRENT_TIMESTAMP),
          su.actif,
          COALESCE(su.created_at, CURRENT_TIMESTAMP),
          COALESCE(su.updated_at, CURRENT_TIMESTAMP)
        FROM societe_users su
        WHERE su.actif = true
        ON CONFLICT (user_id, societe_id) WHERE is_active = true DO NOTHING
      `)
    }

    // Pour chaque société, créer des rôles par défaut basés sur les types système
    await queryRunner.query(`
        INSERT INTO roles (nom, description, "isSystemRole", societe_id, is_global, parent_role_type, actif)
        SELECT 
          ps.value || ' - ' || s.nom as nom,
          ps.description || ' pour ' || s.nom as description,
          false as "isSystemRole",
          s.id as societe_id,
          false as is_global,
          ps.key as parent_role_type,
          true as actif
        FROM societes s
        CROSS JOIN parameters_system ps
        WHERE ps."group" = 'user_roles'
        AND NOT EXISTS (
          SELECT 1 FROM roles r 
          WHERE r.societe_id = s.id 
          AND r.parent_role_type = ps.key
        )
      `)

    const basePermissions = [
      {
        nom: 'READ_DASHBOARD',
        module: 'dashboard',
        action: 'read',
        description: 'Accès au tableau de bord',
      },
      {
        nom: 'READ_USERS',
        module: 'users',
        action: 'read',
        description: 'Consulter les utilisateurs',
      },
      {
        nom: 'WRITE_USERS',
        module: 'users',
        action: 'write',
        description: 'Gérer les utilisateurs',
      },
      {
        nom: 'DELETE_USERS',
        module: 'users',
        action: 'delete',
        description: 'Supprimer les utilisateurs',
      },
      {
        nom: 'READ_SOCIETES',
        module: 'societes',
        action: 'read',
        description: 'Consulter les sociétés',
      },
      {
        nom: 'WRITE_SOCIETES',
        module: 'societes',
        action: 'write',
        description: 'Gérer les sociétés',
      },
      { nom: 'READ_ROLES', module: 'roles', action: 'read', description: 'Consulter les rôles' },
      { nom: 'WRITE_ROLES', module: 'roles', action: 'write', description: 'Gérer les rôles' },
      {
        nom: 'READ_PRODUCTION',
        module: 'production',
        action: 'read',
        description: 'Consulter la production',
      },
      {
        nom: 'WRITE_PRODUCTION',
        module: 'production',
        action: 'write',
        description: 'Gérer la production',
      },
      {
        nom: 'READ_STOCKS',
        module: 'stocks',
        action: 'read',
        description: 'Consulter les stocks',
      },
      { nom: 'WRITE_STOCKS', module: 'stocks', action: 'write', description: 'Gérer les stocks' },
      {
        nom: 'READ_COMMERCIAL',
        module: 'commercial',
        action: 'read',
        description: 'Consulter le commercial',
      },
      {
        nom: 'WRITE_COMMERCIAL',
        module: 'commercial',
        action: 'write',
        description: 'Gérer le commercial',
      },
    ]

    for (const perm of basePermissions) {
      // Vérifier si la permission existe déjà
      const existing = await queryRunner.query(
        `
          SELECT id FROM permissions WHERE nom = $1
        `,
        [perm.nom]
      )

      if (existing.length === 0) {
        await queryRunner.query(
          `
            INSERT INTO permissions (nom, description, module, action, is_global)
            VALUES ($1, $2, $3, $4, true)
          `,
          [perm.nom, perm.description, perm.module, perm.action]
        )
      }
    }

    // Attribution des permissions selon le type de rôle
    const rolePermissionMappings = [
      { roleType: 'SUPER_ADMIN', permissions: ['*'] }, // Toutes les permissions
      { roleType: 'ADMIN', permissions: ['READ_*', 'WRITE_*'] },
      {
        roleType: 'MANAGER',
        permissions: ['READ_*', 'WRITE_PRODUCTION', 'WRITE_STOCKS', 'WRITE_COMMERCIAL'],
      },
      { roleType: 'COMMERCIAL', permissions: ['READ_*', 'WRITE_COMMERCIAL'] },
      { roleType: 'TECHNICIEN', permissions: ['READ_*', 'WRITE_PRODUCTION', 'WRITE_STOCKS'] },
      {
        roleType: 'OPERATEUR',
        permissions: ['READ_DASHBOARD', 'READ_PRODUCTION', 'READ_STOCKS'],
      },
    ]

    for (const mapping of rolePermissionMappings) {
      if (mapping.permissions.includes('*')) {
        // Super admin: toutes les permissions
        await queryRunner.query(
          `
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.parent_role_type = $1
            AND NOT EXISTS (
              SELECT 1 FROM role_permissions rp 
              WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
          `,
          [mapping.roleType]
        )
      } else {
        // Autres rôles: permissions spécifiques
        for (const permPattern of mapping.permissions) {
          if (permPattern.includes('*')) {
            const prefix = permPattern.replace('*', '')
            await queryRunner.query(
              `
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id
                FROM roles r
                CROSS JOIN permissions p
                WHERE r.parent_role_type = $1
                AND p.nom LIKE $2
                AND NOT EXISTS (
                  SELECT 1 FROM role_permissions rp 
                  WHERE rp.role_id = r.id AND rp.permission_id = p.id
                )
              `,
              [mapping.roleType, `${prefix}%`]
            )
          } else {
            await queryRunner.query(
              `
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id
                FROM roles r
                CROSS JOIN permissions p
                WHERE r.parent_role_type = $1
                AND p.nom = $2
                AND NOT EXISTS (
                  SELECT 1 FROM role_permissions rp 
                  WHERE rp.role_id = r.id AND rp.permission_id = p.id
                )
              `,
              [mapping.roleType, permPattern]
            )
          }
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les nouvelles structures
    await queryRunner.dropTable('user_societe_roles', true)

    // Restaurer les données depuis les sauvegardes si elles existent
    const backupExists = await queryRunner.hasTable('migration_backup_societe_users')

    if (backupExists) {
      // Restaurer societe_users depuis la sauvegarde
      await queryRunner.query('DELETE FROM societe_users')
      await queryRunner.query(`
          INSERT INTO societe_users 
          SELECT * FROM migration_backup_societe_users
        `)
    }

    // Supprimer les colonnes ajoutées aux tables existantes
    await queryRunner.query(`
        ALTER TABLE roles 
        DROP COLUMN IF EXISTS societe_id,
        DROP COLUMN IF EXISTS is_global,
        DROP COLUMN IF EXISTS parent_role_type,
        DROP COLUMN IF EXISTS sort_order,
        DROP COLUMN IF EXISTS metadata
      `)

    await queryRunner.query(`
        ALTER TABLE permissions 
        DROP COLUMN IF EXISTS societe_id,
        DROP COLUMN IF EXISTS is_global,
        DROP COLUMN IF EXISTS category,
        DROP COLUMN IF EXISTS sort_order
      `)

    // Supprimer les types de rôles de parameters_system
    await queryRunner.query(`
        DELETE FROM parameters_system 
        WHERE "group" = 'user_roles'
      `)

    // Supprimer les tables de sauvegarde
    await queryRunner.dropTable('migration_backup_roles', true)
    await queryRunner.dropTable('migration_backup_societe_users', true)
    await queryRunner.dropTable('migration_backup_user_roles', true)
  }
}
