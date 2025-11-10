import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { QueryBuilderSecurityService, QueryOperator } from './query-builder-security.service'

/**
 * SQL Query components for safe construction
 */
export interface SanitizedQuery {
  /** SELECT clause with whitelisted columns */
  select: string
  /** FROM clause with validated table names */
  from: string
  /** WHERE clause with parameterized conditions */
  where: string
  /** ORDER BY clause with validated columns */
  orderBy: string
  /** Parameterized query parameters */
  parameters: unknown[]
  /** LIMIT clause */
  limit: string
}

/**
 * Filter condition for WHERE clause
 */
export interface FilterCondition {
  tableName: string
  columnName: string
  operator: string
  value: string | number | boolean | null | Date | string[] | number[]
  tableAlias?: string
}

/**
 * Sort condition for ORDER BY clause
 */
export interface SortCondition {
  tableName: string
  columnName: string
  direction: 'ASC' | 'DESC'
  tableAlias?: string
}

/**
 * Join condition
 */
export interface JoinCondition {
  type: 'INNER' | 'LEFT' | 'RIGHT'
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  fromAlias?: string
  toAlias?: string
}

/**
 * SQL Sanitization Service
 *
 * This service provides safe SQL query construction using:
 * - Parameterized queries to prevent SQL injection
 * - Identifier validation and sanitization
 * - Whitelist-based column and table validation
 * - Type-safe query building
 */
@Injectable()
export class SqlSanitizationService {
  private readonly logger = new Logger(SqlSanitizationService.name)

  constructor(private readonly securityService: QueryBuilderSecurityService) {}

  /**
   * Build a safe SELECT query with all security checks
   */
  buildSafeSelectQuery(options: {
    selectColumns: Array<{
      tableName: string
      columnName: string
      alias?: string
      tableAlias?: string
    }>
    fromTable: string
    joins?: JoinCondition[]
    filters?: FilterCondition[]
    sorts?: SortCondition[]
    limit?: number
    offset?: number
    tenantId?: string
  }): SanitizedQuery {
    const parameters: unknown[] = []
    let parameterIndex = 1

    // Build SELECT clause
    const selectClause = this.buildSelectClause(options.selectColumns)

    // Build FROM clause with joins
    const fromClause = this.buildFromClause(options.fromTable, options.joins)

    // Build WHERE clause with tenant isolation
    const { whereClause, whereParameters } = this.buildWhereClause(
      options.filters || [],
      options.tenantId,
      parameterIndex
    )
    parameters.push(...whereParameters)
    parameterIndex += whereParameters.length

    // Build ORDER BY clause
    const orderByClause = this.buildOrderByClause(options.sorts || [])

    // Build LIMIT clause
    const limitClause = this.buildLimitClause(options.limit, options.offset, parameterIndex)
    if (options.limit !== undefined) {
      parameters.push(options.limit)
      parameterIndex++
    }
    if (options.offset !== undefined) {
      parameters.push(options.offset)
      parameterIndex++
    }

    return {
      select: selectClause,
      from: fromClause,
      where: whereClause,
      orderBy: orderByClause,
      parameters,
      limit: limitClause,
    }
  }

  /**
   * Build safe SELECT clause with column validation
   */
  private buildSelectClause(
    columns: Array<{
      tableName: string
      columnName: string
      alias?: string
      tableAlias?: string
    }>
  ): string {
    if (!columns.length) {
      throw new BadRequestException('At least one column must be selected')
    }

    const selectParts: string[] = []

    for (const col of columns) {
      // Validate column is allowed for selection
      this.securityService.validateColumn(col.tableName, col.columnName, 'select')

      // Sanitize identifiers
      const tableName = this.securityService.sanitizeIdentifier(col.tableName)
      const columnName = this.securityService.sanitizeIdentifier(col.columnName)
      const tableAlias = col.tableAlias
        ? this.securityService.sanitizeIdentifier(col.tableAlias)
        : null
      const columnAlias = col.alias ? this.securityService.sanitizeIdentifier(col.alias) : null

      // Build column reference
      const tableRef = tableAlias || tableName
      const columnRef = `${tableRef}.${columnName}`
      const aliasRef = columnAlias ? ` AS "${columnAlias}"` : ''

      selectParts.push(`${columnRef}${aliasRef}`)
    }

    return selectParts.join(', ')
  }

