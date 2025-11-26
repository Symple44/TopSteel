/**
 * QueryBuilderService - Refactored to use Prisma services
 * Clean implementation using QueryBuilderPrismaService
 */

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { QueryBuilder } from '@prisma/client'
import { QueryBuilderCalculatedFieldPrismaService } from '../../../domains/query-builder/prisma/query-builder-calculated-field-prisma.service'
import { QueryBuilderColumnPrismaService } from '../../../domains/query-builder/prisma/query-builder-column-prisma.service'
import { QueryBuilderJoinPrismaService } from '../../../domains/query-builder/prisma/query-builder-join-prisma.service'
import { QueryBuilderPrismaService } from '../../../domains/query-builder/prisma/query-builder-prisma.service'
import type { CreateQueryBuilderDto } from '../dto/create-query-builder.dto'
import type { UpdateQueryBuilderDto } from '../dto/update-query-builder.dto'
import { QueryBuilderPermissionService } from './query-builder-permission.service'

@Injectable()
export class QueryBuilderService {
  constructor(
    private readonly queryBuilderPrisma: QueryBuilderPrismaService,
    private readonly columnPrisma: QueryBuilderColumnPrismaService,
    private readonly joinPrisma: QueryBuilderJoinPrismaService,
    private readonly calculatedFieldPrisma: QueryBuilderCalculatedFieldPrismaService,
    private readonly permissionService: QueryBuilderPermissionService
  ) {}

  async create(createDto: CreateQueryBuilderDto, userId: string, societeId: string): Promise<QueryBuilder> {
    const queryBuilder = await this.queryBuilderPrisma.createQueryBuilder({
      name: createDto.name,
      description: createDto.description,
      type: createDto.database || 'standard',
      baseTable: createDto.mainTable,
      createdBy: userId,
      societeId,
      isPublic: createDto.isPublic ?? false,
      isActive: true,
      settings: createDto.settings as unknown as Record<string, any>,
      layout: createDto.layout as unknown as Record<string, any>,
    })
    
    // Create columns if provided
    if (createDto.columns && createDto.columns.length > 0) {
      for (const col of createDto.columns) {
        await this.columnPrisma.createColumn({
          queryBuilderId: queryBuilder.id,
          tableName: col.tableName,
          columnName: col.columnName,
          alias: col.alias,
          dataType: col.dataType,
          order: col.displayOrder,
          isVisible: col.isVisible,
          width: col.width,
          format: col.format,
          aggregation: col.aggregation,
        })
      }
    }

    // Create joins if provided
    if (createDto.joins && createDto.joins.length > 0) {
      for (const join of createDto.joins) {
        await this.joinPrisma.createJoin({
          queryBuilderId: queryBuilder.id,
          joinType: join.joinType,
          sourceTable: join.fromTable,
          targetTable: join.toTable,
          sourceColumn: join.fromColumn,
          targetColumn: join.toColumn,
          order: join.order,
        })
      }
    }

    // Create calculated fields if provided
    if (createDto.calculatedFields && createDto.calculatedFields.length > 0) {
      for (const field of createDto.calculatedFields) {
        await this.calculatedFieldPrisma.createCalculatedField({
          queryBuilderId: queryBuilder.id,
          name: field.name,
          expression: field.expression,
          dataType: field.dataType,
          order: field.displayOrder,
          isVisible: field.isVisible,
          format: field.format,
        })
      }
    }
    
    await this.permissionService.addPermission({
      queryBuilderId: queryBuilder.id,
      userId,
      permissionType: 'edit',
      isAllowed: true,
    })

    return queryBuilder
  }

  async findAll(userId: string): Promise<QueryBuilder[]> {
    const queryBuilders = await this.queryBuilderPrisma.getAllQueryBuilders(false)

    const allowedQueryBuilders: QueryBuilder[] = []
    for (const qb of queryBuilders) {
      const canView = await this.permissionService.checkPermission(qb.id, userId, 'view')
      if (canView || qb.isPublic) {
        allowedQueryBuilders.push(qb)
      }
    }

    return allowedQueryBuilders
  }

