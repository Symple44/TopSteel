import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateRolePermissionTables1752530400000 implements MigrationInterface {
  name = 'CreateRolePermissionTables1752530400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table modules
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        category VARCHAR(20) NOT NULL DEFAULT 'BUSINESS',
        icon VARCHAR(50),
        parent_module_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Créer la table permissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        level VARCHAR(20) NOT NULL DEFAULT 'READ',
        is_required BOOLEAN NOT NULL DEFAULT false,
        conditions JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
        UNIQUE(module_id, action)
      )
    `)

    // Créer la table roles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        is_system_role BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        created_by UUID,
        updated_by UUID
      )
    `)

    // Créer la table role_permissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role_id UUID NOT NULL,
        permission_id UUID NOT NULL,
        access_level VARCHAR(20) NOT NULL DEFAULT 'read',
        is_granted BOOLEAN NOT NULL DEFAULT true,
        conditions JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        granted_by UUID,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      )
    `)

    // Créer la table user_roles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        role_id UUID NOT NULL,
        assigned_by UUID,
        expires_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE(user_id, role_id)
      )
    `)

    // Créer les index
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_modules_category ON modules(category)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_modules_is_active ON modules(is_active)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_permissions_module_id ON permissions(module_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON roles(is_system_role)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active)`)

    // Insérer les modules système
    await queryRunner.query(`
      INSERT INTO modules (name, description, category, icon, is_active) VALUES
      ('USER_MANAGEMENT', 'Gestion des utilisateurs', 'CORE', 'Users', true),
      ('ROLE_MANAGEMENT', 'Gestion des rôles', 'CORE', 'Shield', true),
      ('SYSTEM_SETTINGS', 'Paramètres système', 'CORE', 'Settings', true),
      ('CLIENT_MANAGEMENT', 'Gestion des clients', 'BUSINESS', 'Building', true),
      ('PROJECT_MANAGEMENT', 'Gestion des projets', 'BUSINESS', 'FolderOpen', true),
      ('BILLING_MANAGEMENT', 'Gestion de la facturation', 'BUSINESS', 'CreditCard', true),
      ('PRODUCTION_MANAGEMENT', 'Gestion de la production', 'BUSINESS', 'Cog', true),
      ('STOCK_MANAGEMENT', 'Gestion des stocks', 'BUSINESS', 'Package', true),
      ('NOTIFICATION_MANAGEMENT', 'Gestion des notifications', 'ADMIN', 'Bell', true),
      ('AUDIT_LOGS', 'Journaux d''audit', 'ADMIN', 'FileText', true),
      ('BACKUP_MANAGEMENT', 'Gestion des sauvegardes', 'ADMIN', 'HardDrive', true),
      ('FINANCIAL_REPORTS', 'Rapports financiers', 'REPORTS', 'TrendingUp', true),
      ('PRODUCTION_REPORTS', 'Rapports de production', 'REPORTS', 'BarChart3', true),
      ('CUSTOM_REPORTS', 'Rapports personnalisés', 'REPORTS', 'PieChart', true)
    `)

    // Insérer les permissions système
    await queryRunner.query(`
      INSERT INTO permissions (module_id, action, name, description, level, is_required)
      SELECT m.id, 'view', 'Voir les ' || LOWER(m.name), 'Consulter les données du module', 'READ', true
      FROM modules m
    `)

    await queryRunner.query(`
      INSERT INTO permissions (module_id, action, name, description, level, is_required)
      SELECT m.id, 'create', 'Créer dans ' || LOWER(m.name), 'Créer de nouvelles données', 'WRITE', false
      FROM modules m
      WHERE m.category IN ('BUSINESS', 'CORE')
    `)

    await queryRunner.query(`
      INSERT INTO permissions (module_id, action, name, description, level, is_required)
      SELECT m.id, 'update', 'Modifier dans ' || LOWER(m.name), 'Modifier les données existantes', 'WRITE', false
      FROM modules m
      WHERE m.category IN ('BUSINESS', 'CORE')
    `)

    await queryRunner.query(`
      INSERT INTO permissions (module_id, action, name, description, level, is_required)
      SELECT m.id, 'delete', 'Supprimer dans ' || LOWER(m.name), 'Supprimer les données', 'DELETE', false
      FROM modules m
      WHERE m.category IN ('BUSINESS', 'CORE')
    `)

    // Insérer les rôles système
    await queryRunner.query(`
      INSERT INTO roles (name, description, is_system_role, is_active) VALUES
      ('SUPER_ADMIN', 'Super Administrateur - Accès complet', true, true),
      ('ADMIN', 'Administrateur - Accès administratif', true, true),
      ('MANAGER', 'Manager - Accès business complet', true, true),
      ('COMMERCIAL', 'Commercial - Clients et facturation', true, true),
      ('TECHNICIEN', 'Technicien - Production et stocks', true, true),
      ('OPERATEUR', 'Opérateur - Lecture seule production', true, true),
      ('DEVISEUR', 'Deviseur - Spécialisé devis', false, true)
    `)

    // Configuration des permissions par défaut pour SUPER_ADMIN
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted)
      SELECT r.id, p.id, 'ADMIN', true
      FROM roles r, permissions p
      WHERE r.name = 'SUPER_ADMIN'
    `)

    // Configuration des permissions par défaut pour ADMIN
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted)
      SELECT r.id, p.id, 
        CASE 
          WHEN m.name = 'SYSTEM_SETTINGS' AND p.action != 'view' THEN 'WRITE'
          WHEN p.level = 'ADMIN' THEN 'DELETE'
          ELSE p.level
        END,
        true
      FROM roles r, permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'ADMIN'
    `)

    // Configuration des permissions par défaut pour MANAGER
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted)
      SELECT r.id, p.id, 
        CASE 
          WHEN p.level = 'ADMIN' THEN 'DELETE'
          ELSE p.level
        END,
        true
      FROM roles r, permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'MANAGER'
      AND m.category = 'BUSINESS'
    `)

    // Configuration des permissions par défaut pour COMMERCIAL
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted)
      SELECT r.id, p.id, 
        CASE 
          WHEN p.action = 'delete' THEN 'WRITE'
          ELSE p.level
        END,
        true
      FROM roles r, permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'COMMERCIAL'
      AND m.name IN ('CLIENT_MANAGEMENT', 'PROJECT_MANAGEMENT', 'BILLING_MANAGEMENT')
    `)

    // Configuration des permissions par défaut pour TECHNICIEN
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted)
      SELECT r.id, p.id, 
        CASE 
          WHEN p.level = 'DELETE' THEN 'WRITE'
          ELSE p.level
        END,
        true
      FROM roles r, permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'TECHNICIEN'
      AND m.name IN ('PRODUCTION_MANAGEMENT', 'STOCK_MANAGEMENT')
    `)

    // Configuration des permissions par défaut pour OPERATEUR
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted)
      SELECT r.id, p.id, 'READ', true
      FROM roles r, permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'OPERATEUR'
      AND m.name = 'PRODUCTION_MANAGEMENT'
      AND p.action = 'view'
    `)

    // Configuration des permissions par défaut pour DEVISEUR
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted)
      SELECT r.id, p.id, p.level, 
        CASE 
          WHEN m.name = 'CLIENT_MANAGEMENT' AND p.action = 'delete' THEN false
          WHEN m.name = 'BILLING_MANAGEMENT' AND p.action = 'validate' THEN false
          ELSE true
        END
      FROM roles r, permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'DEVISEUR'
      AND m.name IN ('CLIENT_MANAGEMENT', 'BILLING_MANAGEMENT')
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles`)
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`)
    await queryRunner.query(`DROP TABLE IF EXISTS roles`)
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`)
    await queryRunner.query(`DROP TABLE IF EXISTS modules`)
  }
}