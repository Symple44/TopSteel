import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import { Public } from '../../../core/multi-tenant'

// RequestWithUser type definition for query builder operations
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string
    email: string
    roles?: string[]
    permissions?: string[]
  }
}

import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type { CreateQueryBuilderDto } from '../dto/create-query-builder.dto'
import type { ExecuteQueryDto } from '../dto/execute-query.dto'
import type { UpdateQueryBuilderDto } from '../dto/update-query-builder.dto'
import {
  QueryBuilderReadAccess,
  QueryBuilderSecurityGuard,
  QueryBuilderWriteAccess,
} from '../security/query-builder-security.guard'
import { QueryBuilderSecurityService } from '../security/query-builder-security.service'
import { QueryBuilderService } from '../services/query-builder.service'
import { QueryBuilderExecutorService } from '../services/query-builder-executor.service'
import type { QueryExecutionParams } from '../services/query-builder-executor.service'
import { SchemaIntrospectionService } from '../services/schema-introspection.service'

@Controller('query-builder')
@Public() // Bypass global TenantGuard - JwtAuthGuard handles JWT auth
@UseGuards(JwtAuthGuard, QueryBuilderSecurityGuard)
export class QueryBuilderController {
  private readonly logger = new Logger(QueryBuilderController.name)

  constructor(
    private readonly queryBuilderService: QueryBuilderService,
    private readonly executorService: QueryBuilderExecutorService,
    private readonly schemaService: SchemaIntrospectionService,
    private readonly securityService: QueryBuilderSecurityService
  ) {}

