import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../core/database/database.module'
import { QueryBuilderPrismaModule } from '../../domains/query-builder/prisma/query-builder-prisma.module'
import { QueryBuilderController } from './controllers/query-builder.controller'
import { SqlExecutorController } from './controllers/sql-executor.controller'
import { QueryBuilderSecurityGuard } from './security/query-builder-security.guard'
import { QueryBuilderSecurityService } from './security/query-builder-security.service'
import { SqlSanitizationService } from './security/sql-sanitization.service'
import { QueryBuilderService } from './services/query-builder.service'
import { QueryBuilderExecutorService } from './services/query-builder-executor.service'
import { QueryBuilderPermissionService } from './services/query-builder-permission.service'
import { SchemaIntrospectionService } from './services/schema-introspection.service'

/**
 * QueryBuilderModule - Fully Migrated to Prisma
 *
 * Status: ✅ ALL SERVICES ENABLED
 * - QueryBuilderService: CRUD operations via Prisma
 * - QueryBuilderPermissionService: Permission management
 * - QueryBuilderExecutorService: Query execution with PrismaService.$queryRawUnsafe
 * - SchemaIntrospectionService: Database schema discovery via Prisma
 * - QueryBuilderSecurityService: Table/column whitelist security
 * - SqlSanitizationService: SQL injection prevention
 * - QueryBuilderSecurityGuard: Access control guard
 *
 * @see docs/QUERY-BUILDER-IMPLEMENTATION.md for full documentation
 */
@Module({
  imports: [
    DatabaseModule,
    QueryBuilderPrismaModule,
  ],
  controllers: [
    QueryBuilderController,
    SqlExecutorController,
  ],
  providers: [
    // Core services
    QueryBuilderService,
    QueryBuilderPermissionService,
    // Execution services
    QueryBuilderExecutorService,
    SchemaIntrospectionService,
    // Security services
    QueryBuilderSecurityService,
    SqlSanitizationService,
    QueryBuilderSecurityGuard,
  ],
  exports: [
    QueryBuilderService,
    QueryBuilderPermissionService,
    QueryBuilderExecutorService,
    QueryBuilderSecurityService,
    SqlSanitizationService,
  ],
})
export class QueryBuilderModule {}
