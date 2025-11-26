import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'

import { AuthModule } from '../../domains/auth/auth.module'
import { AdminPrismaModule } from '../../domains/admin/prisma/admin-prisma.module'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'
import { AvailablePagesController } from './controllers/available-pages.controller'
import { UserMenuPreferenceController } from './controllers/user-menu-preference.controller'

import { PageSyncService } from './services/page-sync.service'
import { UserMenuPreferenceCleanService } from './services/user-menu-preference-clean.service'

@Module({
  imports: [
    DatabaseModule,
    AdminPrismaModule, // For UserMenuPreferencePrismaService
    AuthModule
  ],
  controllers: [
    UserMenuPreferenceController, // Clean - uses pure Prisma
    AvailablePagesController
  ],
  providers: [
    UserMenuPreferenceCleanService, // Clean - uses pure Prisma
    PageSyncService, // Clean - uses pure Prisma
    OptimizedCacheService
  ],
  exports: [
    UserMenuPreferenceCleanService, // Clean - uses pure Prisma
    PageSyncService, // Clean - uses pure Prisma
  ],
})
export class MenuModule {}
