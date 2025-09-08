import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { ParameterApplication } from '../entities/parameter-application.entity'
import { ParameterClient } from '../entities/parameter-client.entity'
import { ParameterScope, ParameterSystem, ParameterType } from '../entities/parameter-system.entity'
import { ParameterService } from './parameter.service'

describe('ParameterService', () => {
  let service: ParameterService
  let systemRepo: jest.Mocked<Repository<ParameterSystem>>
  let appRepo: jest.Mocked<Repository<ParameterApplication>>
  let clientRepo: jest.Mocked<Repository<ParameterClient>>

  const mockSystemParameter: ParameterSystem = {
    id: 1,
    group: 'user_roles',
    key: 'ADMIN',
    value: 'Administrateur',
    type: ParameterType.ENUM,
    scope: ParameterScope.AUTH,
    description: 'Rôle administrateur',
    translationKey: 'roles.admin',
    isActive: true,
    isReadonly: false,
    customTranslations: {
      en: 'Administrator',
      es: 'Administrador',
    },
    metadata: {
      icon: '🔧',
      color: 'orange',
      order: 2,
      permissions: ['admin.*'],
    },
    arrayValues: [],
    objectValues: {},
    businessRules: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as ParameterSystem

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }

    systemRepo = mockRepository as unknown
    appRepo = mockRepository as unknown
    clientRepo = mockRepository as unknown

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParameterService,
        {
          provide: getRepositoryToken(ParameterSystem, 'auth'),
          useValue: systemRepo,
        },
        {
          provide: getRepositoryToken(ParameterApplication, 'auth'),
          useValue: appRepo,
        },
        {
          provide: getRepositoryToken(ParameterClient, 'auth'),
          useValue: clientRepo,
        },
      ],
    }).compile()

    service = module.get<ParameterService>(ParameterService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Clear cache after each test
    service.invalidateRolesCache()
  })

  describe('getUserRoles', () => {
    it('should return user roles from database with French translations', async () => {
      const mockRoles = [
        { ...mockSystemParameter, key: 'ADMIN' },
        { ...mockSystemParameter, key: 'USER', value: 'Utilisateur' },
      ]

      systemRepo.find.mockResolvedValue(mockRoles)

      const result = await service.getUserRoles('fr')

      expect(systemRepo.find).toHaveBeenCalledWith({
        where: { group: 'user_roles', isActive: true },
        order: { key: 'ASC' },
      })
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        key: 'ADMIN',
        value: 'Administrateur',
        icon: '🔧',
        color: 'orange',
        order: 2,
      })
    })

    it('should return user roles with English translations', async () => {
      const mockRoles = [mockSystemParameter]
      systemRepo.find.mockResolvedValue(mockRoles)

      const result = await service.getUserRoles('en')

      expect(result[0].value).toBe('Administrator')
    })

    it('should use cache on subsequent calls', async () => {
      const mockRoles = [mockSystemParameter]
      systemRepo.find.mockResolvedValue(mockRoles)

      // First call
      await service.getUserRoles('fr')
      // Second call
      await service.getUserRoles('fr')

      expect(systemRepo.find).toHaveBeenCalledTimes(1)
    })

    it('should create default roles when none exist in database', async () => {
      systemRepo.find.mockResolvedValueOnce([]) // First call returns empty
      systemRepo.create.mockImplementation((data) => data as unknown)
      systemRepo.save.mockResolvedValue({} as unknown)

      // Mock the second call after creating default roles
      const mockDefaultRoles = [
        { ...mockSystemParameter, key: 'OWNER' },
        { ...mockSystemParameter, key: 'SUPER_ADMIN' },
      ]
      systemRepo.find.mockResolvedValueOnce(mockDefaultRoles)

      const result = await service.getUserRoles('fr')

      expect(systemRepo.create).toHaveBeenCalledTimes(10) // 10 default roles
      expect(systemRepo.save).toHaveBeenCalledTimes(10)
      expect(result).toBeDefined()
    })

    it('should handle database errors gracefully and return fallback roles', async () => {
      systemRepo.find.mockRejectedValue(new Error('Database connection failed'))

      const result = await service.getUserRoles('fr')

      expect(result).toHaveLength(3) // Fallback roles: SUPER_ADMIN, ADMIN, USER
      expect(result[0].key).toBe('SUPER_ADMIN')
      expect(result[0].isReadonly).toBe(true)
    })

    it('should use expired cache as fallback on database error', async () => {
      const mockRoles = [mockSystemParameter]
      systemRepo.find.mockResolvedValueOnce(mockRoles)

      // First call to populate cache
      await service.getUserRoles('fr')

      // Simulate cache expiry by manually setting it
      service.cacheExpiry = Date.now() - 1000

      // Second call with database error
      systemRepo.find.mockRejectedValue(new Error('Database error'))

      const result = await service.getUserRoles('fr')

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('ADMIN')
    })

    it('should mark SUPER_ADMIN as readonly', async () => {
      const mockRoles = [
        { ...mockSystemParameter, key: 'SUPER_ADMIN' },
        { ...mockSystemParameter, key: 'ADMIN' },
      ]
      systemRepo.find.mockResolvedValue(mockRoles)

      const result = await service.getUserRoles('fr')

      const superAdmin = result.find((role) => role.key === 'SUPER_ADMIN')
      const admin = result.find((role) => role.key === 'ADMIN')

      expect(superAdmin?.isReadonly).toBe(true)
      expect(admin?.isReadonly).toBe(false)
    })
  })

  describe('Cache Management', () => {
    it('should invalidate cache correctly', () => {
      // Populate cache first
      service.rolesCache = [mockSystemParameter]
      service.cacheExpiry = Date.now() + 5000

      service.invalidateRolesCache()

      expect(service.rolesCache).toBeNull()
      expect(service.cacheExpiry).toBe(0)
    })

    it('should automatically expire cache after TTL', async () => {
      const mockRoles = [mockSystemParameter]
      systemRepo.find.mockResolvedValue(mockRoles)

      // First call
      await service.getUserRoles('fr')

      // Manually expire cache
      service.cacheExpiry = Date.now() - 1000

      // Second call should hit database again
      await service.getUserRoles('fr')

      expect(systemRepo.find).toHaveBeenCalledTimes(2)
    })
  })

  describe('getSystemParameter', () => {
    it('should return system parameter with translations', async () => {
      systemRepo.findOne.mockResolvedValue(mockSystemParameter)

      const result = await service.getSystemParameter('user_roles', 'ADMIN', 'en')

      expect(result).toMatchObject({
        key: 'ADMIN',
        value: 'Administrator', // English translation
        type: ParameterType.ENUM,
        metadata: mockSystemParameter.metadata,
      })
    })

    it('should return null for non-existent parameter', async () => {
      systemRepo.findOne.mockResolvedValue(null)

      const result = await service.getSystemParameter('user_roles', 'NONEXISTENT')

      expect(result).toBeNull()
    })

    it('should use default language when translation missing', async () => {
      const paramWithoutTranslation = {
        ...mockSystemParameter,
        customTranslations: {},
      }
      systemRepo.findOne.mockResolvedValue(paramWithoutTranslation)

      const result = await service.getSystemParameter('user_roles', 'ADMIN', 'de')

      expect(result?.value).toBe('Administrateur') // Default French value
    })
  })

  describe('getParameterGroup', () => {
    it('should return all parameters for a group from system scope', async () => {
      const mockParams = [mockSystemParameter, { ...mockSystemParameter, key: 'USER' }]
      systemRepo.find.mockResolvedValue(mockParams)

      const result = await service.getParameterGroup('user_roles', 'fr', 'system')

      expect(systemRepo.find).toHaveBeenCalledWith({
        where: { group: 'user_roles', isActive: true },
        order: { key: 'ASC' },
      })
      expect(result).toHaveLength(2)
    })

    it('should handle application scope parameters', async () => {
      const mockParams = [mockSystemParameter]
      appRepo.find.mockResolvedValue(mockParams)

      await service.getParameterGroup('workflow', 'fr', 'application')

      expect(appRepo.find).toHaveBeenCalled()
      expect(systemRepo.find).not.toHaveBeenCalled()
    })

    it('should handle client scope parameters', async () => {
      const mockParams = [mockSystemParameter]
      clientRepo.find.mockResolvedValue(mockParams)

      await service.getParameterGroup('preferences', 'fr', 'client')

      expect(clientRepo.find).toHaveBeenCalled()
      expect(systemRepo.find).not.toHaveBeenCalled()
    })
  })

  describe('Array and Object Parameters', () => {
    it('should return available modules from array values', async () => {
      const mockParam = {
        ...mockSystemParameter,
        arrayValues: ['module1', 'module2', 'module3'],
      }
      systemRepo.findOne.mockResolvedValue(mockParam)

      const result = await service.getAvailableModules()

      expect(result).toEqual(['module1', 'module2', 'module3'])
    })

    it('should return empty array when parameter not found', async () => {
      systemRepo.findOne.mockResolvedValue(null)

      const result = await service.getAvailableModules()

      expect(result).toEqual([])
    })

    it('should return default permissions from object values', async () => {
      const mockParam = {
        ...mockSystemParameter,
        objectValues: { admin: ['*'], user: ['read'] },
      }
      systemRepo.findOne.mockResolvedValue(mockParam)

      const result = await service.getDefaultPermissions()

      expect(result).toEqual({ admin: ['*'], user: ['read'] })
    })

    it('should return workflow steps with business rules', async () => {
      const mockParam = {
        ...mockSystemParameter,
        arrayValues: ['step1', 'step2'],
        businessRules: { mandatory: true },
      }
      appRepo.findOne.mockResolvedValue(mockParam)

      const result = await service.getWorkflowSteps('fr')

      expect(result).toMatchObject({
        steps: ['step1', 'step2'],
        title: 'Administrateur',
        businessRules: { mandatory: true },
      })
    })
  })

  describe('Client Preferences', () => {
    it('should get client preferences grouped by category', async () => {
      const mockPreferences = [
        {
          group: 'dashboard',
          key: 'widgets',
          value: 'Widget config',
          arrayValues: ['widget1', 'widget2'],
          type: ParameterType.ARRAY,
          metadata: { layout: 'grid' },
          tenantId: 'tenant1',
        },
      ]
      clientRepo.find.mockResolvedValue(mockPreferences as unknown)

      const result = await service.getClientPreferences('tenant1', 'user1', 'fr')

      expect(result).toHaveProperty('dashboard')
      expect(result.dashboard).toHaveProperty('widgets')
      expect(result.dashboard.widgets).toMatchObject({
        value: 'Widget config',
        arrayValues: ['widget1', 'widget2'],
        type: ParameterType.ARRAY,
      })
    })

    it('should filter by tenant ID only when user ID not provided', async () => {
      clientRepo.find.mockResolvedValue([])

      await service.getClientPreferences('tenant1')

      expect(clientRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1', isActive: true },
        order: { group: 'ASC', key: 'ASC' },
      })
    })
  })

  describe('Parameter Updates', () => {
    it('should update system parameter successfully', async () => {
      const existingParam = { ...mockSystemParameter }
      systemRepo.findOne.mockResolvedValue(existingParam)
      systemRepo.save.mockResolvedValue(existingParam)

      const updates = {
        value: 'New Value',
        translations: { en: 'New English Value' },
        metadata: { newField: 'newValue' },
      }

      await service.updateParameter('user_roles', 'ADMIN', updates, 'system')

      expect(systemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'New Value',
          customTranslations: expect.objectContaining({
            en: 'New English Value',
          }),
          metadata: expect.objectContaining({
            newField: 'newValue',
          }),
        })
      )
    })

    it('should invalidate cache when updating user roles', async () => {
      const existingParam = { ...mockSystemParameter }
      systemRepo.findOne.mockResolvedValue(existingParam)
      systemRepo.save.mockResolvedValue(existingParam)

      const invalidateSpy = jest.spyOn(service, 'invalidateRolesCache')

      await service.updateParameter('user_roles', 'ADMIN', { value: 'New Value' })

      expect(invalidateSpy).toHaveBeenCalled()
    })

    it('should throw error when parameter not found for update', async () => {
      systemRepo.findOne.mockResolvedValue(null)

      await expect(
        service.updateParameter('user_roles', 'NONEXISTENT', { value: 'New Value' })
      ).rejects.toThrow('Parameter user_roles.NONEXISTENT not found')
    })

    it('should update client parameter with tenant ID filter', async () => {
      const existingParam = { ...mockSystemParameter, tenantId: 'tenant1' }
      clientRepo.findOne.mockResolvedValue(existingParam)
      clientRepo.save.mockResolvedValue(existingParam)

      await service.updateParameter('preferences', 'theme', { value: 'dark' }, 'client', 'tenant1')

      expect(clientRepo.findOne).toHaveBeenCalledWith({
        where: { group: 'preferences', key: 'theme', tenantId: 'tenant1' },
      })
    })
  })

  describe('Parameter Creation', () => {
    it('should create new system parameter successfully', async () => {
      const newParamData = {
        group: 'test_group',
        key: 'TEST_KEY',
        value: 'Test Value',
        type: 'STRING',
        translations: { en: 'English Test' },
        metadata: { category: 'test' },
      }

      systemRepo.create.mockReturnValue(newParamData as unknown)
      systemRepo.save.mockResolvedValue(newParamData as unknown)

      await service.createParameter(newParamData, 'system')

      expect(systemRepo.create).toHaveBeenCalledWith(newParamData)
      expect(systemRepo.save).toHaveBeenCalledWith(newParamData)
    })

    it('should invalidate cache when creating user roles parameter', async () => {
      const newRoleData = {
        group: 'user_roles',
        key: 'NEW_ROLE',
        value: 'New Role',
        type: 'ENUM',
      }

      systemRepo.create.mockReturnValue(newRoleData as unknown)
      systemRepo.save.mockResolvedValue(newRoleData as unknown)

      const invalidateSpy = jest.spyOn(service, 'invalidateRolesCache')

      await service.createParameter(newRoleData, 'system')

      expect(invalidateSpy).toHaveBeenCalled()
    })

    it('should handle creation with array and object values', async () => {
      const newParamData = {
        group: 'config',
        key: 'COMPLEX_PARAM',
        value: 'Complex Parameter',
        type: 'OBJECT',
        arrayValues: ['item1', 'item2'],
        objectValues: { nested: { value: 'test' } },
      }

      appRepo.create.mockReturnValue(newParamData as unknown)
      appRepo.save.mockResolvedValue(newParamData as unknown)

      await service.createParameter(newParamData, 'application')

      expect(appRepo.create).toHaveBeenCalledWith(newParamData)
      expect(appRepo.save).toHaveBeenCalledWith(newParamData)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed translation data gracefully', async () => {
      const paramWithBadTranslations = {
        ...mockSystemParameter,
        customTranslations: null, // Invalid translations
      }
      systemRepo.findOne.mockResolvedValue(paramWithBadTranslations)

      const result = await service.getSystemParameter('user_roles', 'ADMIN', 'en')

      expect(result?.value).toBe('Administrateur') // Should fallback to default value
    })

    it('should handle repository errors during parameter updates', async () => {
      systemRepo.findOne.mockResolvedValue(mockSystemParameter)
      systemRepo.save.mockRejectedValue(new Error('Database save failed'))

      await expect(
        service.updateParameter('user_roles', 'ADMIN', { value: 'New Value' })
      ).rejects.toThrow('Database save failed')
    })

    it('should handle concurrent cache operations safely', async () => {
      const mockRoles = [mockSystemParameter]
      systemRepo.find.mockResolvedValue(mockRoles)

      // Simulate concurrent calls
      const promises = [
        service.getUserRoles('fr'),
        service.getUserRoles('fr'),
        service.getUserRoles('fr'),
      ]

      const results = await Promise.all(promises)

      // All should return same data
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])

      // Should only hit database once due to caching
      expect(systemRepo.find).toHaveBeenCalledTimes(1)
    })

    it('should handle empty parameter groups gracefully', async () => {
      systemRepo.find.mockResolvedValue([])

      const result = await service.getParameterGroup('empty_group', 'fr', 'system')

      expect(result).toEqual([])
    })
  })
})
