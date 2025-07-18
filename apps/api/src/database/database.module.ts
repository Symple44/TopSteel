// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DatabaseCleanupService } from './database-cleanup.service'
import { DatabaseSyncService } from './database-sync.service'
import { DatabasePreSyncService } from './database-pre-sync.service'

// Import explicite de TOUTES les entités pour debugging
// Entités admin (entitites)
import { SystemSetting } from '../modules/admin/entitites/system-setting.entity'
import { SystemParameter } from '../modules/admin/entitites/system-parameter.entity'
// Entités admin (entities)
import { MenuConfiguration } from '../modules/admin/entities/menu-configuration.entity'
import { MenuItem } from '../modules/admin/entities/menu-item.entity'
import { MenuItemPermission } from '../modules/admin/entities/menu-item-permission.entity'
import { MenuItemRole } from '../modules/admin/entities/menu-item-role.entity'
import { UserMenuPreferences } from '../modules/admin/entities/user-menu-preferences.entity'
import { UserMenuItemPreference } from '../modules/admin/entities/user-menu-item-preference.entity'
import { Clients } from '../modules/clients/entities/clients.entity'
import { Commande } from '../modules/commandes/entities/commande.entity'
import { Devis } from '../modules/devis/entities/devis.entity'
import { LigneDevis } from '../modules/devis/entities/ligne-devis.entity'
import { Document } from '../modules/documents/entities/document.entity'
import { Facturation } from '../modules/facturation/entities/facturation.entity'
import { Fournisseur } from '../modules/fournisseurs/entities/fournisseur.entity'
import { Machine } from '../modules/machines/entities/machine.entity'
import { Maintenance } from '../modules/maintenance/entities/maintenance.entity'
import { Materiaux } from '../modules/materiaux/entities/materiaux.entity'
import { Notifications } from '../modules/notifications/entities/notifications.entity'
import { Planning } from '../modules/planning/entities/planning.entity'
import { Operation } from '../modules/production/entities/operation.entity'
import { OrdreFabrication } from '../modules/production/entities/ordre-fabrication.entity'
import { Production } from '../modules/production/entities/production.entity'
import { Projet } from '../modules/projets/entities/projet.entity'
import { Qualite } from '../modules/qualite/entities/qualite.entity'
import { Chute } from '../modules/stocks/entities/chute.entity'
import { Produit } from '../modules/stocks/entities/produit.entity'
import { Stocks } from '../modules/stocks/entities/stocks.entity'
import { Tracabilite } from '../modules/tracabilite/entities/tracabilite.entity'
import { User } from '../modules/users/entities/user.entity'
import { UserMenuPreference } from '../modules/menu/entities/user-menu-preference.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST') || 'localhost'
        const port = configService.get<number>('DB_PORT') || 5432
        const username = configService.get<string>('DB_USERNAME') || 'postgres'
        const password = configService.get<string>('DB_PASSWORD') || 'postgres'
        const database = configService.get<string>('DB_NAME') || 'erp_topsteel'
        const synchronize = true // Activé pour créer les tables automatiquement
        const logging = configService.get<boolean>('DB_LOGGING') || false
        const ssl = configService.get<boolean>('DB_SSL')

        console.info('🔧 DatabaseModule - Configuration reçue du ConfigService:')
        console.info(`  host: ${host}`)
        console.info(`  port: ${port}`)
        console.info(`  username: ${username}`)
        console.info(`  password: ${'*'.repeat(password?.length || 0)}`)
        console.info(`  database: ${database}`)
        console.info(`  synchronize: ${synchronize}`)
        console.info(`  ssl: ${ssl}`)

        // TOUTES les entités du système
        const entities = [
          // Entités admin
          SystemSetting,
          SystemParameter,
          MenuConfiguration,
          MenuItem,
          MenuItemPermission,
          MenuItemRole,
          UserMenuPreferences,
          UserMenuItemPreference,
          
          // Entités principales avec UUID (BaseAuditEntity)
          User,
          UserMenuPreference,
          Clients,
          Fournisseur,
          Machine,
          Notifications,
          Production,
          Stocks,
          Chute,
          Maintenance,
          Materiaux,
          Planning,
          Qualite,
          Tracabilite,
          Devis,
          LigneDevis,
          Facturation,

          // Entités avec ID number (PrimaryGeneratedColumn)
          Produit,
          Commande,
          OrdreFabrication,
          Operation,
          Projet,
          Document,
        ]

        console.info(
          '🔧 Entités chargées:',
          entities.map((e) => e.name)
        )
        console.info(`🔧 Nombre total d'entités: ${entities.length}`)

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities,
          synchronize: false, // Désactivé - géré par DatabaseSyncService
          logging,
          ssl: false, // Désactivé pour le développement local
          // Configuration pour la production
          dropSchema: false, // Ne jamais drop le schéma automatiquement
          migrationsRun: false,
          migrations: [],
          // Options de connexion
          connectTimeoutMS: 30000,
          maxQueryExecutionTime: 10000,
          // Pool de connexions
          poolSize: 10,
          extra: {
            max: 10,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            sslmode: 'disable',
          },
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseCleanupService, DatabaseSyncService, DatabasePreSyncService],
  exports: [DatabaseCleanupService, DatabaseSyncService, DatabasePreSyncService],
})
export class DatabaseModule {}
