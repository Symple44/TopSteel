import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import type { QueryBuilder, QueryBuilderCalculatedField } from '../entities'
import type { QueryBuilderPermissionService } from './query-builder-permission.service'
import * as mathjs from 'mathjs'

export interface QueryExecutionParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  filters?: Record<string, unknown>
}

export interface QueryExecutionResult {
  data: unknown[]
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
    private readonly permissionService: QueryBuilderPermissionService
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
    filters: Record<string, unknown>,
    queryBuilder: QueryBuilder
  ): { whereClause: string; whereParams: unknown[] } {
    const conditions: string[] = []
    const params: unknown[] = []
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
          const rangeFilter = filterValue as Record<string, any>
          if (rangeFilter.min !== undefined) {
            conditions.push(`${tableAlias}.${column.columnName} >= $${paramIndex++}`)
            params.push(rangeFilter.min)
          }
          if (rangeFilter.max !== undefined) {
            conditions.push(`${tableAlias}.${column.columnName} <= $${paramIndex++}`)
            params.push(rangeFilter.max)
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
    data: unknown[],
    calculatedFields: QueryBuilderCalculatedField[]
  ): unknown[] {
    if (!calculatedFields || calculatedFields.length === 0) {
      return data
    }

    return data.map((row) => {
      const processedRow = { ...(row as Record<string, unknown>) }

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

  private evaluateExpression(expression: string, row: unknown): unknown {
    // This is a simplified implementation
    // In production, use a proper expression evaluator like math.js

    // Replace column references with values
    let evaluableExpression = expression
    if (row && typeof row === 'object' && row !== null) {
      Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g')
        evaluableExpression = evaluableExpression.replace(regex, String(value))
      })
    }

    // Use mathjs for safe arithmetic evaluation
    try {
      // Create a safe parser that only allows basic math operations
      const parser = mathjs.parser()
      
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
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Expression did not evaluate to a valid number')
      }
      
      return result
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}. ${error instanceof Error ? error.message : ''}`)
    }
  }

  async getAvailableColumns(_queryBuilderId: string, _userId: string): Promise<unknown[]> {
    // This method would return available columns based on the configured tables
    // Implementation depends on specific requirements
    return []
  }
}
