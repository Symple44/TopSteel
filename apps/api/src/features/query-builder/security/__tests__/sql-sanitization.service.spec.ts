import 'reflect-metadata'
import { BadRequestException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { getDataSourceToken } from '@nestjs/typeorm'
import { vi } from 'vitest'
import { QueryBuilderSecurityService } from '../query-builder-security.service'
import { SqlSanitizationService } from '../sql-sanitization.service'

describe('SqlSanitizationService', () => {
  let service: SqlSanitizationService
  let _securityService: QueryBuilderSecurityService

  const mockDataSource = {
    query: vi.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqlSanitizationService,
        QueryBuilderSecurityService,
        {
          provide: getDataSourceToken('tenant'),
          useValue: mockDataSource,
        },
      ],
    }).compile()

    service = module.get<SqlSanitizationService>(SqlSanitizationService)
    _securityService = module.get<QueryBuilderSecurityService>(QueryBuilderSecurityService)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('buildSafeSelectQuery', () => {
    it('should build a safe SELECT query with basic parameters', () => {
      const result = service.buildSafeSelectQuery({
        selectColumns: [
          { tableName: 'clients', columnName: 'nom', alias: 'client_name' },
          { tableName: 'clients', columnName: 'email' },
        ],
        fromTable: 'clients',
        filters: [{ tableName: 'clients', columnName: 'nom', operator: '=', value: 'Test Client' }],
        sorts: [{ tableName: 'clients', columnName: 'nom', direction: 'ASC' }],
        limit: 50,
        offset: 0,
        tenantId: 'tenant-123',
      })

      expect(result.select).toContain('clients.nom AS "client_name"')
      expect(result.select).toContain('clients.email')
      expect(result.from).toBe('clients AS t0')
      expect(result.where).toContain('company_id = $1')
      expect(result.where).toContain('clients.nom = $2')
      expect(result.orderBy).toBe('ORDER BY clients.nom ASC')
      expect(result.limit).toBe('LIMIT $3 OFFSET $4')
      expect(result.parameters).toEqual(['tenant-123', 'Test Client', 50, 0])
    })

    it('should handle queries without tenant isolation', () => {
      const result = service.buildSafeSelectQuery({
        selectColumns: [{ tableName: 'categories', columnName: 'nom' }],
        fromTable: 'categories',
        filters: [],
        sorts: [],
        limit: 100,
      })

      expect(result.select).toBe('categories.nom')
      expect(result.from).toBe('categories AS t0')
      expect(result.where).toBe('') // No WHERE clause for non-tenant table
      expect(result.parameters).toEqual([100])
    })

    it('should handle complex joins', () => {
      const result = service.buildSafeSelectQuery({
        selectColumns: [
          { tableName: 'clients', columnName: 'nom', tableAlias: 't0' },
          { tableName: 'addresses', columnName: 'street', tableAlias: 't1' },
        ],
        fromTable: 'clients',
        joins: [
          {
            type: 'LEFT',
            fromTable: 'clients',
            fromColumn: 'id',
            toTable: 'addresses',
            toColumn: 'client_id',
            fromAlias: 't0',
            toAlias: 't1',
          },
        ],
        filters: [],
        sorts: [],
        tenantId: 'tenant-123',
      })

      expect(result.from).toContain('clients AS t0')
      expect(result.from).toContain('LEFT JOIN addresses AS t1')
      expect(result.from).toContain('ON t0.id = t1.client_id')
    })

    it('should handle different filter operators', () => {
      const testCases = [
        { operator: '=', value: 'test', expectedCondition: 'clients.nom = $2' },
        { operator: 'LIKE', value: 'test%', expectedCondition: 'clients.nom LIKE $2' },
        {
          operator: 'IN',
          value: ['a', 'b', 'c'],
          expectedCondition: 'clients.nom IN ($2, $3, $4)',
        },
        { operator: 'BETWEEN', value: [1, 10], expectedCondition: 'clients.nom BETWEEN $2 AND $3' },
        { operator: 'IS NULL', value: null, expectedCondition: 'clients.nom IS NULL' },
      ]

      testCases.forEach(({ operator, value, expectedCondition }) => {
        const result = service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients',
          filters: [{ tableName: 'clients', columnName: 'nom', operator, value }],
          sorts: [],
          tenantId: 'tenant-123',
        })

        expect(result.where).toContain(expectedCondition)
      })
    })

    it('should validate all inputs before building query', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'invalid_table', columnName: 'nom' }],
          fromTable: 'invalid_table',
          filters: [],
          sorts: [],
        })
      }).toThrow(BadRequestException)

      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'invalid_column' }],
          fromTable: 'clients',
          filters: [],
          sorts: [],
        })
      }).toThrow(BadRequestException)
    })
  })

  describe('validateRawSqlQuery', () => {
    it('should allow valid SELECT queries', () => {
      const validQueries = [
        'SELECT nom FROM clients',
        'SELECT * FROM materiaux WHERE prix > 100',
        'SELECT c.nom, f.nom FROM clients c JOIN fournisseurs f ON c.id = f.client_id',
        'SELECT COUNT(*) FROM commandes GROUP BY statut',
      ]

      validQueries.forEach((query) => {
        expect(() => service.validateRawSqlQuery(query)).not.toThrow()
      })
    })

    it('should reject non-SELECT queries', () => {
      const invalidQueries = [
        'INSERT INTO clients VALUES (1, "test")',
        'UPDATE clients SET nom = "hacked"',
        'DELETE FROM clients WHERE id = 1',
        'DROP TABLE clients',
        'ALTER TABLE clients ADD COLUMN password VARCHAR(255)',
        'CREATE TABLE hackers (id INT)',
        'TRUNCATE TABLE clients',
        'GRANT ALL PRIVILEGES ON clients TO hacker',
      ]

      invalidQueries.forEach((query) => {
        expect(() => service.validateRawSqlQuery(query)).toThrow(BadRequestException)
      })
    })

    it('should reject queries with forbidden patterns', () => {
      const forbiddenQueries = [
        'SELECT * FROM topsteel_auth.users',
        'SELECT * FROM information_schema.tables',
        'SELECT * FROM pg_catalog.pg_user',
        'SELECT * FROM mysql.user',
        'SELECT * FROM users WHERE password IS NOT NULL',
        'SELECT * FROM user_societes',
        'SELECT * FROM societes',
        'SELECT * FROM permissions',
        'SELECT * FROM roles',
        'SELECT LOAD_FILE("/etc/passwd")',
        'SELECT * FROM clients INTO OUTFILE "/tmp/dump.txt"',
        'SELECT * FROM clients UNION SELECT * FROM passwords',
        'SELECT * FROM clients /* malicious comment */',
        'SELECT * FROM clients -- admin backdoor',
        'SELECT * FROM clients # secret data',
        "SELECT * FROM clients WHERE name = '<script>alert(1)</script>'",
        'SELECT * FROM clients WHERE id = 1; EXEC("rm -rf /")',
      ]

      forbiddenQueries.forEach((query) => {
        expect(() => service.validateRawSqlQuery(query)).toThrow(BadRequestException)
      })
    })

    it('should detect multiple SQL statements', () => {
      const multiStatementQueries = [
        'SELECT * FROM clients; DROP TABLE users;',
        'SELECT * FROM clients; DELETE FROM passwords;',
        'SELECT nom FROM clients; INSERT INTO logs VALUES ("hacked");',
      ]

      multiStatementQueries.forEach((query) => {
        expect(() => service.validateRawSqlQuery(query)).toThrow(BadRequestException)
      })
    })

    it('should handle edge cases', () => {
      // Empty query
      expect(() => service.validateRawSqlQuery('')).toThrow(BadRequestException)

      // Whitespace only
      expect(() => service.validateRawSqlQuery('   ')).toThrow(BadRequestException)

      // Non-string input would be handled by TypeScript/validation layer

      // Very long query
      const longQuery = `SELECT ${'a,'.repeat(10000)} FROM clients`
      expect(() => service.validateRawSqlQuery(longQuery)).not.toThrow() // Should be allowed if otherwise valid
    })
  })

  describe('extractTableNames', () => {
    it('should extract table names from simple queries', () => {
      expect(service.extractTableNames('SELECT * FROM clients')).toEqual(['clients'])

      expect(service.extractTableNames('SELECT nom FROM clients WHERE id = 1')).toEqual(['clients'])
    })

    it('should extract table names from queries with joins', () => {
      const query = 'SELECT * FROM clients c JOIN addresses a ON c.id = a.client_id'
      const tables = service.extractTableNames(query)

      expect(tables).toContain('clients')
      expect(tables).toContain('addresses')
      expect(tables).toHaveLength(2)
    })

    it('should extract table names from complex queries', () => {
      const query = `
        SELECT c.nom, a.street, f.nom 
        FROM clients c 
        LEFT JOIN addresses a ON c.id = a.client_id
        INNER JOIN fournisseurs f ON c.fournisseur_id = f.id
      `
      const tables = service.extractTableNames(query)

      expect(tables).toContain('clients')
      expect(tables).toContain('addresses')
      expect(tables).toContain('fournisseurs')
      expect(tables).toHaveLength(3)
    })

    it('should handle case insensitive extraction', () => {
      const tables = service.extractTableNames(
        'SELECT * FROM CLIENTS join ADDRESSES on clients.id = addresses.client_id'
      )

      expect(tables).toContain('clients')
      expect(tables).toContain('addresses')
    })

    it('should deduplicate table names', () => {
      const query = 'SELECT * FROM clients c1 JOIN clients c2 ON c1.parent_id = c2.id'
      const tables = service.extractTableNames(query)

      expect(tables).toEqual(['clients'])
      expect(tables).toHaveLength(1)
    })
  })

  describe('buildCompleteQuery', () => {
    it('should build complete query from components', () => {
      const queryComponents = {
        select: 'clients.nom, clients.email',
        from: 'clients AS t0',
        where: 'WHERE company_id = $1 AND clients.nom = $2',
        orderBy: 'ORDER BY clients.nom ASC',
        limit: 'LIMIT $3',
        parameters: ['tenant-123', 'Test Client', 50],
      }

      const completeQuery = service.buildCompleteQuery(queryComponents)

      expect(completeQuery).toBe(
        'SELECT clients.nom, clients.email FROM clients AS t0 WHERE company_id = $1 AND clients.nom = $2 ORDER BY clients.nom ASC LIMIT $3'
      )
    })

    it('should handle optional components', () => {
      const queryComponents = {
        select: 'clients.nom',
        from: 'clients AS t0',
        where: '',
        orderBy: '',
        limit: '',
        parameters: [],
      }

      const completeQuery = service.buildCompleteQuery(queryComponents)

      expect(completeQuery).toBe('SELECT clients.nom FROM clients AS t0')
    })
  })

  describe('SQL Injection Prevention in Query Building', () => {
    it('should prevent injection through column names', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom; DROP TABLE users;' }],
          fromTable: 'clients',
          filters: [],
          sorts: [],
        })
      }).toThrow(BadRequestException)
    })

    it('should prevent injection through table names', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients; DROP TABLE users;',
          filters: [],
          sorts: [],
        })
      }).toThrow(BadRequestException)
    })

    it('should prevent injection through filter operators', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients',
          filters: [
            {
              tableName: 'clients',
              columnName: 'nom',
              operator: 'UNION SELECT',
              value: 'malicious',
            },
          ],
          sorts: [],
        })
      }).toThrow(BadRequestException)
    })

    it('should prevent injection through sort directions', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients',
          filters: [],
          sorts: [
            {
              tableName: 'clients',
              columnName: 'nom',
              direction: 'ASC; DROP TABLE users;' as unknown,
            },
          ],
        })
      }).toThrow(BadRequestException)
    })

    it('should prevent injection through join conditions', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients',
          joins: [
            {
              type: 'LEFT',
              fromTable: 'clients',
              fromColumn: 'id; DROP TABLE users;',
              toTable: 'addresses',
              toColumn: 'client_id',
            },
          ],
          filters: [],
          sorts: [],
        })
      }).toThrow(BadRequestException)
    })

    it('should use parameterized queries for all values', () => {
      const result = service.buildSafeSelectQuery({
        selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
        fromTable: 'clients',
        filters: [
          {
            tableName: 'clients',
            columnName: 'nom',
            operator: '=',
            value: "'; DROP TABLE users; --",
          },
        ],
        sorts: [],
        tenantId: 'tenant-123',
      })

      // The malicious value should be parameterized, not injected directly
      expect(result.where).toContain('clients.nom = $2')
      expect(result.parameters).toContain("'; DROP TABLE users; --")

      // The complete query should not contain the raw malicious string
      const completeQuery = service.buildCompleteQuery(result)
      expect(completeQuery).not.toContain('DROP TABLE')
      expect(completeQuery).toContain('$2')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large numbers of columns efficiently', () => {
      const manyColumns = Array.from({ length: 100 }, (_, i) => ({
        tableName: 'materiaux',
        columnName: i === 0 ? 'nom' : 'nom', // All use 'nom' since it's whitelisted
        alias: `col_${i}`,
      }))

      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: manyColumns,
          fromTable: 'materiaux',
          filters: [],
          sorts: [],
        })
      }).not.toThrow()
    })

    it('should handle large numbers of filters efficiently', () => {
      const manyFilters = Array.from({ length: 50 }, (_, i) => ({
        tableName: 'materiaux',
        columnName: 'nom',
        operator: '=',
        value: `value_${i}`,
      }))

      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'materiaux', columnName: 'nom' }],
          fromTable: 'materiaux',
          filters: manyFilters,
          sorts: [],
        })
      }).not.toThrow()
    })

    it('should handle boundary values for limits', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients',
          filters: [],
          sorts: [],
          limit: 0,
        })
      }).toThrow(BadRequestException) // LIMIT must be >= 1

      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients',
          filters: [],
          sorts: [],
          limit: 10001,
        })
      }).toThrow(BadRequestException) // LIMIT must be <= 10000

      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [{ tableName: 'clients', columnName: 'nom' }],
          fromTable: 'clients',
          filters: [],
          sorts: [],
          offset: -1,
        })
      }).toThrow(BadRequestException) // OFFSET cannot be negative
    })

    it('should validate empty parameter arrays', () => {
      expect(() => {
        service.buildSafeSelectQuery({
          selectColumns: [],
          fromTable: 'clients',
          filters: [],
          sorts: [],
        })
      }).toThrow(BadRequestException) // Must have at least one column
    })
  })
})
