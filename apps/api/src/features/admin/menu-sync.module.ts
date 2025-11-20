import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenuConfiguration } from '../../domains/admin/entities/menu-configuration.entity'
import { MenuItem } from '../../domains/admin/entities/menu-item.entity'
import { MenuItemPermission } from './entities/menu-item-permission.entity'
import { MenuItemRole } from './entities/menu-item-role.entity'
import { MenuSyncController } from './controllers/menu-sync.controller'
import { MenuConfigurationService } from './services/menu-configuration.service'
import { MenuStartupSyncService } from './services/menu-startup-sync.service'
import { MenuSyncService } from './services/menu-sync.service'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [MenuConfiguration, MenuItem, MenuItemPermission, MenuItemRole],
      'auth'
    ),
  ],
  controllers: [MenuSyncController],
  providers: [MenuSyncService, MenuConfigurationService, MenuStartupSyncService],
  exports: [MenuSyncService, MenuConfigurationService],
})
export class MenuSyncModule {}
