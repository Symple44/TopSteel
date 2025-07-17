import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMenuTables1752530600000 implements MigrationInterface {
  name = 'CreateMenuTables1752530600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table menu_configurations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_configurations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT false,
        is_system BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        created_by UUID,
        updated_by UUID
      )
    `)

    // Créer la table menu_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        config_id UUID NOT NULL,
        parent_id UUID,
        title VARCHAR(255) NOT NULL,
        title_key VARCHAR(255),
        href VARCHAR(500),
        icon VARCHAR(50),
        gradient VARCHAR(100),
        badge VARCHAR(50),
        order_index INTEGER NOT NULL DEFAULT 0,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        module_id VARCHAR(255),
        target VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (config_id) REFERENCES menu_configurations(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE
      )
    `)

    // Créer la table menu_item_permissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_item_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        menu_item_id UUID NOT NULL,
        permission_id VARCHAR(255) NOT NULL,
        is_required BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        UNIQUE(menu_item_id, permission_id)
      )
    `)

    // Créer la table menu_item_roles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_item_roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        menu_item_id UUID NOT NULL,
        role_id VARCHAR(255) NOT NULL,
        is_required BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        UNIQUE(menu_item_id, role_id)
      )
    `)

    // Créer les index
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_configurations_name ON menu_configurations(name)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_configurations_is_active ON menu_configurations(is_active)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_configurations_is_system ON menu_configurations(is_system)`)
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_config_id ON menu_items(config_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON menu_items(parent_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_order_index ON menu_items(order_index)`)
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_item_permissions_menu_item_id ON menu_item_permissions(menu_item_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_item_permissions_permission_id ON menu_item_permissions(permission_id)`)
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_item_roles_menu_item_id ON menu_item_roles(menu_item_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_item_roles_role_id ON menu_item_roles(role_id)`)

    // Insérer une configuration de menu par défaut
    await queryRunner.query(`
      INSERT INTO menu_configurations (name, description, is_system, is_active) VALUES
      ('Menu ERP Standard', 'Configuration de menu par défaut pour l''ERP', true, true)
    `)

    // Récupérer l'ID de la configuration par défaut
    const configResult = await queryRunner.query(`
      SELECT id FROM menu_configurations WHERE name = 'Menu ERP Standard' LIMIT 1
    `)
    const configId = configResult[0]?.id

    if (configId) {
      // Insérer les items de menu par défaut
      await queryRunner.query(`
        INSERT INTO menu_items (config_id, title, title_key, href, icon, order_index, module_id) VALUES
        ('${configId}', 'Tableau de bord', 'dashboard', '/dashboard', 'Home', 1, null),
        ('${configId}', 'Administration', 'administration', '/admin', 'Shield', 100, 'ROLE_MANAGEMENT')
      `)

      // Récupérer l'ID de l'item Administration
      const adminResult = await queryRunner.query(`
        SELECT id FROM menu_items WHERE config_id = '${configId}' AND title = 'Administration' LIMIT 1
      `)
      const adminId = adminResult[0]?.id

      if (adminId) {
        // Insérer les sous-items d'administration
        await queryRunner.query(`
          INSERT INTO menu_items (config_id, parent_id, title, title_key, href, icon, order_index, module_id) VALUES
          ('${configId}', '${adminId}', 'Gestion des utilisateurs', 'users_management', '/admin/users', 'Users', 1, 'USER_MANAGEMENT'),
          ('${configId}', '${adminId}', 'Gestion des rôles', 'roles_management', '/admin/roles', 'Shield', 2, 'ROLE_MANAGEMENT'),
          ('${configId}', '${adminId}', 'Gestion des groupes', 'groups_management', '/admin/groups', 'Building', 3, 'USER_MANAGEMENT'),
          ('${configId}', '${adminId}', 'Configuration de l''entreprise', 'company_settings', '/admin/company', 'Building2', 4, 'SYSTEM_SETTINGS'),
          ('${configId}', '${adminId}', 'Notifications', 'notifications_management', '/admin/notifications', 'Bell', 5, 'NOTIFICATION_MANAGEMENT')
        `)

        // Ajouter les permissions pour les items d'administration
        const adminItems = await queryRunner.query(`
          SELECT id, module_id FROM menu_items 
          WHERE config_id = '${configId}' AND parent_id = '${adminId}' AND module_id IS NOT NULL
        `)

        for (const item of adminItems) {
          // Ajouter la permission VIEW pour chaque module
          await queryRunner.query(`
            INSERT INTO menu_item_permissions (menu_item_id, permission_id, is_required) 
            VALUES ('${item.id}', '${item.module_id}_VIEW', true)
          `)
        }

        // Ajouter les rôles requis pour l'administration
        await queryRunner.query(`
          INSERT INTO menu_item_roles (menu_item_id, role_id, is_required) 
          SELECT id, 'ADMIN', true FROM menu_items 
          WHERE config_id = '${configId}' AND (title = 'Administration' OR parent_id = '${adminId}')
        `)

        // Ajouter également SUPER_ADMIN
        await queryRunner.query(`
          INSERT INTO menu_item_roles (menu_item_id, role_id, is_required) 
          SELECT id, 'SUPER_ADMIN', false FROM menu_items 
          WHERE config_id = '${configId}' AND (title = 'Administration' OR parent_id = '${adminId}')
        `)
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse
    await queryRunner.query(`DROP TABLE IF EXISTS menu_item_roles`)
    await queryRunner.query(`DROP TABLE IF EXISTS menu_item_permissions`)
    await queryRunner.query(`DROP TABLE IF EXISTS menu_items`)
    await queryRunner.query(`DROP TABLE IF EXISTS menu_configurations`)
  }
}