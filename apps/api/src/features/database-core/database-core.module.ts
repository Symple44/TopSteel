import { DatabaseModule } from '../../core/database/database.module'
import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

// Services re-enabled - they use Prisma or are simple stubs
import { DatabaseAdminController } from './controllers/database-admin.controller'
import { DatabaseHealthSimpleService } from './services/database-health-simple.service'
import { MigrationManagerService } from './services/migration-manager.service'
import { TenantConnectionService } from './services/tenant-connection.service'
import { TenantConnectionSimpleService } from './services/tenant-connection-simple.service'

@Global()
@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
  ],
  controllers: [
    DatabaseAdminController, // Re-enabled - uses Prisma-compatible services
  ],
  providers: [
    DatabaseHealthSimpleService, // Simple stub service
    MigrationManagerService, // Uses PrismaService and TenantConnectionService
    TenantConnectionService, // Manages tenant database connections
    TenantConnectionSimpleService, // Simple stub service
  ],
  exports: [
    DatabaseHealthSimpleService,
    MigrationManagerService,
    TenantConnectionService,
    TenantConnectionSimpleService,
  ],
})
export class DatabaseCoreModule {}
