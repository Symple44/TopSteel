/**
 * RolesController Unit Tests
 *
 * Tests for role management endpoints
 *
 * Coverage:
 * - GET /roles - List roles
 * - POST /roles - Create role
 * - GET /roles/:id - Get role by ID
 * - DELETE /roles/:id - Delete role
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RolesController } from './roles.controller'

describe('RolesController', () => {
  let controller: RolesController
  let mockRolePrismaService: any

  const mockRole = {
    id: 'role-123',
    name: 'manager',
    label: 'Manager',
    description: 'Manager role',
    level: 50,
    isSystem: false,
    isActive: true,
    societeId: null,
    parentId: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSystemRole = {
    ...mockRole,
    id: 'role-system',
    name: 'admin',
    label: 'Administrator',
    level: 100,
    isSystem: true,
  }

  beforeEach(() => {
    mockRolePrismaService = {
      findAllRoles: vi.fn(),
      create: vi.fn(),
      findRoleById: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      getStats: vi.fn(),
      getRolePermissions: vi.fn(),
      assignPermission: vi.fn(),
      revokePermission: vi.fn(),
      countUsersWithRole: vi.fn(),
    }

    controller = new RolesController(mockRolePrismaService)
  })

  describe('GET /roles', () => {
    it('should return all active roles by default', async () => {
      // Arrange
      const roles = [mockRole, mockSystemRole]
      mockRolePrismaService.findAllRoles.mockResolvedValue(roles)

      // Act
      const result = await controller.findAll({})

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(roles)
      expect(result.meta.total).toBe(2)
      expect(result.meta.includeInactive).toBe(false)
      expect(mockRolePrismaService.findAllRoles).toHaveBeenCalledWith(false, undefined)
    })

    it('should filter by societeId', async () => {
      // Arrange
      const societeRoles = [{ ...mockRole, societeId: 'societe-1' }]
      mockRolePrismaService.findAllRoles.mockResolvedValue(societeRoles)

      // Act
      const result = await controller.findAll({ societeId: 'societe-1' })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(societeRoles)
      expect(result.meta.societeId).toBe('societe-1')
      expect(mockRolePrismaService.findAllRoles).toHaveBeenCalledWith(false, 'societe-1')
    })

    it('should include inactive roles when requested', async () => {
      // Arrange
      const allRoles = [mockRole, { ...mockRole, id: 'role-inactive', isActive: false }]
      mockRolePrismaService.findAllRoles.mockResolvedValue(allRoles)

      // Act
      const result = await controller.findAll({ includeInactive: true })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(allRoles)
      expect(result.meta.includeInactive).toBe(true)
      expect(mockRolePrismaService.findAllRoles).toHaveBeenCalledWith(true, undefined)
    })

    it('should return empty array when no roles', async () => {
      // Arrange
      mockRolePrismaService.findAllRoles.mockResolvedValue([])

      // Act
      const result = await controller.findAll({})

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })
  })

  describe('POST /roles', () => {
    const createRoleDto = {
      name: 'new-role',
      label: 'New Role',
      description: 'A new role',
      level: 30,
    }

    it('should create a role with valid data', async () => {
      // Arrange
      const createdRole = { ...mockRole, ...createRoleDto, id: 'role-new' }
      mockRolePrismaService.create.mockResolvedValue(createdRole)

      // Act
      const result = await controller.create(createRoleDto)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(createdRole)
      expect(result.message).toBe('Role created successfully')
      expect(result.statusCode).toBe(201)
      expect(mockRolePrismaService.create).toHaveBeenCalledWith(createRoleDto)
    })

    it('should set default values for optional fields', async () => {
      // Arrange
      const minimalDto = {
        name: 'minimal-role',
        label: 'Minimal Role',
      }
      const createdRole = {
        ...mockRole,
        ...minimalDto,
        id: 'role-minimal',
        level: 0,
        isSystem: false,
        isActive: true,
      }
      mockRolePrismaService.create.mockResolvedValue(createdRole)

      // Act
      const result = await controller.create(minimalDto)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.level).toBe(0)
      expect(result.data.isSystem).toBe(false)
      expect(result.data.isActive).toBe(true)
    })

    it('should throw ConflictException when name already exists', async () => {
      // Arrange
      const error = new Error('Un rôle avec ce nom existe déjà')
      error.name = 'ConflictException'
      mockRolePrismaService.create.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.create(createRoleDto)).rejects.toThrow(
        'Un rôle avec ce nom existe déjà'
      )
    })
  })

  describe('GET /roles/:id', () => {
    it('should return role with relations', async () => {
      // Arrange
      const roleWithRelations = {
        ...mockRole,
        permissions: [],
        users: [],
      }
      mockRolePrismaService.findRoleById.mockResolvedValue(roleWithRelations)

      // Act
      const result = await controller.findOne('role-123')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(roleWithRelations)
      expect(mockRolePrismaService.findRoleById).toHaveBeenCalledWith('role-123', true)
    })

    it('should return error when role not found', async () => {
      // Arrange
      mockRolePrismaService.findRoleById.mockResolvedValue(null)

      // Act
      const result = await controller.findOne('nonexistent')

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toBe('Role not found')
      expect(result.statusCode).toBe(404)
    })
  })

  describe('DELETE /roles/:id', () => {
    it('should delete non-system role', async () => {
      // Arrange
      mockRolePrismaService.deleteRole.mockResolvedValue(undefined)

      // Act
      const result = await controller.remove('role-123')

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Role deleted successfully')
      expect(mockRolePrismaService.deleteRole).toHaveBeenCalledWith('role-123')
    })

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      const error = new Error('Rôle non trouvé')
      error.name = 'NotFoundException'
      mockRolePrismaService.deleteRole.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.remove('nonexistent')).rejects.toThrow('Rôle non trouvé')
    })

    it('should throw ConflictException when deleting system role', async () => {
      // Arrange
      const error = new Error('Impossible de supprimer un rôle système')
      error.name = 'ConflictException'
      mockRolePrismaService.deleteRole.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.remove('role-system')).rejects.toThrow(
        'Impossible de supprimer un rôle système'
      )
    })

    it('should throw ConflictException when role is in use', async () => {
      // Arrange
      const error = new Error('Ce rôle est assigné à 5 utilisateur(s). Impossible de le supprimer.')
      error.name = 'ConflictException'
      mockRolePrismaService.deleteRole.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.remove('role-123')).rejects.toThrow(
        'Ce rôle est assigné à 5 utilisateur(s)'
      )
    })
  })

  describe('GET /roles/stats', () => {
    it('should return role statistics', async () => {
      // Arrange
      const stats = {
        total: 10,
        active: 8,
        inactive: 2,
        system: 3,
        custom: 7,
      }
      mockRolePrismaService.getStats.mockResolvedValue(stats)

      // Act
      const result = await controller.getStats()

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(stats)
      expect(mockRolePrismaService.getStats).toHaveBeenCalledWith(undefined)
    })

    it('should filter stats by societeId', async () => {
      // Arrange
      const stats = {
        total: 5,
        active: 4,
        inactive: 1,
        system: 1,
        custom: 4,
      }
      mockRolePrismaService.getStats.mockResolvedValue(stats)

      // Act
      const result = await controller.getStats('societe-1')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(stats)
      expect(mockRolePrismaService.getStats).toHaveBeenCalledWith('societe-1')
    })
  })

  describe('GET /roles/:id/permissions', () => {
    it('should return role permissions', async () => {
      // Arrange
      const roleWithPermissions = {
        ...mockRole,
        permissions: [
          {
            id: 'rp-1',
            roleId: 'role-123',
            permissionId: 'perm-1',
            permission: {
              id: 'perm-1',
              name: 'users:read',
              description: 'Read users',
            },
          },
        ],
      }
      mockRolePrismaService.getRolePermissions.mockResolvedValue(roleWithPermissions)

      // Act
      const result = await controller.getRolePermissions('role-123')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.roleId).toBe('role-123')
      expect(result.data.roleName).toBe('manager')
      expect(result.data.permissions).toHaveLength(1)
      expect(result.data.total).toBe(1)
    })

    it('should return error when role not found', async () => {
      // Arrange
      mockRolePrismaService.getRolePermissions.mockResolvedValue(null)

      // Act
      const result = await controller.getRolePermissions('nonexistent')

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toBe('Role not found')
      expect(result.statusCode).toBe(404)
    })
  })

  describe('POST /roles/:id/permissions', () => {
    it('should assign permission to role', async () => {
      // Arrange
      mockRolePrismaService.assignPermission.mockResolvedValue(undefined)

      // Act
      const result = await controller.assignPermission('role-123', {
        permissionId: 'perm-1',
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Permission assigned successfully')
      expect(result.statusCode).toBe(201)
      expect(mockRolePrismaService.assignPermission).toHaveBeenCalledWith('role-123', 'perm-1')
    })

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      const error = new Error('Rôle non trouvé')
      error.name = 'NotFoundException'
      mockRolePrismaService.assignPermission.mockRejectedValue(error)

      // Act & Assert
      await expect(
        controller.assignPermission('nonexistent', { permissionId: 'perm-1' })
      ).rejects.toThrow('Rôle non trouvé')
    })
  })

  describe('DELETE /roles/:id/permissions/:permissionId', () => {
    it('should revoke permission from role', async () => {
      // Arrange
      mockRolePrismaService.revokePermission.mockResolvedValue(undefined)

      // Act
      const result = await controller.revokePermission('role-123', 'perm-1')

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Permission revoked successfully')
      expect(mockRolePrismaService.revokePermission).toHaveBeenCalledWith('role-123', 'perm-1')
    })
  })

  describe('GET /roles/:id/users-count', () => {
    it('should return user count for role', async () => {
      // Arrange
      mockRolePrismaService.countUsersWithRole.mockResolvedValue(15)

      // Act
      const result = await controller.countUsers('role-123')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.roleId).toBe('role-123')
      expect(result.data.userCount).toBe(15)
      expect(mockRolePrismaService.countUsersWithRole).toHaveBeenCalledWith('role-123')
    })

    it('should return zero when no users have role', async () => {
      // Arrange
      mockRolePrismaService.countUsersWithRole.mockResolvedValue(0)

      // Act
      const result = await controller.countUsers('role-123')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.userCount).toBe(0)
    })
  })
})
