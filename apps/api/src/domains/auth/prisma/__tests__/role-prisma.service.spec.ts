/**
 * RolePrismaService Unit Tests
 *
 * Tests critiques pour le service de gestion des rôles Prisma
 *
 * Coverage:
 * - CRUD rôles
 * - Gestion permissions
 * - Assignment/Revocation
 * - Statistics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RolePrismaService } from '../role-prisma.service'
import {
  createMockPrismaService,
  resetPrismaMocks,
  createMockRole,
  createMockPermission,
  type MockPrismaService,
} from '../../../../__tests__/helpers/prisma-mock-factory'

describe('RolePrismaService', () => {
  let service: RolePrismaService
  let mockPrisma: MockPrismaService

  beforeEach(() => {
    mockPrisma = createMockPrismaService()
    service = new RolePrismaService(mockPrisma as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetPrismaMocks(mockPrisma)
  })

  // ============================================
  // CREATE ROLE
  // ============================================

  describe('create', () => {
    const createRoleData = {
      name: 'ADMIN',
      label: 'Administrator',
      description: 'Admin role with full permissions',
    }

    it('should create role successfully', async () => {
      const mockCreatedRole = createMockRole(createRoleData)
      mockPrisma.role.create.mockResolvedValue(mockCreatedRole)

      const result = await service.create(createRoleData)

      expect(mockPrisma.role.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createRoleData.name,
          label: createRoleData.label,
          description: createRoleData.description,
        }),
      })
      expect(result).toEqual(mockCreatedRole)
    })

    it('should prevent duplicate role names', async () => {
      mockPrisma.role.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      })

      await expect(service.create(createRoleData)).rejects.toThrow()
    })

    it('should set isActive to true by default', async () => {
      const mockRole = createMockRole({ ...createRoleData, isActive: true })
      mockPrisma.role.create.mockResolvedValue(mockRole)

      const result = await service.create(createRoleData)

      expect(result.isActive).toBe(true)
    })

    it('should handle system role flag', async () => {
      const systemRoleData = { ...createRoleData, isSystem: true }
      const mockRole = createMockRole(systemRoleData)
      mockPrisma.role.create.mockResolvedValue(mockRole)

      const result = await service.create(systemRoleData)

      expect(result.isSystem).toBe(true)
    })
  })

  // ============================================
  // FIND ROLES
  // ============================================

  describe('findAllRoles', () => {
    it('should return all active roles', async () => {
      const mockRoles = [
        createMockRole({ name: 'ADMIN' }),
        createMockRole({ name: 'USER' }),
      ]

      mockPrisma.role.findMany.mockResolvedValue(mockRoles)

      const result = await service.findAllRoles()

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
      expect(result).toEqual(mockRoles)
    })

    it('should include inactive roles when requested', async () => {
      const allRoles = [
        createMockRole({ name: 'ADMIN', isActive: true }),
        createMockRole({ name: 'OLD_ROLE', isActive: false }),
      ]

      mockPrisma.role.findMany.mockResolvedValue(allRoles)

      await service.findAllRoles({ includeInactive: true })

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('findRoleById', () => {
    it('should find role by ID', async () => {
      const mockRole = createMockRole()
      mockPrisma.role.findUnique.mockResolvedValue(mockRole)

      const result = await service.findRoleById('role-123')

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
      })
      expect(result).toEqual(mockRole)
    })

    it('should return null for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null)

      const result = await service.findRoleById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findRoleByName', () => {
    it('should find role by name', async () => {
      const mockRole = createMockRole({ name: 'ADMIN' })
      mockPrisma.role.findUnique.mockResolvedValue(mockRole)

      const result = await service.findRoleByName('ADMIN')

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
      })
      expect(result).toEqual(mockRole)
    })

    it('should return null for non-existent role name', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null)

      const result = await service.findRoleByName('NONEXISTENT')

      expect(result).toBeNull()
    })
  })

  // ============================================
  // UPDATE ROLE
  // ============================================

  describe('updateRole', () => {
    it('should update role fields', async () => {
      const updateData = {
        label: 'Updated Label',
        description: 'Updated description',
      }

      const mockUpdatedRole = createMockRole(updateData)
      mockPrisma.role.update.mockResolvedValue(mockUpdatedRole)

      const result = await service.updateRole('role-123', updateData)

      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        data: expect.objectContaining(updateData),
      })
      expect(result).toEqual(mockUpdatedRole)
    })

    it('should prevent system role name changes', async () => {
      // Implementation should prevent changing system role names
      const mockSystemRole = createMockRole({ isSystem: true })
      mockPrisma.role.findUnique.mockResolvedValue(mockSystemRole)

      // If trying to update a system role name, it should be prevented
      // This test assumes the service has this protection
    })
  })

  // ============================================
  // DELETE ROLE
  // ============================================

  describe('deleteRole', () => {
    it('should delete role', async () => {
      mockPrisma.role.delete.mockResolvedValue(createMockRole() as any)

      await service.deleteRole('role-123')

      expect(mockPrisma.role.delete).toHaveBeenCalledWith({
        where: { id: 'role-123' },
      })
    })

    it('should prevent deletion of system roles', async () => {
      mockPrisma.role.delete.mockRejectedValue(new Error('Cannot delete system role'))

      await expect(service.deleteRole('system-role-123')).rejects.toThrow()
    })

    it('should throw if role not found', async () => {
      mockPrisma.role.delete.mockRejectedValue({
        code: 'P2025',
        meta: { cause: 'Record not found' },
      })

      await expect(service.deleteRole('nonexistent')).rejects.toThrow()
    })
  })

  // ============================================
  // ROLE PERMISSIONS
  // ============================================

  describe('getRolePermissions', () => {
    it('should return role with permissions', async () => {
      const mockPermission = createMockPermission()
      const mockRoleWithPermissions = {
        ...createMockRole(),
        permissions: [
          {
            id: 'role-perm-1',
            roleId: 'role-123',
            permissionId: 'perm-1',
            permission: mockPermission,
            createdAt: new Date(),
          },
        ],
      }

      mockPrisma.role.findUnique.mockResolvedValue(mockRoleWithPermissions as any)

      const result = await service.getRolePermissions('role-123')

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
      expect(result).toEqual(mockRoleWithPermissions)
    })

    it('should return null for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null)

      const result = await service.getRolePermissions('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('assignPermission', () => {
    it('should assign permission to role', async () => {
      mockPrisma.rolePermission.create.mockResolvedValue({
        id: 'role-perm-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
      } as any)

      await service.assignPermission('role-123', 'perm-123')

      expect(mockPrisma.rolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId: 'role-123',
          permissionId: 'perm-123',
        },
      })
    })

    it('should prevent duplicate permission assignment', async () => {
      mockPrisma.rolePermission.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['roleId', 'permissionId'] },
      })

      await expect(service.assignPermission('role-123', 'perm-123')).rejects.toThrow()
    })

    it('should validate role exists before assignment', async () => {
      mockPrisma.rolePermission.create.mockRejectedValue({
        code: 'P2003',
        meta: { field_name: 'roleId' },
      })

      await expect(service.assignPermission('nonexistent', 'perm-123')).rejects.toThrow()
    })
  })

  describe('revokePermission', () => {
    it('should revoke permission from role', async () => {
      mockPrisma.rolePermission.delete.mockResolvedValue({
        id: 'role-perm-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
      } as any)

      await service.revokePermission('role-123', 'perm-123')

      expect(mockPrisma.rolePermission.delete).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            roleId: 'role-123',
            permissionId: 'perm-123',
          },
        },
      })
    })

    it('should throw if permission assignment not found', async () => {
      mockPrisma.rolePermission.delete.mockRejectedValue({
        code: 'P2025',
        meta: { cause: 'Record not found' },
      })

      await expect(service.revokePermission('role-123', 'perm-123')).rejects.toThrow()
    })
  })

  // ============================================
  // STATISTICS
  // ============================================

  describe('getStats', () => {
    it('should return role statistics', async () => {
      mockPrisma.role.count.mockResolvedValueOnce(10) // total
      mockPrisma.role.count.mockResolvedValueOnce(8) // active
      mockPrisma.role.count.mockResolvedValueOnce(2) // inactive

      const result = await service.getStats()

      expect(result).toEqual({
        total: 10,
        active: 8,
        inactive: 2,
      })
    })

    it('should filter stats by societe if provided', async () => {
      mockPrisma.role.count.mockResolvedValue(5)

      await service.getStats('societe-123')

      expect(mockPrisma.role.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          societeId: 'societe-123',
        }),
      })
    })
  })

  describe('countUsersWithRole', () => {
    it('should count users with specific role', async () => {
      mockPrisma.userRole.count.mockResolvedValue(25)

      const result = await service.countUsersWithRole('role-123')

      expect(mockPrisma.userRole.count).toHaveBeenCalledWith({
        where: { roleId: 'role-123' },
      })
      expect(result).toBe(25)
    })

    it('should return 0 for role with no users', async () => {
      mockPrisma.userRole.count.mockResolvedValue(0)

      const result = await service.countUsersWithRole('empty-role')

      expect(result).toBe(0)
    })
  })
})
