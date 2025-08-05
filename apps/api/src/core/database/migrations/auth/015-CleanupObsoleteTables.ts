import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CleanupObsoleteTables1737500000015 implements MigrationInterface {
  name = 'CleanupObsoleteTables1737500000015'

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Vérifier que la migration précédente est bien appliquée
      const userSocieteRolesExists = await queryRunner.hasTable('user_societe_roles')
      if (!userSocieteRolesExists) {
        throw new Error(
          "La table user_societe_roles n'existe pas. Veuillez d'abord exécuter la migration 014-RefactorRolesMultiSociete"
        )
      }

      // Vérifier qu'il y a des données dans la nouvelle table
      const dataCount = await queryRunner.query('SELECT COUNT(*) as count FROM user_societe_roles')
      const count = parseInt(dataCount[0].count)

      if (count === 0) {
        // Ne pas supprimer les tables si aucune donnée n'a été migrée
        return
      }

      await queryRunner.dropTable('migration_backup_roles', true)
      await queryRunner.dropTable('migration_backup_societe_users', true)
      await queryRunner.dropTable('migration_backup_user_roles', true)

      // D'abord supprimer les contraintes de clés étrangères qui pointent vers user_roles
      await queryRunner.query(`
        ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS FK_user_roles_user_id
      `)
      await queryRunner.query(`
        ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS FK_user_roles_role_id
      `)

      // Supprimer la table user_roles (remplacée par user_societe_roles)
      await queryRunner.dropTable('user_roles', true)

      const groupsExists = await queryRunner.hasTable('groups')
      if (groupsExists) {
        const groupsCount = await queryRunner.query('SELECT COUNT(*) as count FROM groups')
        const groupsUsed = parseInt(groupsCount[0].count)

        if (groupsUsed === 0) {
          // Supprimer d'abord user_groups si elle existe
          await queryRunner.dropTable('user_groups', true)
          await queryRunner.dropTable('groups', true)
        } else {
        }
      }

      // Marquer le champ role comme déprécié dans societe_users
      // (on ne le supprime pas encore pour éviter de casser le code existant)
      const societeUsersExists = await queryRunner.hasTable('societe_users')
      if (societeUsersExists) {
        const hasRoleColumn = await queryRunner.hasColumn('societe_users', 'role')
        if (hasRoleColumn) {
          // Ajouter un commentaire pour indiquer que le champ est déprécié
          await queryRunner.query(`
            COMMENT ON COLUMN societe_users.role IS 'DÉPRÉCIÉ: Utiliser user_societe_roles.role_type à la place'
          `)
        }
      }

      // Supprimer les permissions qui ne sont liées à aucun rôle
      await queryRunner.query(`
        DELETE FROM permissions 
        WHERE id NOT IN (
          SELECT DISTINCT permission_id 
          FROM role_permissions 
          WHERE permission_id IS NOT NULL
        )
        AND is_global = false
      `)

      // Analyser les tables pour mettre à jour les statistiques
      await queryRunner.query('ANALYZE user_societe_roles')
      await queryRunner.query('ANALYZE roles')
      await queryRunner.query('ANALYZE permissions')
      await queryRunner.query('ANALYZE role_permissions')

      // Créer une vue qui simule l'ancienne structure pour la compatibilité
      await queryRunner.query(`
        CREATE OR REPLACE VIEW v_user_roles_compat AS
        SELECT 
          usr.id,
          usr.user_id,
          usr.role_id,
          usr.role_type as role_name,
          usr.created_at
        FROM user_societe_roles usr
        WHERE usr.is_active = true
      `)

      // Compter les données après nettoyage
      const finalStats = await queryRunner.query(`
        SELECT 
          (SELECT COUNT(*) FROM user_societe_roles) as user_societe_roles_count,
          (SELECT COUNT(*) FROM roles) as roles_count,
          (SELECT COUNT(*) FROM permissions) as permissions_count,
          (SELECT COUNT(*) FROM role_permissions) as role_permissions_count,
          (SELECT COUNT(DISTINCT role_type) FROM user_societe_roles) as distinct_role_types
      `)

      const _stats = finalStats[0]
    } catch (error) {
      throw error
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Supprimer la vue de compatibilité
      await queryRunner.query('DROP VIEW IF EXISTS v_user_roles_compat')

      // Recréer la table user_roles si elle n'existe pas
      const userRolesExists = await queryRunner.hasTable('user_roles')
      if (!userRolesExists) {
        await queryRunner.query(`
          CREATE TABLE user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            role_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            UNIQUE (user_id, role_id)
          )
        `)
      }

      // Recréer la table groups si elle n'existe pas
      const groupsExists = await queryRunner.hasTable('groups')
      if (!groupsExists) {
        await queryRunner.query(`
          CREATE TABLE groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nom VARCHAR(100) NOT NULL,
            description TEXT,
            actif BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

        await queryRunner.query(`
          CREATE TABLE user_groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            group_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
            UNIQUE (user_id, group_id)
          )
        `)
      }

      // Supprimer le commentaire sur societe_users.role
      await queryRunner.query(`
        COMMENT ON COLUMN societe_users.role IS null
      `)
    } catch (error) {
      throw error
    }
  }
}
