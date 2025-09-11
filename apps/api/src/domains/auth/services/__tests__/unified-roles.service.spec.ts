import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../../../users/entities/user.entity'
import { GlobalUserRole, SocieteRoleType } from '../../core/constants/roles.constants'
import { UserSocieteRole } from '../../core/entities/user-societe-role.entity'
import type { UserSocieteInfo } from '../unified-roles.service'
import { UnifiedRolesService } from '../unified-roles.service'

/**
 * Tests unitaires pour UnifiedRolesService
 *
 * Focus sur les méthodes modifiées :
 * - getUserSocieteRoles (support SUPER_ADMIN virtuel)
 * - getUserSocieteRole (rôles virtuels SUPER_ADMIN)
 * - getSuperAdminSocietes (nouveau comportement)
 * - Caching et invalidation
 */
describe('UnifiedRolesService', () => {
  let service: UnifiedRolesService
  let userSocieteRoleRepository: Record<string, unknown>
  let userRepository: Record<string, unknown>
  let cacheService: Record<string, unknown>

  const mockUser = {
    id: 'user-123',
    email: 'test@topsteel.com',
    role: GlobalUserRole.MANAGER,
    actif: true,
    nom: 'Test',
    prenom: 'User',
    acronyme: 'TU',
  } as User

  const mockSuperAdminUser = {
    id: 'super-admin-123',
    email: 'admin@topsteel.com',
    role: GlobalUserRole.SUPER_ADMIN,
    actif: true,
    nom: 'Super',
    prenom: 'Admin',
    acronyme: 'SA',
  } as User

  const mockUserSocieteRole = {
    id: 'usr-123',
    userId: 'user-123',
    societeId: 'societe-123',
    roleType: SocieteRoleType.MANAGER,
    isActive: true,
    isDefaultSociete: true,
    additionalPermissions: [],
    restrictedPermissions: [],
    allowedSiteIds: ['site-1', 'site-2'],
    expiresAt: null,
    grantedById: 'admin-123',
    societe: {
      id: 'societe-123',
      nom: 'Test Company',
      code: 'TC001',
      sites: [
        { id: 'site-1', nom: 'Site 1', code: 'S001' },
        { id: 'site-2', nom: 'Site 2', code: 'S002' },
      ],
    },
    isEffectivelyActive: vi.fn().mockReturnValue(true),
  } as UserSocieteRole

  beforeEach(() => {
    // Create mocks
    const mockQueryBuilder = {
      createQueryBuilder: vi.fn().mockReturnThis(),
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([mockUserSocieteRole]),
      getOne: vi.fn().mockResolvedValue(mockUserSocieteRole),
      query: vi.fn().mockResolvedValue([
        { id: 'societe-1', nom: 'Company 1', code: 'C001' },
        { id: 'societe-2', nom: 'Company 2', code: 'C002' },
        { id: 'societe-3', nom: 'Company 3', code: 'C003' },
      ]),
    }

    userSocieteRoleRepository = {
      ...mockQueryBuilder,
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }

    userRepository = {
      findOne: vi.fn(),
    }

    cacheService = {
      getWithMetrics: vi.fn(),
      setWithGroup: vi.fn(),
      set: vi.fn(),
      invalidateGroup: vi.fn(),
      invalidatePattern: vi.fn(),
    }

    // Create service instance with direct dependency injection
    service = new UnifiedRolesService(
      userSocieteRoleRepository as Record<string, unknown>,
      userRepository as Record<string, unknown>,
      cacheService as Record<string, unknown>
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserSocieteRoles', () => {
    it('should return cached roles if available', async () => {
      const cachedRoles: UserSocieteInfo[] = [
        {
          userId: 'user-123',
          societeId: 'societe-123',
          globalRole: GlobalUserRole.MANAGER,
          societeRole: SocieteRoleType.MANAGER,
          effectiveRole: SocieteRoleType.MANAGER,
          isDefaultSociete: true,
          isActive: true,
          permissions: [],
          additionalPermissions: [],
          restrictedPermissions: [],
        },
      ]

      cacheService.getWithMetrics.mockResolvedValue(cachedRoles)

      const result = await service.getUserSocieteRoles('user-123')

      expect(result).toEqual(cachedRoles)
      expect(cacheService.getWithMetrics).toHaveBeenCalledWith('user_societe_roles:user-123')
      expect(userRepository.findOne).not.toHaveBeenCalled()
    })

    it('should return empty array if user not found', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(null)

      const result = await service.getUserSocieteRoles('nonexistent-user')

      expect(result).toEqual([])
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-user' },
        select: ['id', 'email', 'role', 'actif', 'nom', 'prenom', 'acronyme'],
      })
    })

    it('should fetch and cache user roles when not in cache', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(mockUser)

      const result = await service.getUserSocieteRoles('user-123')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        userId: 'user-123',
        societeId: 'societe-123',
        globalRole: GlobalUserRole.MANAGER,
        societeRole: SocieteRoleType.MANAGER,
        effectiveRole: SocieteRoleType.MANAGER,
        isDefaultSociete: true,
        isActive: true,
      })

      expect(userSocieteRoleRepository.createQueryBuilder).toHaveBeenCalledWith('usr')
      expect(cacheService.setWithGroup).toHaveBeenCalledWith(
        'user_societe_roles:user-123',
        expect.any(Array),
        'user:user-123',
        300
      )
    })

    it('should handle user with no société roles', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(mockUser)
      userSocieteRoleRepository.createQueryBuilder().getMany.mockResolvedValue([])

      const result = await service.getUserSocieteRoles('user-123')

      expect(result).toEqual([])
      expect(cacheService.setWithGroup).toHaveBeenCalledWith(
        'user_societe_roles:user-123',
        [],
        'user:user-123',
        300
      )
    })
  })

  describe('getUserSocieteRole', () => {
    it('should return cached role if available', async () => {
      const cachedRole: UserSocieteInfo = {
        userId: 'user-123',
        societeId: 'societe-123',
        globalRole: GlobalUserRole.MANAGER,
        societeRole: SocieteRoleType.MANAGER,
        effectiveRole: SocieteRoleType.MANAGER,
        isDefaultSociete: true,
        isActive: true,
        permissions: [],
        additionalPermissions: [],
        restrictedPermissions: [],
      }

      cacheService.getWithMetrics.mockResolvedValue(cachedRole)

      const result = await service.getUserSocieteRole('user-123', 'societe-123')

      expect(result).toEqual(cachedRole)
      expect(cacheService.getWithMetrics).toHaveBeenCalledWith(
        'user_societe_role:user-123:societe-123'
      )
    })

    it('should return null if user not found', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(null)

      const result = await service.getUserSocieteRole('nonexistent-user', 'societe-123')

      expect(result).toBeNull()
    })

    it('should create virtual SUPER_ADMIN role when no explicit role exists', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(mockSuperAdminUser)
      userSocieteRoleRepository.createQueryBuilder().getOne.mockResolvedValue(null)

      const result = await service.getUserSocieteRole('super-admin-123', 'societe-123')

      expect(result).toMatchObject({
        userId: 'super-admin-123',
        societeId: 'societe-123',
        globalRole: GlobalUserRole.SUPER_ADMIN,
        societeRole: SocieteRoleType.OWNER,
        effectiveRole: SocieteRoleType.OWNER,
        isDefaultSociete: false,
        isActive: true,
        permissions: [],
        additionalPermissions: [],
        restrictedPermissions: [],
      })

      expect(cacheService.setWithGroup).toHaveBeenCalledWith(
        'user_societe_role:super-admin-123:societe-123',
        expect.objectContaining({
          globalRole: GlobalUserRole.SUPER_ADMIN,
          societeRole: SocieteRoleType.OWNER,
        }),
        'user:super-admin-123',
        300
      )
    })

    it('should NOT create virtual role for non-SUPER_ADMIN users', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(mockUser) // Regular MANAGER user
      userSocieteRoleRepository.createQueryBuilder().getOne.mockResolvedValue(null)

      const result = await service.getUserSocieteRole('user-123', 'societe-123')

      expect(result).toBeNull()
      expect(cacheService.setWithGroup).toHaveBeenCalledWith(
        'user_societe_role:user-123:societe-123',
        null,
        'user:user-123',
        300
      )
    })

    it('should return actual role when it exists, even for SUPER_ADMIN', async () => {
      const superAdminWithExplicitRole = {
        ...mockUserSocieteRole,
        userId: 'super-admin-123',
        roleType: SocieteRoleType.ADMIN,
      }

      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(mockSuperAdminUser)
      userSocieteRoleRepository
        .createQueryBuilder()
        .getOne.mockResolvedValue(superAdminWithExplicitRole)

      const result = await service.getUserSocieteRole('super-admin-123', 'societe-123')

      expect(result).toMatchObject({
        userId: 'super-admin-123',
        societeId: 'societe-123',
        globalRole: GlobalUserRole.SUPER_ADMIN,
        societeRole: SocieteRoleType.ADMIN,
        effectiveRole: SocieteRoleType.OWNER, // SUPER_ADMIN global overrides société role
      })
    })
  })

  describe('getSuperAdminSocietes', () => {
    it('should return all active sociétés for SUPER_ADMIN', async () => {
      userRepository.findOne.mockResolvedValue(mockSuperAdminUser)

      const result = await service.getSuperAdminSocietes('super-admin-123')

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        userId: 'super-admin-123',
        societeId: 'societe-1',
        globalRole: GlobalUserRole.SUPER_ADMIN,
        societeRole: SocieteRoleType.OWNER,
        effectiveRole: SocieteRoleType.OWNER,
        isDefaultSociete: false,
        isActive: true,
        permissions: [],
        additionalPermissions: [],
        restrictedPermissions: [],
      })

      expect(userSocieteRoleRepository.query).toHaveBeenCalledWith(
        `\n      SELECT id, nom, code FROM societes WHERE status = 'ACTIVE'\n    `
      )
    })

    it('should return empty array for non-SUPER_ADMIN users', async () => {
      userRepository.findOne.mockResolvedValue(mockUser) // Regular MANAGER user

      const result = await service.getSuperAdminSocietes('user-123')

      expect(result).toEqual([])
      expect(userSocieteRoleRepository.query).not.toHaveBeenCalled()
    })

    it('should return empty array if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null)

      const result = await service.getSuperAdminSocietes('nonexistent-user')

      expect(result).toEqual([])
      expect(userSocieteRoleRepository.query).not.toHaveBeenCalled()
    })
  })

  describe('Cache Management', () => {
    it('should invalidate user role cache correctly', async () => {
      await service.invalidateUserRoleCache('user-123')

      expect(cacheService.invalidateGroup).toHaveBeenCalledWith('user:user-123')
    })

    it('should invalidate all user caches correctly', async () => {
      await service.invalidateAllUserCaches()

      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('user_societe_role*')
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('user_societe_roles*')
    })

    it('should cache user data when fetching from database', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockResolvedValue(mockUser)

      // Call private method through public method
      await service.getUserSocieteRoles('user-123')

      expect(cacheService.set).toHaveBeenCalledWith('user:user-123', mockUser, 600)
    })

    it('should return cached user data when available', async () => {
      // First call should cache, second should use cache
      cacheService.getWithMetrics
        .mockResolvedValueOnce(null) // No cached roles
        .mockResolvedValueOnce(null) // No cached user first time
        .mockResolvedValueOnce(mockUser) // Cached user second time

      userRepository.findOne.mockResolvedValue(mockUser)

      // First call
      await service.getUserSocieteRoles('user-123')

      // Second call should use cached user
      await service.getUserSocieteRoles('user-123')

      expect(userRepository.findOne).toHaveBeenCalledTimes(1) // Only called once
    })
  })

  describe('Permission and Access Checks', () => {
    it('should correctly identify SUPER_ADMIN system access', async () => {
      userRepository.findOne.mockResolvedValue(mockSuperAdminUser)

      const result = await service.hasSystemAdminAccess('super-admin-123')

      expect(result).toBe(true)
    })

    it('should correctly identify non-SUPER_ADMIN system access', async () => {
      userRepository.findOne.mockResolvedValue(mockUser)

      const result = await service.hasSystemAdminAccess('user-123')

      expect(result).toBe(false)
    })

    it('should return false for nonexistent user system access', async () => {
      userRepository.findOne.mockResolvedValue(null)

      const result = await service.hasSystemAdminAccess('nonexistent-user')

      expect(result).toBe(false)
    })
  })

  describe('Role Assignment and Management', () => {
    it('should assign new role to user in société', async () => {
      userSocieteRoleRepository.findOne.mockResolvedValue(null)
      const mockCreate = vi.fn().mockReturnValue(mockUserSocieteRole)
      UserSocieteRole.create = mockCreate
      userSocieteRoleRepository.save.mockResolvedValue(mockUserSocieteRole as UserSocieteRole)

      const result = await service.assignUserToSociete(
        'user-123',
        'societe-123',
        SocieteRoleType.MANAGER,
        'admin-123',
        {
          isDefault: true,
          additionalPermissions: ['read_reports'],
          allowedSiteIds: ['site-1'],
        }
      )

      expect(mockCreate).toHaveBeenCalledWith(
        'user-123',
        'societe-123',
        SocieteRoleType.MANAGER,
        'admin-123'
      )
      expect(userSocieteRoleRepository.save).toHaveBeenCalled()
      expect(result).toEqual(mockUserSocieteRole)
    })

    it('should update existing role assignment', async () => {
      const existingRole = { ...mockUserSocieteRole }
      userSocieteRoleRepository.findOne.mockResolvedValue(existingRole)
      userSocieteRoleRepository.save.mockResolvedValue(existingRole as UserSocieteRole)

      await service.assignUserToSociete(
        'user-123',
        'societe-123',
        SocieteRoleType.ADMIN,
        'admin-123',
        {
          isDefault: false,
          restrictedPermissions: ['delete_data'],
        }
      )

      expect(existingRole.roleType).toBe(SocieteRoleType.ADMIN)
      expect(existingRole.isActive).toBe(true)
      expect(existingRole.restrictedPermissions).toEqual(['delete_data'])
      expect(userSocieteRoleRepository.save).toHaveBeenCalledWith(existingRole)
    })
  })

  describe('Role Validation', () => {
    it('should validate coherent role assignment', () => {
      const validation = service.validateRoleAssignment(
        GlobalUserRole.ADMIN,
        SocieteRoleType.ADMIN,
        ['read_reports'],
        []
      )

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toEqual([])
      expect(validation.warnings).toHaveLength(0)
    })

    it('should detect role hierarchy conflicts', () => {
      const validation = service.validateRoleAssignment(
        GlobalUserRole.SUPER_ADMIN,
        SocieteRoleType.USER, // Lower than expected
        [],
        []
      )

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toContain(
        'Le rôle société USER est inférieur au rôle global SUPER_ADMIN'
      )
    })

    it('should detect permission conflicts', () => {
      const conflictingPermissions = ['read_data', 'write_data']

      const validation = service.validateRoleAssignment(
        GlobalUserRole.MANAGER,
        SocieteRoleType.MANAGER,
        conflictingPermissions,
        conflictingPermissions
      )

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain(
        'Conflit de permissions: read_data, write_data sont à la fois accordées et restreintes'
      )
    })

    it('should warn about SUPER_ADMIN with restrictions', () => {
      const validation = service.validateRoleAssignment(
        GlobalUserRole.SUPER_ADMIN,
        SocieteRoleType.OWNER,
        [],
        ['some_restriction']
      )

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toContain(
        'SUPER_ADMIN ne devrait pas avoir de permissions restreintes'
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      cacheService.getWithMetrics.mockResolvedValue(null)
      userRepository.findOne.mockRejectedValue(new Error('Database connection error'))

      await expect(service.getUserSocieteRoles('user-123')).rejects.toThrow(
        'Database connection error'
      )
    })

    it('should handle cache errors gracefully', async () => {
      cacheService.getWithMetrics.mockRejectedValue(new Error('Cache connection error'))
      userRepository.findOne.mockResolvedValue(mockUser)

      // Should propagate cache errors since the service doesn't handle them currently
      await expect(service.getUserSocieteRoles('user-123')).rejects.toThrow(
        'Cache connection error'
      )
    })
  })
})
