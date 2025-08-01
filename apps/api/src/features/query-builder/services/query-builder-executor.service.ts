import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { QueryBuilder } from '../entities'
import type { QueryBuilderCalculatedField } from '../entities'
import { QueryBuilderPermissionService } from './query-builder-permission.service'

export interface QueryExecutionParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  filters?: Record<string, any>
}

export interface QueryExecutionResult {
  data: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class QueryBuilderExecutorService {
  constructor(
    @InjectDataSource('tenant')
    private _dataSource: DataSource,
    private readonly permissionService: QueryBuilderPermissionService,
  ) {}

  async executeQuery(
    queryBuilder: QueryBuilder,
    params: QueryExecutionParams,
    userId: string
  ): Promise<QueryExecutionResult> {
    // Check execute permission
    const canExecute = await this.permissionService.checkPermission(
      queryBuilder.id,
      userId,
      'execute'
    )

    if (!canExecute && !queryBuilder.isPublic) {
      throw new BadRequestException('You do not have permission to execute this query')
    }

    const { page = 1, pageSize = 50, sortBy, sortOrder = 'ASC', filters = {} } = params

    // Build SELECT clause
    const selectColumns = this.buildSelectClause(queryBuilder)

    // Build FROM clause with JOINs
    const fromClause = this.buildFromClause(queryBuilder)

    // Build WHERE clause
    const { whereClause, whereParams } = this.buildWhereClause(filters, queryBuilder)

    // Build ORDER BY clause
    const orderByClause = sortBy ? `ORDER BY ${sortBy} ${sortOrder}` : ''

    // Apply max rows limit if set
    const effectivePageSize = queryBuilder.maxRows
      ? Math.min(pageSize, queryBuilder.maxRows)
      : pageSize

    // Build final query
    const offset = (page - 1) * effectivePageSize
    const query = `
      SELECT ${selectColumns}
      FROM ${fromClause}
      ${whereClause}
      ${orderByClause}
      LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
    `

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${fromClause}
      ${whereClause}
    `

    try {
      // Execute count query
      const countResult = await this._dataSource.query(countQuery, whereParams)
      const total = parseInt(countResult[0].total, 10)

      // Execute main query
      const data = await this._dataSource.query(query, [...whereParams, effectivePageSize, offset])

      // Apply calculated fields
      const processedData = this.processCalculatedFields(data, queryBuilder.calculatedFields)

      return {
        data: processedData,
        total,
        page,
        pageSize: effectivePageSize,
        totalPages: Math.ceil(total / effectivePageSize),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new BadRequestException(`Query execution failed: ${message}`)
    }
  }

  private buildSelectClause(queryBuilder: QueryBuilder): string {
    const columns = queryBuilder.columns
      .filter((col) => col.isVisible)
      .map((col) => {
        const tableAlias = this.getTableAlias(col.tableName, queryBuilder)
        return `${tableAlias}.${col.columnName} AS "${col.alias}"`
      })

    return columns.join(', ')
  }

  private buildFromClause(queryBuilder: QueryBuilder): string {
    let fromClause = `${queryBuilder.mainTable} AS t0`

    queryBuilder.joins.forEach((join, index) => {
      const joinKeyword = join.joinType.toUpperCase()
      const fromAlias = this.getTableAlias(join.fromTable, queryBuilder)
      const toAlias = join.alias || `t${index + 1}`

      fromClause += ` ${joinKeyword} JOIN ${join.toTable} AS ${toAlias}`
      fromClause += ` ON ${fromAlias}.${join.fromColumn} = ${toAlias}.${join.toColumn}`
    })

    return fromClause
  }

  private buildWhereClause(
    filters: Record<string, any>,
    queryBuilder: QueryBuilder
  ): { whereClause: string; whereParams: any[] } {
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    Object.entries(filters).forEach(([columnAlias, filterValue]) => {
      const column = queryBuilder.columns.find((col) => col.alias === columnAlias)

      if (column?.isFilterable) {
        const tableAlias = this.getTableAlias(column.tableName, queryBuilder)

        if (Array.isArray(filterValue)) {
          const placeholders = filterValue.map(() => `$${paramIndex++}`).join(', ')
          conditions.push(`${tableAlias}.${column.columnName} IN (${placeholders})`)
          params.push(...filterValue)
        } else if (typeof filterValue === 'object' && filterValue !== null) {
          // Handle range filters
          if (filterValue.min !== undefined) {
            conditions.push(`${tableAlias}.${column.columnName} >= $${paramIndex++}`)
            params.push(filterValue.min)
          }
          if (filterValue.max !== undefined) {
            conditions.push(`${tableAlias}.${column.columnName} <= $${paramIndex++}`)
            params.push(filterValue.max)
          }
        } else {
          conditions.push(`${tableAlias}.${column.columnName} = $${paramIndex++}`)
          params.push(filterValue)
        }
      }
    })

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    return { whereClause, whereParams: params }
  }

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
    data: any[],
    calculatedFields: QueryBuilderCalculatedField[]
  ): any[] {
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

  private evaluateExpression(expression: string, row: any): any {
    // This is a simplified implementation
    // In production, use a proper expression evaluator like math.js

    // Replace column references with values
    let evaluableExpression = expression
    Object.entries(row).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      evaluableExpression = evaluableExpression.replace(regex, String(value))
    })

    // Basic arithmetic operations only
    try {
      // Remove any non-numeric characters except operators
      const sanitized = evaluableExpression.replace(/[^0-9+\-*/().\s]/g, '')
      // Use Function constructor for safe evaluation
      return new Function(`return ${sanitized}`)()
    } catch (_error) {
      throw new Error(`Invalid expression: ${expression}`)
    }
  }

  async getAvailableColumns(_queryBuilderId: string, _userId: string): Promise<any[]> {
    // This method would return available columns based on the configured tables
    // Implementation depends on specific requirements
    return []
  }
}
