import { Global, Module } from '@nestjs/common'
import { TenantConnectionService } from './services/tenant-connection.service'
import { DatabaseHealthService } from './services/database-health.service'
import { MigrationManagerService } from './services/migration-manager.service'
import { DatabaseAdminController } from './controllers/database-admin.controller'

@Global()
@Module({
  controllers: [DatabaseAdminController],
  providers: [
    TenantConnectionService,
    DatabaseHealthService,
    MigrationManagerService,
  ],
  exports: [
    TenantConnectionService,
    DatabaseHealthService,
    MigrationManagerService,
  ],
})
export class DatabaseCoreModule {}