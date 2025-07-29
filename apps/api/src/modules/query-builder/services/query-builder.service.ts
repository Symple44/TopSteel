import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { QueryBuilder, QueryBuilderColumn, QueryBuilderJoin, QueryBuilderCalculatedField } from '../entities'
import { CreateQueryBuilderDto } from '../dto/create-query-builder.dto'
import { UpdateQueryBuilderDto } from '../dto/update-query-builder.dto'
import { QueryBuilderPermissionService } from './query-builder-permission.service'

@Injectable()
export class QueryBuilderService {
  constructor(
    @InjectRepository(QueryBuilder, 'auth')
    private queryBuilderRepository: Repository<QueryBuilder>,
    @InjectRepository(QueryBuilderColumn, 'auth')
    private columnRepository: Repository<QueryBuilderColumn>,
    @InjectRepository(QueryBuilderJoin, 'auth')
    private joinRepository: Repository<QueryBuilderJoin>,
    @InjectRepository(QueryBuilderCalculatedField, 'auth')
    private calculatedFieldRepository: Repository<QueryBuilderCalculatedField>,
    private permissionService: QueryBuilderPermissionService,
  ) {}

  async create(createDto: CreateQueryBuilderDto, userId: string): Promise<QueryBuilder> {
    const queryBuilder = this.queryBuilderRepository.create({
      ...createDto,
      createdById: userId,
    })

    const saved = await this.queryBuilderRepository.save(queryBuilder)

    // Add default permission for creator
    await this.permissionService.addPermission({
      queryBuilderId: saved.id,
      userId,
      permissionType: 'edit',
      isAllowed: true,
    })

    return saved
  }

  async findAll(userId: string): Promise<QueryBuilder[]> {
    const queryBuilders = await this.queryBuilderRepository.find({
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
    const queryBuilder = await this.queryBuilderRepository.findOne({
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

  async update(id: string, updateDto: UpdateQueryBuilderDto, userId: string): Promise<QueryBuilder> {
    const queryBuilder = await this.findOne(id, userId)

    const canEdit = await this.permissionService.checkPermission(id, userId, 'edit')
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this Query Builder')
    }

    // Update columns if provided
    if (updateDto.columns) {
      await this.columnRepository.delete({ queryBuilderId: id })
      const columns = updateDto.columns.map(col => 
        this.columnRepository.create({ ...col, queryBuilderId: id })
      )
      await this.columnRepository.save(columns)
    }

    // Update joins if provided
    if (updateDto.joins) {
      await this.joinRepository.delete({ queryBuilderId: id })
      const joins = updateDto.joins.map(join => 
        this.joinRepository.create({ ...join, queryBuilderId: id })
      )
      await this.joinRepository.save(joins)
    }

    // Update calculated fields if provided
    if (updateDto.calculatedFields) {
      await this.calculatedFieldRepository.delete({ queryBuilderId: id })
      const fields = updateDto.calculatedFields.map(field => 
        this.calculatedFieldRepository.create({ ...field, queryBuilderId: id })
      )
      await this.calculatedFieldRepository.save(fields)
    }

    // Update main query builder
    const { columns, joins, calculatedFields, ...mainUpdate } = updateDto
    await this.queryBuilderRepository.update(id, mainUpdate)

    return this.findOne(id, userId)
  }

  async remove(id: string, userId: string): Promise<void> {
    const queryBuilder = await this.findOne(id, userId)

    const canDelete = await this.permissionService.checkPermission(id, userId, 'delete')
    if (!canDelete && queryBuilder.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to delete this Query Builder')
    }

    await this.queryBuilderRepository.remove(queryBuilder)
  }

  async duplicate(id: string, userId: string): Promise<QueryBuilder> {
    const original = await this.findOne(id, userId)

    const duplicate = this.queryBuilderRepository.create({
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

    const saved = await this.queryBuilderRepository.save(duplicate)

    // Duplicate columns
    const columns = original.columns.map(col => 
      this.columnRepository.create({
        ...col,
        id: undefined,
        queryBuilderId: saved.id,
      })
    )
    await this.columnRepository.save(columns)

    // Duplicate joins
    const joins = original.joins.map(join => 
      this.joinRepository.create({
        ...join,
        id: undefined,
        queryBuilderId: saved.id,
      })
    )
    await this.joinRepository.save(joins)

    // Duplicate calculated fields
    const fields = original.calculatedFields.map(field => 
      this.calculatedFieldRepository.create({
        ...field,
        id: undefined,
        queryBuilderId: saved.id,
      })
    )
    await this.calculatedFieldRepository.save(fields)

    return this.findOne(saved.id, userId)
  }
}