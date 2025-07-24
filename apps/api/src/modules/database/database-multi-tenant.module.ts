import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MultiTenantDatabaseConfig } from '../../database/config/multi-tenant-database.config'

// Import des entités AUTH
import { Societe } from '../societes/entities/societe.entity'
import { Site } from '../societes/entities/site.entity'
import { SocieteUser } from '../societes/entities/societe-user.entity'
import { SharedDataRegistry } from '../shared/entities/shared-data-registry.entity'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../auth/entities/user-session.entity'
import { UserMFA } from '../auth/entities/user-mfa.entity'
import { MFASession } from '../auth/entities/mfa-session.entity'

// Import des entités SHARED
import { SharedEntities } from '../shared/entities'

// Import des entités AUTH supplémentaires
import { Role } from '../auth/entities/role.entity'
import { Permission } from '../auth/entities/permission.entity'
import { RolePermission } from '../auth/entities/role-permission.entity'
import { UserRole } from '../auth/entities/user-role.entity'
import { Group } from '../auth/entities/group.entity'
import { UserGroup } from '../auth/entities/user-group.entity'
import { Module as ModuleEntity } from '../auth/entities/module.entity'

// Import des entités de préférences utilisateur (maintenant dans AUTH)
import { UserSettings } from '../users/entities/user-settings.entity'
import { UserMenuPreference } from '../menu/entities/user-menu-preference.entity'
import { UserMenuItemPreference } from '../admin/entities/user-menu-item-preference.entity'
import { UserMenuPreferences } from '../admin/entities/user-menu-preferences.entity'

// Import des entités de notifications (maintenant dans AUTH)
import { Notifications } from '../notifications/entities/notifications.entity'
import { NotificationSettings } from '../notifications/entities/notification-settings.entity'

// Import des entités TENANT principales (pour datasource par défaut)
import { Clients } from '../clients/entities/clients.entity'
import { Fournisseur } from '../fournisseurs/entities/fournisseur.entity'
import { Materiaux } from '../materiaux/entities/materiaux.entity'
import { Stocks } from '../stocks/entities/stocks.entity'
import { Commande } from '../commandes/entities/commande.entity'

@Global()
@Module({
  imports: [
    ConfigModule,
    
    // Configuration de la base AUTH
    TypeOrmModule.forRootAsync({
      name: 'auth',
      imports: [ConfigModule],
      useFactory: (config: MultiTenantDatabaseConfig) => {
        return config.getAuthDatabaseConfig()
      },
      inject: [MultiTenantDatabaseConfig],
    }),

    // Configuration de la base SHARED
    TypeOrmModule.forRootAsync({
      name: 'shared',
      imports: [ConfigModule],
      useFactory: (config: MultiTenantDatabaseConfig) => {
        return config.getSharedDatabaseConfig()
      },
      inject: [MultiTenantDatabaseConfig],
    }),

    // Configuration de la base TENANT par défaut (topsteel)
    TypeOrmModule.forRootAsync({
      name: 'tenant',
      imports: [ConfigModule],
      useFactory: (config: MultiTenantDatabaseConfig) => {
        return config.getTenantDatabaseConfig('topsteel')
      },
      inject: [MultiTenantDatabaseConfig],
    }),

    // Export des repositories AUTH
    TypeOrmModule.forFeature([
      Societe,
      Site,  
      SocieteUser,
      SharedDataRegistry,
      User,
      UserSession,
      UserMFA,
      MFASession,
      Role,
      Permission,
      RolePermission,
      UserRole,
      Group,
      UserGroup,
      ModuleEntity,
      // Préférences utilisateur
      UserSettings,
      UserMenuPreference,
      UserMenuItemPreference,
      UserMenuPreferences,
      // Notifications
      Notifications,
      NotificationSettings,
    ], 'auth'),

    // Export des repositories SHARED
    TypeOrmModule.forFeature(SharedEntities, 'shared'),

    // Export des repositories TENANT (principales entités)
    TypeOrmModule.forFeature([
      Clients,
      Fournisseur,
      Materiaux,
      Stocks,
      Commande,
    ], 'tenant'),
  ],
  providers: [MultiTenantDatabaseConfig],
  exports: [
    MultiTenantDatabaseConfig,
    TypeOrmModule,
  ],
})
export class DatabaseMultiTenantModule {}