  /**
   * Build safe FROM clause with join validation
   */
  private buildFromClause(mainTable: string, joins?: JoinCondition[]): string {
    // Validate main table
    this.securityService.validateTable(mainTable)
    const sanitizedMainTable = this.securityService.sanitizeIdentifier(mainTable)

    let fromClause = `${sanitizedMainTable} AS t0`

    if (joins && joins.length > 0) {
      for (let i = 0; i < joins.length; i++) {
        const join = joins[i]

        // Validate join is allowed
        this.securityService.validateJoin(join.fromTable, join.toTable)

        // Validate join columns
        this.securityService.validateColumn(join.fromTable, join.fromColumn, 'join')
        this.securityService.validateColumn(join.toTable, join.toColumn, 'join')

        // Sanitize identifiers
        const toTable = this.securityService.sanitizeIdentifier(join.toTable)
        const toAlias = join.toAlias
          ? this.securityService.sanitizeIdentifier(join.toAlias)
          : `t${i + 1}`
        const fromAlias = join.fromAlias || 't0'
        const fromColumn = this.securityService.sanitizeIdentifier(join.fromColumn)
        const toColumn = this.securityService.sanitizeIdentifier(join.toColumn)

        // Validate join type
        if (!['INNER', 'LEFT', 'RIGHT'].includes(join.type)) {
          throw new BadRequestException(`Invalid join type: ${join.type}`)
        }

        fromClause += ` ${join.type} JOIN ${toTable} AS ${toAlias} ON ${fromAlias}.${fromColumn} = ${toAlias}.${toColumn}`
      }
    }

    return fromClause
  }

