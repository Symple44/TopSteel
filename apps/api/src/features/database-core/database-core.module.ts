import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../../domains/users/entities/user.entity'
import { DiscoveredPage } from '../menu/entities/discovered-page.entity'
import { UserMenuPreference } from '../menu/entities/user-menu-preference.entity'
import { Societe } from '../societes/entities/societe.entity'
import { SocieteUser } from '../societes/entities/societe-user.entity'
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
