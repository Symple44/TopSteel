import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { DataSource, type DataSourceOptions } from 'typeorm'
import { Group } from '../../../domains/auth/core/entities/group.entity'
import { MFASession } from '../../../domains/auth/core/entities/mfa-session.entity'
import { Module } from '../../../domains/auth/core/entities/module.entity'
import { Permission } from '../../../domains/auth/core/entities/permission.entity'
import { Role } from '../../../domains/auth/core/entities/role.entity'
import { RolePermission } from '../../../domains/auth/core/entities/role-permission.entity'
import { UserGroup } from '../../../domains/auth/core/entities/user-group.entity'
import { UserMFA } from '../../../domains/auth/core/entities/user-mfa.entity'
import { UserRole } from '../../../domains/auth/core/entities/user-role.entity'
import { UserSession } from '../../../domains/auth/core/entities/user-session.entity'
import { UserSocieteRole } from '../../../domains/auth/core/entities/user-societe-role.entity'
// Entités métier (bases sociétés) - Supprimées pour optimiser
// Entités marketplace
import { MarketplaceModule as MarketplaceModuleEntity } from '../../../features/marketplace/entities/marketplace-module.entity'
import { ModuleInstallation } from '../../../features/marketplace/entities/module-installation.entity'
import { ModuleRating } from '../../../features/marketplace/entities/module-rating.entity'
import { UserMenuPreference } from '../../../features/menu/entities/user-menu-preference.entity'
import { Article } from '../../../domains/inventory/entities/article.entity'
import { Material } from '../../../domains/materials/entities/material.entity'
import { Partner } from '../../../domains/partners/entities/partner.entity'
import { Notifications } from '../../../features/notifications/entities/notifications.entity'
import { ParameterApplication } from '../../../features/parameters/entities/parameter-application.entity'
import { ParameterClient } from '../../../features/parameters/entities/parameter-client.entity'
// Entités de paramètres (dans AUTH)
import { ParameterSystem } from '../../../features/parameters/entities/parameter-system.entity'
// Entités partagées (base shared)
import { SharedEntities } from '../../../features/shared/entities'
import { SharedDataRegistry } from '../../../features/shared/entities/shared-data-registry.entity'
import { Site } from '../../../features/societes/entities/site.entity'
// Entités d'authentification (base auth)
import { Societe } from '../../../features/societes/entities/societe.entity'
import { SocieteUser } from '../../../features/societes/entities/societe-user.entity'
import { User } from '../../../domains/users/entities/user.entity'
import { UserSettings } from '../../../domains/users/entities/user-settings.entity'

@Injectable()
export class MultiTenantDatabaseConfig {
  private dataSources: Map<string, DataSource> = new Map()

  constructor(private configService: ConfigService) {}

  /**
   * Configuration de la base d'authentification (utilisateurs, sociétés, permissions)
   */
  getAuthDatabaseConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', '127.0.0.1'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_AUTH_NAME', 'erp_topsteel_auth'),
      entities: [
        // Entités d'authentification et gestion des sociétés
        Societe,
        Site,
        SocieteUser,
        SharedDataRegistry, // Registre des données partagées
        User,
        UserSettings,
        UserMenuPreference,
        Group,
        Module,
        Permission,
        Role,
        RolePermission,
        UserGroup,
        UserRole,
        UserSocieteRole,
        UserSession,
        UserMFA,
        MFASession,
        // Entités marketplace (seulement catalogue global)
        MarketplaceModuleEntity,
        // Entités de paramètres
        ParameterSystem,
        ParameterApplication,
        ParameterClient,
      ],
      synchronize: false, // Toujours false en production
      logging: this.configService.get('DB_LOGGING', false),
      migrations: ['src/database/migrations/auth/*{.ts,.js}'],
      migrationsRun: false,
    }
  }

  /**
   * Configuration de la base partagée (données métier communes)
   */
  getSharedDatabaseConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', '127.0.0.1'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_SHARED_NAME', 'erp_topsteel_shared'),
      entities: SharedEntities,
      synchronize: false,
      logging: this.configService.get('DB_LOGGING', false),
      migrations: ['src/database/migrations/shared/*{.ts,.js}'],
      migrationsRun: false,
    }
  }

  /**
   * Configuration d'une base société (données métier spécifiques)
   */
  getTenantDatabaseConfig(societeCode: string): DataSourceOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', '127.0.0.1'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: `erp_topsteel_${societeCode.toLowerCase()}`,
      entities: [
        // Entités métier spécifiques à la société
        Partner,
        Article,
        Material,
        Notifications,
        // Entités marketplace spécifiques au tenant
        ModuleInstallation,
        ModuleRating,
      ],
      synchronize: false,
      logging: this.configService.get('DB_LOGGING', false),
      migrations: [`src/database/migrations/tenant/*{.ts,.js}`],
      migrationsRun: false,
    }
  }

  /**
   * Obtenir ou créer une connexion pour une société
   */
  async getTenantConnection(societeCode: string): Promise<DataSource> {
    if (this.dataSources.has(societeCode)) {
      const dataSource = this.dataSources.get(societeCode)!
      if (!dataSource.isInitialized) {
        await dataSource.initialize()
      }
      return dataSource
    }

    const config = this.getTenantDatabaseConfig(societeCode)
    const dataSource = new DataSource(config)
    await dataSource.initialize()
    this.dataSources.set(societeCode, dataSource)
    return dataSource
  }

  /**
   * Fermer une connexion société
   */
  async closeTenantConnection(societeCode: string): Promise<void> {
    const dataSource = this.dataSources.get(societeCode)
    if (dataSource?.isInitialized) {
      await dataSource.destroy()
      this.dataSources.delete(societeCode)
    }
  }

  /**
   * Fermer toutes les connexions
   */
  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.dataSources.entries()).map(async ([_code, dataSource]) => {
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    })
    await Promise.all(promises)
    this.dataSources.clear()
  }

  /**
   * Obtenir ou créer une connexion pour la base partagée
   */
  async getSharedConnection(): Promise<DataSource> {
    const sharedKey = 'shared'

    if (this.dataSources.has(sharedKey)) {
      const dataSource = this.dataSources.get(sharedKey)!
      if (!dataSource.isInitialized) {
        await dataSource.initialize()
      }
      return dataSource
    }

    const config = this.getSharedDatabaseConfig() as DataSourceOptions
    const dataSource = new DataSource(config)
    await dataSource.initialize()
    this.dataSources.set(sharedKey, dataSource)
    return dataSource
  }

  /**
   * Créer une nouvelle base de données pour une société
   */
  async createTenantDatabase(societe: Societe): Promise<void> {
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: this.configService.get('DB_HOST', '127.0.0.1'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: 'postgres', // Base admin pour créer d'autres bases
    })

    await adminDataSource.initialize()

    try {
      const databaseName = `erp_topsteel_${societe.code.toLowerCase()}`

      // Créer la base de données
      await adminDataSource.query(`CREATE DATABASE "${databaseName}" WITH ENCODING 'UTF8'`)

      // Initialiser le schéma
      const tenantDataSource = await this.getTenantConnection(societe.code)
      await tenantDataSource.runMigrations()
    } finally {
      await adminDataSource.destroy()
    }
  }
}
