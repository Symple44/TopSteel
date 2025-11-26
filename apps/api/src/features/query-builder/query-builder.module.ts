import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../core/database/database.module'
import { QueryBuilderPrismaModule } from '../../domains/query-builder/prisma/query-builder-prisma.module'
import { QueryBuilderController } from './controllers/query-builder.controller'
// import { SqlExecutorController } from './controllers/sql-executor.controller'
// import { QueryBuilderSecurityGuard } from './security/query-builder-security.guard'
// import { QueryBuilderSecurityService } from './security/query-builder-security.service'
// import { SqlSanitizationService } from './security/sql-sanitization.service'
import { QueryBuilderService } from './services/query-builder.service'
// import { QueryBuilderExecutorService } from './services/query-builder-executor.service'
import { QueryBuilderPermissionService } from './services/query-builder-permission.service'
// import { SchemaIntrospectionService } from './services/schema-introspection.service'

/**
 * QueryBuilderModule - Migrated to Prisma
 * 
 * Status:
 * ✅ QueryBuilderService - Refactored to use Prisma services
 * ✅ QueryBuilderPermissionService - Refactored to use Prisma services
 * ❌ QueryBuilderController - Depends on unrefactored services (Executor, Security)
 * ❌ QueryBuilderExecutorService - Uses @InjectDataSource('tenant')
 * ❌ SchemaIntrospectionService - Uses @InjectDataSource('tenant')
 * ❌ QueryBuilderSecurityService - Uses @InjectDataSource('tenant')
 * ❌ SqlSanitizationService - Depends on QueryBuilderSecurityService
 */
@Module({
  imports: [
    DatabaseModule,
    QueryBuilderPrismaModule, // ✅ All Prisma services
  ],
  controllers: [
    // QueryBuilderController, // Disabled - depends on unrefactored services
    // SqlExecutorController - Disabled - depends on unrefactored services
  ],
  providers: [
    // ✅ Refactored services using Prisma
    QueryBuilderService,
    QueryBuilderPermissionService,
    
    // ❌ Not yet refactored - need @InjectDataSource migration
    // QueryBuilderExecutorService,
    // SchemaIntrospectionService,
    // QueryBuilderSecurityService,
    // SqlSanitizationService,
    // QueryBuilderSecurityGuard,
  ],
  exports: [
    QueryBuilderService,
    QueryBuilderPermissionService,
    // QueryBuilderExecutorService,
    // QueryBuilderSecurityService,
    // SqlSanitizationService,
  ],
})
export class QueryBuilderModule {}