  /**
   * Build safe WHERE clause with parameterized conditions and tenant isolation
   */
  private buildWhereClause(
    filters: FilterCondition[],
    tenantId: string | undefined,
    startingParamIndex: number
  ): { whereClause: string; whereParameters: unknown[] } {
    const conditions: string[] = []
    const parameters: unknown[] = []
    let paramIndex = startingParamIndex

    // Add tenant isolation for tables that require it
    const tablesWithTenantIsolation = new Set<string>()

    // Check main table and joined tables for tenant isolation requirements
    for (const filter of filters) {
      if (this.securityService.requiresTenantIsolation(filter.tableName)) {
        tablesWithTenantIsolation.add(filter.tableName)
      }
    }

    // Add tenant isolation conditions
    if (tenantId) {
      for (const tableName of tablesWithTenantIsolation) {
        const tenantColumn = this.securityService.getTenantColumn(tableName)
        const tableAlias = this.findTableAlias(tableName, filters)
        const tableRef = tableAlias || tableName

        conditions.push(`${tableRef}.${tenantColumn} = $${paramIndex}`)
        parameters.push(tenantId)
        paramIndex++
      }
    }

    // Add filter conditions
    for (const filter of filters) {
      // Validate column can be filtered
      const _columnConfig = this.securityService.validateColumn(
        filter.tableName,
        filter.columnName,
        'filter'
      )

      // Validate and normalize operator
      const operator = this.securityService.validateOperator(
        filter.tableName,
        filter.columnName,
        filter.operator
      )

      // Validate filter value
      this.securityService.validateColumnValue(filter.tableName, filter.columnName, filter.value)

      // Sanitize identifiers
      const columnName = this.securityService.sanitizeIdentifier(filter.columnName)
      const tableAlias =
        filter.tableAlias || this.securityService.sanitizeIdentifier(filter.tableName)

      // Build condition based on operator
      const condition = this.buildFilterCondition(
        `${tableAlias}.${columnName}`,
        operator,
        filter.value,
        paramIndex
      )

      if (condition.condition) {
        conditions.push(condition.condition)
        parameters.push(...condition.parameters)
        paramIndex += condition.parameters.length
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    return { whereClause, whereParameters: parameters }
  }

  /**
   * Build individual filter condition with proper parameterization
   */
  private buildFilterCondition(
    columnRef: string,
    operator: QueryOperator,
    value: unknown,
    paramIndex: number
  ): { condition: string; parameters: unknown[] } {
    const parameters: unknown[] = []
    let condition: string

    switch (operator) {
      case QueryOperator.EQUALS:
        condition = `${columnRef} = $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.NOT_EQUALS:
        condition = `${columnRef} != $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.GREATER_THAN:
        condition = `${columnRef} > $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.GREATER_THAN_OR_EQUALS:
        condition = `${columnRef} >= $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.LESS_THAN:
        condition = `${columnRef} < $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.LESS_THAN_OR_EQUALS:
        condition = `${columnRef} <= $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.LIKE:
        condition = `${columnRef} LIKE $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.ILIKE:
        condition = `${columnRef} ILIKE $${paramIndex}`
        parameters.push(value)
        break

      case QueryOperator.IN: {
        if (!Array.isArray(value) || value.length === 0) {
          throw new BadRequestException('IN operator requires a non-empty array')
        }
        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ')
        condition = `${columnRef} IN (${placeholders})`
        parameters.push(...value)
        break
      }

      case QueryOperator.NOT_IN: {
        if (!Array.isArray(value) || value.length === 0) {
          throw new BadRequestException('NOT IN operator requires a non-empty array')
        }
        const notInPlaceholders = value.map((_, i) => `$${paramIndex + i}`).join(', ')
        condition = `${columnRef} NOT IN (${notInPlaceholders})`
        parameters.push(...value)
        break
      }

      case QueryOperator.IS_NULL:
        condition = `${columnRef} IS NULL`
        // No parameters needed
        break

      case QueryOperator.IS_NOT_NULL:
        condition = `${columnRef} IS NOT NULL`
        // No parameters needed
        break

      case QueryOperator.BETWEEN:
        if (!Array.isArray(value) || value.length !== 2) {
          throw new BadRequestException('BETWEEN operator requires an array with exactly 2 values')
        }
        condition = `${columnRef} BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        parameters.push(value[0], value[1])
        break

      default:
        throw new BadRequestException(`Unsupported operator: ${operator}`)
    }

    return { condition, parameters }
  }

  /**
   * Build safe ORDER BY clause
   */
  private buildOrderByClause(sorts: SortCondition[]): string {
    if (!sorts.length) {
      return ''
    }

    const orderParts: string[] = []

    for (const sort of sorts) {
      // Validate column can be sorted
      this.securityService.validateColumn(sort.tableName, sort.columnName, 'sort')

      // Validate sort direction
      const direction = this.securityService.validateSortDirection(sort.direction)

      // Sanitize identifiers
      const columnName = this.securityService.sanitizeIdentifier(sort.columnName)
      const tableAlias = sort.tableAlias || this.securityService.sanitizeIdentifier(sort.tableName)

      orderParts.push(`${tableAlias}.${columnName} ${direction}`)
    }

    return `ORDER BY ${orderParts.join(', ')}`
  }

  /**
   * Build LIMIT clause with bounds checking
   */
  private buildLimitClause(limit?: number, offset?: number, paramIndex?: number): string {
    const parts: string[] = []

    if (limit !== undefined) {
      if (limit < 1 || limit > 10000) {
        throw new BadRequestException('LIMIT must be between 1 and 10000')
      }
      parts.push(`LIMIT $${paramIndex}`)
    }

    if (offset !== undefined) {
      if (offset < 0) {
        throw new BadRequestException('OFFSET cannot be negative')
      }
      parts.push(`OFFSET $${paramIndex! + 1}`)
    }

    return parts.join(' ')
  }

  /**
   * Find table alias for a given table name in filters
   */
  private findTableAlias(tableName: string, filters: FilterCondition[]): string | null {
    const filter = filters.find((f) => f.tableName === tableName && f.tableAlias)
    return filter?.tableAlias || null
  }

  /**
   * Validate and sanitize a raw SQL query (for development/testing only)
   */
  validateRawSqlQuery(sql: string): void {
    const sqlLower = sql.toLowerCase().trim()

    // Only allow SELECT statements
    if (!sqlLower.startsWith('select')) {
      throw new BadRequestException('Only SELECT queries are allowed')
    }

    // Forbidden patterns that could indicate SQL injection or unauthorized access
    const forbiddenPatterns = [
      // System tables and schemas
      /\btopsteel_auth\./i,
      /\binformation_schema\b/i,
      /\bpg_catalog\b/i,
      /\bpg_/i,
      /\bmysql\./i,
      /\bsys\./i,

      // User and permission tables
      /\busers\b/i,
      /\buser_societes\b/i,
      /\bsocietes\b/i,
      /\bpermissions\b/i,
      /\broles\b/i,
      /\bauth_/i,

      // Dangerous SQL operations
      /\bdrop\b/i,
      /\bdelete\b/i,
      /\bupdate\b/i,
      /\binsert\b/i,
      /\balter\b/i,
      /\bcreate\b/i,
      /\btruncate\b/i,
      /\bgrant\b/i,
      /\brevoke\b/i,
      /\bexec\b/i,
      /\bexecute\b/i,

      // Function calls that could be dangerous
      /\bload_file\b/i,
      /\binto\s+outfile\b/i,
      /\binto\s+dumpfile\b/i,
      /\bunion.*select/i,

      // Comment patterns that could hide malicious code
      /\/\*/,
      /--/,
      /#/,

      // Script tags and HTML that could indicate XSS
      /<script/i,
      /<\/script/i,
      /javascript:/i,
      /vbscript:/i,
    ]

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(sql)) {
        this.logger.warn(`Raw SQL query blocked due to forbidden pattern: ${pattern}`)
        throw new BadRequestException('Query contains forbidden operations or references')
      }
    }

    // Additional validation: check for multiple statements (semicolon outside of quotes)
    const parts = sql.split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
    if (parts.filter((p) => p.trim()).length > 1) {
      throw new BadRequestException('Multiple SQL statements are not allowed')
    }
  }

