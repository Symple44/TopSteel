import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserMenuPreference } from './entities/user-menu-preference.entity'
import { UserMenuPreferenceService } from './services/user-menu-preference.service'
import { PageSyncService } from './services/page-sync.service'
import { UserMenuPreferenceController } from './controllers/user-menu-preference.controller'
import { AvailablePagesController } from './controllers/available-pages.controller'

@Module({
  imports: [
    // UserMenuPreference est déjà enregistré dans DatabaseMultiTenantModule
  ],
  controllers: [
    UserMenuPreferenceController,
    AvailablePagesController
  ],
  providers: [
    UserMenuPreferenceService,
    PageSyncService
  ],
  exports: [
    UserMenuPreferenceService,
    PageSyncService
  ],
})
export class MenuModule {}