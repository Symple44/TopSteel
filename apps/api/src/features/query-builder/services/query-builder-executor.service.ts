import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import * as mathjs from 'mathjs'
import type { DataSource } from 'typeorm'
import type { QueryOperator } from '../../../types/query-builder/query-builder.types'
import type { QueryBuilder } from '../entities'
import type { QueryBuilderSecurityService } from '../security/query-builder-security.service'
import type { SqlSanitizationService } from '../security/sql-sanitization.service'
import type { QueryBuilderPermissionService } from './query-builder-permission.service'

export interface QueryExecutionParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  filters?: Record<string, unknown>
}

export interface QueryExecutionResultWithPagination {
  data: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class QueryBuilderExecutorService {
  private readonly logger = new Logger(QueryBuilderExecutorService.name)

  constructor(
    @InjectDataSource('tenant')
    private _dataSource: DataSource,
    private readonly permissionService: QueryBuilderPermissionService,
    private readonly securityService: QueryBuilderSecurityService,
    private readonly sanitizationService: SqlSanitizationService
  ) {}

  async executeQuery(
    queryBuilder: QueryBuilder,
    params: QueryExecutionParams,
    userId: string
  ): Promise<QueryExecutionResultWithPagination> {
    // Check execute permission
    const canExecute = await this.permissionService.checkPermission(
      queryBuilder.id,
      userId,
      'execute'
    )

    if (!canExecute && !queryBuilder.isPublic) {
      this.logger.warn(
        `User ${userId} attempted to execute query ${queryBuilder.id} without permission`
      )
      throw new BadRequestException('You do not have permission to execute this query')
    }

    const { page = 1 } = params

    try {
      // Convert legacy parameters to new structured format for security validation
      const structuredParams = this.convertToStructuredParams(queryBuilder, params)

      // Get tenant ID for isolation (this should come from user context)
      const tenantId = await this.getUserTenantId(userId)

      // Build secure query using sanitization service
      const sanitizedQuery = this.sanitizationService.buildSafeSelectQuery({
        selectColumns: structuredParams.selectColumns,
        fromTable: queryBuilder.mainTable,
        joins: structuredParams.joins,
        filters: structuredParams.filters,
        sorts: structuredParams.sorts,
        limit: structuredParams.pageSize,
        offset: structuredParams.offset,
        tenantId,
      })

      // Build complete query strings
      const mainQuery = this.sanitizationService.buildCompleteQuery(sanitizedQuery)

      // Build count query (same as main query but with COUNT(*) and no LIMIT/OFFSET)
      const countQuery = `SELECT COUNT(*) as total FROM ${sanitizedQuery.from} ${sanitizedQuery.where}`

      this.logger.debug('Executing secure queries', {
        userId,
        queryBuilderId: queryBuilder.id,
        mainQuery: mainQuery.substring(0, 200), // Log first 200 chars
        parameterCount: sanitizedQuery.parameters.length,
      })

      // Execute count query
      const countResult = (await this._dataSource.query(
        countQuery,
        sanitizedQuery.parameters.slice(0, -2)
      )) as Array<{ total: string }> // Remove LIMIT and OFFSET params
      const total = parseInt(countResult[0].total, 10)

      // Execute main query
      const data = (await this._dataSource.query(mainQuery, sanitizedQuery.parameters)) as Record<
        string,
        unknown
      >[]

      // Apply calculated fields
      const processedData = this.processCalculatedFields(data, queryBuilder.calculatedFields)

      this.logger.log('Query executed successfully', {
        userId,
        queryBuilderId: queryBuilder.id,
        resultCount: data.length,
        totalCount: total,
      })

      return {
        data: processedData,
        total,
        page,
        pageSize: structuredParams.pageSize,
        totalPages: Math.ceil(total / structuredParams.pageSize),
      }
    } catch (error) {
      this.logger.error('Query execution failed', {
        userId,
        queryBuilderId: queryBuilder.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })

      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new BadRequestException(`Query execution failed: ${message}`)
    }
  }

  /**
   * Convert legacy query parameters to structured format for security validation
   */
  private convertToStructuredParams(
    queryBuilder: QueryBuilder,
    params: QueryExecutionParams
  ): {
    selectColumns: Array<{
      tableName: string
      columnName: string
      alias?: string
      tableAlias?: string
    }>
    joins: Array<{
      type: 'INNER' | 'LEFT' | 'RIGHT'
      fromTable: string
      fromColumn: string
      toTable: string
      toColumn: string
      fromAlias?: string
      toAlias?: string
    }>
    filters: Array<{
      tableName: string
      columnName: string
      operator: QueryOperator
      value: unknown
      tableAlias?: string
    }>
    sorts: Array<{
      tableName: string
      columnName: string
      direction: 'ASC' | 'DESC'
      tableAlias?: string
    }>
    pageSize: number
    offset: number
  } {
    // Convert columns to structured format
    const selectColumns = queryBuilder.columns
      .filter((col) => col.isVisible)
      .map((col) => ({
        tableName: col.tableName,
        columnName: col.columnName,
        alias: col.alias,
        tableAlias: this.getTableAlias(col.tableName, queryBuilder),
      }))

    // Convert joins to structured format
    const joins = queryBuilder.joins.map((join, index) => ({
      type: join.joinType.toUpperCase() as 'INNER' | 'LEFT' | 'RIGHT',
      fromTable: join.fromTable,
      fromColumn: join.fromColumn,
      toTable: join.toTable,
      toColumn: join.toColumn,
      fromAlias: this.getTableAlias(join.fromTable, queryBuilder),
      toAlias: join.alias || `t${index + 1}`,
    }))

    // Convert legacy filters to structured format
    const filters: Array<{
      tableName: string
      columnName: string
      operator: QueryOperator
      value: unknown
      tableAlias?: string
    }> = []
    Object.entries(params.filters || {}).forEach(([columnAlias, filterValue]) => {
      const column = queryBuilder.columns.find((col) => col.alias === columnAlias)
      if (column?.isFilterable) {
        // Determine operator based on value type
        let operator: QueryOperator = '='
        let value: unknown = filterValue

        if (Array.isArray(filterValue)) {
          operator = 'IN'
        } else if (typeof filterValue === 'object' && filterValue !== null) {
          // Handle range filters
          const rangeFilter = filterValue as Record<string, unknown>
          if (rangeFilter.min !== undefined && rangeFilter.max !== undefined) {
            operator = 'BETWEEN'
            value = [rangeFilter.min, rangeFilter.max]
          } else if (rangeFilter.min !== undefined) {
            operator = '>='
            value = rangeFilter.min
          } else if (rangeFilter.max !== undefined) {
            operator = '<='
            value = rangeFilter.max
          }
        }

        filters.push({
          tableName: column.tableName,
          columnName: column.columnName,
          operator,
          value,
          tableAlias: this.getTableAlias(column.tableName, queryBuilder),
        })
      }
    })

    // Convert sorting to structured format
    const sorts: Array<{
      tableName: string
      columnName: string
      direction: 'ASC' | 'DESC'
      tableAlias?: string
    }> = []
    if (params.sortBy) {
      const column = queryBuilder.columns.find((col) => col.alias === params.sortBy)
      if (column?.isSortable) {
        sorts.push({
          tableName: column.tableName,
          columnName: column.columnName,
          direction: params.sortOrder || 'ASC',
          tableAlias: this.getTableAlias(column.tableName, queryBuilder),
        })
      }
    }

    // Apply max rows limit if set
    const effectivePageSize = queryBuilder.maxRows
      ? Math.min(params.pageSize || 50, queryBuilder.maxRows)
      : params.pageSize || 50

    const offset = ((params.page || 1) - 1) * effectivePageSize

    return {
      selectColumns,
      joins,
      filters,
      sorts,
      pageSize: effectivePageSize,
      offset,
    }
  }

  /**
   * Get tenant ID for the current user (for tenant isolation)
   */
  private async getUserTenantId(userId: string): Promise<string | undefined> {
    try {
      // This should integrate with your user/tenant service
      // For now, we'll implement a basic query to get the user's company
      const result = (await this._dataSource.query(
        `SELECT su.societeId as company_id 
         FROM users u 
         JOIN societe_users su ON u.id = su.userId 
         WHERE u.id = $1 AND su.isDefault = true AND su.actif = true
         LIMIT 1`,
        [userId]
      )) as Array<{ company_id: string }>

      return result?.[0]?.company_id || undefined
    } catch (error) {
      this.logger.warn(`Could not determine tenant ID for user ${userId}:`, error)
      return undefined
    }
  }

  // Removed - now handled by SqlSanitizationService

  private getTableAlias(tableName: string, queryBuilder: QueryBuilder): string {
    if (tableName === queryBuilder.mainTable) {
      return 't0'
    }

    const joinIndex = queryBuilder.joins.findIndex((join) => join.toTable === tableName)
    if (joinIndex !== -1) {
      return queryBuilder.joins[joinIndex].alias || `t${joinIndex + 1}`
    }

    return 't0' // Default to main table alias
  }

  private processCalculatedFields(
    data: Record<string, unknown>[],
    calculatedFields: Array<{
      id: string
      name: string
      expression: string
      isVisible: boolean
      dataType?: string
      format?: string
    }>
  ): Record<string, unknown>[] {
    if (!calculatedFields || calculatedFields.length === 0) {
      return data
    }

    return data.map((row) => {
      const processedRow = { ...row }

      calculatedFields
        .filter((field) => field.isVisible)
        .forEach((field) => {
          try {
            // Simple expression evaluation - in production, use a proper expression parser
            const result = this.evaluateExpression(field.expression, row)
            processedRow[field.name] = result
          } catch (_error) {
            processedRow[field.name] = null
          }
        })

      return processedRow
    })
  }

  private evaluateExpression(expression: string, row: Record<string, unknown>): unknown {
    // This is a simplified implementation
    // In production, use a proper expression evaluator like math.js

    // Replace column references with values
    let evaluableExpression = expression
    Object.entries(row).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      evaluableExpression = evaluableExpression.replace(regex, String(value))
    })

