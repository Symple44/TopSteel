import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'

// import { MenuSyncController } from './controllers/menu-sync.controller'
// import { MenuConfigurationService } from './services/menu-configuration.service'
// import { MenuStartupSyncService } from './services/menu-startup-sync.service'
// import { MenuSyncService } from './services/menu-sync.service'

@Module({
  imports: [
    DatabaseModule,
    // TypeORM repositories disabled - using Prisma services
    // TypeOrmModule.forFeature(
    //   [MenuConfiguration, MenuItem, MenuItemPermission, MenuItemRole],
    //   'auth'
    // )
  ],
  controllers: [
    // MenuSyncController, // Disabled - depends on TypeORM services
  ],
  providers: [
    // MenuSyncService, // Disabled - uses TypeORM @InjectRepository
    // MenuConfigurationService, // Disabled - uses TypeORM @InjectRepository
    // MenuStartupSyncService, // Disabled - may depend on TypeORM services
  ],
  exports: [
    // MenuSyncService,
    // MenuConfigurationService
  ],
})
export class MenuSyncModule {}
