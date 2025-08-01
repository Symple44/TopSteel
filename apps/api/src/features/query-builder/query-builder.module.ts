import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
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
import { QueryBuilderService } from './services/query-builder.service'
import { QueryBuilderExecutorService } from './services/query-builder-executor.service'
import { QueryBuilderPermissionService } from './services/query-builder-permission.service'
import { SchemaIntrospectionService } from './services/schema-introspection.service'

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
  ],
  exports: [QueryBuilderService, QueryBuilderExecutorService],
})
export class QueryBuilderModule {}
