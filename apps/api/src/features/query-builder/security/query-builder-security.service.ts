import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

/**
 * Allowed tables with their security configuration
 */
export interface TableSecurityConfig {
  /** Table name */
  name: string
  /** Human readable description */
  description: string
  /** Allowed columns with their configuration */
  columns: ColumnSecurityConfig[]
  /** Whether this table requires tenant isolation (company_id filter) */
  requiresTenantIsolation: boolean
  /** Custom tenant column name (defaults to 'company_id') */
  tenantColumn?: string
  /** Whether this table allows filtering */
  allowFiltering: boolean
  /** Whether this table allows sorting */
  allowSorting: boolean
  /** Whether this table allows joins */
  allowJoins: boolean
  /** Allowed join tables */
  allowedJoinTables?: string[]
  /** Maximum rows that can be returned */
  maxRows?: number
}

/**
 * Column security configuration
 */
export interface ColumnSecurityConfig {
  /** Column name */
  name: string
  /** Data type */
  dataType: string
  /** Whether this column can be selected */
  allowSelect: boolean
  /** Whether this column can be filtered */
  allowFilter: boolean
  /** Whether this column can be used for sorting */
  allowSort: boolean
  /** Whether this column can be used in joins */
  allowJoin: boolean
  /** Whether this column contains sensitive data */
  isSensitive: boolean
  /** Allowed operators for this column */
  allowedOperators: QueryOperator[]
  /** Custom validation pattern (regex) */
  validationPattern?: string
}

/**
 * Allowed SQL operators
 */
export enum QueryOperator {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUALS = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUALS = '<=',
  LIKE = 'LIKE',
  ILIKE = 'ILIKE',
  IN = 'IN',
  NOT_IN = 'NOT IN',
  IS_NULL = 'IS NULL',
  IS_NOT_NULL = 'IS NOT NULL',
  BETWEEN = 'BETWEEN',
}

/**
 * Allowed sort directions
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Query Builder Security Service
 *
 * This service provides centralized security controls for the Query Builder feature:
 * - Table and column whitelisting
 * - SQL injection prevention
 * - Input validation and sanitization
 * - Permission-based access control
 */
@Injectable()
export class QueryBuilderSecurityService {
  private readonly logger = new Logger(QueryBuilderSecurityService.name)