  async findOne(id: string, userId: string): Promise<any> {
    const queryBuilder = await this.queryBuilderPrisma.getQueryBuilderWithRelations(id)

    if (!queryBuilder) {
      throw new NotFoundException('Query Builder not found')
    }

    const canView = await this.permissionService.checkPermission(id, userId, 'view')
    if (!canView && !queryBuilder.isPublic) {
      throw new ForbiddenException('You do not have permission to view this Query Builder')
    }

    return queryBuilder
  }

  async update(id: string, updateDto: UpdateQueryBuilderDto, userId: string): Promise<QueryBuilder> {
    await this.findOne(id, userId)

    const canEdit = await this.permissionService.checkPermission(id, userId, 'edit')
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this Query Builder')
    }

    const updated = await this.queryBuilderPrisma.updateQueryBuilder(id, {
      name: updateDto.name,
      description: updateDto.description,
      type: updateDto.database,
      baseTable: updateDto.mainTable,
      isPublic: updateDto.isPublic,
      isActive: true,
      settings: updateDto.settings as unknown as Record<string, any>,
      layout: updateDto.layout as unknown as Record<string, any>,
    })

    if (updateDto.columns) {
      await this.columnPrisma.deleteByQueryBuilderId(id)
      if (updateDto.columns.length > 0) {
        for (const col of updateDto.columns) {
          await this.columnPrisma.createColumn({
            queryBuilderId: id,
            tableName: col.tableName,
            columnName: col.columnName,
            alias: col.alias || col.columnName,
            dataType: col.dataType || 'string',
            isVisible: col.isVisible ?? true,
            order: col.displayOrder ?? 0,
            width: col.width,
            format: col.format,
            aggregation: col.aggregation,
          })
        }
      }
    }

    if (updateDto.joins) {
      await this.joinPrisma.deleteByQueryBuilderId(id)
      if (updateDto.joins.length > 0) {
        for (const join of updateDto.joins) {
          await this.joinPrisma.createJoin({
            queryBuilderId: id,
            joinType: join.joinType || 'INNER',
            sourceTable: join.fromTable,
            targetTable: join.toTable,
            sourceColumn: join.fromColumn,
            targetColumn: join.toColumn,
            order: join.order ?? 0,
          })
        }
      }
    }

    if (updateDto.calculatedFields) {
      await this.calculatedFieldPrisma.deleteByQueryBuilderId(id)
      if (updateDto.calculatedFields.length > 0) {
        for (const field of updateDto.calculatedFields) {
          await this.calculatedFieldPrisma.createCalculatedField({
            queryBuilderId: id,
            name: field.name,
            expression: field.expression,
            dataType: field.dataType || 'string',
            isVisible: field.isVisible ?? true,
            order: field.displayOrder ?? 0,
          })
        }
      }
    }

    return updated
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId)

    const canDelete = await this.permissionService.checkPermission(id, userId, 'delete')
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this Query Builder')
    }

    await this.queryBuilderPrisma.deleteQueryBuilder(id)
  }

  async duplicate(id: string, newName: string, userId: string): Promise<QueryBuilder> {
    const original = await this.findOne(id, userId)

    const canView = await this.permissionService.checkPermission(id, userId, 'view')
    if (!canView && !original.isPublic) {
      throw new ForbiddenException('You do not have permission to duplicate this Query Builder')
    }

    const duplicate = await this.queryBuilderPrisma.duplicateQueryBuilder(id, newName, userId)

    await this.permissionService.addPermission({
      queryBuilderId: duplicate.id,
      userId,
      permissionType: 'edit',
      isAllowed: true,
    })

    return duplicate
  }

  async getUserQueryBuilders(userId: string): Promise<QueryBuilder[]> {
    return this.queryBuilderPrisma.getUserQueryBuilders(userId, false)
  }

  async getPublicQueryBuilders(): Promise<QueryBuilder[]> {
    return this.queryBuilderPrisma.getPublicQueryBuilders(false)
  }

  async searchQueryBuilders(searchTerm: string, userId: string): Promise<QueryBuilder[]> {
    const results = await this.queryBuilderPrisma.searchQueryBuilders(searchTerm)

    const allowedResults: QueryBuilder[] = []
    for (const qb of results) {
      const canView = await this.permissionService.checkPermission(qb.id, userId, 'view')
      if (canView || qb.isPublic) {
        allowedResults.push(qb)
      }
    }

    return allowedResults
  }
}
