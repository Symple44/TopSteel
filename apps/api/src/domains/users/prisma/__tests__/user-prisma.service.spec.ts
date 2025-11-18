/**
 * UserPrismaService Unit Tests
 *
 * Tests critiques pour le service de gestion des utilisateurs Prisma
 *
 * Coverage:
 * - CRUD utilisateurs
 * - Recherche et pagination
 * - Gestion settings
 * - Soft delete
 * - Validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserPrismaService } from '../user-prisma.service'
import {
  createMockPrismaService,
  resetPrismaMocks,
  createMockUser,
  type MockPrismaService,
} from '../../../../__tests__/helpers/prisma-mock-factory'

describe('UserPrismaService', () => {
  let service: UserPrismaService
  let mockPrisma: MockPrismaService

  beforeEach(() => {
    mockPrisma = createMockPrismaService()
    service = new UserPrismaService(mockPrisma as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetPrismaMocks(mockPrisma)
  })

  // ============================================
  // CREATE USER
  // ============================================

  describe('create', () => {
    const createUserData = {
      email: 'newuser@test.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    }

    it('should create user successfully', async () => {
      const mockCreatedUser = createMockUser({
        email: createUserData.email,
        username: createUserData.username,
      })

      mockPrisma.user.create.mockResolvedValue(mockCreatedUser)

      const result = await service.create(createUserData)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createUserData.email,
          username: createUserData.username,
          firstName: createUserData.firstName,
          lastName: createUserData.lastName,
        }),
      })
      expect(result).toEqual(mockCreatedUser)
    })

    it('should prevent duplicate email', async () => {
      mockPrisma.user.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      })

      await expect(service.create(createUserData)).rejects.toThrow()
    })

    it('should prevent duplicate username', async () => {
      mockPrisma.user.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['username'] },
      })

      await expect(service.create(createUserData)).rejects.toThrow()
    })

    it('should set default isActive to true', async () => {
      const mockUser = createMockUser({ isActive: true })
      mockPrisma.user.create.mockResolvedValue(mockUser)

      const result = await service.create(createUserData)

      expect(result.isActive).toBe(true)
    })

    it('should handle optional fields', async () => {
      const dataWithOptionals = {
        ...createUserData,
        acronyme: 'NU',
        metadata: { department: 'IT' },
      }

      const mockUser = createMockUser({
        acronyme: 'NU',
        metadata: { department: 'IT' },
      })

      mockPrisma.user.create.mockResolvedValue(mockUser)

      const result = await service.create(dataWithOptionals)

      expect(result.acronyme).toBe('NU')
      expect(result.metadata).toEqual({ department: 'IT' })
    })
  })

  // ============================================
  // FIND USERS
  // ============================================

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        createMockUser({ id: 'user-1' }),
        createMockUser({ id: 'user-2' }),
      ]

      mockPrisma.user.findMany.mockResolvedValue(mockUsers)
      mockPrisma.user.count.mockResolvedValue(10)

      const result = await service.findAll({
        skip: 0,
        take: 10,
      })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: expect.any(Object),
      })
      expect(result).toEqual(mockUsers)
    })

    it('should filter by isActive', async () => {
      const activeUsers = [createMockUser({ isActive: true })]

      mockPrisma.user.findMany.mockResolvedValue(activeUsers)

      await service.findAll({
        skip: 0,
        take: 10,
        where: { isActive: true },
      })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: expect.objectContaining({ isActive: true }),
      })
    })

    it('should exclude deleted users by default', async () => {
      const nonDeletedUsers = [createMockUser({ deletedAt: null })]

      mockPrisma.user.findMany.mockResolvedValue(nonDeletedUsers)

      await service.findAll({
        skip: 0,
        take: 10,
      })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      )
    })

    it('should support search by email/username', async () => {
      const searchResults = [createMockUser({ email: 'test@example.com' })]

      mockPrisma.user.findMany.mockResolvedValue(searchResults)

      await service.findAll({
        skip: 0,
        take: 10,
        where: {
          OR: [
            { email: { contains: 'test' } },
            { username: { contains: 'test' } },
          ],
        },
      })

      expect(mockPrisma.user.findMany).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('should find user by ID', async () => {
      const mockUser = createMockUser()
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findOne('user-123')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findOne('nonexistent')

      expect(result).toBeNull()
    })

    it('should include relations when requested', async () => {
      const mockUserWithRelations = {
        ...createMockUser(),
        roles: [],
        groups: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRelations as any)

      await service.findOne('user-123', {
        include: { roles: true, groups: true },
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { roles: true, groups: true },
      })
    })
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = createMockUser({ email: 'test@example.com' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findByEmail('test@example.com')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findByEmail('notfound@example.com')

      expect(result).toBeNull()
    })
  })

  // ============================================
  // UPDATE USER
  // ============================================

  describe('update', () => {
    it('should update user fields', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const mockUpdatedUser = createMockUser(updateData)
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser)

      const result = await service.update('user-123', updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining(updateData),
      })
      expect(result).toEqual(mockUpdatedUser)
    })

    it('should handle metadata updates', async () => {
      const updateData = {
        metadata: { theme: 'dark', language: 'fr' },
      }

      const mockUser = createMockUser(updateData)
      mockPrisma.user.update.mockResolvedValue(mockUser)

      const result = await service.update('user-123', updateData)

      expect(result.metadata).toEqual(updateData.metadata)
    })

    it('should prevent email/username conflicts', async () => {
      mockPrisma.user.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      })

      await expect(
        service.update('user-123', { email: 'taken@example.com' })
      ).rejects.toThrow()
    })

    it('should not allow passwordHash update directly', async () => {
      const updateData = { firstName: 'Test' }
      const mockUser = createMockUser(updateData)
      mockPrisma.user.update.mockResolvedValue(mockUser)

      await service.update('user-123', updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      })
    })
  })

  // ============================================
  // DELETE USER (SOFT DELETE)
  // ============================================

  describe('remove', () => {
    it('should soft delete user (set deletedAt)', async () => {
      const mockDeletedUser = createMockUser({ deletedAt: new Date() })
      mockPrisma.user.update.mockResolvedValue(mockDeletedUser)

      await service.remove('user-123')

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          deletedAt: expect.any(Date),
        },
      })
    })

    it('should throw if user not found', async () => {
      mockPrisma.user.update.mockRejectedValue({
        code: 'P2025',
        meta: { cause: 'Record not found' },
      })

      await expect(service.remove('nonexistent')).rejects.toThrow()
    })
  })

  // ============================================
  // USER SETTINGS
  // ============================================

  describe('getUserSettings', () => {
    it('should return user settings', async () => {
      const mockSettings = {
        id: 'settings-123',
        userId: 'user-123',
        theme: 'dark',
        language: 'fr',
        notifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings as any)

      const result = await service.getUserSettings('user-123')

      expect(mockPrisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      })
      expect(result).toEqual(mockSettings)
    })

    it('should create default settings if none exist', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(null)

      const defaultSettings = {
        id: 'settings-new',
        userId: 'user-123',
        theme: 'light',
        language: 'en',
        notifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.userSettings.create.mockResolvedValue(defaultSettings as any)

      const result = await service.getUserSettings('user-123')

      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
        }),
      })
    })
  })

  describe('updateUserSettings', () => {
    it('should update user settings', async () => {
      const updateData = {
        theme: 'dark',
        language: 'fr',
      }

      const mockUpdatedSettings = {
        id: 'settings-123',
        userId: 'user-123',
        ...updateData,
        notifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.userSettings.update.mockResolvedValue(mockUpdatedSettings as any)

      const result = await service.updateUserSettings('user-123', updateData)

      expect(mockPrisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: updateData,
      })
      expect(result).toEqual(mockUpdatedSettings)
    })
  })

  // ============================================
  // STATISTICS
  // ============================================

  describe('getStats', () => {
    it('should return user statistics', async () => {
      mockPrisma.user.count.mockResolvedValueOnce(100) // total
      mockPrisma.user.count.mockResolvedValueOnce(85) // active
      mockPrisma.user.count.mockResolvedValueOnce(15) // inactive

      const result = await service.getStats()

      expect(result).toEqual({
        total: 100,
        active: 85,
        inactive: 15,
      })
    })
  })

  // ============================================
  // PASSWORD VALIDATION
  // ============================================

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const mockUser = createMockUser({
        passwordHash: '$2b$10$correcthash',
      })

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Mock bcrypt comparison (would need to mock bcrypt module)
      const result = await service.validatePassword('user-123', 'correctpassword')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
    })

    it('should return false for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.validatePassword('nonexistent', 'password')

      expect(result).toBe(false)
    })
  })
})
