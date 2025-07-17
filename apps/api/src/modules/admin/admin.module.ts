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

// Services
import { SystemParametersService } from './system-parameters.service'
import { MenuConfigurationService } from './services/menu-configuration.service'
import { UserMenuPreferencesService } from './services/user-menu-preferences.service'
import { DatabaseIntegrityService } from './services/database-integrity.service'

// Controllers
import { SystemParametersController } from './system-parameters.controller'
import { DatabaseIntegrityController } from './controllers/database-integrity.controller'
import { MenuConfigurationController } from './controllers/menu-configuration.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemParameter,
      MenuConfiguration,
      MenuItem,
      MenuItemPermission,
      MenuItemRole,
      UserMenuPreferences,
      UserMenuItemPreference
    ])
  ],
  controllers: [
    SystemParametersController,
    DatabaseIntegrityController,
    MenuConfigurationController
  ],
  providers: [
    SystemParametersService,
    MenuConfigurationService,
    UserMenuPreferencesService,
    DatabaseIntegrityService
  ],
  exports: [
    SystemParametersService,
    MenuConfigurationService,
    UserMenuPreferencesService,
    DatabaseIntegrityService,
    TypeOrmModule
  ],
})
export class AdminModule {}