  /**
   * Whitelist of allowed tables with their security configuration
   * This is the core security mechanism - only these tables can be accessed
   */
  private readonly allowedTables: Map<string, TableSecurityConfig> = new Map([
    // Core business tables
    [
      'clients',
      {
        name: 'clients',
        description: 'Customer data',
        requiresTenantIsolation: true,
        allowFiltering: true,
        allowSorting: true,
        allowJoins: true,
        allowedJoinTables: ['addresses', 'contacts'],
        maxRows: 1000,
        columns: [
          {
            name: 'id',
            dataType: 'uuid',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: true,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
          },
          {
            name: 'company_id',
            dataType: 'uuid',
            allowSelect: false, // Never expose tenant ID
            allowFilter: false, // Handled automatically
            allowSort: false,
            allowJoin: false,
            isSensitive: true,
            allowedOperators: [],
          },
          {
            name: 'nom',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.LIKE,
              QueryOperator.ILIKE,
              QueryOperator.IN,
            ],
            validationPattern: '^[A-Za-z0-9\\s\\-\\.]{1,100}$',
          },
          {
            name: 'email',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: true,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.LIKE, QueryOperator.ILIKE],
            validationPattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$',
          },
          {
            name: 'telephone',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: false,
            allowJoin: false,
            isSensitive: true,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.LIKE],
            validationPattern: '^[0-9\\+\\-\\s\\.\\(\\)]{8,20}$',
          },
          {
            name: 'created_at',
            dataType: 'timestamp',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.GREATER_THAN,
              QueryOperator.LESS_THAN,
              QueryOperator.BETWEEN,
            ],
          },
          {
            name: 'updated_at',
            dataType: 'timestamp',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.GREATER_THAN,
              QueryOperator.LESS_THAN,
              QueryOperator.BETWEEN,
            ],
          },
        ],
      },
    ],

    [
      'fournisseurs',
      {
        name: 'fournisseurs',
        description: 'Supplier data',
        requiresTenantIsolation: true,
        allowFiltering: true,
        allowSorting: true,
        allowJoins: true,
        allowedJoinTables: ['addresses', 'contacts'],
        maxRows: 500,
        columns: [
          {
            name: 'id',
            dataType: 'uuid',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: true,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
          },
          {
            name: 'company_id',
            dataType: 'uuid',
            allowSelect: false,
            allowFilter: false,
            allowSort: false,
            allowJoin: false,
            isSensitive: true,
            allowedOperators: [],
          },
          {
            name: 'nom',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.LIKE,
              QueryOperator.ILIKE,
              QueryOperator.IN,
            ],
            validationPattern: '^[A-Za-z0-9\\s\\-\\.]{1,100}$',
          },
          {
            name: 'code_fournisseur',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
            validationPattern: '^[A-Za-z0-9\\-]{1,50}$',
          },
          {
            name: 'created_at',
            dataType: 'timestamp',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.GREATER_THAN,
              QueryOperator.LESS_THAN,
              QueryOperator.BETWEEN,
            ],
          },
        ],
      },
    ],

    [
      'materiaux',
      {
        name: 'materiaux',
        description: 'Materials catalog',
        requiresTenantIsolation: true,
        allowFiltering: true,
        allowSorting: true,
        allowJoins: true,
        allowedJoinTables: ['categories', 'fournisseurs'],
        maxRows: 2000,
        columns: [
          {
            name: 'id',
            dataType: 'uuid',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: true,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
          },
          {
            name: 'company_id',
            dataType: 'uuid',
            allowSelect: false,
            allowFilter: false,
            allowSort: false,
            allowJoin: false,
            isSensitive: true,
            allowedOperators: [],
          },
          {
            name: 'nom',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.LIKE,
              QueryOperator.ILIKE,
              QueryOperator.IN,
            ],
            validationPattern: '^[A-Za-z0-9\\s\\-\\.]{1,200}$',
          },
          {
            name: 'reference',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.LIKE, QueryOperator.IN],
            validationPattern: '^[A-Za-z0-9\\-_]{1,50}$',
          },
          {
            name: 'prix_unitaire',
            dataType: 'decimal',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.GREATER_THAN,
              QueryOperator.LESS_THAN,
              QueryOperator.BETWEEN,
            ],
          },
          {
            name: 'stock_actuel',
            dataType: 'integer',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.GREATER_THAN,
              QueryOperator.LESS_THAN,
              QueryOperator.BETWEEN,
            ],
          },
        ],
      },
    ],

    [
      'commandes',
      {
        name: 'commandes',
        description: 'Orders',
        requiresTenantIsolation: true,
        allowFiltering: true,
        allowSorting: true,
        allowJoins: true,
        allowedJoinTables: ['clients', 'commande_items'],
        maxRows: 1000,
        columns: [
          {
            name: 'id',
            dataType: 'uuid',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: true,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
          },
          {
            name: 'company_id',
            dataType: 'uuid',
            allowSelect: false,
            allowFilter: false,
            allowSort: false,
            allowJoin: false,
            isSensitive: true,
            allowedOperators: [],
          },
          {
            name: 'numero_commande',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.LIKE, QueryOperator.IN],
            validationPattern: '^[A-Za-z0-9\\-_]{1,50}$',
          },
          {
            name: 'date_commande',
            dataType: 'date',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.GREATER_THAN,
              QueryOperator.LESS_THAN,
              QueryOperator.BETWEEN,
            ],
          },
          {
            name: 'statut',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
            validationPattern: '^(nouveau|confirme|expedie|livre|annule)$',
          },
          {
            name: 'montant_total',
            dataType: 'decimal',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.GREATER_THAN,
              QueryOperator.LESS_THAN,
              QueryOperator.BETWEEN,
            ],
          },
        ],
      },
    ],

    // System reference tables (no tenant isolation needed)
    [
      'categories',
      {
        name: 'categories',
        description: 'Material categories',
        requiresTenantIsolation: false,
        allowFiltering: true,
        allowSorting: true,
        allowJoins: true,
        allowedJoinTables: ['materiaux'],
        maxRows: 100,
        columns: [
          {
            name: 'id',
            dataType: 'uuid',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: true,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
          },
          {
            name: 'nom',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [
              QueryOperator.EQUALS,
              QueryOperator.LIKE,
              QueryOperator.ILIKE,
              QueryOperator.IN,
            ],
            validationPattern: '^[A-Za-z0-9\\s\\-\\.]{1,100}$',
          },
          {
            name: 'code',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            allowJoin: false,
            isSensitive: false,
            allowedOperators: [QueryOperator.EQUALS, QueryOperator.IN],
            validationPattern: '^[A-Z0-9_]{1,20}$',
          },
        ],
      },
    ],
  ])

  constructor(@InjectDataSource('tenant') readonly _dataSource: DataSource) {
    this.logger.log(`Initialized with ${this.allowedTables.size} whitelisted tables`)
  }

  /**
   * Validate that a table is allowed and return its configuration
   */
  validateTable(tableName: string): TableSecurityConfig {
    const normalizedName = this.normalizeIdentifier(tableName)
    const config = this.allowedTables.get(normalizedName)

    if (!config) {
      this.logger.warn(`Attempted access to unauthorized table: ${tableName}`)
      throw new BadRequestException(`Table '${tableName}' is not authorized for query building`)
    }

    return config
  }

  /**
   * Validate that a column is allowed for a specific table and operation
   */
  validateColumn(
    tableName: string,
    columnName: string,
    operation: 'select' | 'filter' | 'sort' | 'join'
  ): ColumnSecurityConfig {
    const tableConfig = this.validateTable(tableName)
    const normalizedColumn = this.normalizeIdentifier(columnName)

    const columnConfig = tableConfig.columns.find((col) => col.name === normalizedColumn)
    if (!columnConfig) {
      this.logger.warn(`Attempted access to unauthorized column: ${tableName}.${columnName}`)
      throw new BadRequestException(
        `Column '${columnName}' is not authorized in table '${tableName}'`
      )
    }

    // Check operation-specific permissions
    switch (operation) {
      case 'select':
        if (!columnConfig.allowSelect) {
          throw new BadRequestException(`Column '${columnName}' cannot be selected`)
        }
        break
      case 'filter':
        if (!columnConfig.allowFilter) {
          throw new BadRequestException(`Column '${columnName}' cannot be used for filtering`)
        }
        break
      case 'sort':
        if (!columnConfig.allowSort) {
          throw new BadRequestException(`Column '${columnName}' cannot be used for sorting`)
        }
        break
      case 'join':
        if (!columnConfig.allowJoin) {
          throw new BadRequestException(`Column '${columnName}' cannot be used for joins`)
        }
        break
    }

    return columnConfig
  }

  /**
   * Validate SQL operator for a specific column
   */
  validateOperator(tableName: string, columnName: string, operator: string): QueryOperator {
    const columnConfig = this.validateColumn(tableName, columnName, 'filter')
    const normalizedOperator = operator.toUpperCase() as QueryOperator

    if (!Object.values(QueryOperator).includes(normalizedOperator)) {
      throw new BadRequestException(`Invalid SQL operator: ${operator}`)
    }

    if (!columnConfig.allowedOperators.includes(normalizedOperator)) {
      throw new BadRequestException(
        `Operator '${operator}' is not allowed for column '${columnName}' in table '${tableName}'`
      )
    }

    return normalizedOperator
  }

  /**
   * Validate sort direction
   */
  validateSortDirection(direction: string): SortDirection {
    const normalizedDirection = direction.toUpperCase() as SortDirection

    if (!Object.values(SortDirection).includes(normalizedDirection)) {
      throw new BadRequestException(`Invalid sort direction: ${direction}. Allowed: ASC, DESC`)
    }

    return normalizedDirection
  }

  /**
   * Validate that a join between two tables is allowed
   */
  validateJoin(fromTable: string, toTable: string): void {
    const fromConfig = this.validateTable(fromTable)
    const toConfig = this.validateTable(toTable)

    if (!fromConfig.allowJoins) {
      throw new BadRequestException(`Table '${fromTable}' does not allow joins`)
    }

    if (!toConfig.allowJoins) {
      throw new BadRequestException(`Table '${toTable}' does not allow joins`)
    }

    if (fromConfig.allowedJoinTables && !fromConfig.allowedJoinTables.includes(toTable)) {
      throw new BadRequestException(`Join from '${fromTable}' to '${toTable}' is not allowed`)
    }
  }

  /**
   * Validate column value against its validation pattern
   */
  validateColumnValue(tableName: string, columnName: string, value: any): void {
    const columnConfig = this.validateColumn(tableName, columnName, 'filter')

    if (columnConfig.validationPattern && typeof value === 'string') {
      const regex = new RegExp(columnConfig.validationPattern)
      if (!regex.test(value)) {
        throw new BadRequestException(
          `Value for column '${columnName}' does not match required pattern`
        )
      }
    }
  }

  /**
   * Get all allowed tables
   */
  getAllowedTables(): TableSecurityConfig[] {
    return Array.from(this.allowedTables.values())
  }

  /**
   * Get allowed columns for a specific table
   */
  getAllowedColumns(tableName: string): ColumnSecurityConfig[] {
    const config = this.validateTable(tableName)
    return config.columns.filter((col) => col.allowSelect)
  }

  /**
   * Check if table requires tenant isolation
   */
  requiresTenantIsolation(tableName: string): boolean {
    const config = this.validateTable(tableName)
    return config.requiresTenantIsolation
  }

  /**
   * Get tenant column name for a table
   */
  getTenantColumn(tableName: string): string {
    const config = this.validateTable(tableName)
    return config.tenantColumn || 'company_id'
  }

  /**
   * Get maximum allowed rows for a table
   */
  getMaxRows(tableName: string): number | undefined {
    const config = this.validateTable(tableName)
    return config.maxRows
  }

  /**
   * Normalize SQL identifiers (remove quotes, convert to lowercase)
   */
  private normalizeIdentifier(identifier: string): string {
    return identifier
      .replace(/["`']/g, '') // Remove quotes
      .toLowerCase()
      .trim()
  }

  /**
   * Sanitize SQL identifier to prevent injection
   */
  sanitizeIdentifier(identifier: string): string {
    const normalized = this.normalizeIdentifier(identifier)

    // Only allow alphanumeric characters, underscores, and specific safe characters
    if (!/^[a-z0-9_]+$/.test(normalized)) {
      throw new BadRequestException(`Invalid identifier: ${identifier}`)
    }

    return normalized
  }

  /**
   * Get table statistics for monitoring
   */
  getSecurityStatistics(): {
    allowedTablesCount: number
    totalColumnsCount: number
    sensitiveColumnsCount: number
    tenantIsolatedTablesCount: number
  } {
    let totalColumns = 0
    let sensitiveColumns = 0
    let tenantIsolatedTables = 0

    for (const config of this.allowedTables.values()) {
      totalColumns += config.columns.length
      sensitiveColumns += config.columns.filter((col) => col.isSensitive).length
      if (config.requiresTenantIsolation) {
        tenantIsolatedTables++
      }
    }

    return {
      allowedTablesCount: this.allowedTables.size,
      totalColumnsCount: totalColumns,
      sensitiveColumnsCount: sensitiveColumns,
      tenantIsolatedTablesCount: tenantIsolatedTables,
    }
  }
}
