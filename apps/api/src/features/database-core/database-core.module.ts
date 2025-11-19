import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'





import { DatabaseAdminController } from './controllers/database-admin.controller'
import { DatabaseHealthSimpleService } from './services/database-health-simple.service'
import { MigrationManagerService } from './services/migration-manager.service'
import { TenantConnectionService } from './services/tenant-connection.service'
import { TenantConnectionSimpleService } from './services/tenant-connection-simple.service'

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature(
      [User, UserMenuPreference, DiscoveredPage, Societe, SocieteUser],
      'auth'
    ),
    TypeOrmModule.forFeature([], 'shared'),
  ],
  controllers: [DatabaseAdminController],
  providers: [
    DatabaseHealthSimpleService,
    MigrationManagerService,
    TenantConnectionService,
    TenantConnectionSimpleService,
  ],
  exports: [
    DatabaseHealthSimpleService,
    MigrationManagerService,
    TenantConnectionService,
    TenantConnectionSimpleService,
  ],
})
export class DatabaseCoreModule {}
import { DiscoveredPage } from '../../features/menu/entities/discovered-page.entity'
import { Societe } from '../../features/societes/entities/societe.entity'
import { SocieteUser } from '../../features/societes/entities/societe-user.entity'
import { User } from '../../domains/users/entities/user.entity'
import { UserMenuPreference } from '../../domains/admin/entities/user-menu-preference.entity'
