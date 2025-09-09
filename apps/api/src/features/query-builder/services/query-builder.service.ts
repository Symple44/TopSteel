import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DeepPartial, Repository } from 'typeorm'
import type { CreateQueryBuilderDto } from '../dto/create-query-builder.dto'
import type { UpdateQueryBuilderDto } from '../dto/update-query-builder.dto'
import {
  QueryBuilder,
  QueryBuilderCalculatedField,
  QueryBuilderColumn,
  QueryBuilderJoin,
  type JoinType,
} from '../entities'
import type { QueryBuilderPermissionService } from './query-builder-permission.service'

// Interface for format field
export interface FieldFormat {
  type?: 'date' | 'number' | 'currency' | 'percentage' | 'boolean' | 'custom'
  pattern?: string
  prefix?: string
  suffix?: string
  decimals?: number
}

// Interface for aggregation field
export interface FieldAggregation {
  enabled?: boolean
  type?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

// Interface for update data
interface QueryBuilderUpdateData {
  name?: string
  description?: string
  database?: string
  mainTable?: string
  isPublic?: boolean
  maxRows?: number
  settings?: {
    enablePagination?: boolean
    pageSize?: number
    enableSorting?: boolean
    enableFiltering?: boolean
    enableExport?: boolean
    exportFormats?: string[]
  }
  layout?: Record<string, unknown>
}

@Injectable()
export class QueryBuilderService {
  constructor(
    @InjectRepository(QueryBuilder, 'auth')
    private _queryBuilderRepository: Repository<QueryBuilder>,
    @InjectRepository(QueryBuilderColumn, 'auth')
    private _columnRepository: Repository<QueryBuilderColumn>,
    @InjectRepository(QueryBuilderJoin, 'auth')
    private _joinRepository: Repository<QueryBuilderJoin>,
    @InjectRepository(QueryBuilderCalculatedField, 'auth')
    private _calculatedFieldRepository: Repository<QueryBuilderCalculatedField>,
    private readonly permissionService: QueryBuilderPermissionService
  ) {}

  async create(createDto: CreateQueryBuilderDto, userId: string): Promise<QueryBuilder> {
    const queryData = {
      ...createDto,
      createdById: userId,
    } as DeepPartial<QueryBuilder>

    const queryBuilder = this._queryBuilderRepository.create(queryData)
    const saved = await this._queryBuilderRepository.save(queryBuilder)
    const savedEntity = Array.isArray(saved) ? saved[0] : saved

    // Add default permission for creator
    await this.permissionService.addPermission({
      queryBuilderId: savedEntity.id,
      userId,
      permissionType: 'edit',
      isAllowed: true,
    })

    return savedEntity
  }

  async findAll(userId: string): Promise<QueryBuilder[]> {
    const queryBuilders = await this._queryBuilderRepository.find({
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' },
    })

    // Filter based on permissions
    const allowedQueryBuilders: QueryBuilder[] = []
    for (const qb of queryBuilders) {
      const canView = await this.permissionService.checkPermission(qb.id, userId, 'view')
      if (canView || qb.isPublic) {
        allowedQueryBuilders.push(qb)
      }
    }

    return allowedQueryBuilders
  }

  async findOne(id: string, userId: string): Promise<QueryBuilder> {
    const queryBuilder = await this._queryBuilderRepository.findOne({
      where: { id },
      relations: ['columns', 'joins', 'calculatedFields', 'createdBy'],
    })

    if (!queryBuilder) {
      throw new NotFoundException('Query Builder not found')
    }

    const canView = await this.permissionService.checkPermission(id, userId, 'view')
    if (!canView && !queryBuilder.isPublic) {
      throw new ForbiddenException('You do not have permission to view this Query Builder')
    }

    return queryBuilder
  }

  async update(
    id: string,
    updateDto: UpdateQueryBuilderDto,
    userId: string
  ): Promise<QueryBuilder> {
    const _queryBuilder = await this.findOne(id, userId)

    const canEdit = await this.permissionService.checkPermission(id, userId, 'edit')
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this Query Builder')
    }

    // Update columns if provided
    if (updateDto.columns) {
      await this._columnRepository.delete({ queryBuilderId: id })
      if (updateDto.columns.length > 0) {
        const columnsData = updateDto.columns.map((col) => ({
          ...col,
          queryBuilderId: id,
        }))
        const columns = this._columnRepository.create(columnsData)
        await this._columnRepository.save(columns)
      }
    }

    // Update joins if provided
    if (updateDto.joins) {
      await this._joinRepository.delete({ queryBuilderId: id })
      if (updateDto.joins.length > 0) {
        const joinsData = updateDto.joins.map((join) => ({
          ...join,
          queryBuilderId: id,
        }))
        const joins = this._joinRepository.create(joinsData)
        await this._joinRepository.save(joins)
      }
    }

    // Update calculated fields if provided
    if (updateDto.calculatedFields) {
      await this._calculatedFieldRepository.delete({ queryBuilderId: id })
      if (updateDto.calculatedFields.length > 0) {
        const fieldsData = updateDto.calculatedFields.map((field) => ({
          ...field,
          queryBuilderId: id,
        }))
        const fields = this._calculatedFieldRepository.create(fieldsData)
        await this._calculatedFieldRepository.save(fields)
      }
    }

    // Update main query builder
    const {
      columns: _columns,
      joins: _joins,
      calculatedFields: _calculatedFields,
      ...mainUpdate
    } = updateDto
    await this._queryBuilderRepository.update(id, mainUpdate as QueryBuilderUpdateData)

    return this.findOne(id, userId)
  }

  async remove(id: string, userId: string): Promise<void> {
    const queryBuilder = await this.findOne(id, userId)

    const canDelete = await this.permissionService.checkPermission(id, userId, 'delete')
    if (!canDelete && queryBuilder.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to delete this Query Builder')
    }

    await this._queryBuilderRepository.remove(queryBuilder)
  }

  async duplicate(id: string, userId: string): Promise<QueryBuilder> {
    const original = await this.findOne(id, userId)

    const duplicate = this._queryBuilderRepository.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      database: original.database,
      mainTable: original.mainTable,
      isPublic: false,
      maxRows: original.maxRows,
      settings: original.settings,
      layout: original.layout,
      createdById: userId,
    })

    const saved = await this._queryBuilderRepository.save(duplicate)
    const savedEntity = Array.isArray(saved) ? saved[0] : saved

    // Duplicate columns
    if (original.columns && original.columns.length > 0) {
      const columns = original.columns.map((col) => {
        const { id, ...columnData } = col
        return this._columnRepository.create({
          ...columnData,
          queryBuilderId: savedEntity.id,
        } as DeepPartial<QueryBuilderColumn>)
      })
      await this._columnRepository.save(columns)
    }

    // Duplicate joins
    if (original.joins && original.joins.length > 0) {
      const joins = original.joins.map((join) => {
        const { id, ...joinData } = join
        return this._joinRepository.create({
          ...joinData,
          queryBuilderId: savedEntity.id,
        } as DeepPartial<QueryBuilderJoin>)
      })
      await this._joinRepository.save(joins)
    }

    // Duplicate calculated fields
    if (original.calculatedFields && original.calculatedFields.length > 0) {
      const fields = original.calculatedFields.map((field) => {
        const { id, ...fieldData } = field
        
        return this._calculatedFieldRepository.create({
          ...fieldData,
          queryBuilderId: savedEntity.id,
        } as DeepPartial<QueryBuilderCalculatedField>)
      })
      await this._calculatedFieldRepository.save(fields)
    }

    return this.findOne(savedEntity.id, userId)
  }
}
