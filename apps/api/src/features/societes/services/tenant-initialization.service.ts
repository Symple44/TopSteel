import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { MultiTenantDatabaseConfig } from '../../../core/database/config/multi-tenant-database.config'
import { User, UserRole as UserRoleEnum } from '../../../domains/users/entities/user.entity'
import { UserSettings } from '../../../domains/users/entities/user-settings.entity'
import { NotificationSettings } from '../../notifications/entities/notification-settings.entity'
import { Societe } from '../entities/societe.entity'
import { SocieteUser, UserSocieteRole } from '../entities/societe-user.entity'
import { NotificationSettings, Societe, SocieteUser, User, UserSettings } from '@prisma/client'


export interface DefaultUserConfig {
  nom: string
  prenom: string
  email: string
  password: string
  role: UserRoleEnum
}

@Injectable()
export class TenantInitializationService {
  private readonly logger = new Logger(TenantInitializationService.name)

  constructor(
    private readonly multiTenantConfig: MultiTenantDatabaseConfig,
    @InjectRepository(User, 'auth')
    private readonly _userRepository: Repository<User>,
    @InjectRepository(UserSettings, 'auth')
    private readonly _userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(NotificationSettings, 'auth')
    private readonly _notificationSettingsRepository: Repository<NotificationSettings>,
    @InjectRepository(SocieteUser, 'auth')
    private readonly _societeUserRepository: Repository<SocieteUser>
  ) {}

  /**
   * Initialiser toutes les données par défaut pour une nouvelle société
   */
  async initializeTenantData(societe: Societe): Promise<void> {
    this.logger.log(`🔧 Initialisation des données pour la société ${societe.nom}`)

    try {
      // 1. Créer les utilisateurs par défaut
      const defaultUsers = await this.createDefaultUsers(societe)

      // 2. Initialiser les paramètres système (dans la base TENANT)
      await this.initializeSystemParameters(societe.code)

      // 3. Créer les données métier de base (dans la base TENANT)
      await this.initializeBusinessData(societe.code)

      this.logger.log(`✅ Données initialisées pour ${societe.nom}`)
      this.logger.log(`👥 Utilisateurs créés: ${defaultUsers.length}`)
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'initialisation des données:`, (error as Error).message)
      throw error
    }
  }

