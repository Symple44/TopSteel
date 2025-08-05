import { type MigrationInterface, type QueryRunner, Table } from 'typeorm'

export class CreateUserPreferencesTables1721808002000 implements MigrationInterface {
  name = 'CreateUserPreferencesTables1721808002000'
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Activer l'extension uuid-ossp
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // Tables de préférences utilisateur
    await queryRunner.createTable(
      new Table({
        name: 'user_settings',
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
            name: 'key',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'value',
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
        ],
      }),
      true
    )

    // Tables pour les préférences DataTable
    await queryRunner.createTable(
      new Table({
        name: 'datatable_hierarchical_preferences',
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
            name: 'table_name',
            type: 'varchar',
            length: '100',
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
        ],
      }),
      true
    )

    await queryRunner.createTable(
      new Table({
        name: 'datatable_hierarchy_order',
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
            name: 'table_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'column_order',
            type: 'jsonb',
            default: "'[]'",
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

    // Tables pour les préférences UI
    await queryRunner.createTable(
      new Table({
        name: 'ui_preferences_reorderable_list',
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
            name: 'component_id',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'order',
            type: 'jsonb',
            default: "'[]'",
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

    // Tables pour les préférences de menu
    await queryRunner.createTable(
      new Table({
        name: 'user_menu_preferences',
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
            name: 'collapsed_items',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'favorite_items',
            type: 'jsonb',
            default: "'[]'",
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

    await queryRunner.createTable(
      new Table({
        name: 'user_menu_item_preferences',
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
            name: 'menu_item_id',
            type: 'uuid',
          },
          {
            name: 'is_favorite',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_hidden',
            type: 'boolean',
            default: false,
          },
          {
            name: 'custom_order',
            type: 'integer',
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

    await queryRunner.createTable(
      new Table({
        name: 'user_menu_preferences_admin',
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
            name: 'custom_menus',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'menu_layout',
            type: 'varchar',
            length: '50',
            default: "'default'",
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

    // Tables de notifications
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
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
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '20',
            default: "'normal'",
          },
          {
            name: 'data',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
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

    await queryRunner.createTable(
      new Table({
        name: 'notification_settings',
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
            name: 'enableSound',
            type: 'boolean',
            default: true,
          },
          {
            name: 'enableToast',
            type: 'boolean',
            default: true,
          },
          {
            name: 'enableBrowser',
            type: 'boolean',
            default: true,
          },
          {
            name: 'enableEmail',
            type: 'boolean',
            default: false,
          },
          {
            name: 'categories',
            type: 'jsonb',
            default: `'{
              "system": true,
              "stock": true,
              "projet": true,
              "production": true,
              "maintenance": true,
              "qualite": true,
              "facturation": true,
              "sauvegarde": false,
              "utilisateur": true
            }'`,
          },
          {
            name: 'priorities',
            type: 'jsonb',
            default: `'{
              "low": false,
              "normal": true,
              "high": true,
              "urgent": true
            }'`,
          },
          {
            name: 'schedules',
            type: 'jsonb',
            default: `'{
              "workingHours": {
                "enabled": false,
                "start": "09:00",
                "end": "18:00"
              },
              "weekdays": {
                "enabled": false,
                "days": [1, 2, 3, 4, 5]
              }
            }'`,
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

    // Créer les index
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_user_settings_user_key ON user_settings (user_id, key)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_datatable_prefs_user_table ON datatable_hierarchical_preferences (user_id, table_name)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_datatable_order_user_table ON datatable_hierarchy_order (user_id, table_name)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_ui_prefs_user_component ON ui_preferences_reorderable_list (user_id, component_id)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_user_menu_prefs_user ON user_menu_preferences (user_id)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_user_menu_item_prefs ON user_menu_item_preferences (user_id, menu_item_id)'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_user_menu_admin_user ON user_menu_preferences_admin (user_id)'
    )
    await queryRunner.query('CREATE INDEX IDX_notifications_user ON notifications (user_id)')
    await queryRunner.query('CREATE INDEX IDX_notifications_read ON notifications (read)')
    await queryRunner.query(
      'CREATE UNIQUE INDEX IDX_notification_settings_user ON notification_settings (user_id)'
    )

    // Note: Les contraintes de clé étrangères seront ajoutées après la création de toutes les tables
    // Elles seront créées dans une migration ultérieure ou automatiquement par TypeORM
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse
    await queryRunner.dropTable('notification_settings')
    await queryRunner.dropTable('notifications')
    await queryRunner.dropTable('user_menu_preferences_admin')
    await queryRunner.dropTable('user_menu_item_preferences')
    await queryRunner.dropTable('user_menu_preferences')
    await queryRunner.dropTable('ui_preferences_reorderable_list')
    await queryRunner.dropTable('datatable_hierarchy_order')
    await queryRunner.dropTable('datatable_hierarchical_preferences')
    await queryRunner.dropTable('user_settings')
  }
}
