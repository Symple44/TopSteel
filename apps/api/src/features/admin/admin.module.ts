import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'

import { AdminPrismaModule } from '../../domains/admin/prisma/admin-prisma.module'

// Import du module auth
import { AuthModule } from '../../domains/auth/auth.module'

// Import du module users
import { UsersModule } from '../../domains/users/users.module'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'
// Import du MenuModule pour accéder à PageSyncService
import { MenuModule } from '../menu/menu.module'

// Import du module societes
import { SocietesModule } from '../societes/societes.module'

// Controllers
import { AdminRolesController } from './controllers/admin-roles.controller'
import { AdminUsersController } from './controllers/admin-users.controller'
import { AdminCompanyController } from './controllers/admin-company.controller'
import { AuthPerformanceController } from './controllers/auth-performance.controller'
import { DatabaseIntegrityController } from './controllers/database-integrity.controller'
import { MenuRawController } from './controllers/menu-raw.controller'
import { SystemParametersController } from './system-parameters.controller'

// Services - All migrated to Prisma
import { AdminRolesService } from './services/admin-roles.service'
import { DatabaseBackupService } from './services/database-backup.service'
import { DatabaseEnumFixService } from './services/database-enum-fix.service'
import { DatabaseIntegrityService } from './services/database-integrity.service'
import { DatabaseStatsService } from './services/database-stats.service'
import { MenuConfigurationService } from './services/menu-configuration.service'
import { MenuRawService } from './services/menu-raw.service'
import { UserMenuPreferencesService } from './services/user-menu-preferences.service'
import { SystemParametersService } from './system-parameters.service'

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    MenuModule,
    SocietesModule,
    AuthModule,
    AdminPrismaModule,
  ],
  controllers: [
    AdminUsersController,
    AdminRolesController,
    AdminCompanyController,
    AuthPerformanceController,
    DatabaseIntegrityController,
    MenuRawController,
    SystemParametersController,
  ],
  providers: [
    // All services migrated to Prisma
    AdminRolesService,
    DatabaseBackupService,
    DatabaseEnumFixService,
    DatabaseIntegrityService,
    DatabaseStatsService,
    MenuConfigurationService,
    MenuRawService,
    UserMenuPreferencesService,
    SystemParametersService,
    OptimizedCacheService,
  ],
  exports: [
    AdminRolesService,
    DatabaseBackupService,
    DatabaseEnumFixService,
    DatabaseIntegrityService,
    DatabaseStatsService,
    MenuConfigurationService,
    MenuRawService,
    UserMenuPreferencesService,
    SystemParametersService,
  ],
})
export class AdminModule {}

