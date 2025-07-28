import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DatabaseAdminController } from './controllers/database-admin.controller'
import { DatabaseHealthSimpleService } from './services/database-health-simple.service'
import { MigrationManagerService } from './services/migration-manager.service'
import { TenantConnectionService } from './services/tenant-connection.service'
import { TenantConnectionSimpleService } from './services/tenant-connection-simple.service'

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([], 'auth'),
    TypeOrmModule.forFeature([], 'shared'), 
    TypeOrmModule.forFeature([], 'tenant'),
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