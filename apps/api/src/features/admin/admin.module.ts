import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Entities existantes
import { SystemParameter } from './entitites/system-parameter.entity'

// import { UserMenuPreferences } from './entities/user-menu-preferences.entity'
// import { UserMenuItemPreference } from './entities/user-menu-item-preference.entity'

// Import du module auth
import { AuthModule } from '../../domains/auth/auth.module'
import { Permission } from '../../domains/auth/core/entities/permission.entity'
// Auth entities
import { Role } from '../../domains/auth/core/entities/role.entity'
import { RolePermission } from '../../domains/auth/core/entities/role-permission.entity'
// Import du module users
import { UsersModule } from '../../domains/users/users.module'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'
// Import du MenuModule pour accéder à PageSyncService
import { MenuModule } from '../menu/menu.module'
// Import du module societes
import { SocietesModule } from '../societes/societes.module'
import { AdminMFAController } from './controllers/admin-mfa.controller'
import { AdminRolesController } from './controllers/admin-roles.controller'
import { AdminSocietesController } from './controllers/admin-societes.controller'
import { AdminUsersController } from './controllers/admin-users.controller'
import { AuthPerformanceController } from './controllers/auth-performance.controller'
import { DatabaseIntegrityController } from './controllers/database-integrity.controller'
import { MenuRawController } from './controllers/menu-raw.controller'
import { PageSyncController } from './controllers/page-sync.controller'
import { AdminRolesService } from './services/admin-roles.service'
import { DatabaseBackupService } from './services/database-backup.service'
import { DatabaseEnumFixService } from './services/database-enum-fix.service'
// import { UserMenuPreferencesService } from './services/user-menu-preferences.service'
import { DatabaseIntegrityService } from './services/database-integrity.service'
import { DatabaseStatsService } from './services/database-stats.service'
import { MenuRawService } from './services/menu-raw.service'
// Controllers
import { SystemParametersController } from './system-parameters.controller'
// Services
import { SystemParametersService } from './system-parameters.service'

@Module({
  imports: [
    UsersModule,
    MenuModule,
    SocietesModule,
    AuthModule,
    TypeOrmModule.forFeature([SystemParameter], 'auth'),
    // TypeOrmModule.forFeature([
    // Toutes les entités de menu causent des problèmes TypeScript
    // Utilisation de requêtes SQL brutes via MenuRawService
    // ], 'auth'),
    TypeOrmModule.forFeature([Role, Permission, RolePermission], 'auth'),
  ],
  controllers: [
    SystemParametersController,
    DatabaseIntegrityController,
    // MenuConfigurationController,  // Dépend d'entités TypeORM problématiques
    PageSyncController,
    AdminUsersController,
    AdminRolesController, // Réactivé pour l'endpoint permissions
    AdminSocietesController, // Gestion multi-société
    AuthPerformanceController, // Monitoring des performances
    AdminMFAController, // Gestion MFA
    // AdminMenusController,  // Dépend d'entités TypeORM problématiques
    // MenuTestController,  // Dépend d'entités TypeORM problématiques
    MenuRawController, // Service de menu avec requêtes SQL brutes
  ],
  providers: [
    SystemParametersService,
    // MenuConfigurationService,  // Retiré car dépend d'entités TypeORM problématiques
    MenuRawService, // Service de menu avec requêtes SQL brutes - FONCTIONNEL
    // UserMenuPreferencesService,  // Service retiré temporairement
    DatabaseIntegrityService,
    DatabaseBackupService,
    DatabaseStatsService,
    DatabaseEnumFixService,
    AdminRolesService, // Réactivé pour AdminRolesController
    OptimizedCacheService, // Service de cache REDIS
  ],
  exports: [
    SystemParametersService,
    // MenuConfigurationService,  // Retiré car dépend d'entités TypeORM problématiques
    MenuRawService, // Service de menu avec requêtes SQL brutes - FONCTIONNEL
    // UserMenuPreferencesService,  // Service retiré temporairement
    DatabaseIntegrityService,
    DatabaseBackupService,
    DatabaseStatsService,
    DatabaseEnumFixService,
    TypeOrmModule,
  ],
})
export class AdminModule {}
