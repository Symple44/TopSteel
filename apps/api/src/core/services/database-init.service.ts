import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import type { DataSource } from 'typeorm'
import type { MenuConfigurationService } from '../../features/admin/services/menu-configuration.service'
import type { DatabaseSyncService } from '../database/database-sync.service'
import { DatabaseInitBaseService } from './database-init/database-init-base.service'
import { INIT_DATA } from './database-init/database-init-data'

@Injectable()
export class DatabaseInitService extends DatabaseInitBaseService implements OnModuleInit {
  protected readonly logger = new Logger(DatabaseInitService.name)

  constructor(
    @InjectDataSource()
    dataSource: DataSource,
    private readonly menuConfigService: MenuConfigurationService,
    private readonly databaseSyncService: DatabaseSyncService
  ) {
    super(dataSource)
  }

  async onModuleInit() {
    try {
      this.logger.log('Initialisation de la base de données...')

      // Vérifier la connexion
      const isConnected = await this.checkConnection()
      if (!isConnected) {
        this.logger.error('Impossible de se connecter à la base de données')
        return
      }

      // Utiliser le nouveau service de synchronisation
      await this.databaseSyncService.safeSynchronize()

      // TEMPORAIREMENT DÉSACTIVÉ - Les scripts d'initialisation doivent être corrigés
      // pour correspondre aux entités TypeORM réelles
      /*
      // Initialiser les enums
      await this.initializeEnums()
      
      // Initialiser les modules, rôles, permissions et groupes
      await this.initializeModules()
      await this.initializePermissions()
      await this.initializeRoles()
      await this.initializeRolePermissions()
      await this.initializeGroups()
      
      // Initialiser les paramètres système
      await this.initializeSystemParameters()
      
      // Initialiser les données par défaut (menus)
      await this.initializeDefaultData()
      
      // Créer un utilisateur administrateur par défaut
      await this.createDefaultAdminUser()
      */

      this.logger.log('✅ Synchronisation de la base de données terminée avec succès')
      this.logger.warn("⚠️  Scripts d'initialisation temporairement désactivés")
      this.logger.warn('⚠️  Il faut corriger les scripts pour correspondre aux entités TypeORM')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'initialisation de la base de données:", error)
      throw error
    }
  }

