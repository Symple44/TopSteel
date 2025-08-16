import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateMenuConfigurationTables1737600000000 implements MigrationInterface {
  name = 'CreateMenuConfigurationTables1737600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create menu_configurations table
    await queryRunner.createTable(
      new Table({
        name: 'menu_configurations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isUnique: true,
            comment: 'Unique code for the menu configuration',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            comment: 'Display name of the menu',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Description of the menu configuration',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['main', 'sidebar', 'toolbar', 'context', 'mobile'],
            default: "'main'",
            comment: 'Type of menu',
          },
          {
            name: 'position',
            type: 'enum',
            enum: ['top', 'bottom', 'left', 'right', 'center'],
            default: "'top'",
            comment: 'Position of the menu',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Whether the menu is active',
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            comment: 'Whether this is the default menu configuration',
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Company-specific menu (null = global)',
          },
          {
            name: 'role_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Role-specific menu',
          },
          {
            name: 'config',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Additional configuration options',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Additional metadata',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // Create menu_items table
    await queryRunner.createTable(
      new Table({
        name: 'menu_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'menu_id',
            type: 'uuid',
            comment: 'Reference to menu_configurations',
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Parent menu item for nested menus',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            comment: 'Unique code within the menu',
          },
          {
            name: 'label',
            type: 'varchar',
            length: '255',
            comment: 'Display label',
          },
          {
            name: 'label_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Translation key for the label',
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Icon identifier',
          },
          {
            name: 'icon_type',
            type: 'enum',
            enum: ['material', 'fontawesome', 'custom', 'svg'],
            default: "'material'",
            comment: 'Type of icon',
          },
          {
            name: 'route',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Route/URL for the menu item',
          },
          {
            name: 'route_params',
            type: 'jsonb',
            isNullable: true,
            comment: 'Route parameters',
          },
          {
            name: 'external_url',
            type: 'varchar',
            length: '1000',
            isNullable: true,
            comment: 'External URL if applicable',
          },
          {
            name: 'target',
            type: 'enum',
            enum: ['_self', '_blank', '_parent', '_top'],
            default: "'_self'",
            comment: 'Link target',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['link', 'divider', 'header', 'group', 'collapsible'],
            default: "'link'",
            comment: 'Type of menu item',
          },
          {
            name: 'badge',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Badge text to display',
          },
          {
            name: 'badge_color',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Badge color',
          },
          {
            name: 'badge_type',
            type: 'enum',
            enum: ['static', 'dynamic'],
            isNullable: true,
            comment: 'Badge type',
          },
          {
            name: 'badge_source',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Source for dynamic badge (API endpoint or function)',
          },
          {
            name: 'permission',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Required permission to view this item',
          },
          {
            name: 'required_roles',
            type: 'jsonb',
            isNullable: true,
            comment: 'Array of required roles',
          },
          {
            name: 'excluded_roles',
            type: 'jsonb',
            isNullable: true,
            comment: 'Array of excluded roles',
          },
          {
            name: 'order_index',
            type: 'integer',
            default: 0,
            comment: 'Order of the item in the menu',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Whether the menu item is active',
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
            comment: 'Whether the menu item is visible',
          },
          {
            name: 'is_disabled',
            type: 'boolean',
            default: false,
            comment: 'Whether the menu item is disabled',
          },
          {
            name: 'tooltip',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Tooltip text',
          },
          {
            name: 'css_classes',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Additional CSS classes',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Additional metadata',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create menu_item_actions table
    await queryRunner.createTable(
      new Table({
        name: 'menu_item_actions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'menu_item_id',
            type: 'uuid',
            comment: 'Reference to menu_items',
          },
          {
            name: 'action_type',
            type: 'enum',
            enum: ['click', 'hover', 'context', 'shortcut'],
            default: "'click'",
            comment: 'Type of action',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '255',
            comment: 'Action identifier or function name',
          },
          {
            name: 'action_params',
            type: 'jsonb',
            isNullable: true,
            comment: 'Parameters for the action',
          },
          {
            name: 'shortcut_keys',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Keyboard shortcut (e.g., "Ctrl+K")',
          },
          {
            name: 'confirmation_required',
            type: 'boolean',
            default: false,
            comment: 'Whether confirmation is required',
          },
          {
            name: 'confirmation_message',
            type: 'text',
            isNullable: true,
            comment: 'Confirmation message to display',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create user_menu_preferences table
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
            comment: 'Reference to users',
          },
          {
            name: 'menu_id',
            type: 'uuid',
            comment: 'Reference to menu_configurations',
          },
          {
            name: 'hidden_items',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Array of hidden menu item IDs',
          },
          {
            name: 'pinned_items',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Array of pinned menu item IDs',
          },
          {
            name: 'custom_order',
            type: 'jsonb',
            isNullable: true,
            comment: 'Custom ordering of menu items',
          },
          {
            name: 'collapsed_groups',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Array of collapsed group IDs',
          },
          {
            name: 'favorites',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Array of favorite menu items',
          },
          {
            name: 'recent_items',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Array of recently accessed items',
          },
          {
            name: 'preferences',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Additional user preferences',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create menu_access_logs table for tracking menu usage
    await queryRunner.createTable(
      new Table({
        name: 'menu_access_logs',
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
            comment: 'User who accessed the menu item',
          },
          {
            name: 'menu_item_id',
            type: 'uuid',
            comment: 'Menu item that was accessed',
          },
          {
            name: 'menu_id',
            type: 'uuid',
            comment: 'Menu configuration ID',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            comment: 'Action performed (click, hover, etc.)',
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Additional metadata',
          },
          {
            name: 'accessed_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      'menu_configurations',
      new TableIndex({
        name: 'IDX_menu_configurations_code',
        columnNames: ['code'],
      })
    )

    await queryRunner.createIndex(
      'menu_configurations',
      new TableIndex({
        name: 'IDX_menu_configurations_societe_id',
        columnNames: ['societe_id'],
      })
    )

    await queryRunner.createIndex(
      'menu_configurations',
      new TableIndex({
        name: 'IDX_menu_configurations_role_type',
        columnNames: ['role_type'],
      })
    )

    await queryRunner.createIndex(
      'menu_configurations',
      new TableIndex({
        name: 'IDX_menu_configurations_is_active',
        columnNames: ['is_active'],
      })
    )

    await queryRunner.createIndex(
      'menu_items',
      new TableIndex({
        name: 'IDX_menu_items_menu_id',
        columnNames: ['menu_id'],
      })
    )

    await queryRunner.createIndex(
      'menu_items',
      new TableIndex({
        name: 'IDX_menu_items_parent_id',
        columnNames: ['parent_id'],
      })
    )

    await queryRunner.createIndex(
      'menu_items',
      new TableIndex({
        name: 'IDX_menu_items_code',
        columnNames: ['menu_id', 'code'],
      })
    )

    await queryRunner.createIndex(
      'menu_items',
      new TableIndex({
        name: 'IDX_menu_items_order',
        columnNames: ['menu_id', 'order_index'],
      })
    )

    await queryRunner.createIndex(
      'menu_items',
      new TableIndex({
        name: 'IDX_menu_items_is_active',
        columnNames: ['is_active'],
      })
    )

    await queryRunner.createIndex(
      'menu_item_actions',
      new TableIndex({
        name: 'IDX_menu_item_actions_menu_item_id',
        columnNames: ['menu_item_id'],
      })
    )

    await queryRunner.createIndex(
      'user_menu_preferences',
      new TableIndex({
        name: 'IDX_user_menu_preferences_user_menu',
        columnNames: ['user_id', 'menu_id'],
      })
    )

    await queryRunner.createIndex(
      'menu_access_logs',
      new TableIndex({
        name: 'IDX_menu_access_logs_user_id',
        columnNames: ['user_id'],
      })
    )

    await queryRunner.createIndex(
      'menu_access_logs',
      new TableIndex({
        name: 'IDX_menu_access_logs_menu_item_id',
        columnNames: ['menu_item_id'],
      })
    )

    await queryRunner.createIndex(
      'menu_access_logs',
      new TableIndex({
        name: 'IDX_menu_access_logs_accessed_at',
        columnNames: ['accessed_at'],
      })
    )

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE menu_items 
      ADD CONSTRAINT FK_menu_items_menu_id 
      FOREIGN KEY (menu_id) REFERENCES menu_configurations(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE menu_items 
      ADD CONSTRAINT FK_menu_items_parent_id 
      FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE menu_item_actions 
      ADD CONSTRAINT FK_menu_item_actions_menu_item_id 
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE user_menu_preferences 
      ADD CONSTRAINT FK_user_menu_preferences_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE user_menu_preferences 
      ADD CONSTRAINT FK_user_menu_preferences_menu_id 
      FOREIGN KEY (menu_id) REFERENCES menu_configurations(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE menu_access_logs 
      ADD CONSTRAINT FK_menu_access_logs_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE menu_access_logs 
      ADD CONSTRAINT FK_menu_access_logs_menu_item_id 
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE menu_access_logs 
      ADD CONSTRAINT FK_menu_access_logs_menu_id 
      FOREIGN KEY (menu_id) REFERENCES menu_configurations(id) ON DELETE CASCADE
    `)

    // Insert default menu configurations
    await queryRunner.query(`
      INSERT INTO menu_configurations (code, name, type, position, is_active, is_default, config)
      VALUES 
        ('main_menu', 'Menu Principal', 'main', 'top', true, true, '{"collapsible": true, "showIcons": true}'),
        ('sidebar_menu', 'Menu Latéral', 'sidebar', 'left', true, false, '{"width": "250px", "collapsible": true}'),
        ('mobile_menu', 'Menu Mobile', 'mobile', 'top', true, false, '{"swipeable": true, "showIcons": true}')
    `)

    // Insert default menu items for main menu
    await queryRunner.query(`
      WITH main_menu AS (
        SELECT id FROM menu_configurations WHERE code = 'main_menu'
      )
      INSERT INTO menu_items (menu_id, code, label, label_key, icon, route, type, order_index, permission)
      SELECT 
        main_menu.id,
        code,
        label,
        label_key,
        icon,
        route,
        type,
        order_index,
        permission
      FROM main_menu,
      (VALUES
        ('dashboard', 'Tableau de bord', 'menu.dashboard', 'dashboard', '/dashboard', 'link', 1, 'dashboard:read'),
        ('inventory', 'Inventaire', 'menu.inventory', 'inventory', null, 'group', 2, 'inventory:read'),
        ('articles', 'Articles', 'menu.articles', 'category', '/inventory/articles', 'link', 3, 'articles:read'),
        ('materials', 'Matériaux', 'menu.materials', 'build', '/inventory/materials', 'link', 4, 'materials:read'),
        ('partners', 'Partenaires', 'menu.partners', 'people', '/partners', 'link', 5, 'partners:read'),
        ('orders', 'Commandes', 'menu.orders', 'shopping_cart', '/orders', 'link', 6, 'orders:read'),
        ('production', 'Production', 'menu.production', 'factory', '/production', 'link', 7, 'production:read'),
        ('reports', 'Rapports', 'menu.reports', 'assessment', '/reports', 'link', 8, 'reports:read'),
        ('admin', 'Administration', 'menu.admin', 'settings', null, 'group', 9, 'admin:read'),
        ('users', 'Utilisateurs', 'menu.users', 'person', '/admin/users', 'link', 10, 'users:read'),
        ('settings', 'Paramètres', 'menu.settings', 'tune', '/admin/settings', 'link', 11, 'settings:read')
      ) AS items(code, label, label_key, icon, route, type, order_index, permission)
    `)

    // Set parent-child relationships for grouped items
    await queryRunner.query(`
      WITH inventory_group AS (
        SELECT id FROM menu_items WHERE code = 'inventory'
      ),
      admin_group AS (
        SELECT id FROM menu_items WHERE code = 'admin'
      )
      UPDATE menu_items 
      SET parent_id = CASE 
        WHEN code IN ('articles', 'materials') THEN (SELECT id FROM inventory_group)
        WHEN code IN ('users', 'settings') THEN (SELECT id FROM admin_group)
        ELSE parent_id
      END
      WHERE code IN ('articles', 'materials', 'users', 'settings')
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query('ALTER TABLE menu_access_logs DROP CONSTRAINT IF EXISTS FK_menu_access_logs_menu_id')
    await queryRunner.query('ALTER TABLE menu_access_logs DROP CONSTRAINT IF EXISTS FK_menu_access_logs_menu_item_id')
    await queryRunner.query('ALTER TABLE menu_access_logs DROP CONSTRAINT IF EXISTS FK_menu_access_logs_user_id')
    await queryRunner.query('ALTER TABLE user_menu_preferences DROP CONSTRAINT IF EXISTS FK_user_menu_preferences_menu_id')
    await queryRunner.query('ALTER TABLE user_menu_preferences DROP CONSTRAINT IF EXISTS FK_user_menu_preferences_user_id')
    await queryRunner.query('ALTER TABLE menu_item_actions DROP CONSTRAINT IF EXISTS FK_menu_item_actions_menu_item_id')
    await queryRunner.query('ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS FK_menu_items_parent_id')
    await queryRunner.query('ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS FK_menu_items_menu_id')

    // Drop indexes
    await queryRunner.dropIndex('menu_access_logs', 'IDX_menu_access_logs_accessed_at')
    await queryRunner.dropIndex('menu_access_logs', 'IDX_menu_access_logs_menu_item_id')
    await queryRunner.dropIndex('menu_access_logs', 'IDX_menu_access_logs_user_id')
    await queryRunner.dropIndex('user_menu_preferences', 'IDX_user_menu_preferences_user_menu')
    await queryRunner.dropIndex('menu_item_actions', 'IDX_menu_item_actions_menu_item_id')
    await queryRunner.dropIndex('menu_items', 'IDX_menu_items_is_active')
    await queryRunner.dropIndex('menu_items', 'IDX_menu_items_order')
    await queryRunner.dropIndex('menu_items', 'IDX_menu_items_code')
    await queryRunner.dropIndex('menu_items', 'IDX_menu_items_parent_id')
    await queryRunner.dropIndex('menu_items', 'IDX_menu_items_menu_id')
    await queryRunner.dropIndex('menu_configurations', 'IDX_menu_configurations_is_active')
    await queryRunner.dropIndex('menu_configurations', 'IDX_menu_configurations_role_type')
    await queryRunner.dropIndex('menu_configurations', 'IDX_menu_configurations_societe_id')
    await queryRunner.dropIndex('menu_configurations', 'IDX_menu_configurations_code')

    // Drop tables
    await queryRunner.dropTable('menu_access_logs')
    await queryRunner.dropTable('user_menu_preferences')
    await queryRunner.dropTable('menu_item_actions')
    await queryRunner.dropTable('menu_items')
    await queryRunner.dropTable('menu_configurations')
  }
}