  /**
   * Extract table names from a SQL query for validation
   */
  extractTableNames(sql: string): string[] {
    const tableNames: string[] = []

    // Simple regex to extract table names from FROM and JOIN clauses
    // This is not perfect but provides basic protection
    const fromMatches = sql.match(/\bFROM\s+(\w+)(?:\s+AS\s+\w+)?/gi) || []
    const joinMatches = sql.match(/\bJOIN\s+(\w+)(?:\s+AS\s+\w+)?/gi) || []

    const allMatches = [...fromMatches, ...joinMatches]
    allMatches.forEach((match) => {
      const tableName = match
        .replace(/FROM|JOIN|AS/gi, '')
        .trim()
        .split(/\s+/)[0]
      if (tableName && !tableNames.includes(tableName.toLowerCase())) {
        tableNames.push(tableName.toLowerCase())
      }
    })

    return tableNames
  }

  /**
   * Build a complete safe query string from components
   */
  buildCompleteQuery(query: SanitizedQuery): string {
    const parts = [`SELECT ${query.select}`, `FROM ${query.from}`]

    if (query.where) {
      parts.push(query.where)
    }

    if (query.orderBy) {
      parts.push(query.orderBy)
    }

    if (query.limit) {
      parts.push(query.limit)
    }

    return parts.join(' ')
  }
}
