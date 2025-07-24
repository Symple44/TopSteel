import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { DataSource, DataSourceOptions } from 'typeorm'

// Entités d'authentification (base auth)
import { Societe } from '../../modules/societes/entities/societe.entity'
import { Site } from '../../modules/societes/entities/site.entity'
import { SocieteUser } from '../../modules/societes/entities/societe-user.entity'
import { User } from '../../modules/users/entities/user.entity'
import { UserSettings } from '../../modules/users/entities/user-settings.entity'
import { Group } from '../../modules/auth/entities/group.entity'
import { Module } from '../../modules/auth/entities/module.entity'
import { Permission } from '../../modules/auth/entities/permission.entity'
import { Role } from '../../modules/auth/entities/role.entity'
import { RolePermission } from '../../modules/auth/entities/role-permission.entity'
import { UserGroup } from '../../modules/auth/entities/user-group.entity'
import { UserRole } from '../../modules/auth/entities/user-role.entity'
import { UserSession } from '../../modules/auth/entities/user-session.entity'
import { UserMFA } from '../../modules/auth/entities/user-mfa.entity'
import { MFASession } from '../../modules/auth/entities/mfa-session.entity'

// Entités partagées (base shared)
import { SharedEntities } from '../../modules/shared/entities'
import { SharedDataRegistry } from '../../modules/shared/entities/shared-data-registry.entity'

// Entités métier (bases sociétés)
import { Clients } from '../../modules/clients/entities/clients.entity'
import { Commande } from '../../modules/commandes/entities/commande.entity'
import { Devis } from '../../modules/devis/entities/devis.entity'
import { LigneDevis } from '../../modules/devis/entities/ligne-devis.entity'
import { Document } from '../../modules/documents/entities/document.entity'
import { Facturation } from '../../modules/facturation/entities/facturation.entity'
import { Fournisseur } from '../../modules/fournisseurs/entities/fournisseur.entity'
import { Machine } from '../../modules/machines/entities/machine.entity'
import { Maintenance } from '../../modules/maintenance/entities/maintenance.entity'
import { Materiaux } from '../../modules/materiaux/entities/materiaux.entity'
import { Notifications } from '../../modules/notifications/entities/notifications.entity'
import { Planning } from '../../modules/planning/entities/planning.entity'
import { Operation } from '../../modules/production/entities/operation.entity'
import { OrdreFabrication } from '../../modules/production/entities/ordre-fabrication.entity'
import { Production } from '../../modules/production/entities/production.entity'
import { Projet } from '../../modules/projets/entities/projet.entity'
import { Qualite } from '../../modules/qualite/entities/qualite.entity'
import { Chute } from '../../modules/stocks/entities/chute.entity'
import { Produit } from '../../modules/stocks/entities/produit.entity'
import { Stocks } from '../../modules/stocks/entities/stocks.entity'
import { Tracabilite } from '../../modules/tracabilite/entities/tracabilite.entity'

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
      host: this.configService.get('DB_HOST', 'localhost'),
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
        Group,
        Module,
        Permission,
        Role,
        RolePermission,
        UserGroup,
        UserRole,
        UserSession,
        UserMFA,
        MFASession,
      ],
      synchronize: false, // Toujours false en production
      logging: this.configService.get('DB_LOGGING', false),
      migrations: ['dist/database/migrations/auth/*.js'],
      migrationsRun: false,
    }
  }

  /**
   * Configuration de la base partagée (données métier communes)
   */
  getSharedDatabaseConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_SHARED_NAME', 'erp_topsteel_shared'),
      entities: SharedEntities,
      synchronize: false,
      logging: this.configService.get('DB_LOGGING', false),
      migrations: ['dist/database/migrations/shared/*.js'],
      migrationsRun: false,
    }
  }

  /**
   * Configuration d'une base société (données métier spécifiques)
   */
  getTenantDatabaseConfig(societeCode: string): DataSourceOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: `erp_topsteel_${societeCode.toLowerCase()}`,
      entities: [
        // Entités métier spécifiques à la société
        Clients,
        Commande,
        Devis,
        LigneDevis,
        Document,
        Facturation,
        Fournisseur,
        Machine,
        Maintenance,
        Materiaux,
        Notifications,
        Planning,
        Operation,
        OrdreFabrication,
        Production,
        Projet,
        Qualite,
        Chute,
        Produit,
        Stocks,
        Tracabilite,
      ],
      synchronize: false,
      logging: this.configService.get('DB_LOGGING', false),
      migrations: [`dist/database/migrations/tenant/*.js`],
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
    const promises = Array.from(this.dataSources.entries()).map(
      async ([code, dataSource]) => {
        if (dataSource.isInitialized) {
          await dataSource.destroy()
        }
      }
    )
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
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: 'postgres', // Base admin pour créer d'autres bases
    })

    await adminDataSource.initialize()

    try {
      const databaseName = `erp_topsteel_${societe.code.toLowerCase()}`
      
      // Créer la base de données
      await adminDataSource.query(
        `CREATE DATABASE "${databaseName}" WITH ENCODING 'UTF8'`
      )

      // Initialiser le schéma
      const tenantDataSource = await this.getTenantConnection(societe.code)
      await tenantDataSource.runMigrations()
      
    } finally {
      await adminDataSource.destroy()
    }
  }
}