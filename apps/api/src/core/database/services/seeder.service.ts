import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { DataSource, EntityManager } from 'typeorm'

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name)
  private readonly isDevelopment: boolean

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development'
  }

  /**
   * Exécute tous les seeds si nécessaire
   */
  async runSeeds(): Promise<void> {
    try {
      this.logger.log("🌱 Vérification des données d'initialisation...")

      // Vérifier si les seeds ont déjà été exécutés
      const seedsStatus = await this.checkSeedsStatus()

      if (seedsStatus.completed) {
        this.logger.log("✅ Données d'initialisation déjà présentes")
        return
      }

      this.logger.log("🔄 Exécution des données d'initialisation...")

      // Exécuter les seeds dans l'ordre
      await this.dataSource.transaction(async (manager) => {
        await this.seedSystemParameters(manager)
        await this.seedDefaultUsers(manager)
        await this.seedMenuConfiguration(manager)
        await this.markSeedsAsCompleted(manager)
      })

      this.logger.log("✅ Données d'initialisation créées avec succès")
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'initialisation des données:", error)
      throw error
    }
  }

  /**
   * Vérifie si les seeds ont été exécutés
   */
  private async checkSeedsStatus(): Promise<{
    completed: boolean
    lastRun?: Date
  }> {
    try {
      // Créer la table de tracking des seeds si elle n'existe pas
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS seeds_status (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name)
        )
      `)

      const result = await this.dataSource.query(`
        SELECT executed_at FROM seeds_status 
        WHERE name = 'initial_seed' 
        ORDER BY executed_at DESC 
        LIMIT 1
      `)

      return {
        completed: result.length > 0,
        lastRun: result[0]?.executed_at,
      }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification des seeds:', error)
      return { completed: false }
    }
  }

  /**
   * Marque les seeds comme complétés
   */
  private async markSeedsAsCompleted(manager: EntityManager): Promise<void> {
    await manager.query(`
      INSERT INTO seeds_status (name, executed_at) 
      VALUES ('initial_seed', CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP
    `)
  }

  /**
   * Seed des paramètres système
   */
  private async seedSystemParameters(manager: EntityManager): Promise<void> {
    this.logger.log('📋 Initialisation des paramètres système...')

    const systemParameters = [
      {
        key: 'app_name',
        value: 'TopSteel ERP',
        description: "Nom de l'application",
        type: 'string',
        category: 'general',
      },
      {
        key: 'app_version',
        value: '1.0.0',
        description: "Version de l'application",
        type: 'string',
        category: 'general',
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Mode maintenance',
        type: 'boolean',
        category: 'system',
      },
      {
        key: 'max_file_size',
        value: '10485760',
        description: 'Taille max des fichiers (bytes)',
        type: 'number',
        category: 'files',
      },
    ]

    for (const param of systemParameters) {
      await manager.query(
        `
        INSERT INTO system_parameters (key, value, description, type, category, "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO NOTHING
      `,
        [param.key, param.value, param.description, param.type, param.category]
      )
    }
  }

  /**
   * Seed des utilisateurs par défaut
   */
  private async seedDefaultUsers(manager: EntityManager): Promise<void> {
    this.logger.log('👥 Initialisation des utilisateurs par défaut...')

    // Vérifier si des utilisateurs existent déjà
    const userCount = await manager.query('SELECT COUNT(*) as count FROM users')

    if (parseInt(userCount[0].count, 10) > 0) {
      this.logger.log('👥 Utilisateurs déjà présents, passage')
      return
    }

    // Créer l'utilisateur admin par défaut avec un mot de passe sécurisé
    const bcrypt = require('bcrypt')
    
    // Utiliser une variable d'environnement pour le mot de passe admin initial
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || process.env.NODE_ENV === 'development' 
      ? 'ChangeMe123!' // Mot de passe par défaut UNIQUEMENT en développement
      : null
    
    if (!adminPassword) {
      this.logger.error('❌ INITIAL_ADMIN_PASSWORD non défini. Utilisateur admin non créé.')
      this.logger.warn('⚠️  Définissez INITIAL_ADMIN_PASSWORD dans vos variables d\'environnement')
      return
    }
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    await manager.query(
      `
      INSERT INTO users (nom, prenom, email, password, role, actif, acronyme, "created_at", "updated_at")
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING
    `,
      ['Admin', 'System', 'admin@topsteel.tech', hashedPassword, 'SUPER_ADMIN', true, 'TOP']
    )

    if (process.env.NODE_ENV === 'development') {
      this.logger.log('👥 Utilisateur admin créé: admin@topsteel.tech (acronyme: TOP)')
      this.logger.warn('⚠️  Mode développement - Changez le mot de passe admin!')
    } else {
      this.logger.log('👥 Utilisateur admin créé avec succès')
    }
    
    this.logger.warn('⚠️  IMPORTANT: Changez le mot de passe admin après la première connexion!')
  }

  /**
   * Seed de la configuration des menus (temporairement désactivé)
   */
  private async seedMenuConfiguration(manager: EntityManager): Promise<void> {
    this.logger.log('🎛️  Initialisation de la configuration des menus...')

    try {
      // Vérifier si les tables existent
      const tablesExist = await this.checkMenuTablesExist(manager)
      if (!tablesExist) {
        this.logger.warn('⚠️  Tables de menu non trouvées, passage de la configuration des menus')
        return
      }

      // Vérifier si une configuration par défaut existe déjà
      const existingConfig = await manager.query(`
        SELECT id FROM menu_configurations 
        WHERE name = 'Configuration par défaut' AND is_system = true
        LIMIT 1
      `)

      if (existingConfig.length > 0) {
        this.logger.log('🎛️  Configuration des menus par défaut déjà présente')
        return
      }

      // Créer la configuration par défaut
      const configId = await this.createDefaultMenuConfiguration(manager)

      // Créer les items de menu par défaut
      await this.createDefaultMenuItems(manager, configId)

      // Activer cette configuration
      await manager.query(
        `
        UPDATE menu_configurations 
        SET is_active = true 
        WHERE id = $1
      `,
        [configId]
      )

      this.logger.log('✅ Configuration des menus par défaut créée avec succès')
    } catch (error) {
      this.logger.warn('⚠️  Erreur lors de la configuration des menus:', error)
      // Ne pas faire échouer le seed complet pour les menus
    }
  }

  /**
   * Vérifie si les tables de menu existent
   */
  private async checkMenuTablesExist(manager: EntityManager): Promise<boolean> {
    try {
      const result = await manager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('menu_configurations', 'menu_items', 'menu_item_permissions', 'menu_item_roles')
      `)

      return result.length >= 2 // Au minimum menu_configurations et menu_items
    } catch (error) {
      this.logger.warn('Erreur lors de la vérification des tables de menu:', error)
      return false
    }
  }

  /**
   * Crée la configuration de menu par défaut
   */
  private async createDefaultMenuConfiguration(manager: EntityManager): Promise<string> {
    const result = await manager.query(
      `
      INSERT INTO menu_configurations (
        id, name, description, is_system, is_active, 
        created_by, updated_by, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, true, false,
        'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id
    `,
      ['Configuration par défaut', 'Configuration de menu par défaut du système TopSteel']
    )

    return result[0].id
  }

  /**
   * Crée les items de menu par défaut
   */
  private async createDefaultMenuItems(manager: EntityManager, configId: string): Promise<void> {
    // Tableau de bord
    await manager.query(
      `
      INSERT INTO menu_items (
        id, config_id, title, title_key, type, program_id, href, icon,
        order_index, is_visible, module_id, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, 'Tableau de bord', 'dashboard', 'PROGRAM', 
        '/dashboard', '/dashboard', 'Home', 1, true, 'DASHBOARD', 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `,
      [configId]
    )

    // Dossier Administration
    const adminFolderId = (
      await manager.query(
        `
      INSERT INTO menu_items (
        id, config_id, title, title_key, type, icon,
        order_index, is_visible, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, 'Administration', 'administration', 'FOLDER', 'Shield',
        100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id
    `,
        [configId]
      )
    )[0].id

    // Items d'administration
    const adminItems = [
      {
        title: 'Gestion des utilisateurs',
        titleKey: 'users_management',
        programId: '/admin/users',
        href: '/admin/users',
        icon: 'Users',
        moduleId: 'USER_MANAGEMENT',
        orderIndex: 1,
      },
      {
        title: 'Gestion des rôles',
        titleKey: 'roles_management',
        programId: '/admin/roles',
        href: '/admin/roles',
        icon: 'Shield',
        moduleId: 'ROLE_MANAGEMENT',
        orderIndex: 2,
      },
      {
        title: 'Gestion des menus',
        titleKey: 'menu_management',
        programId: '/admin/menus',
        href: '/admin/menus',
        icon: 'Menu',
        moduleId: 'MENU_MANAGEMENT',
        orderIndex: 3,
      },
    ]

    for (const item of adminItems) {
      await manager.query(
        `
        INSERT INTO menu_items (
          id, config_id, parent_id, title, title_key, type, program_id, href, icon,
          order_index, is_visible, module_id, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'PROGRAM', $5, $6, $7,
          $8, true, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `,
        [
          configId,
          adminFolderId,
          item.title,
          item.titleKey,
          item.programId,
          item.href,
          item.icon,
          item.orderIndex,
          item.moduleId,
        ]
      )
    }

    this.logger.log('📋 Items de menu par défaut créés')
  }

  /**
   * Reset des seeds (développement uniquement)
   */
  async resetSeeds(): Promise<void> {
    if (!this.isDevelopment) {
      throw new Error('Reset des seeds interdit en production')
    }

    try {
      this.logger.warn("🔄 Reset des données d'initialisation...")

      await this.dataSource.query("DELETE FROM seeds_status WHERE name = 'initial_seed'")

      this.logger.log("✅ Données d'initialisation reset")
    } catch (error) {
      this.logger.error('❌ Erreur lors du reset des seeds:', error)
      throw error
    }
  }

  /**
   * Seed spécifique pour les tests
   */
  async seedTestData(): Promise<void> {
    if (!this.isDevelopment) {
      throw new Error('Seed de test interdit en production')
    }

    try {
      this.logger.log('🧪 Initialisation des données de test...')

      // Ajouter des données de test ici
      // Par exemple: clients fictifs, projets de test, etc.

      this.logger.log('✅ Données de test créées')
    } catch (error) {
      this.logger.error('❌ Erreur lors de la création des données de test:', error)
      throw error
    }
  }
}