  @Post()
  @QueryBuilderWriteAccess()
  async create(@Body() createDto: CreateQueryBuilderDto, @Request() req: RequestWithUser) {
    this.logger.log('Query builder creation requested', {
      userId: req.user.id,
      name: createDto.name,
      mainTable: createDto.mainTable,
    })

    try {
      // Validate main table access
      this.securityService.validateTable(createDto.mainTable)

      // Use a default societeId or get from user context if available
      const societeId = (req.user as { societeId?: string }).societeId || 'default-societe-id'
      return await this.queryBuilderService.create(createDto, req.user.id, societeId)
    } catch (error) {
      this.logger.error('Failed to create query builder', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  @Get()
  @QueryBuilderReadAccess()
  async findAll(@Request() req: RequestWithUser) {
    this.logger.log('Query builders list requested', {
      userId: req.user.id,
    })

    try {
      return await this.queryBuilderService.findAll(req.user.id)
    } catch (error) {
      this.logger.error('Failed to get query builders', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new BadRequestException('Failed to retrieve query builders')
    }
  }

  @Get('schema/tables')
  @QueryBuilderReadAccess()
  async getTables(@Query('schema') schema: string = 'public', @Request() req: RequestWithUser) {
    this.logger.log('Available tables requested', {
      userId: req.user.id,
      schema,
    })

    try {
      // Return only whitelisted tables instead of all schema tables
      const allowedTables = this.securityService.getAllowedTables()

      return allowedTables.map((table) => ({
        tableName: table.name,
        schemaName: schema,
        description: table.description,
        allowFiltering: table.allowFiltering,
        allowSorting: table.allowSorting,
        allowJoins: table.allowJoins,
        maxRows: table.maxRows,
      }))
    } catch (error) {
      this.logger.error('Failed to get available tables', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new BadRequestException('Failed to retrieve available tables')
    }
  }

  @Get('schema/tables/:table/columns')
  @QueryBuilderReadAccess()
  async getTableColumns(
    @Param('table') table: string,
    @Query('schema') schema: string = 'public',
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    this.logger.log('Table columns requested', {
      userId: req.user.id,
      table,
      schema,
    })

    try {
      // Validate table access first
      this.securityService.validateTable(table)

      // Return only whitelisted columns
      const allowedColumns = this.securityService.getAllowedColumns(table)

      // Filter out sensitive columns
      return allowedColumns
        .filter((col) => !col.isSensitive || col.name !== 'company_id')
        .map((col) => ({
          tableName: table,
          columnName: col.name,
          dataType: col.dataType,
          allowSelect: col.allowSelect,
          allowFilter: col.allowFilter,
          allowSort: col.allowSort,
          allowJoin: col.allowJoin,
          validationPattern: col.validationPattern,
          allowedOperators: col.allowedOperators,
        }))
    } catch (error) {
      this.logger.error('Failed to get table columns', {
        userId: req.user.id,
        table,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error // Re-throw as it's already properly formatted
    }
  }

  @Get('schema/tables/:table/relations')
  @QueryBuilderReadAccess()
  async getTableRelations(
    @Param('table') table: string,
    @Query('schema') schema: string = 'public',
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    this.logger.log('Table relations requested', {
      userId: req.user.id,
      table,
      schema,
    })

    try {
      // Validate source table access
      const tableConfig = this.securityService.validateTable(table)

      if (!tableConfig.allowJoins) {
        return []
      }

      // Get relations from schema service but filter by allowed join tables
      const allRelations = await this.schemaService.getRelations(table, schema)

      // Filter relations to only allowed target tables
      const allowedRelations = allRelations.filter((relation) => {
        const targetTable =
          relation.sourceTable === table ? relation.targetTable : relation.sourceTable

        try {
          this.securityService.validateTable(targetTable)
          return tableConfig.allowedJoinTables?.includes(targetTable) ?? false
        } catch {
          return false
        }
      })

      return allowedRelations
    } catch (error) {
      this.logger.error('Failed to get table relations', {
        userId: req.user.id,
        table,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  @Get('schema/databases')
  @QueryBuilderReadAccess()
  async getDatabases(@Request() req: ExpressRequest & { user: { id: string } }) {
    this.logger.log('Databases list requested', {
      userId: req.user.id,
    })

    // For security, only return current database
    // Don't expose all available databases
    return ['topsteel_tenant']
  }

  @Get('schema/schemas')
  @QueryBuilderReadAccess()
  async getSchemas(@Request() req: ExpressRequest & { user: { id: string } }) {
    this.logger.log('Schemas list requested', {
      userId: req.user.id,
    })

    // For security, only return public schema
    return ['public']
  }

  @Get(':id')
  @QueryBuilderReadAccess()
  async findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    this.logger.log('Query builder details requested', {
      userId: req.user.id,
      queryBuilderId: id,
    })

    try {
      return await this.queryBuilderService.findOne(id, req.user.id)
    } catch (error) {
      this.logger.error('Failed to get query builder', {
        userId: req.user.id,
        queryBuilderId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  @Post(':id/execute')
  @QueryBuilderReadAccess()
  async execute(
    @Param('id') id: string,
    @Body() executeDto: ExecuteQueryDto,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    this.logger.log('Query builder execution requested', {
      userId: req.user.id,
      queryBuilderId: id,
      page: executeDto.page,
      pageSize: executeDto.pageSize,
    })

    try {
      const queryBuilder = await this.queryBuilderService.findOne(id, req.user.id)

      // Validate all tables/columns referenced in the query builder
      this.securityService.validateTable(queryBuilder.mainTable || '')

      for (const column of queryBuilder.columns || []) {
        this.securityService.validateColumn(column.tableName || '', column.columnName || '', 'select')
      }

      for (const join of queryBuilder.joins || []) {
        this.securityService.validateJoin(join.fromTable || '', join.toTable || '')
      }

      // Transform filters array to Record format for compatibility
      const transformedExecuteDto = {
        ...executeDto,
        filters: executeDto.filters
          ? executeDto.filters.reduce(
              (acc, filter, index) => {
                acc[`filter_${index}`] = filter
                return acc
              },
              {} as Record<string, unknown>
            )
          : {},
      }

      return await this.executorService.executeQuery(
        queryBuilder,
        transformedExecuteDto as QueryExecutionParams,
        req.user.id
      )
    } catch (error) {
      this.logger.error('Query builder execution failed', {
        userId: req.user.id,
        queryBuilderId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  @Post(':id/duplicate')
  @QueryBuilderWriteAccess()
  async duplicate(
    @Param('id') id: string,
    @Body() body: { newName?: string } = {},
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    this.logger.log('Query builder duplication requested', {
      userId: req.user.id,
      queryBuilderId: id,
    })

    try {
      const newName = body.newName || `Copy of ${id}`
      return await this.queryBuilderService.duplicate(id, newName, req.user.id)
    } catch (error) {
      this.logger.error('Failed to duplicate query builder', {
        userId: req.user.id,
        queryBuilderId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  @Patch(':id')
  @QueryBuilderWriteAccess()
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQueryBuilderDto,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    this.logger.log('Query builder update requested', {
      userId: req.user.id,
      queryBuilderId: id,
    })

    try {
      // Validate table access if mainTable is being changed
      if (updateDto.mainTable) {
        this.securityService.validateTable(updateDto.mainTable)
      }

      return await this.queryBuilderService.update(id, updateDto, req.user.id)
    } catch (error) {
      this.logger.error('Failed to update query builder', {
        userId: req.user.id,
        queryBuilderId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  @Delete(':id')
  @QueryBuilderWriteAccess()
  async remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    this.logger.log('Query builder deletion requested', {
      userId: req.user.id,
      queryBuilderId: id,
    })

    try {
      return await this.queryBuilderService.remove(id, req.user.id)
    } catch (error) {
      this.logger.error('Failed to delete query builder', {
        userId: req.user.id,
        queryBuilderId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  @Post(':id/add-to-menu')
  @QueryBuilderWriteAccess()
  async addToMenu(
    @Param('id') id: string,
    @Body() body: { title?: string; icon?: string },
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    this.logger.log('Add query builder to menu requested', {
      userId: req.user.id,
      queryBuilderId: id,
    })

    try {
      const queryBuilder = await this.queryBuilderService.findOne(id, req.user.id)

      // Return information needed to add to menu
      return {
        queryBuilderId: id,
        title: body.title || queryBuilder.name,
        icon: body.icon || 'BarChart3',
        type: 'D',
        description: `Vue Data: ${queryBuilder.description || queryBuilder.name}`,
      }
    } catch (error) {
      this.logger.error('Failed to prepare menu item', {
        userId: req.user.id,
        queryBuilderId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Get security statistics (for monitoring)
   */
  @Get('admin/security-stats')
  @QueryBuilderWriteAccess()
  async getSecurityStats(@Request() req: ExpressRequest & { user: { id: string } }) {
    this.logger.log('Security statistics requested', {
      userId: req.user.id,
    })

    try {
      const stats = this.securityService.getSecurityStatistics()

      return {
        ...stats,
        generatedAt: new Date().toISOString(),
        requestedBy: req.user.id,
      }
    } catch (error) {
      this.logger.error('Failed to get security statistics', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new BadRequestException('Failed to retrieve security statistics')
    }
  }
}
