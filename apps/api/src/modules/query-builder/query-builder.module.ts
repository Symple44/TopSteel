import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QueryBuilderController } from './controllers/query-builder.controller'
import { QueryBuilderService } from './services/query-builder.service'
import { QueryBuilderExecutorService } from './services/query-builder-executor.service'
import { QueryBuilderPermissionService } from './services/query-builder-permission.service'
import { SchemaIntrospectionService } from './services/schema-introspection.service'
import {
  QueryBuilder,
  QueryBuilderColumn,
  QueryBuilderJoin,
  QueryBuilderCalculatedField,
  QueryBuilderPermission,
} from './entities'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QueryBuilder,
      QueryBuilderColumn,
      QueryBuilderJoin,
      QueryBuilderCalculatedField,
      QueryBuilderPermission,
    ]),
  ],
  controllers: [QueryBuilderController],
  providers: [
    QueryBuilderService,
    QueryBuilderExecutorService,
    QueryBuilderPermissionService,
    SchemaIntrospectionService,
  ],
  exports: [QueryBuilderService, QueryBuilderExecutorService],
})
export class QueryBuilderModule {}