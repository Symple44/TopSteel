import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateGroupTables1752530500000 implements MigrationInterface {
  name = 'CreateGroupTables1752530500000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table groups
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        type VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        created_by UUID,
        updated_by UUID
      )
    `)

    // Créer la table user_groups
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        group_id UUID NOT NULL,
        assigned_by UUID,
        expires_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        UNIQUE(user_id, group_id)
      )
    `)

    // Créer la table group_roles (relation many-to-many)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_roles (
        group_id UUID NOT NULL,
        role_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY (group_id, role_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `)

    // Créer les index
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_groups_is_active ON user_groups(is_active)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_group_roles_group_id ON group_roles(group_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_group_roles_role_id ON group_roles(role_id)`)

    // Insérer quelques groupes par défaut
    await queryRunner.query(`
      INSERT INTO groups (name, description, type, is_active) VALUES
      ('Direction', 'Équipe de direction', 'DEPARTMENT', true),
      ('Commercial', 'Équipe commerciale', 'DEPARTMENT', true),
      ('Production', 'Équipe de production', 'DEPARTMENT', true),
      ('Technique', 'Équipe technique', 'DEPARTMENT', true),
      ('Administratif', 'Équipe administrative', 'DEPARTMENT', true),
      ('Projet Alpha', 'Équipe projet Alpha', 'PROJECT', true),
      ('Projet Beta', 'Équipe projet Beta', 'PROJECT', true)
    `)

    // Associer des rôles par défaut aux groupes
    await queryRunner.query(`
      INSERT INTO group_roles (group_id, role_id)
      SELECT g.id, r.id
      FROM groups g, roles r
      WHERE 
        (g.name = 'Direction' AND r.name IN ('SUPER_ADMIN', 'ADMIN')) OR
        (g.name = 'Commercial' AND r.name = 'COMMERCIAL') OR
        (g.name = 'Production' AND r.name IN ('MANAGER', 'TECHNICIEN')) OR
        (g.name = 'Technique' AND r.name = 'TECHNICIEN') OR
        (g.name = 'Administratif' AND r.name = 'MANAGER')
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse
    await queryRunner.query(`DROP TABLE IF EXISTS group_roles`)
    await queryRunner.query(`DROP TABLE IF EXISTS user_groups`)
    await queryRunner.query(`DROP TABLE IF EXISTS groups`)
  }
}