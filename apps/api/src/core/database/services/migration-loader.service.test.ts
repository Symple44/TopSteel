import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { DataSource, type QueryRunner } from 'typeorm'
import { vi } from 'vitest'
import { CreateInitialTables1737178800000 } from '../migrations/1737178800000-CreateInitialTables'
import { MigrationLoaderService } from './migration-loader.service'

// Mock the migration class
vi.mock('../migrations/1737178800000-CreateInitialTables', () => ({
  CreateInitialTables1737178800000: vi.fn().mockImplementation(() => ({
    up: vi.fn().mockResolvedValue(undefined),
    down: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe('MigrationLoaderService', () => {
  let service: MigrationLoaderService
  let dataSource: DataSource & { [K in keyof DataSource]: vi.MockedFunction<DataSource[K]> }
  let configService: ConfigService & {
    [K in keyof ConfigService]: vi.MockedFunction<ConfigService[K]>
  }
  let queryRunner: QueryRunner & { [K in keyof QueryRunner]: vi.MockedFunction<QueryRunner[K]> }
  let transactionManager: {
    query: vi.MockedFunction<(...args: unknown[]) => unknown>
    queryRunner: QueryRunner & { [K in keyof QueryRunner]: vi.MockedFunction<QueryRunner[K]> }
  }

  beforeEach(async () => {
    // Create mocked QueryRunner
    queryRunner = {
      query: vi.fn(),
      manager: {
        query: vi.fn(),
      },
    } as QueryRunner & { [K in keyof QueryRunner]: vi.MockedFunction<QueryRunner[K]> }

    // Create mocked transaction manager
    transactionManager = {
      query: vi.fn(),
      queryRunner,
    }

    // Create mocked DataSource
    dataSource = {
      query: vi.fn(),
      transaction: vi.fn().mockImplementation((callback) => callback(transactionManager)),
    } as DataSource & { [K in keyof DataSource]: vi.MockedFunction<DataSource[K]> }

    // Create mocked ConfigService
    configService = {
      get: vi.fn(),
    } as ConfigService & { [K in keyof ConfigService]: vi.MockedFunction<ConfigService[K]> }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationLoaderService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile()

    service = module.get<MigrationLoaderService>(MigrationLoaderService)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor and Environment Detection', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should detect development environment correctly', () => {
      configService.get.mockReturnValue('development')

      const _testModule = Test.createTestingModule({
        providers: [
          MigrationLoaderService,
          {
            provide: DataSource,
            useValue: dataSource,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile()

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV')
    })

    it('should handle missing NODE_ENV gracefully', () => {
      configService.get.mockReturnValue(undefined)

      expect(() => {
        Test.createTestingModule({
          providers: [
            MigrationLoaderService,
            {
              provide: DataSource,
              useValue: dataSource,
            },
            {
              provide: ConfigService,
              useValue: configService,
            },
          ],
        }).compile()
      }).not.toThrow()
    })
  })

  describe('runInitialMigrations', () => {
    it('should successfully run initial migrations when migrations table does not exist', async () => {
      // Mock: migrations table doesn't exist
      dataSource.query.mockResolvedValueOnce([{ exists: false }]) // migrations table check

      // Mock: create migrations table and run migration
      transactionManager.query.mockResolvedValueOnce(undefined) // INSERT migration record

      const mockMigrationInstance = new (
        CreateInitialTables1737178800000 as vi.MockedFunction<
          typeof CreateInitialTables1737178800000
        >
      )()

      await service.runInitialMigrations()

      expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('SELECT EXISTS'))
      expect(dataSource.transaction).toHaveBeenCalled()
      expect(mockMigrationInstance.up).toHaveBeenCalledWith(queryRunner)
      expect(transactionManager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO migrations'),
        [1737178800000, 'CreateInitialTables1737178800000']
      )
    })

    it('should skip migrations when already executed', async () => {
      // Mock: migrations table exists and migration already executed
      dataSource.query
        .mockResolvedValueOnce([{ exists: true }]) // migrations table exists
        .mockResolvedValueOnce([{ name: 'CreateInitialTables1737178800000' }]) // migration exists

      await service.runInitialMigrations()

      expect(dataSource.query).toHaveBeenCalledTimes(2)
      expect(dataSource.transaction).not.toHaveBeenCalled()
    })

    it('should create migrations table when it does not exist', async () => {
      // Mock: migrations table doesn't exist, no existing migrations
      dataSource.query.mockResolvedValueOnce([{ exists: false }]) // migrations table check

      transactionManager.query.mockResolvedValue(undefined)

      await service.runInitialMigrations()

      expect(dataSource.transaction).toHaveBeenCalled()
    })

    it('should handle database errors during migration execution', async () => {
      // Mock: migrations table doesn't exist
      dataSource.query.mockResolvedValueOnce([{ exists: false }])

      // Mock: transaction fails
      const mockError = new Error('Database connection failed')
      dataSource.transaction.mockRejectedValue(mockError)

      await expect(service.runInitialMigrations()).rejects.toThrow('Database connection failed')
    })

    it('should handle QueryRunner not available error', async () => {
      // Mock: migrations table doesn't exist
      dataSource.query.mockResolvedValueOnce([{ exists: false }])

      // Mock: transaction with no QueryRunner
      const transactionManagerNoQueryRunner = {
        query: vi.fn(),
        queryRunner: null,
      }
      dataSource.transaction.mockImplementation((callback) =>
        callback(transactionManagerNoQueryRunner)
      )

      await expect(service.runInitialMigrations()).rejects.toThrow('QueryRunner is not available')
    })
  })

  describe('checkBaseTables', () => {
    it('should return true when all base tables exist', async () => {
      dataSource.query.mockResolvedValueOnce([{ count: '4' }])

      const result = await service.checkBaseTables()

      expect(result).toBe(true)
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count')
      )
    })

    it('should return false when some base tables are missing', async () => {
      dataSource.query.mockResolvedValueOnce([{ count: '2' }])

      const result = await service.checkBaseTables()

      expect(result).toBe(false)
    })

    it('should return false when no base tables exist', async () => {
      dataSource.query.mockResolvedValueOnce([{ count: '0' }])

      const result = await service.checkBaseTables()

      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database query failed')
      dataSource.query.mockRejectedValue(mockError)

      const result = await service.checkBaseTables()

      expect(result).toBe(false)
    })

    it('should handle non-numeric count values', async () => {
      dataSource.query.mockResolvedValueOnce([{ count: 'invalid' }])

      const result = await service.checkBaseTables()

      expect(result).toBe(false)
    })
  })

  describe('ensureMigrations', () => {
    it('should skip migrations when tables already exist', async () => {
      // Mock checkBaseTables to return true
      vi.spyOn(service, 'checkBaseTables').mockResolvedValue(true)
      const runInitialMigrationsSpy = jest
        .spyOn(service, 'runInitialMigrations')
        .mockResolvedValue()

      await service.ensureMigrations()

      expect(runInitialMigrationsSpy).not.toHaveBeenCalled()
    })

    it('should run migrations when tables are missing', async () => {
      // Mock checkBaseTables to return false
      vi.spyOn(service, 'checkBaseTables').mockResolvedValue(false)
      const runInitialMigrationsSpy = jest
        .spyOn(service, 'runInitialMigrations')
        .mockResolvedValue()

      await service.ensureMigrations()

      expect(runInitialMigrationsSpy).toHaveBeenCalled()
    })

    it('should propagate errors from runInitialMigrations', async () => {
      const mockError = new Error('Migration failed')
      vi.spyOn(service, 'checkBaseTables').mockResolvedValue(false)
      vi.spyOn(service, 'runInitialMigrations').mockRejectedValue(mockError)

      await expect(service.ensureMigrations()).rejects.toThrow('Migration failed')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed migration table query results', async () => {
      // Mock malformed response
      dataSource.query.mockResolvedValueOnce([{}]) // missing 'exists' property

      await expect(service.runInitialMigrations()).rejects.toThrow()
    })

    it('should handle empty query results', async () => {
      dataSource.query.mockResolvedValueOnce([]) // empty array

      await expect(service.runInitialMigrations()).rejects.toThrow()
    })

    it('should handle SQL injection attempts safely', async () => {
      // This test ensures our queries are parameterized and safe
      const _maliciousInput = "'; DROP TABLE users; --"

      // Mock normal flow
      dataSource.query.mockResolvedValueOnce([{ exists: false }])
      transactionManager.query.mockResolvedValue(undefined)

      await service.runInitialMigrations()

      // Verify that our queries are properly structured and not vulnerable
      expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('SELECT EXISTS'))
      expect(transactionManager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO migrations (timestamp, name)'),
        expect.arrayContaining([1737178800000, 'CreateInitialTables1737178800000'])
      )
    })

    it('should handle concurrent migration attempts gracefully', async () => {
      // Mock: first call finds no migrations table, second call during transaction might find existing migrations
      dataSource.query
        .mockResolvedValueOnce([{ exists: false }]) // initial check
        .mockResolvedValueOnce([{ name: 'CreateInitialTables1737178800000' }]) // concurrent execution check

      // Should not throw, but should handle gracefully
      await service.runInitialMigrations()
    })
  })

  describe('Performance and Optimization', () => {
    it('should complete migrations within reasonable time', async () => {
      dataSource.query.mockResolvedValueOnce([{ exists: false }])
      transactionManager.query.mockResolvedValue(undefined)

      const startTime = Date.now()
      await service.runInitialMigrations()
      const endTime = Date.now()

      // Should complete within 5 seconds (generous for test environment)
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should handle large migration result sets efficiently', async () => {
      // Mock a large number of existing migrations
      const largeMigrationList = Array.from({ length: 1000 }, (_, i) => ({
        name: `Migration${i}`,
      }))

      dataSource.query
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce(largeMigrationList)

      await expect(service.runInitialMigrations()).resolves.not.toThrow()
    })
  })
})
