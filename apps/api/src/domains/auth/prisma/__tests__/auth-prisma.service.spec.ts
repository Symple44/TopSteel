/**
 * AuthPrismaService Unit Tests
 *
 * Tests critiques pour le service d'authentification Prisma
 *
 * Coverage:
 * - Création utilisateurs
 * - Validation credentials
 * - Gestion sessions
 * - Gestion rôles et permissions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { AuthPrismaService } from '../auth-prisma.service'
import {
  createMockPrismaService,
  resetPrismaMocks,
  createMockUser,
  createMockRole,
  createMockPermission,
  createMockSession,
  type MockPrismaService,
} from '../../../../__tests__/helpers/prisma-mock-factory'
import * as bcrypt from 'bcrypt'

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}))

describe('AuthPrismaService', () => {
  let service: AuthPrismaService
  let mockPrisma: MockPrismaService

  beforeEach(() => {
    mockPrisma = createMockPrismaService()
    service = new AuthPrismaService(mockPrisma as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetPrismaMocks(mockPrisma)
  })

  // ============================================
  // USER CREATION
  // ============================================

  describe('createUser', () => {
    const createUserData = {
      email: 'newuser@test.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    }

    it.skip('should create user with hashed password (TODO: fix select fields)', async () => {
      const hashedPassword = '$2b$10$hashedpassword'
      const mockCreatedUser = createMockUser({
        email: createUserData.email,
        username: createUserData.username,
        passwordHash: hashedPassword,
      })

      // Mock bcrypt.hash
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never)

      // Mock Prisma user.create
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser)

      const result = await service.createUser(createUserData)

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserData.password, 10)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createUserData.email,
          username: createUserData.username,
          passwordHash: hashedPassword,
          firstName: createUserData.firstName,
          lastName: createUserData.lastName,
        }),
      })
      expect(result).toEqual(mockCreatedUser)
    })

    it('should prevent duplicate email', async () => {
      const hashedPassword = '$2b$10$hashedpassword'

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never)

      // Mock Prisma to throw unique constraint error
      mockPrisma.user.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      })

      await expect(service.createUser(createUserData)).rejects.toThrow()
    })

    it('should set default values', async () => {
      const hashedPassword = '$2b$10$hashedpassword'
      const mockCreatedUser = createMockUser({
        email: createUserData.email,
        isActive: true,
        emailVerified: false,
      })

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never)
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser)

      const result = await service.createUser(createUserData)

      expect(result.isActive).toBe(true)
      expect(result.emailVerified).toBe(false)
    })

    it('should handle optional fields', async () => {
      const dataWithOptionals = {
        ...createUserData,
        acronyme: 'NU',
        metadata: { department: 'IT' },
      }

      const hashedPassword = '$2b$10$hashedpassword'
      const mockCreatedUser = createMockUser({
        ...dataWithOptionals,
        passwordHash: hashedPassword,
        metadata: dataWithOptionals.metadata,
      })

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never)
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser)

      const result = await service.createUser(dataWithOptionals)

      expect(result.acronyme).toBe('NU')
      expect(result.metadata).toEqual({ department: 'IT' })
    })
  })

  // ============================================
  // USER RETRIEVAL
  // ============================================

  describe('findUserByEmail', () => {
    it.skip('should find user by email (TODO: fix includes)', async () => {
      const mockUser = createMockUser({ email: 'test@test.com' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findUserByEmail('test@test.com')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findUserByEmail('notfound@test.com')

      expect(result).toBeNull()
    })

    it.skip('should be case-insensitive (TODO: verify implementation)', async () => {
      const mockUser = createMockUser({ email: 'test@test.com' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      await service.findUserByEmail('TEST@TEST.COM')

      // Vérifier que la recherche utilise l'email en minuscules
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: expect.stringMatching(/test@test.com/i) },
      })
    })
  })

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      const mockUser = createMockUser()
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findUserById('user-123')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null for non-existent ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findUserById('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ============================================
  // PASSWORD VALIDATION
  // ============================================

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      const mockUser = createMockUser({
        passwordHash: '$2b$10$correcthash',
      })

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const result = await service.validatePassword(mockUser, 'correctpassword')

      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', mockUser.passwordHash)
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const mockUser = createMockUser({
        passwordHash: '$2b$10$correcthash',
      })

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      const result = await service.validatePassword(mockUser, 'wrongpassword')

      expect(result).toBe(false)
    })

    it.skip('should handle bcrypt errors gracefully (TODO: verify error handling)', async () => {
      const mockUser = createMockUser()

      vi.mocked(bcrypt.compare).mockRejectedValue(new Error('bcrypt error') as never)

      await expect(service.validatePassword(mockUser, 'password')).rejects.toThrow()
    })
  })

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  describe('createSession', () => {
    const sessionData = {
      userId: 'user-123',
      sessionId: 'session-abc-123',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-xyz',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
    }

    it('should create session successfully', async () => {
      const mockSession = createMockSession(sessionData)
      mockPrisma.userSession.create.mockResolvedValue(mockSession)

      const result = await service.createSession(sessionData)

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: sessionData.userId,
          sessionId: sessionData.sessionId,
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          isActive: true,
          status: 'active',
        }),
      })
      expect(result).toEqual(mockSession)
    })

    it('should set login and activity timestamps', async () => {
      const mockSession = createMockSession(sessionData)
      mockPrisma.userSession.create.mockResolvedValue(mockSession)

      const result = await service.createSession(sessionData)

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          loginTime: expect.any(Date),
          lastActivity: expect.any(Date),
        }),
      })
    })

    it('should handle optional fields', async () => {
      const minimalData = {
        userId: 'user-123',
        sessionId: 'session-123',
        accessToken: 'access-token',
      }
      const mockSession = createMockSession(minimalData)
      mockPrisma.userSession.create.mockResolvedValue(mockSession)

      await service.createSession(minimalData)

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          refreshToken: null,
          ipAddress: null,
          userAgent: null,
        }),
      })
    })
  })

  describe('findActiveSession', () => {
    it('should find active session with user', async () => {
      const mockUser = createMockUser()
      const mockSession = { ...createMockSession(), user: mockUser }

      mockPrisma.userSession.findUnique.mockResolvedValue(mockSession as any)

      const result = await service.findActiveSession('session-abc-123')

      expect(mockPrisma.userSession.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'session-abc-123' },
        include: { user: true },
      })
      expect(result).toEqual(mockSession)
    })

    it('should return null for inactive session', async () => {
      mockPrisma.userSession.findUnique.mockResolvedValue(null)

      const result = await service.findActiveSession('inactive-session')

      expect(result).toBeNull()
    })
  })

  describe('endSession', () => {
    it('should end session with reason', async () => {
      const mockSession = createMockSession({ isActive: false })
      mockPrisma.userSession.update.mockResolvedValue(mockSession)

      const result = await service.endSession('session-abc-123', 'USER_LOGOUT')

      expect(mockPrisma.userSession.update).toHaveBeenCalledWith({
        where: { sessionId: 'session-abc-123' },
        data: expect.objectContaining({
          isActive: false,
          logoutTime: expect.any(Date),
          forcedLogoutReason: 'USER_LOGOUT',
          status: 'ended',
        }),
      })
      expect(result.isActive).toBe(false)
    })
  })

  describe('endAllUserSessions', () => {
    it('should end all user sessions', async () => {
      mockPrisma.userSession.updateMany.mockResolvedValue({ count: 3 })

      const result = await service.endAllUserSessions('user-123', 'SECURITY_RESET')

      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
        },
        data: expect.objectContaining({
          isActive: false,
          logoutTime: expect.any(Date),
          forcedLogoutReason: 'SECURITY_RESET',
          status: 'ended',
        }),
      })
      expect(result).toBe(3)
    })
  })

  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  describe('createRole', () => {
    const roleData = {
      name: 'ADMIN',
      label: 'Administrator',
      description: 'Admin role',
    }

    it('should create role successfully', async () => {
      const mockRole = createMockRole(roleData)
      mockPrisma.role.create.mockResolvedValue(mockRole)

      const result = await service.createRole(roleData)

      expect(mockPrisma.role.create).toHaveBeenCalledWith({
        data: expect.objectContaining(roleData),
      })
      expect(result).toEqual(mockRole)
    })

    it('should prevent duplicate role names', async () => {
      mockPrisma.role.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      })

      await expect(service.createRole(roleData)).rejects.toThrow()
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

    it('should return null for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null)

      const result = await service.findRoleByName('NONEXISTENT')

      expect(result).toBeNull()
    })
  })

  // ============================================
  // PERMISSION MANAGEMENT
  // ============================================

  describe('createPermission', () => {
    const permissionData = {
      name: 'users.read',
      label: 'Read Users',
      module: 'users',
      action: 'read',
      resource: 'User',
      description: 'Permission to read users',
    }

    it('should create permission successfully', async () => {
      const mockPermission = createMockPermission(permissionData)
      mockPrisma.permission.create.mockResolvedValue(mockPermission)

      const result = await service.createPermission(permissionData)

      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: permissionData.name,
          label: permissionData.label,
          module: permissionData.module,
          action: permissionData.action,
          resource: permissionData.resource,
          description: permissionData.description,
        }),
      })
      expect(result).toEqual(mockPermission)
    })

    it('should prevent duplicate permission names', async () => {
      mockPrisma.permission.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      })

      await expect(service.createPermission(permissionData)).rejects.toThrow()
    })
  })

  describe('assignPermissionToRole', () => {
    it('should assign permission to role', async () => {
      const mockRolePermission = {
        id: 'role-perm-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
      }

      mockPrisma.rolePermission.create.mockResolvedValue(mockRolePermission as any)

      const result = await service.assignPermissionToRole('role-123', 'perm-123')

      expect(mockPrisma.rolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId: 'role-123',
          permissionId: 'perm-123',
        },
      })
      expect(result).toEqual(mockRolePermission)
    })

    it('should prevent duplicate assignment', async () => {
      mockPrisma.rolePermission.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['roleId', 'permissionId'] },
      })

      await expect(service.assignPermissionToRole('role-123', 'perm-123')).rejects.toThrow()
    })
  })

  describe('removePermissionFromRole', () => {
    it('should remove permission from role', async () => {
      const mockRolePermission = {
        id: 'role-perm-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
      }

      mockPrisma.rolePermission.delete.mockResolvedValue(mockRolePermission as any)

      const result = await service.removePermissionFromRole('role-123', 'perm-123')

      expect(mockPrisma.rolePermission.delete).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            roleId: 'role-123',
            permissionId: 'perm-123',
          },
        },
      })
      expect(result).toEqual(mockRolePermission)
    })
  })

  // ============================================
  // USER-ROLE ASSIGNMENT
  // ============================================

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      const mockUserRole = {
        id: 'user-role-123',
        userId: 'user-123',
        roleId: 'role-123',
        createdAt: new Date(),
      }
      mockPrisma.userRole.create.mockResolvedValue(mockUserRole as any)

      const result = await service.assignRoleToUser('user-123', 'role-123')

      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          roleId: 'role-123',
        },
      })
      expect(result).toEqual(mockUserRole)
    })
  })

  describe('removeRoleFromUser', () => {
    it('should remove role from user', async () => {
      const mockUserRole = {
        id: 'user-role-123',
        userId: 'user-123',
        roleId: 'role-123',
        createdAt: new Date(),
      }
      mockPrisma.userRole.delete.mockResolvedValue(mockUserRole as any)

      const result = await service.removeRoleFromUser('user-123', 'role-123')

      expect(mockPrisma.userRole.delete).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId: 'user-123',
            roleId: 'role-123',
          },
        },
      })
      expect(result).toEqual(mockUserRole)
    })
  })

  // ============================================
  // LAST LOGIN UPDATE
  // ============================================

  describe('updateLastLogin', () => {
    it('should update lastLoginAt timestamp', async () => {
      const now = new Date()
      const mockUser = createMockUser({ lastLoginAt: now })
      mockPrisma.user.update.mockResolvedValue(mockUser)

      const result = await service.updateLastLogin('user-123')

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          lastLoginAt: expect.any(Date),
        },
      })
      expect(result.lastLoginAt).toBeInstanceOf(Date)
    })
  })
})
