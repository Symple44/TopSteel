import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities existantes
import { SystemParameter } from './entitites/system-parameter.entity'

// Nouvelles entities pour le menu
import { MenuConfiguration } from './entities/menu-configuration.entity'
import { MenuItem } from './entities/menu-item.entity'
import { MenuItemPermission } from './entities/menu-item-permission.entity'
import { MenuItemRole } from './entities/menu-item-role.entity'
import { UserMenuPreferences } from './entities/user-menu-preferences.entity'
import { UserMenuItemPreference } from './entities/user-menu-item-preference.entity'
import { DiscoveredPage } from '../menu/entities/discovered-page.entity'

// Services
import { SystemParametersService } from './system-parameters.service'
import { MenuConfigurationService } from './services/menu-configuration.service'
import { UserMenuPreferencesService } from './services/user-menu-preferences.service'
import { DatabaseIntegrityService } from './services/database-integrity.service'
import { DatabaseBackupService } from './services/database-backup.service'
import { DatabaseStatsService } from './services/database-stats.service'
import { DatabaseEnumFixService } from './services/database-enum-fix.service'
import { PageSyncService } from '../menu/services/page-sync.service'

// Controllers
import { SystemParametersController } from './system-parameters.controller'
import { DatabaseIntegrityController } from './controllers/database-integrity.controller'
import { MenuConfigurationController } from './controllers/menu-configuration.controller'
import { PageSyncController } from './controllers/page-sync.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemParameter,
      MenuConfiguration,
      MenuItem,
      MenuItemPermission,
      MenuItemRole,
      UserMenuPreferences,
      UserMenuItemPreference,
      DiscoveredPage
    ])
  ],
  controllers: [
    SystemParametersController,
    DatabaseIntegrityController,
    MenuConfigurationController,
    PageSyncController
  ],
  providers: [
    SystemParametersService,
    MenuConfigurationService,
    UserMenuPreferencesService,
    DatabaseIntegrityService,
    DatabaseBackupService,
    DatabaseStatsService,
    DatabaseEnumFixService,
    PageSyncService
  ],
  exports: [
    SystemParametersService,
    MenuConfigurationService,
    UserMenuPreferencesService,
    DatabaseIntegrityService,
    DatabaseBackupService,
    DatabaseStatsService,
    DatabaseEnumFixService,
    PageSyncService,
    TypeOrmModule
  ],
})
export class AdminModule {}