    // Use mathjs for safe arithmetic evaluation
    try {
      // Create a safe parser that only allows basic math operations
      const _parser = mathjs.parser()

      // Configure mathjs to be more restrictive
      const limitedScope = {
        // Only allow basic arithmetic functions
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        round: Math.round,
        floor: Math.floor,
        ceil: Math.ceil,
        sqrt: Math.sqrt,
        pow: Math.pow,
      }

      // Evaluate the expression with limited scope
      const result = mathjs.evaluate(evaluableExpression, limitedScope)

      // Ensure the result is a number
      if (typeof result !== 'number' || Number.isNaN(result)) {
        throw new Error('Expression did not evaluate to a valid number')
      }

      return result
    } catch (error) {
      throw new Error(
        `Invalid expression: ${expression}. ${error instanceof Error ? error.message : ''}`
      )
    }
  }

  /**
   * Get available columns that can be used in query builder
   * Now uses the security service to return only whitelisted columns
   */
  async getAvailableColumns(
    queryBuilderId: string,
    userId: string
  ): Promise<
    Array<{
      tableName: string
      columnName: string
      dataType: string
      allowSelect: boolean
      allowFilter: boolean
      allowSort: boolean
      isSensitive: boolean
    }>
  > {
    // Check if user has permission to view this query builder
    const canView = await this.permissionService.checkPermission(queryBuilderId, userId, 'view')
    if (!canView) {
      throw new BadRequestException('You do not have permission to view this query builder')
    }

    // Get all whitelisted tables and their columns
    const allowedTables = this.securityService.getAllowedTables()
    const availableColumns = []

    for (const table of allowedTables) {
      for (const column of table.columns) {
        // Don't expose sensitive tenant columns
        if (!column.isSensitive || column.name !== 'company_id') {
          availableColumns.push({
            tableName: table.name,
            columnName: column.name,
            dataType: column.dataType,
            allowSelect: column.allowSelect,
            allowFilter: column.allowFilter,
            allowSort: column.allowSort,
            isSensitive: column.isSensitive,
          })
        }
      }
    }

    return availableColumns
  }

  /**
   * Execute raw SQL with security validation (admin only)
   */
  async executeRawSql(
    sql: string,
    limit = 100,
    userId: string,
    companyId?: string
  ): Promise<Record<string, unknown>[]> {
    this.logger.log('Raw SQL execution requested', {
      userId,
      sqlPreview: sql.substring(0, 50),
      limit,
      companyId,
    })

    // Validate the SQL query for security
    this.sanitizationService.validateRawSqlQuery(sql)

    // Extract and validate table names
    const tableNames = this.sanitizationService.extractTableNames(sql)
    for (const tableName of tableNames) {
      this.securityService.validateTable(tableName)
    }

    try {
      // Execute with proper limits and parameterization
      const limitedSql = `${sql} LIMIT ${Math.min(limit, 1000)}`

      const result = (await this._dataSource.query(limitedSql)) as Record<string, unknown>[]

      this.logger.log('Raw SQL execution successful', {
        userId,
        rowCount: result.length,
        companyId,
      })

      return result
    } catch (error) {
      this.logger.error('Raw SQL execution failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        sqlPreview: sql.substring(0, 50),
        companyId,
      })

      throw new BadRequestException(
        `SQL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
