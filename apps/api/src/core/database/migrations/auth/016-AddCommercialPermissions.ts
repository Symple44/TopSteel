import { QueryRunner } from 'typeorm'
import type { MigrationInterface } from 'typeorm'

export class AddCommercialPermissions1753820000016 implements MigrationInterface {
  name = 'AddCommercialPermissions1753820000016'

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      const granularPermissions = [
        // VENTES - Accès complet
        {
          nom: 'VENTES_CREATE',
          module: 'ventes',
          action: 'create',
          description: 'Créer des ventes',
          category: 'commercial',
        },
        {
          nom: 'VENTES_READ',
          module: 'ventes',
          action: 'read',
          description: 'Consulter les ventes',
          category: 'commercial',
        },
        {
          nom: 'VENTES_UPDATE',
          module: 'ventes',
          action: 'update',
          description: 'Modifier les ventes',
          category: 'commercial',
        },
        {
          nom: 'VENTES_DELETE',
          module: 'ventes',
          action: 'delete',
          description: 'Supprimer les ventes',
          category: 'commercial',
        },
        {
          nom: 'VENTES_EXPORT',
          module: 'ventes',
          action: 'export',
          description: 'Exporter les ventes',
          category: 'commercial',
        },

        // CLIENTS - Accès complet avec restrictions configurables
        {
          nom: 'CLIENTS_CREATE',
          module: 'clients',
          action: 'create',
          description: 'Créer des clients',
          category: 'commercial',
        },
        {
          nom: 'CLIENTS_READ',
          module: 'clients',
          action: 'read',
          description: 'Consulter les clients',
          category: 'commercial',
        },
        {
          nom: 'CLIENTS_UPDATE',
          module: 'clients',
          action: 'update',
          description: 'Modifier les clients',
          category: 'commercial',
        },
        {
          nom: 'CLIENTS_DELETE',
          module: 'clients',
          action: 'delete',
          description: 'Supprimer les clients',
          category: 'commercial',
        },
        {
          nom: 'CLIENTS_EXPORT',
          module: 'clients',
          action: 'export',
          description: 'Exporter les clients',
          category: 'commercial',
        },

        // ACHATS - Lecture seule
        {
          nom: 'ACHATS_READ',
          module: 'achats',
          action: 'read',
          description: 'Consulter les achats',
          category: 'operational',
        },
        {
          nom: 'ACHATS_CREATE',
          module: 'achats',
          action: 'create',
          description: 'Créer des achats',
          category: 'operational',
        },
        {
          nom: 'ACHATS_UPDATE',
          module: 'achats',
          action: 'update',
          description: 'Modifier les achats',
          category: 'operational',
        },
        {
          nom: 'ACHATS_DELETE',
          module: 'achats',
          action: 'delete',
          description: 'Supprimer les achats',
          category: 'operational',
        },

        // DEVIS - Accès complet
        {
          nom: 'DEVIS_CREATE',
          module: 'devis',
          action: 'create',
          description: 'Créer des devis',
          category: 'commercial',
        },
        {
          nom: 'DEVIS_READ',
          module: 'devis',
          action: 'read',
          description: 'Consulter les devis',
          category: 'commercial',
        },
        {
          nom: 'DEVIS_UPDATE',
          module: 'devis',
          action: 'update',
          description: 'Modifier les devis',
          category: 'commercial',
        },
        {
          nom: 'DEVIS_DELETE',
          module: 'devis',
          action: 'delete',
          description: 'Supprimer les devis',
          category: 'commercial',
        },
        {
          nom: 'DEVIS_EXPORT',
          module: 'devis',
          action: 'export',
          description: 'Exporter les devis',
          category: 'commercial',
        },
        {
          nom: 'DEVIS_APPROVE',
          module: 'devis',
          action: 'approve',
          description: 'Approuver les devis',
          category: 'commercial',
        },
        {
          nom: 'DEVIS_CONVERT',
          module: 'devis',
          action: 'convert',
          description: 'Convertir devis en commande',
          category: 'commercial',
        },

        // RAPPORTS COMMERCIAUX
        {
          nom: 'REPORTS_COMMERCIAL_READ',
          module: 'reports',
          action: 'read',
          description: 'Consulter rapports commerciaux',
          category: 'reporting',
        },
        {
          nom: 'REPORTS_COMMERCIAL_EXPORT',
          module: 'reports',
          action: 'export',
          description: 'Exporter rapports commerciaux',
          category: 'reporting',
        },

        // MENUS SPÉCIALISÉS
        {
          nom: 'MENU_CLIENTS_ACCESS',
          module: 'menu',
          action: 'access',
          description: 'Accès au menu clients',
          category: 'navigation',
        },
        {
          nom: 'MENU_VENTES_ACCESS',
          module: 'menu',
          action: 'access',
          description: 'Accès au menu ventes',
          category: 'navigation',
        },
        {
          nom: 'MENU_DEVIS_ACCESS',
          module: 'menu',
          action: 'access',
          description: 'Accès au menu devis',
          category: 'navigation',
        },
        {
          nom: 'MENU_ACHATS_READ_ONLY',
          module: 'menu',
          action: 'read',
          description: 'Accès lecture seule menu achats',
          category: 'navigation',
        },

        // GESTION DES DONNÉES PAR SOCIÉTÉ
        {
          nom: 'DATA_SCOPE_COMPANY',
          module: 'data',
          action: 'scope',
          description: 'Accès aux données de la société uniquement',
          category: 'security',
        },
        {
          nom: 'DATA_SCOPE_OWN_RECORDS',
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
          SELECT id FROM permissions WHERE nom = $1
        `,
          [perm.nom]
        )

        if (existing.length === 0) {
          await queryRunner.query(
            `
            INSERT INTO permissions (nom, description, module, action, is_global, category, sort_order)
            VALUES ($1, $2, $3, $4, true, $5, 0)
          `,
            [perm.nom, perm.description, perm.module, perm.action, perm.category]
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
          AND p.nom = $1
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
          WHERE nom = $1
        `,
          [condConfig.permission, JSON.stringify(condConfig.conditions)]
        )
      }

      // Créer des exemples de permissions spécifiques par société pour les commerciaux
      await queryRunner.query(`
        INSERT INTO permissions (nom, description, module, action, is_global, societe_id, category)
        SELECT 
          'CLIENTS_ADVANCED_EXPORT_' || s.id as nom,
          'Export avancé clients pour ' || s.nom as description,
          'clients' as module,
          'export' as action,
          false as is_global,
          s.id as societe_id,
          'commercial' as category
        FROM societes s
        WHERE NOT EXISTS (
          SELECT 1 FROM permissions p 
          WHERE p.nom = 'CLIENTS_ADVANCED_EXPORT_' || s.id
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
        await queryRunner.query(`DELETE FROM permissions WHERE nom = $1`, [permName])
      }

      // Supprimer les permissions spécifiques par société
      await queryRunner.query(`
        DELETE FROM permissions 
        WHERE nom LIKE 'CLIENTS_ADVANCED_EXPORT_%' 
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
