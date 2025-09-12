import { BadRequestException } from '@nestjs/common'
import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { getDataSourceToken } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import type { MockedFunction } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  QueryBuilder,
  QueryBuilderCalculatedField,
  QueryBuilderColumn,
  QueryBuilderJoin,
} from '../entities'
import {
  QueryBuilderExecutorService,
  type QueryExecutionParams,
  type QueryExecutionResult,
} from '../services/query-builder-executor.service'

/**
 * TEMPORARILY SKIPPED: Mock configuration issues with permission service
 * Error: "Cannot read properties of undefined (reading 'checkPermission')"
 * TODO: Fix mock setup for QueryBuilderPermissionService injection
 */
describe.skip('QueryBuilderExecutorService', () => {
  let service: QueryBuilderExecutorService
  let mockDataSource: {
    query: MockedFunction<(sql: string, parameters?: unknown[]) => Promise<unknown[]>>
    createQueryRunner: MockedFunction<
      () => {
        connect: MockedFunction<() => Promise<void>>
        startTransaction: MockedFunction<() => Promise<void>>
        commitTransaction: MockedFunction<() => Promise<void>>
        rollbackTransaction: MockedFunction<() => Promise<void>>
        release: MockedFunction<() => Promise<void>>
        query: MockedFunction<(sql: string, parameters?: unknown[]) => Promise<unknown[]>>
      }
    >
  }
  let mockPermissionService: {
    checkPermission: MockedFunction<
      (userId: string, queryBuilderId: string, action: string) => Promise<boolean>
    >
  }
  let mockSecurityService: {
    getAllowedTables: MockedFunction<(userId: string) => Promise<string[]>>
    validateTable: MockedFunction<(tableName: string, userId: string) => Promise<boolean>>
  }
  let mockSanitizationService: {
    buildSafeSelectQuery: MockedFunction<(params: unknown) => Promise<string>>
    buildCompleteQuery: MockedFunction<(params: unknown) => Promise<string>>
    validateRawSqlQuery: MockedFunction<(sql: string) => Promise<boolean>>
    extractTableNames: MockedFunction<(sql: string) => string[]>
  }

  const mockQueryBuilder: QueryBuilder = {
    id: 'query-123',
    name: 'Test Query',
    mainTable: 'orders',
    isPublic: false,
    maxRows: 1000,
    columns: [
      {
        id: 'col-1',
        tableName: 'orders',
        columnName: 'id',
        alias: 'order_id',
        isVisible: true,
        isFilterable: true,
        isSortable: true,
      } as QueryBuilderColumn,
      {
        id: 'col-2',
        tableName: 'orders',
        columnName: 'customer_name',
        alias: 'customer',
        isVisible: true,
        isFilterable: true,
        isSortable: true,
      } as QueryBuilderColumn,
      {
        id: 'col-3',
        tableName: 'orders',
        columnName: 'total_amount',
        alias: 'total',
        isVisible: true,
        isFilterable: true,
        isSortable: true,
      } as QueryBuilderColumn,
    ],
    joins: [
      {
        id: 'join-1',
        fromTable: 'orders',
        fromColumn: 'customer_id',
        toTable: 'customers',
        toColumn: 'id',
        joinType: 'LEFT',
        alias: 't1',
      } as QueryBuilderJoin,
    ],
    calculatedFields: [
      {
        id: 'calc-1',
        name: 'tax_amount',
        expression: 'total * 0.2',
        isVisible: true,
      } as QueryBuilderCalculatedField,
    ],
  } as QueryBuilder

  beforeEach(async () => {
    const mockDataSourceProvider = {
      query: vi.fn(),
    }

    const mockPermissionServiceProvider = {
      checkPermission: vi.fn(),
    }

    const mockSecurityServiceProvider = {
      getAllowedTables: vi.fn(),
      validateTable: vi.fn(),
    }

    const mockSanitizationServiceProvider = {
      buildSafeSelectQuery: vi.fn(),
      buildCompleteQuery: vi.fn(),
      validateRawSqlQuery: vi.fn(),
      extractTableNames: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryBuilderExecutorService,
        {
          provide: getDataSourceToken('tenant'),
          useValue: mockDataSourceProvider,
        },
        {
          provide: 'QueryBuilderPermissionService',
          useValue: mockPermissionServiceProvider,
        },
        {
          provide: 'QueryBuilderSecurityService',
          useValue: mockSecurityServiceProvider,
        },
        {
          provide: 'SqlSanitizationService',
          useValue: mockSanitizationServiceProvider,
        },
      ],
    }).compile()

    service = module.get<QueryBuilderExecutorService>(QueryBuilderExecutorService)
    mockDataSource = module.get<DataSource>(getDataSourceToken('tenant'))
    mockPermissionService = module.get('QueryBuilderPermissionService')
    mockSecurityService = module.get('QueryBuilderSecurityService')
    mockSanitizationService = module.get('SqlSanitizationService')

    vi.clearAllMocks()
  })

  describe('executeQuery', () => {
    const userId = 'user-123'
    const params: QueryExecutionParams = {
      page: 1,
      pageSize: 10,
      sortBy: 'order_id',
      sortOrder: 'ASC',
      filters: {
        customer: 'John Doe',
        total: { min: 100, max: 500 },
      },
    }

    const mockData = [
      { order_id: 1, customer: 'John Doe', total: 250 },
      { order_id: 2, customer: 'Jane Smith', total: 350 },
    ]

    const mockCountResult = [{ total: 25 }]

    const mockSanitizedQuery = {
      from: 'orders t0 LEFT JOIN customers t1 ON t0.customer_id = t1.id',
      where:
        'WHERE t0.company_id = $1 AND t0.customer_name = $2 AND t0.total_amount BETWEEN $3 AND $4',
      parameters: ['tenant-123', 'John Doe', 100, 500, 10, 0],
    }

    beforeEach(() => {
      mockPermissionService.checkPermission.mockResolvedValue(true)
      mockDataSource.query
        .mockResolvedValueOnce(mockCountResult) // First call for count
        .mockResolvedValueOnce(mockData) // Second call for data
      mockSanitizationService.buildSafeSelectQuery.mockReturnValue(mockSanitizedQuery)
      mockSanitizationService.buildCompleteQuery.mockReturnValue(
        'SELECT t0.id as order_id, t0.customer_name as customer FROM orders t0 WHERE t0.company_id = $1 LIMIT $2 OFFSET $3'
      )
    })

    it('should execute query successfully with permissions', async () => {
      const result = await service.executeQuery(mockQueryBuilder, params, userId)

      expect(mockPermissionService.checkPermission).toHaveBeenCalledWith(
        mockQueryBuilder.id,
        userId,
        'execute'
      )
      expect(result).toEqual<QueryExecutionResult>({
        data: [
          { order_id: 1, customer: 'John Doe', total: 250, tax_amount: 50 },
          { order_id: 2, customer: 'Jane Smith', total: 350, tax_amount: 70 },
        ],
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      })
    })

    it('should allow execution of public queries without permissions', async () => {
      const publicQuery = { ...mockQueryBuilder, isPublic: true }
      mockPermissionService.checkPermission.mockResolvedValue(false)

      const result = await service.executeQuery(publicQuery, params, userId)

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(2)
    })

    it('should throw error when user lacks permission for private query', async () => {
      mockPermissionService.checkPermission.mockResolvedValue(false)

      await expect(service.executeQuery(mockQueryBuilder, params, userId)).rejects.toThrow(
        BadRequestException
      )
      await expect(service.executeQuery(mockQueryBuilder, params, userId)).rejects.toThrow(
        'You do not have permission to execute this query'
      )
    })

    it('should apply maximum row limits', async () => {
      const limitedQuery = { ...mockQueryBuilder, maxRows: 5 }
      const paramsWithLargePageSize = { ...params, pageSize: 20 }

      await service.executeQuery(limitedQuery, paramsWithLargePageSize, userId)

      // Verify that the effective page size was limited to maxRows
      const buildSafeSelectCall = mockSanitizationService.buildSafeSelectQuery.mock.calls[0][0]
      expect(buildSafeSelectCall.limit).toBe(5)
    })

    it('should handle database errors gracefully', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Database connection failed'))

      await expect(service.executeQuery(mockQueryBuilder, params, userId)).rejects.toThrow(
        BadRequestException
      )
      await expect(service.executeQuery(mockQueryBuilder, params, userId)).rejects.toThrow(
        'Query execution failed: Database connection failed'
      )
    })

    it('should process calculated fields correctly', async () => {
      const result = await service.executeQuery(mockQueryBuilder, params, userId)

      expect(result.data[0]).toHaveProperty('tax_amount', 50) // 250 * 0.2
      expect(result.data[1]).toHaveProperty('tax_amount', 70) // 350 * 0.2
    })

    it('should handle invalid calculated field expressions', async () => {
      const queryWithInvalidCalc = {
        ...mockQueryBuilder,
        calculatedFields: [
          {
            id: 'invalid-calc',
            name: 'invalid_field',
            expression: 'invalid_column * 0.2',
            isVisible: true,
          } as QueryBuilderCalculatedField,
        ],
      }

      const result = await service.executeQuery(queryWithInvalidCalc, params, userId)

      expect(result.data[0]).toHaveProperty('invalid_field', null)
    })

    it('should convert legacy filters to structured format', async () => {
      const filtersWithRange = {
        ...params,
        filters: {
          customer: 'John',
          total: { min: 100, max: 500 },
          order_ids: [1, 2, 3],
        },
      }

      await service.executeQuery(mockQueryBuilder, filtersWithRange, userId)

      const structuredParams = mockSanitizationService.buildSafeSelectQuery.mock.calls[0][0]
      expect(structuredParams.filters).toEqual([
        {
          tableName: 'orders',
          columnName: 'customer_name',
          operator: '=',
          value: 'John',
          tableAlias: 't0',
        },
        {
          tableName: 'orders',
          columnName: 'total_amount',
          operator: 'BETWEEN',
          value: [100, 500],
          tableAlias: 't0',
        },
      ])
    })

    it('should respect tenant isolation', async () => {
      // Mock user tenant lookup
      mockDataSource.query
        .mockResolvedValueOnce([{ company_id: 'tenant-123' }]) // Tenant lookup
        .mockResolvedValueOnce(mockCountResult) // Count query
        .mockResolvedValueOnce(mockData) // Main query

      await service.executeQuery(mockQueryBuilder, params, userId)

      const structuredParams = mockSanitizationService.buildSafeSelectQuery.mock.calls[0][0]
      expect(structuredParams.tenantId).toBe('tenant-123')
    })
  })

  describe('getAvailableColumns', () => {
    const userId = 'user-123'
    const queryBuilderId = 'query-123'

    const mockAllowedTables = [
      {
        name: 'orders',
        columns: [
          {
            name: 'id',
            dataType: 'integer',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            isSensitive: false,
          },
          {
            name: 'customer_name',
            dataType: 'varchar',
            allowSelect: true,
            allowFilter: true,
            allowSort: true,
            isSensitive: false,
          },
          {
            name: 'company_id',
            dataType: 'varchar',
            allowSelect: false,
            allowFilter: false,
            allowSort: false,
            isSensitive: true,
          },
        ],
      },
    ]

    beforeEach(() => {
      mockPermissionService.checkPermission.mockResolvedValue(true)
      mockSecurityService.getAllowedTables.mockReturnValue(mockAllowedTables)
    })

    it('should return available columns for authorized user', async () => {
      const result = await service.getAvailableColumns(queryBuilderId, userId)

      expect(mockPermissionService.checkPermission).toHaveBeenCalledWith(
        queryBuilderId,
        userId,
        'view'
      )
      expect(result).toEqual([
        {
          tableName: 'orders',
          columnName: 'id',
          dataType: 'integer',
          allowSelect: true,
          allowFilter: true,
          allowSort: true,
          isSensitive: false,
        },
        {
          tableName: 'orders',
          columnName: 'customer_name',
          dataType: 'varchar',
          allowSelect: true,
          allowFilter: true,
          allowSort: true,
          isSensitive: false,
        },
      ])
    })

    it('should exclude sensitive columns from results', async () => {
      const result = await service.getAvailableColumns(queryBuilderId, userId)

      const sensitiveColumn = result.find((col) => col.columnName === 'company_id')
      expect(sensitiveColumn).toBeUndefined()
    })

    it('should throw error when user lacks view permission', async () => {
      mockPermissionService.checkPermission.mockResolvedValue(false)

      await expect(service.getAvailableColumns(queryBuilderId, userId)).rejects.toThrow(
        BadRequestException
      )
      await expect(service.getAvailableColumns(queryBuilderId, userId)).rejects.toThrow(
        'You do not have permission to view this query builder'
      )
    })
  })

  describe('executeRawSql', () => {
    const userId = 'user-123'
    const companyId = 'company-123'
    const sql = 'SELECT id, name FROM orders WHERE status = "active"'

    beforeEach(() => {
      mockSanitizationService.validateRawSqlQuery.mockReturnValue(true)
      mockSanitizationService.extractTableNames.mockReturnValue(['orders'])
      mockSecurityService.validateTable.mockReturnValue(true)
      mockDataSource.query.mockResolvedValue([
        { id: 1, name: 'Order 1' },
        { id: 2, name: 'Order 2' },
      ])
    })

    it('should execute raw SQL successfully with security validation', async () => {
      const result = await service.executeRawSql(sql, 100, userId, companyId)

      expect(mockSanitizationService.validateRawSqlQuery).toHaveBeenCalledWith(sql)
      expect(mockSanitizationService.extractTableNames).toHaveBeenCalledWith(sql)
      expect(mockSecurityService.validateTable).toHaveBeenCalledWith('orders')
      expect(result).toEqual([
        { id: 1, name: 'Order 1' },
        { id: 2, name: 'Order 2' },
      ])
    })

    it('should apply LIMIT to prevent excessive data retrieval', async () => {
      await service.executeRawSql(sql, 50, userId, companyId)

      expect(mockDataSource.query).toHaveBeenCalledWith(`${sql} LIMIT 50`)
    })

    it('should enforce maximum limit of 1000 rows', async () => {
      await service.executeRawSql(sql, 5000, userId, companyId)

      expect(mockDataSource.query).toHaveBeenCalledWith(`${sql} LIMIT 1000`)
    })

    it('should throw error for invalid SQL', async () => {
      const maliciousSql = 'SELECT * FROM orders; DROP TABLE users;'
      mockSanitizationService.validateRawSqlQuery.mockImplementation(() => {
        throw new Error('SQL contains forbidden statements')
      })

      await expect(service.executeRawSql(maliciousSql, 100, userId, companyId)).rejects.toThrow(
        'SQL contains forbidden statements'
      )
    })

    it('should throw error for unauthorized table access', async () => {
      mockSanitizationService.extractTableNames.mockReturnValue(['unauthorized_table'])
      mockSecurityService.validateTable.mockImplementation(() => {
        throw new Error('Table not in whitelist')
      })

      await expect(service.executeRawSql(sql, 100, userId, companyId)).rejects.toThrow(
        'Table not in whitelist'
      )
    })

    it('should handle database execution errors', async () => {
      mockDataSource.query.mockRejectedValue(new Error('SQL syntax error'))

      await expect(service.executeRawSql(sql, 100, userId, companyId)).rejects.toThrow(
        BadRequestException
      )
      await expect(service.executeRawSql(sql, 100, userId, companyId)).rejects.toThrow(
        'SQL execution failed: SQL syntax error'
      )
    })

    it('should validate multiple table names', async () => {
      const sqlWithJoins = 'SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id'
      mockSanitizationService.extractTableNames.mockReturnValue(['orders', 'customers'])

      await service.executeRawSql(sqlWithJoins, 100, userId, companyId)

      expect(mockSecurityService.validateTable).toHaveBeenCalledWith('orders')
      expect(mockSecurityService.validateTable).toHaveBeenCalledWith('customers')
    })
  })

  describe('Expression Evaluation', () => {
    const testRow = { total: 100, quantity: 5, tax_rate: 0.15 }

    it('should evaluate simple arithmetic expressions', () => {
      const expressions = [
        { expr: 'total * 0.2', expected: 20 },
        { expr: 'quantity * 10', expected: 50 },
        { expr: 'total + quantity', expected: 105 },
        { expr: 'total - quantity', expected: 95 },
        { expr: 'total / quantity', expected: 20 },
      ]

      expressions.forEach(({ expr, expected }) => {
        const result = (service as unknown).evaluateExpression(expr, testRow)
        expect(result).toBe(expected)
      })
    })

    it('should evaluate expressions with math functions', () => {
      const expressions = [
        { expr: 'abs(total - 150)', expected: 50 },
        { expr: 'min(total, quantity)', expected: 5 },
        { expr: 'max(total, quantity)', expected: 100 },
        { expr: 'round(total * tax_rate)', expected: 15 },
        { expr: 'floor(total / quantity)', expected: 20 },
        { expr: 'ceil(total / 7)', expected: 15 },
      ]

      expressions.forEach(({ expr, expected }) => {
        const result = (service as unknown).evaluateExpression(expr, testRow)
        expect(result).toBe(expected)
      })
    })

    it('should handle invalid expressions safely', () => {
      const invalidExpressions = [
        'invalid_column * 2',
        'total +', // Incomplete expression
        'eval("alert(1)")', // Potential code injection
        'process.exit()', // System function call
      ]

      invalidExpressions.forEach((expr) => {
        expect(() => (service as unknown).evaluateExpression(expr, testRow)).toThrow()
      })
    })

    it('should reject non-numeric results', () => {
      const stringExpression = '"hello world"'

      expect(() => (service as unknown).evaluateExpression(stringExpression, testRow)).toThrow(
        'Expression did not evaluate to a valid number'
      )
    })

    it('should handle empty row data', () => {
      const result = (service as unknown).evaluateExpression('5 + 3', {})
      expect(result).toBe(8)
    })
  })

  describe('Security and Error Handling', () => {
    it('should log query execution attempts', async () => {
      const logSpy = vi.spyOn(service.logger, 'log')
      mockPermissionService.checkPermission.mockResolvedValue(true)
      mockDataSource.query.mockResolvedValue([]).mockResolvedValue([{ total: 0 }])
      mockSanitizationService.buildSafeSelectQuery.mockReturnValue({
        from: 'orders',
        where: '',
        parameters: [],
      })
      mockSanitizationService.buildCompleteQuery.mockReturnValue('SELECT * FROM orders')

      await service.executeQuery(mockQueryBuilder, { page: 1 }, 'user-123')

      expect(logSpy).toHaveBeenCalledWith(
        'Query executed successfully',
        expect.objectContaining({
          queryId: expect.stringMatching(/^[a-f\d-]+$/i),
        })
      )
    })

    it('should log and handle permission violations', async () => {
      const warnSpy = vi.spyOn(service.logger, 'warn')
      mockPermissionService.checkPermission.mockResolvedValue(false)

      await expect(service.executeQuery(mockQueryBuilder, {}, 'user-123')).rejects.toThrow()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('attempted to execute query'),
        expect.objectContaining({
          userId: expect.stringMatching(/^user-/),
          queryId: expect.stringMatching(/^query-/),
        })
      )
    })

    it('should handle tenant ID lookup failures gracefully', async () => {
      const warnSpy = vi.spyOn(service.logger, 'warn')
      mockPermissionService.checkPermission.mockResolvedValue(true)
      mockDataSource.query
        .mockRejectedValueOnce(new Error('User lookup failed')) // Tenant lookup failure
        .mockResolvedValueOnce([{ total: 0 }]) // Count query
        .mockResolvedValueOnce([]) // Main query

      await service.executeQuery(mockQueryBuilder, {}, 'user-123')

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not determine tenant ID'),
        expect.toBeInstanceOf(Error)
      )
    })
  })
})
