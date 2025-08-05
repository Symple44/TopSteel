import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCommercialPermissions1753820000016 implements MigrationInterface {
  name = 'AddCommercialPermissions1753820000016'

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      const granularPermissions = [
        // VENTES - Accès complet
        {
          name: 'VENTES_CREATE',
          module: 'ventes',
          action: 'create',
          description: 'Créer des ventes',
          category: 'commercial',
        },
        {
          name: 'VENTES_READ',
          module: 'ventes',
          action: 'read',
          description: 'Consulter les ventes',
          category: 'commercial',
        },
        {
          name: 'VENTES_UPDATE',
          module: 'ventes',
          action: 'update',
          description: 'Modifier les ventes',
          category: 'commercial',
        },
        {
          name: 'VENTES_DELETE',
          module: 'ventes',
          action: 'delete',
          description: 'Supprimer les ventes',
          category: 'commercial',
        },
        {
          name: 'VENTES_EXPORT',
          module: 'ventes',
          action: 'export',
          description: 'Exporter les ventes',
          category: 'commercial',
        },

        // CLIENTS - Accès complet avec restrictions configurables
        {
          name: 'CLIENTS_CREATE',
          module: 'clients',
          action: 'create',
          description: 'Créer des clients',
          category: 'commercial',
        },
        {
          name: 'CLIENTS_READ',
          module: 'clients',
          action: 'read',
          description: 'Consulter les clients',
          category: 'commercial',
        },
        {
          name: 'CLIENTS_UPDATE',
          module: 'clients',
          action: 'update',
          description: 'Modifier les clients',
          category: 'commercial',
        },
        {
          name: 'CLIENTS_DELETE',
          module: 'clients',
          action: 'delete',
          description: 'Supprimer les clients',
          category: 'commercial',
        },
        {
          name: 'CLIENTS_EXPORT',
          module: 'clients',
          action: 'export',
          description: 'Exporter les clients',
          category: 'commercial',
        },

        // ACHATS - Lecture seule
        {
          name: 'ACHATS_READ',
          module: 'achats',
          action: 'read',
          description: 'Consulter les achats',
          category: 'operational',
        },
        {
          name: 'ACHATS_CREATE',
          module: 'achats',
          action: 'create',
          description: 'Créer des achats',
          category: 'operational',
        },
        {
          name: 'ACHATS_UPDATE',
          module: 'achats',
          action: 'update',
          description: 'Modifier les achats',
          category: 'operational',
        },
        {
          name: 'ACHATS_DELETE',
          module: 'achats',
          action: 'delete',
          description: 'Supprimer les achats',
          category: 'operational',
        },

        // DEVIS - Accès complet
        {
          name: 'DEVIS_CREATE',
          module: 'devis',
          action: 'create',
          description: 'Créer des devis',
          category: 'commercial',
        },
        {
          name: 'DEVIS_READ',
          module: 'devis',
          action: 'read',
          description: 'Consulter les devis',
          category: 'commercial',
        },
        {
          name: 'DEVIS_UPDATE',
          module: 'devis',
          action: 'update',
          description: 'Modifier les devis',
          category: 'commercial',
        },
        {
          name: 'DEVIS_DELETE',
          module: 'devis',
          action: 'delete',
          description: 'Supprimer les devis',
          category: 'commercial',
        },
        {
          name: 'DEVIS_EXPORT',
          module: 'devis',
          action: 'export',
          description: 'Exporter les devis',
          category: 'commercial',
        },
        {
          name: 'DEVIS_APPROVE',
          module: 'devis',
          action: 'approve',
          description: 'Approuver les devis',
          category: 'commercial',
        },
        {
          name: 'DEVIS_CONVERT',
          module: 'devis',
          action: 'convert',
          description: 'Convertir devis en commande',
          category: 'commercial',
        },

        // RAPPORTS COMMERCIAUX
        {
          name: 'REPORTS_COMMERCIAL_READ',
          module: 'reports',
          action: 'read',
          description: 'Consulter rapports commerciaux',
          category: 'reporting',
        },
        {
          name: 'REPORTS_COMMERCIAL_EXPORT',
          module: 'reports',
          action: 'export',
          description: 'Exporter rapports commerciaux',
          category: 'reporting',
        },

        // MENUS SPÉCIALISÉS
        {
          name: 'MENU_CLIENTS_ACCESS',
          module: 'menu',
          action: 'access',
          description: 'Accès au menu clients',
          category: 'navigation',
        },
        {
          name: 'MENU_VENTES_ACCESS',
          module: 'menu',
          action: 'access',
          description: 'Accès au menu ventes',
          category: 'navigation',
        },
        {
          name: 'MENU_DEVIS_ACCESS',
          module: 'menu',
          action: 'access',
          description: 'Accès au menu devis',
          category: 'navigation',
        },
        {
          name: 'MENU_ACHATS_READ_ONLY',
          module: 'menu',
          action: 'read',
          description: 'Accès lecture seule menu achats',
          category: 'navigation',
        },

        // GESTION DES DONNÉES PAR SOCIÉTÉ
        {
          name: 'DATA_SCOPE_COMPANY',
          module: 'data',
          action: 'scope',
          description: 'Accès aux données de la société uniquement',
          category: 'security',
        },
        {
          name: 'DATA_SCOPE_OWN_RECORDS',
          module: 'data',
          action: 'scope',
          description: 'Priorité sur ses propres enregistrements',
          category: 'security',
        },
      ]

      for (const perm of granularPermissions) {
        // Vérifier si la permission existe déjà
        const existing = await queryRunner.query(
          `
          SELECT id FROM permissions WHERE name = $1
        `,
          [perm.name]
        )

        if (existing.length === 0) {
          await queryRunner.query(
            `
            INSERT INTO permissions (nom, name, description, resource, action, is_global, category, sort_order)
            VALUES ($1, $1, $2, $3, $4, true, $5, 0)
          `,
            [perm.name, perm.description, perm.module, perm.action, perm.category]
          )
        }
      }

      // Permissions pour COMMERCIAL
      const commercialPermissions = [
        // Accès complet aux ventes
        'VENTES_CREATE',
        'VENTES_READ',
        'VENTES_UPDATE',
        'VENTES_DELETE',
        'VENTES_EXPORT',
        // Accès complet aux clients (sauf suppression par défaut)
        'CLIENTS_CREATE',
        'CLIENTS_READ',
        'CLIENTS_UPDATE',
        'CLIENTS_EXPORT',
        // Lecture seule des achats
        'ACHATS_READ',
        // Accès complet aux devis
        'DEVIS_CREATE',
        'DEVIS_READ',
        'DEVIS_UPDATE',
        'DEVIS_DELETE',
        'DEVIS_EXPORT',
        'DEVIS_APPROVE',
        'DEVIS_CONVERT',
        // Rapports commerciaux
        'REPORTS_COMMERCIAL_READ',
        'REPORTS_COMMERCIAL_EXPORT',
        // Accès aux menus
        'MENU_CLIENTS_ACCESS',
        'MENU_VENTES_ACCESS',
        'MENU_DEVIS_ACCESS',
        'MENU_ACHATS_READ_ONLY',
        // Scope des données
        'DATA_SCOPE_COMPANY',
        'DATA_SCOPE_OWN_RECORDS',
        // Permissions de base
        'READ_DASHBOARD',
      ]

      // Attribuer ces permissions aux rôles COMMERCIAL existants
      for (const permName of commercialPermissions) {
        await queryRunner.query(
          `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT r.id, p.id
          FROM roles r
          CROSS JOIN permissions p
          WHERE r.parent_role_type = 'COMMERCIAL'
          AND p.name = $1
          AND NOT EXISTS (
            SELECT 1 FROM role_permissions rp 
            WHERE rp.role_id = r.id AND rp.permission_id = p.id
          )
        `,
          [permName]
        )
      }

      // Ajouter des métadonnées aux permissions pour les conditions
      const permissionConditions = [
        {
          permission: 'CLIENTS_DELETE',
          conditions: {
            requiredRole: 'ADMIN',
            description: 'Seuls les admins peuvent supprimer des clients',
          },
        },
        {
          permission: 'ACHATS_CREATE',
          conditions: {
            denied: true,
            description: "Création d'achats interdite pour les commerciaux",
          },
        },
        {
          permission: 'ACHATS_UPDATE',
          conditions: {
            denied: true,
            description: "Modification d'achats interdite pour les commerciaux",
          },
        },
        {
          permission: 'MENU_ACHATS_READ_ONLY',
          conditions: {
            readonly: true,
            description: 'Menu achats en lecture seule pour les commerciaux',
          },
        },
      ]

      for (const condConfig of permissionConditions) {
        await queryRunner.query(
          `
          UPDATE permissions 
          SET metadata = $2
          WHERE name = $1
        `,
          [condConfig.permission, JSON.stringify(condConfig.conditions)]
        )
      }

      // Créer des exemples de permissions spécifiques par société pour les commerciaux
      await queryRunner.query(`
        INSERT INTO permissions (nom, name, description, resource, action, is_global, societe_id, category)
        SELECT 
          'CLIENTS_ADVANCED_EXPORT_' || s.id as nom,
          'CLIENTS_ADVANCED_EXPORT_' || s.id as name,
          'Export avancé clients pour ' || s.nom as description,
          'clients' as resource,
          'export' as action,
          false as is_global,
          s.id as societe_id,
          'commercial' as category
        FROM societes s
        WHERE NOT EXISTS (
          SELECT 1 FROM permissions p 
          WHERE p.name = 'CLIENTS_ADVANCED_EXPORT_' || s.id
        )
      `)

      await queryRunner.query(`
        UPDATE roles 
        SET metadata = jsonb_build_object(
          'dataScope', 'company',
          'menuRestrictions', array['readonly_achats'],
          'specialPermissions', array['devis_full_access', 'clients_create_restricted'],
          'description', 'Rôle commercial avec accès complet aux ventes, devis et lecture des achats'
        )
        WHERE parent_role_type = 'COMMERCIAL'
      `)
    } catch (error) {
      throw error
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Supprimer les associations role-permissions pour COMMERCIAL
      await queryRunner.query(`
        DELETE FROM role_permissions 
        WHERE role_id IN (
          SELECT id FROM roles WHERE parent_role_type = 'COMMERCIAL'
        )
      `)

      // Supprimer les permissions ajoutées
      const permissionsToDelete = [
        'VENTES_CREATE',
        'VENTES_READ',
        'VENTES_UPDATE',
        'VENTES_DELETE',
        'VENTES_EXPORT',
        'CLIENTS_CREATE',
        'CLIENTS_READ',
        'CLIENTS_UPDATE',
        'CLIENTS_DELETE',
        'CLIENTS_EXPORT',
        'ACHATS_READ',
        'ACHATS_CREATE',
        'ACHATS_UPDATE',
        'ACHATS_DELETE',
        'DEVIS_CREATE',
        'DEVIS_READ',
        'DEVIS_UPDATE',
        'DEVIS_DELETE',
        'DEVIS_EXPORT',
        'DEVIS_APPROVE',
        'DEVIS_CONVERT',
        'REPORTS_COMMERCIAL_READ',
        'REPORTS_COMMERCIAL_EXPORT',
        'MENU_CLIENTS_ACCESS',
        'MENU_VENTES_ACCESS',
        'MENU_DEVIS_ACCESS',
        'MENU_ACHATS_READ_ONLY',
        'DATA_SCOPE_COMPANY',
        'DATA_SCOPE_OWN_RECORDS',
      ]

      for (const permName of permissionsToDelete) {
        await queryRunner.query(`DELETE FROM permissions WHERE name = $1`, [permName])
      }

      // Supprimer les permissions spécifiques par société
      await queryRunner.query(`
        DELETE FROM permissions 
        WHERE name LIKE 'CLIENTS_ADVANCED_EXPORT_%' 
        AND is_global = false
      `)

      // Réinitialiser les métadonnées des rôles COMMERCIAL
      await queryRunner.query(`
        UPDATE roles 
        SET metadata = '{}'
        WHERE parent_role_type = 'COMMERCIAL'
      `)
    } catch (error) {
      throw error
    }
  }
}