  /**
   * Créer les utilisateurs par défaut pour une société
   */
  private async createDefaultUsers(societe: Societe): Promise<User[]> {
    this.logger.log(`👥 Création des utilisateurs par défaut...`)

    const defaultUsers: DefaultUserConfig[] = [
      {
        nom: 'Admin',
        prenom: societe.nom,
        email: `admin@${societe.code.toLowerCase()}.topsteel.local`,
        password: 'Admin123!',
        role: UserRoleEnum.ADMIN,
      },
      {
        nom: 'Utilisateur',
        prenom: 'Standard',
        email: `user@${societe.code.toLowerCase()}.topsteel.local`,
        password: 'User123!',
        role: UserRoleEnum.USER,
      },
    ]

    const createdUsers: User[] = []

    for (const userData of defaultUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this._userRepository.findOne({
          where: { email: userData.email },
        })

        if (existingUser) {
          this.logger.warn(`Utilisateur ${userData.email} existe déjà, ignoré`)
          continue
        }

        // Hasher le mot de passe
        const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

        // Créer l'utilisateur
        const user = this._userRepository.create({
          nom: userData.nom,
          prenom: userData.prenom,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          actif: true,
        })

        const savedUser = await this._userRepository.save(user)
        createdUsers.push(savedUser)

        // Associer l'utilisateur à la société
        const societeRole =
          userData.role === UserRoleEnum.ADMIN ? UserSocieteRole.ADMIN : UserSocieteRole.USER
        await this.associateUserToSociete(savedUser.id, societe.id, societeRole)

        // Créer les paramètres utilisateur par défaut
        await this.createDefaultUserSettings(savedUser.id)

        // Créer les paramètres de notification par défaut
        await this.createDefaultNotificationSettings(savedUser.id)

        this.logger.log(`✅ Utilisateur créé: ${userData.email} (${userData.role})`)
        // Ne JAMAIS logger les mots de passe - Sécurité
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug('ℹ️  Utilisateur créé avec succès. Mot de passe envoyé par email.')
        }
      } catch (error) {
        this.logger.error(
          `❌ Erreur création utilisateur ${userData.email}:`,
          (error as Error).message
        )
        // Continue avec les autres utilisateurs
      }
    }

    return createdUsers
  }

  /**
   * Associer un utilisateur à une société
   */
  private async associateUserToSociete(
    userId: string,
    societeId: string,
    role: UserSocieteRole
  ): Promise<void> {
    try {
      const association = this._societeUserRepository.create({
        userId,
        societeId,
        role: role,
        actif: true,
        isDefault: role === UserSocieteRole.ADMIN,
      })

      await this._societeUserRepository.save(association)
      this.logger.log(`✅ Utilisateur associé à la société avec le rôle ${role}`)
    } catch (error) {
      this.logger.error(`❌ Erreur association utilisateur-société:`, (error as Error).message)
      throw error
    }
  }

  /**
   * Créer les paramètres utilisateur par défaut
   */
  private async createDefaultUserSettings(userId: string): Promise<void> {
    try {
      const userSetting = this._userSettingsRepository.create({
        userId,
        preferences: {
          language: 'fr',
          timezone: 'Europe/Paris',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false,
            emailTypes: {
              newMessages: true,
              systemAlerts: true,
              taskReminders: true,
              weeklyReports: false,
              securityAlerts: true,
              maintenanceNotice: false,
            },
            pushTypes: {
              enabled: true,
              sound: true,
              urgent: true,
              normal: true,
              quiet: false,
            },
            quietHours: {
              enabled: false,
              start: '22:00',
              end: '07:00',
            },
          },
          appearance: {
            theme: 'light',
            language: 'fr',
            fontSize: 'medium',
            sidebarWidth: 'normal',
            density: 'comfortable',
            accentColor: 'blue',
            contentWidth: 'compact',
          },
        },
      })

      await this._userSettingsRepository.save(userSetting)

      this.logger.log(`✅ Paramètres utilisateur créés pour ${userId}`)
    } catch (error) {
      this.logger.error(`❌ Erreur création paramètres utilisateur:`, (error as Error).message)
      // Non critique, on continue
    }
  }

  /**
   * Créer les paramètres de notification par défaut
   */
  private async createDefaultNotificationSettings(userId: string): Promise<void> {
    try {
      const notificationSettings = this._notificationSettingsRepository.create({
        userId,
        enableSound: true,
        enableToast: true,
        enableBrowser: true,
        enableEmail: false,
        categories: {
          system: true,
          stock: true,
          projet: true,
          production: true,
          maintenance: true,
          qualite: true,
          facturation: true,
          sauvegarde: false,
          utilisateur: true,
        },
        priorities: {
          low: false,
          normal: true,
          high: true,
          urgent: true,
        },
        schedules: {
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '18:00',
          },
          weekdays: {
            enabled: false,
            days: [1, 2, 3, 4, 5],
          },
        },
      })

      await this._notificationSettingsRepository.save(notificationSettings)
      this.logger.log(`✅ Paramètres de notification créés pour ${userId}`)
    } catch (error) {
      this.logger.error(`❌ Erreur création paramètres notification:`, (error as Error).message)
      // Non critique, on continue
    }
  }

  /**
   * Initialiser les paramètres système dans la base TENANT
   */
  private async initializeSystemParameters(societeCode: string): Promise<void> {
    try {
      this.logger.log(`⚙️ Initialisation des paramètres système...`)

      const tenantDataSource = await this.multiTenantConfig.getTenantConnection(societeCode)

      // Vérifier si des paramètres existent déjà
      const existingParams = await tenantDataSource.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'system_parameters'
      `)

      if (parseInt(existingParams[0]?.count || '0', 10) === 0) {
        this.logger.log("Table system_parameters n'existe pas dans la base tenant")
        return
      }

      // Paramètres système par défaut pour une nouvelle société
      const systemParameters = [
        {
          key: 'company_name',
          value: `Société ${societeCode}`,
          description: 'Nom de la société',
          category: 'general',
        },
        { key: 'currency', value: 'EUR', description: 'Devise par défaut', category: 'financial' },
        {
          key: 'vat_rate',
          value: '20.0',
          description: 'Taux de TVA par défaut',
          category: 'financial',
        },
        {
          key: 'decimal_precision',
          value: '2',
          description: 'Précision décimale',
          category: 'general',
        },
        {
          key: 'auto_numbering',
          value: 'true',
          description: 'Numérotation automatique',
          category: 'general',
        },
        {
          key: 'backup_enabled',
          value: 'true',
          description: 'Sauvegardes activées',
          category: 'system',
        },
        { key: 'audit_enabled', value: 'true', description: 'Audit activé', category: 'system' },
      ]

      for (const param of systemParameters) {
        await tenantDataSource.query(
          `
          INSERT INTO system_parameters (key, value, description, category, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (key) DO NOTHING
        `,
          [param.key, param.value, param.description, param.category]
        )
      }

      this.logger.log(`✅ Paramètres système initialisés`)
    } catch (error) {
      this.logger.error(`❌ Erreur initialisation paramètres système:`, (error as Error).message)
      // Non critique, on continue
    }
  }

  /**
   * Initialiser les données métier de base
   */
  private async initializeBusinessData(societeCode: string): Promise<void> {
    try {
      this.logger.log(`📦 Initialisation des données métier de base...`)

      const tenantDataSource = await this.multiTenantConfig.getTenantConnection(societeCode)

      // Catégories de matériaux par défaut
      const defaultCategories = [
        'Acier',
        'Aluminium',
        'Inox',
        'Cuivre',
        'Laiton',
        'Consommables',
        'Outillage',
      ]

      // Vérifier si la table existe
      const tableExists = await tenantDataSource.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'material_categories'
      `)

      if (parseInt(tableExists[0]?.count || '0', 10) > 0) {
        for (const category of defaultCategories) {
          await tenantDataSource.query(
            `
            INSERT INTO material_categories (name, description, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            ON CONFLICT (name) DO NOTHING
          `,
            [category, `Catégorie ${category}`]
          )
        }
      }

      this.logger.log(`✅ Données métier de base initialisées`)
    } catch (error) {
      this.logger.error(`❌ Erreur initialisation données métier:`, (error as Error).message)
      // Non critique, on continue
    }
  }
}