  /**
   * Initialise les permissions par rôle
   */
  private async initializeRolePermissions(): Promise<void> {
    try {
      const rolePermissionCount = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM role_permissions
      `)

      if (parseInt(rolePermissionCount[0]?.count || '0') === 0) {
        this.logger.log('Configuration des permissions par rôle...')

        // Configuration SUPER_ADMIN : tous les droits
        await this.dataSource.query(`
          INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted, created_at, updated_at)
          SELECT r.id, p.id, 'ADMIN', true, NOW(), NOW()
          FROM roles r, permissions p
          WHERE r.name = 'SUPER_ADMIN'
        `)

        // Configuration ADMIN : tous les droits sauf système
        await this.dataSource.query(`
          INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted, created_at, updated_at)
          SELECT r.id, p.id, 
            CASE 
              WHEN m.name = 'SYSTEM_SETTINGS' AND p.action != 'view' THEN 'WRITE'
              WHEN p.level = 'ADMIN' THEN 'DELETE'
              ELSE p.level
            END,
            true, NOW(), NOW()
          FROM roles r, permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE r.name = 'ADMIN'
        `)

        // Configuration MANAGER : business complet
        await this.dataSource.query(`
          INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted, created_at, updated_at)
          SELECT r.id, p.id, 
            CASE 
              WHEN p.level = 'ADMIN' THEN 'DELETE'
              ELSE p.level
            END,
            true, NOW(), NOW()
          FROM roles r, permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE r.name = 'MANAGER'
          AND m.category = 'BUSINESS'
        `)

        // Configuration COMMERCIAL
        await this.dataSource.query(`
          INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted, created_at, updated_at)
          SELECT r.id, p.id, 
            CASE 
              WHEN p.action = 'delete' THEN 'WRITE'
              ELSE p.level
            END,
            true, NOW(), NOW()
          FROM roles r, permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE r.name = 'COMMERCIAL'
          AND m.name IN ('CLIENT_MANAGEMENT', 'PROJECT_MANAGEMENT', 'BILLING_MANAGEMENT')
        `)

        // Configuration TECHNICIEN
        await this.dataSource.query(`
          INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted, created_at, updated_at)
          SELECT r.id, p.id, 
            CASE 
              WHEN p.level = 'DELETE' THEN 'WRITE'
              ELSE p.level
            END,
            true, NOW(), NOW()
          FROM roles r, permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE r.name = 'TECHNICIEN'
          AND m.name IN ('PRODUCTION_MANAGEMENT', 'STOCK_MANAGEMENT')
        `)

        // Configuration OPERATEUR
        await this.dataSource.query(`
          INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted, created_at, updated_at)
          SELECT r.id, p.id, 'READ', true, NOW(), NOW()
          FROM roles r, permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE r.name = 'OPERATEUR'
          AND m.name = 'PRODUCTION_MANAGEMENT'
          AND p.action = 'view'
        `)

        // Configuration DEVISEUR
        await this.dataSource.query(`
          INSERT INTO role_permissions (role_id, permission_id, access_level, is_granted, created_at, updated_at)
          SELECT r.id, p.id, p.level, 
            CASE 
              WHEN m.name = 'CLIENT_MANAGEMENT' AND p.action = 'delete' THEN false
              WHEN m.name = 'BILLING_MANAGEMENT' AND p.action = 'validate' THEN false
              ELSE true
            END, NOW(), NOW()
          FROM roles r, permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE r.name = 'DEVISEUR'
          AND m.name IN ('CLIENT_MANAGEMENT', 'BILLING_MANAGEMENT')
        `)

        this.logger.log('Permissions par rôle configurées')
      }
    } catch (error) {
      this.logger.error('Erreur lors de la configuration des permissions par rôle:', error)
    }
  }

  private async initializeDefaultData() {
    try {
      // Vérifier si des configurations de menu existent
      const menuConfigs = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM menu_configurations
      `)

      if (parseInt(menuConfigs[0]?.count || '0') === 0) {
        this.logger.log('Création de la configuration de menu par défaut...')
        await this.menuConfigService.createDefaultConfiguration()

        // Activer la configuration par défaut
        const defaultConfig = await this.dataSource.query(`
          SELECT id FROM menu_configurations WHERE name = 'Configuration par défaut' LIMIT 1
        `)

        if (defaultConfig[0]?.id) {
          await this.menuConfigService.activateConfiguration(defaultConfig[0].id)
          this.logger.log('Configuration de menu par défaut activée')
        }
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des données par défaut:", error)
    }
  }

  private async createDefaultAdminUser() {
    try {
      // Vérifier si des utilisateurs existent
      const userCount = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM users
      `)

      if (parseInt(userCount[0]?.count || '0') === 0) {
        this.logger.log("Création de l'utilisateur administrateur par défaut...")

        // Hasher le mot de passe par défaut
        const defaultPassword = INIT_DATA.defaultAdmin.password
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)

        // Créer l'utilisateur admin
        const adminUser = await this.dataSource.query(
          `
          INSERT INTO users (nom, prenom, email, mot_de_passe, role, actif, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id
        `,
          [
            INIT_DATA.defaultAdmin.nom,
            INIT_DATA.defaultAdmin.prenom,
            INIT_DATA.defaultAdmin.email,
            hashedPassword,
            'admin',
            true,
          ]
        )

        const adminUserId = adminUser[0]?.id

        if (adminUserId) {
          // Créer les paramètres utilisateur par défaut
          const userSettings = INIT_DATA.defaultAdmin.userSettings
          await this.dataSource.query(
            `
            INSERT INTO user_settings (user_id, theme, language, timezone, date_format, time_format, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (user_id) DO NOTHING
          `,
            [
              adminUserId,
              userSettings.theme,
              userSettings.language,
              userSettings.timezone,
              userSettings.date_format,
              userSettings.time_format,
            ]
          )

          // Assigner le rôle SUPER_ADMIN à l'utilisateur admin
          await this.dataSource.query(
            `
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, created_at, updated_at)
            SELECT $1, r.id, $1, true, NOW(), NOW()
            FROM roles r
            WHERE r.name = $2
            ON CONFLICT (user_id, role_id) DO NOTHING
          `,
            [adminUserId, INIT_DATA.defaultAdmin.role]
          )

          // Assigner l'utilisateur admin au groupe Direction
          await this.dataSource.query(
            `
            INSERT INTO user_groups (user_id, group_id, assigned_by, is_active, created_at, updated_at)
            SELECT $1, g.id, $1, true, NOW(), NOW()
            FROM groups g
            WHERE g.name = 'Direction'
            ON CONFLICT (user_id, group_id) DO NOTHING
          `,
            [adminUserId]
          )

          this.logger.log('Utilisateur administrateur créé avec succès')
          this.logger.log(`Email: ${INIT_DATA.defaultAdmin.email}`)
          this.logger.log(`Mot de passe: ${INIT_DATA.defaultAdmin.password}`)
          this.logger.log(`Rôle: ${INIT_DATA.defaultAdmin.role}`)
          this.logger.log('⚠️  ATTENTION: Changez ce mot de passe en production!')
        }
      }
    } catch (error) {
      this.logger.error("Erreur lors de la création de l'utilisateur administrateur:", error)
    }
  }
}
