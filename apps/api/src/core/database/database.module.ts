// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
// Entités API (entitites)
import { UiPreferencesReorderableList } from '../../api/entities/ui-preferences-reorderable-list.entity'
import { MFASession } from '../../domains/auth/core/entities/mfa-session.entity'
import { UserMFA } from '../../domains/auth/core/entities/user-mfa.entity'
import { UserSession } from '../../domains/auth/core/entities/user-session.entity'
import { User } from '../../domains/users/entities/user.entity'
// Entités admin (entities)
import { MenuConfiguration } from '../../features/admin/entities/menu-configuration.entity'
import { MenuItem } from '../../features/admin/entities/menu-item.entity'
import { MenuItemPermission } from '../../features/admin/entities/menu-item-permission.entity'
import { MenuItemRole } from '../../features/admin/entities/menu-item-role.entity'
import { UserMenuItemPreference } from '../../features/admin/entities/user-menu-item-preference.entity'
import { UserMenuPreferences } from '../../features/admin/entities/user-menu-preferences.entity'
import { SystemParameter } from '../../features/admin/entitites/system-parameter.entity'
// Import explicite de TOUTES les entités pour debugging
// Entités admin (entitites)
import { SystemSetting } from '../../features/admin/entitites/system-setting.entity'
// Entités métier supprimées pour optimiser le debug
import { UserMenuPreference } from '../../features/menu/entities/user-menu-preference.entity'
import { Notifications } from '../../features/notifications/entities/notifications.entity'
import { DatabaseCleanupService } from './database-cleanup.service'
import { DatabasePreSyncService } from './database-pre-sync.service'
import { DatabaseSyncService } from './database-sync.service'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST') || 'localhost'
        const port = configService.get<number>('DB_PORT') || 5432
        const username = configService.get<string>('DB_USERNAME') || 'postgres'
        const password = (() => {
          const pwd = configService.get<string>('DB_PASSWORD')
          const nodeEnv = configService.get<string>('NODE_ENV')

          if (!pwd) {
            if (nodeEnv === 'production') {
              throw new Error('DB_PASSWORD environment variable is required in production')
            }
            // Use development default password for non-production environments
            return 'dev_password'
          }
          return pwd
        })()
        const database = configService.get<string>('DB_NAME') || 'erp_topsteel'
        const _synchronize = true // Activé pour créer les tables automatiquement
        const logging = configService.get<boolean>('DB_LOGGING') || false
        const _ssl = configService.get<boolean>('DB_SSL')

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

          // Entités API
          UiPreferencesReorderableList,

          // Entités auth
          UserSession,
          UserMFA,
          MFASession,

          // Entités principales avec UUID (BaseAuditEntity)
          User,
          UserMenuPreference,
          Notifications,
        ]

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
