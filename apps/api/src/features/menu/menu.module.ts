import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../../domains/auth/auth.module'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'
import { AvailablePagesController } from './controllers/available-pages.controller'
import { UserMenuPreferenceController } from './controllers/user-menu-preference.controller'
import { DiscoveredPage } from './entities/discovered-page.entity'
import { UserMenuPreference } from '../../domains/admin/entities/user-menu-preference.entity'
import { PageSyncService } from './services/page-sync.service'
import { UserMenuPreferenceService } from './services/user-menu-preference.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserMenuPreference, DiscoveredPage], 'auth'),
    AuthModule,
  ],
  controllers: [UserMenuPreferenceController, AvailablePagesController],
  providers: [UserMenuPreferenceService, PageSyncService, OptimizedCacheService],
  exports: [UserMenuPreferenceService, PageSyncService],
})
export class MenuModule {}
