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

// Auth entities
import { Role } from '../auth/entities/role.entity'
import { Permission } from '../auth/entities/permission.entity'
import { RolePermission } from '../auth/entities/role-permission.entity'

// Services
import { SystemParametersService } from './system-parameters.service'
import { MenuConfigurationService } from './services/menu-configuration.service'
import { UserMenuPreferencesService } from './services/user-menu-preferences.service'
import { DatabaseIntegrityService } from './services/database-integrity.service'
import { DatabaseBackupService } from './services/database-backup.service'
import { DatabaseStatsService } from './services/database-stats.service'
import { DatabaseEnumFixService } from './services/database-enum-fix.service'
import { AdminRolesService } from './services/admin-roles.service'

// Import du MenuModule pour accéder à PageSyncService
import { MenuModule } from '../menu/menu.module'

// Controllers
import { SystemParametersController } from './system-parameters.controller'
import { DatabaseIntegrityController } from './controllers/database-integrity.controller'
import { MenuConfigurationController } from './controllers/menu-configuration.controller'
import { PageSyncController } from './controllers/page-sync.controller'
import { AdminUsersController } from './controllers/admin-users.controller'
import { AdminRolesController } from './controllers/admin-roles.controller'

// Import du module users
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    UsersModule,
    MenuModule,
    TypeOrmModule.forFeature([Role, Permission, RolePermission], 'auth')
  ],
  controllers: [
    SystemParametersController,
    DatabaseIntegrityController,
    MenuConfigurationController,
    PageSyncController,
    AdminUsersController,
    AdminRolesController
  ],
  providers: [
    SystemParametersService,
    MenuConfigurationService,
    UserMenuPreferencesService,
    DatabaseIntegrityService,
    DatabaseBackupService,
    DatabaseStatsService,
    DatabaseEnumFixService,
    AdminRolesService
  ],
  exports: [
    SystemParametersService,
    MenuConfigurationService,
    UserMenuPreferencesService,
    DatabaseIntegrityService,
    DatabaseBackupService,
    DatabaseStatsService,
    DatabaseEnumFixService,
    TypeOrmModule
  ],
})
export class AdminModule {}