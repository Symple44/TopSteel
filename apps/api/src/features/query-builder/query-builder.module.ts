import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../../domains/users/entities/user.entity'
import { DatabaseCoreModule } from '../database-core/database-core.module'
import { QueryBuilderController } from './controllers/query-builder.controller'
import { SqlExecutorController } from './controllers/sql-executor.controller'
import {
  QueryBuilder,
  QueryBuilderCalculatedField,
  QueryBuilderColumn,
  QueryBuilderJoin,
  QueryBuilderPermission,
} from './entities'
import { QueryBuilderSecurityGuard } from './security/query-builder-security.guard'
// Security services
import { QueryBuilderSecurityService } from './security/query-builder-security.service'
import { SqlSanitizationService } from './security/sql-sanitization.service'
import { QueryBuilderService } from './services/query-builder.service'
import { QueryBuilderExecutorService } from './services/query-builder-executor.service'
import { QueryBuilderPermissionService } from './services/query-builder-permission.service'
import { SchemaIntrospectionService } from './services/schema-introspection.service'
import { User } from '@prisma/client'


@Module({
  imports: [
    DatabaseCoreModule, // Pour accéder aux DataSources
    TypeOrmModule.forFeature(
      [
        QueryBuilder,
        QueryBuilderColumn,
        QueryBuilderJoin,
        QueryBuilderCalculatedField,
        QueryBuilderPermission,
        User, // Nécessaire pour QueryBuilderPermissionService
      ],
      'auth' // Les entités QueryBuilder sont dans la base auth
    ),
  ],
  controllers: [QueryBuilderController, SqlExecutorController],
  providers: [
    QueryBuilderService,
    QueryBuilderExecutorService,
    QueryBuilderPermissionService,
    SchemaIntrospectionService,
    // Security services
    QueryBuilderSecurityService,
    SqlSanitizationService,
    QueryBuilderSecurityGuard,
  ],
  exports: [
    QueryBuilderService,
    QueryBuilderExecutorService,
    QueryBuilderSecurityService,
    SqlSanitizationService,
  ],
})
export class QueryBuilderModule {}

