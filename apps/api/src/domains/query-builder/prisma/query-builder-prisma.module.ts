import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { QueryBuilderPrismaService } from './query-builder-prisma.service'
import { QueryBuilderColumnPrismaService } from './query-builder-column-prisma.service'
import { QueryBuilderJoinPrismaService } from './query-builder-join-prisma.service'
import { QueryBuilderCalculatedFieldPrismaService } from './query-builder-calculated-field-prisma.service'
import { QueryBuilderPermissionPrismaService } from './query-builder-permission-prisma.service'

/**
 * QueryBuilderPrismaModule - Phase 2.6 (Complete - 5/5 entities)
 *
 * Module pour gestion du query builder avec Prisma
 *
 * Provides:
 * - QueryBuilderPrismaService pour query builders
 * - QueryBuilderColumnPrismaService pour colonnes
 * - QueryBuilderJoinPrismaService pour jointures
 * - QueryBuilderCalculatedFieldPrismaService pour champs calculés
 * - QueryBuilderPermissionPrismaService pour permissions d'accès
 */
@Module({
  imports: [PrismaModule],
  providers: [
    QueryBuilderPrismaService,
    QueryBuilderColumnPrismaService,
    QueryBuilderJoinPrismaService,
    QueryBuilderCalculatedFieldPrismaService,
    QueryBuilderPermissionPrismaService,
  ],
  exports: [
    QueryBuilderPrismaService,
    QueryBuilderColumnPrismaService,
    QueryBuilderJoinPrismaService,
    QueryBuilderCalculatedFieldPrismaService,
    QueryBuilderPermissionPrismaService,
  ],
})
export class QueryBuilderPrismaModule {}
