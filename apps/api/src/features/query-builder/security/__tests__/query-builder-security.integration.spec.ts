import 'reflect-metadata'
import { BadRequestException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { getDataSourceToken } from '@nestjs/typeorm'
import { vi } from 'vitest'
import type { DataSource } from 'typeorm'
import { QueryBuilderExecutorService } from '../../services/query-builder-executor.service'
import { QueryBuilderPermissionService } from '../../services/query-builder-permission.service'
import { QueryBuilderSecurityService } from '../query-builder-security.service'
import { SqlSanitizationService } from '../sql-sanitization.service'

// Types pour les interfaces des query builders et mocks
interface MockQueryBuilder {
  id: string
  name: string
  mainTable: string
  isPublic: boolean
  columns: Array<{
    tableName: string
    columnName: string
    alias: string
    isVisible: boolean
    isFilterable: boolean
    isSortable: boolean
  }>
  joins: unknown[]
  calculatedFields: unknown[]
  maxRows: number
}

interface MockDataSource extends Partial<DataSource> {
  query: ReturnType<typeof vi.fn>
}

interface MockRepository {
  findOne: ReturnType<typeof vi.fn>
  find: ReturnType<typeof vi.fn>
  createQueryBuilder: ReturnType<typeof vi.fn>
}

describe('Query Builder Security Integration Tests', () => {
  let executorService: QueryBuilderExecutorService
  let _securityService: QueryBuilderSecurityService
  let _sanitizationService: SqlSanitizationService
  let _permissionService: QueryBuilderPermissionService

  const mockTenantDataSource: MockDataSource = {
    query: vi.fn(),
  }

  const mockAuthDataSource: MockDataSource = {
    query: vi.fn(),
  }

  const mockPermissionRepository: MockRepository = {
    findOne: vi.fn(),
    find: vi.fn(),
    createQueryBuilder: vi.fn(),
  }

  const mockUserRepository: MockRepository = {
    createQueryBuilder: vi.fn(() => ({
      leftJoin: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([]),
    })),
    findOne: vi.fn(),
    find: vi.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryBuilderExecutorService,
        QueryBuilderSecurityService,
        SqlSanitizationService,
        QueryBuilderPermissionService,
        {
          provide: getDataSourceToken('tenant'),
          useValue: mockTenantDataSource,
        },
        {
          provide: getDataSourceToken('auth'),
          useValue: mockAuthDataSource,
        },
        {
          provide: 'QueryBuilderPermissionRepository',
          useValue: mockPermissionRepository,
        },
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile()

    executorService = module.get<QueryBuilderExecutorService>(QueryBuilderExecutorService)
    _securityService = module.get<QueryBuilderSecurityService>(QueryBuilderSecurityService)
    _sanitizationService = module.get<SqlSanitizationService>(SqlSanitizationService)
    _permissionService = module.get<QueryBuilderPermissionService>(QueryBuilderPermissionService)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('End-to-End SQL Injection Prevention', () => {
    it('should prevent SQL injection through executeRawSql', async () => {
      const userId = 'test-user-123'
      const maliciousSqlQueries = [
        'SELECT * FROM clients; DROP TABLE users; --',
        "SELECT * FROM clients WHERE id = 1' OR '1'='1",
        'SELECT * FROM clients UNION SELECT password FROM users',
        "SELECT * FROM clients; INSERT INTO admin_logs VALUES ('hacked')",
        "SELECT LOAD_FILE('/etc/passwd')",
        "SELECT * FROM clients INTO OUTFILE '/tmp/stolen_data.txt'",
      ]

      // Mock user tenant ID lookup
      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: 'tenant-123' }])
        }
        return Promise.resolve([])
      })

      for (const maliciousQuery of maliciousSqlQueries) {
        await expect(executorService.executeRawSql(maliciousQuery, 100, userId)).rejects.toThrow(
          BadRequestException
        )
      }
    })

    it('should prevent SQL injection through structured queries', async () => {
      const userId = 'test-user-123'

      // Mock user tenant ID lookup
      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: 'tenant-123' }])
        }
        return Promise.resolve([])
      })

      const maliciousStructuredQuery = {
        selectColumns: [{ tableName: 'clients; DROP TABLE users;', columnName: 'nom' }],
        fromTable: 'clients',
        filters: [
          {
            tableName: 'clients',
            columnName: 'nom',
            operator: 'UNION SELECT * FROM passwords WHERE',
            value: 'anything',
          },
        ],
        sorts: [
          {
            tableName: 'clients',
            columnName: 'nom; DELETE FROM users;',
            direction: 'ASC' as const,
          },
        ],
      }

      await expect(
        executorService.executeStructuredQuery(maliciousStructuredQuery, userId)
      ).rejects.toThrow(BadRequestException)
    })

    it('should enforce tenant isolation in all queries', async () => {
      const userId = 'test-user-123'
      const tenantId = 'tenant-123'

      // Mock successful user tenant lookup
      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: tenantId }])
        }
        if (query.includes('SELECT COUNT(*) as total')) {
          return Promise.resolve([{ total: '5' }])
        }
        if (query.includes('SELECT clients.nom')) {
          return Promise.resolve([{ nom: 'Client 1' }, { nom: 'Client 2' }])
        }
        return Promise.resolve([])
      })

      const structuredQuery = {
        selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
        fromTable: 'clients',
        filters: [],
        sorts: [],
      }

      const _result = await executorService.executeStructuredQuery(structuredQuery, userId)

      // Verify that tenant isolation was applied
      const executedQueries = mockTenantDataSource.query?.mock.calls || []
      const countQuery = executedQueries.find((call: any) => call[0].includes('COUNT(*)'))
      const selectQuery = executedQueries.find((call: any) => call[0].includes('SELECT clients.nom'))

      expect(countQuery?.[0]).toContain('company_id = $1')
      expect(countQuery?.[1]).toContain(tenantId)
      expect(selectQuery?.[0]).toContain('company_id = $1')
      expect(selectQuery?.[1]).toContain(tenantId)
    })

    it('should validate all table and column access', async () => {
      const unauthorizedQueries = [
        {
          selectColumns: [{ tableName: 'users', columnName: 'password' }],
          fromTable: 'users',
        },
        {
          selectColumns: [{ tableName: 'admin_secrets', columnName: 'secret_key' }],
          fromTable: 'admin_secrets',
        },
        {
          selectColumns: [{ tableName: 'clients', columnName: 'credit_card_number' }],
          fromTable: 'clients',
        },
        {
          selectColumns: [{ tableName: 'information_schema', columnName: 'table_name' }],
          fromTable: 'information_schema',
        },
      ]

      for (const query of unauthorizedQueries) {
        await expect(
          executorService.executeStructuredQuery(
            {
              ...query,
              filters: [],
              sorts: [],
            },
            'test-user-123'
          )
        ).rejects.toThrow(BadRequestException)
      }
    })

    it('should prevent unauthorized joins', async () => {
      const unauthorizedJoinQueries = [
        {
          selectColumns: [
            { tableName: 'clients', columnName: 'nom' },
            { tableName: 'users', columnName: 'email' },
          ],
          fromTable: 'clients',
          joins: [
            {
              type: 'INNER' as const,
              fromTable: 'clients',
              fromColumn: 'id',
              toTable: 'users',
              toColumn: 'client_id',
            },
          ],
        },
        {
          selectColumns: [
            { tableName: 'materiaux', columnName: 'nom' },
            { tableName: 'passwords', columnName: 'hash' },
          ],
          fromTable: 'materiaux',
          joins: [
            {
              type: 'LEFT' as const,
              fromTable: 'materiaux',
              fromColumn: 'id',
              toTable: 'passwords',
              toColumn: 'material_id',
            },
          ],
        },
      ]

      for (const query of unauthorizedJoinQueries) {
        await expect(
          executorService.executeStructuredQuery(
            {
              ...query,
              filters: [],
              sorts: [],
            },
            'test-user-123'
          )
        ).rejects.toThrow(BadRequestException)
      }
    })
  })

  describe('Permission-based Access Control', () => {
    it('should enforce query builder permissions', async () => {
      const userId = 'test-user-123'
      const queryBuilderId = 'qb-123'

      // Mock permission check to deny access
      mockPermissionRepository.findOne.mockResolvedValue(null)
      mockUserRepository.createQueryBuilder().getRawMany.mockResolvedValue([])

      const mockQueryBuilder = {
        id: queryBuilderId,
        name: 'Test Query',
        mainTable: 'clients',
        isPublic: false,
        columns: [
          {
            tableName: 'clients',
            columnName: 'nom',
            alias: 'client_name',
            isVisible: true,
            isFilterable: true,
            isSortable: true,
          },
        ],
        joins: [],
        calculatedFields: [],
        maxRows: 1000,
      }

      // Test that permission denial prevents execution
      await expect(
        executorService.executeQuery(mockQueryBuilder as MockQueryBuilder, { page: 1, pageSize: 50 }, userId)
      ).rejects.toThrow(BadRequestException)
    })

    it('should allow access when permissions are granted', async () => {
      const userId = 'test-user-123'
      const queryBuilderId = 'qb-123'

      // Mock permission check to allow access
      mockPermissionRepository.findOne.mockResolvedValue({
        id: 'perm-123',
        queryBuilderId,
        userId,
        permissionType: 'execute',
        isAllowed: true,
      })

      // Mock tenant ID lookup
      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: 'tenant-123' }])
        }
        if (query.includes('COUNT(*)')) {
          return Promise.resolve([{ total: '2' }])
        }
        return Promise.resolve([{ client_name: 'Client 1' }, { client_name: 'Client 2' }])
      })

      const mockQueryBuilder = {
        id: queryBuilderId,
        name: 'Test Query',
        mainTable: 'clients',
        isPublic: false,
        columns: [
          {
            tableName: 'clients',
            columnName: 'nom',
            alias: 'client_name',
            isVisible: true,
            isFilterable: true,
            isSortable: true,
          },
        ],
        joins: [],
        calculatedFields: [],
        maxRows: 1000,
      }

      const result = await executorService.executeQuery(
        mockQueryBuilder as MockQueryBuilder,
        { page: 1, pageSize: 50 },
        userId
      )

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should handle public queries without explicit permissions', async () => {
      const userId = 'test-user-123'
      const queryBuilderId = 'qb-public-123'

      // Mock permission check to return no explicit permission
      mockPermissionRepository.findOne.mockResolvedValue(null)
      mockUserRepository.createQueryBuilder().getRawMany.mockResolvedValue([])

      // Mock tenant ID and query execution
      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: 'tenant-123' }])
        }
        if (query.includes('COUNT(*)')) {
          return Promise.resolve([{ total: '1' }])
        }
        return Promise.resolve([{ material_name: 'Steel Beam' }])
      })

      const mockPublicQueryBuilder = {
        id: queryBuilderId,
        name: 'Public Material Query',
        mainTable: 'materiaux',
        isPublic: true, // This should allow access without explicit permissions
        columns: [
          {
            tableName: 'materiaux',
            columnName: 'nom',
            alias: 'material_name',
            isVisible: true,
            isFilterable: true,
            isSortable: true,
          },
        ],
        joins: [],
        calculatedFields: [],
        maxRows: 500,
      }

      const result = await executorService.executeQuery(
        mockPublicQueryBuilder as MockQueryBuilder,
        { page: 1, pageSize: 50 },
        userId
      )

      expect(result.data).toHaveLength(1)
    })
  })

  describe('Data Isolation and Security', () => {
    it('should enforce row-level security based on tenant', async () => {
      const userId = 'test-user-123'
      const userTenantId = 'tenant-123'
      const otherTenantId = 'tenant-456'

      // Mock tenant lookup to return user's tenant
      mockTenantDataSource.query?.mockImplementation((query: string, params?: string[]) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: userTenantId }])
        }

        // Verify that queries include proper tenant filtering
        if (query.includes('company_id = $1')) {
          expect(params).toContain(userTenantId)
          expect(params).not.toContain(otherTenantId)

          if (query.includes('COUNT(*)')) {
            return Promise.resolve([{ total: '1' }])
          }
          return Promise.resolve([{ nom: 'Tenant 123 Client' }])
        }

        return Promise.resolve([])
      })

      const structuredQuery = {
        selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
        fromTable: 'clients',
        filters: [],
        sorts: [],
      }

      await executorService.executeStructuredQuery(structuredQuery, userId)

      // Verify that all database queries included tenant filtering
      const allCalls = mockTenantDataSource.query?.mock.calls || []
      const dataQueries = allCalls.filter(
        (call) => call[0].includes('clients') && !call[0].includes('SELECT su.societeId')
      )

      dataQueries.forEach((call: any) => {
        expect(call[0]).toContain('company_id = $1')
        expect(call[1]).toContain(userTenantId)
      })
    })

    it('should prevent access to sensitive columns', async () => {
      const sensitiveColumnQueries = [
        {
          selectColumns: [{ tableName: 'clients', columnName: 'company_id' }],
          fromTable: 'clients',
        },
        {
          selectColumns: [{ tableName: 'fournisseurs', columnName: 'company_id' }],
          fromTable: 'fournisseurs',
        },
      ]

      for (const query of sensitiveColumnQueries) {
        await expect(
          executorService.executeStructuredQuery(
            {
              ...query,
              filters: [],
              sorts: [],
            },
            'test-user-123'
          )
        ).rejects.toThrow(BadRequestException)
      }
    })

    it('should enforce maximum row limits per table', async () => {
      const userId = 'test-user-123'

      // Mock tenant lookup
      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: 'tenant-123' }])
        }
        return Promise.resolve([])
      })

      // Test that queries respect max row limits defined in security config
      const largePageSizeQuery = {
        selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
        fromTable: 'clients',
        filters: [],
        sorts: [],
        pageSize: 5000, // Exceeds the max limit for clients table (1000)
      }

      // The service should limit to the table's max rows
      await executorService.executeStructuredQuery(largePageSizeQuery, userId)

      // Check that the LIMIT was applied correctly
      const executedQueries = mockTenantDataSource.query?.mock.calls || []
      const selectQuery = executedQueries.find(
        (call: any) => call[0].includes('LIMIT') && call[0].includes('clients.nom')
      )

      // Should be limited to table's max rows (1000), not the requested 5000
      expect(selectQuery?.[1]).toContain(1000)
    })
  })

  describe('Expression Security', () => {
    it('should safely evaluate calculated field expressions', () => {
      const safeExpressions = [
        'prix_unitaire * quantite',
        'round(montant * 1.2, 2)',
        'abs(difference)',
        'min(valeur1, valeur2)',
        'max(stock_initial, stock_final)',
      ]

      safeExpressions.forEach((expression) => {
        const testRow = {
          prix_unitaire: 10,
          quantite: 5,
          montant: 100,
          difference: -25,
          valeur1: 15,
          valeur2: 20,
          stock_initial: 100,
          stock_final: 75,
        }

        // This would be called internally by the executor service
        expect(() => {
          executorService.evaluateExpression(expression, testRow)
        }).not.toThrow()
      })
    })

    it('should prevent dangerous expressions', () => {
      const dangerousExpressions = [
        'eval("malicious_code()")',
        'process.exit(1)',
        'require("fs").readFileSync("/etc/passwd")',
        'constructor.constructor("return process")()',
        'global.process.exit()',
        'window.location = "http://evil.com"',
        '__proto__.constructor.constructor("return process")()',
      ]

      dangerousExpressions.forEach((expression) => {
        expect(() => {
          executorService.evaluateExpression(expression, {})
        }).toThrow()
      })
    })

    it('should handle expression evaluation errors gracefully', () => {
      const problematicExpressions = [
        'undefined_variable * 10',
        'prix / 0', // Division by zero
        'very_long_expression_that_might_cause_issues'.repeat(100),
        'prix * quantite * montant * total * grand_total * mega_total', // Complex calculation
      ]

      problematicExpressions.forEach((expression) => {
        const result = executorService.processCalculatedFields(
          [{ prix: 10, quantite: 5 }],
          [
            {
              id: 'calc-1',
              name: 'test_calc',
              expression,
              isVisible: true,
              queryBuilder: null as any,
              queryBuilderId: 'qb-1',
            },
          ]
        )

        // Should handle errors gracefully and set field to null
        expect(result[0]).toHaveProperty('test_calc', null)
      })
    })
  })

  describe('Input Validation Edge Cases', () => {
    it('should handle unicode and special characters safely', async () => {
      const userId = 'test-user-123'

      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: 'tenant-123' }])
        }
        return Promise.resolve([])
      })

      const unicodeQuery = {
        selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
        fromTable: 'clients',
        filters: [
          {
            tableName: 'clients',
            columnName: 'nom',
            operator: '=',
            value: 'Café français 🇫🇷 with unicode',
          },
        ],
        sorts: [],
      }

      // Should handle unicode gracefully
      await expect(
        executorService.executeStructuredQuery(unicodeQuery, userId)
      ).resolves.toBeDefined()
    })

    it('should prevent buffer overflow attacks', async () => {
      const userId = 'test-user-123'
      const veryLongString = 'A'.repeat(1000000) // 1MB string

      await expect(
        executorService.executeRawSql(
          `SELECT * FROM clients WHERE nom = '${veryLongString}'`,
          100,
          userId
        )
      ).rejects.toThrow(BadRequestException)
    })

    it('should handle null and undefined values safely', async () => {
      const userId = 'test-user-123'

      mockTenantDataSource.query?.mockImplementation((query: string) => {
        if (query.includes('SELECT su.societeId')) {
          return Promise.resolve([{ company_id: 'tenant-123' }])
        }
        return Promise.resolve([])
      })

      const queryWithNullValues = {
        selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
        fromTable: 'clients',
        filters: [
          {
            tableName: 'clients',
            columnName: 'nom',
            operator: 'IS NULL',
            value: null,
          },
        ],
        sorts: [],
      }

      await expect(
        executorService.executeStructuredQuery(queryWithNullValues, userId)
      ).resolves.toBeDefined()
    })
  })
})
