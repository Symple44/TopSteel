import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'
import { User } from '../entities/user.entity'
import { UserSettings } from '../entities/user-settings.entity'
import { UsersService } from '../users.service'

// Mock bcrypt
vi.mock('bcrypt')
const bcryptMock = bcrypt as unknown

describe('UsersService', () => {
  let service: UsersService
  let userRepository: any
  let userSettingsRepository: any

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    nom: 'Doe',
    prenom: 'John',
    acronyme: 'JD',
    role: GlobalUserRole.USER,
    actif: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    refreshToken: null,
    settings: undefined,
  } as User

  const mockUserSettings: UserSettings = {
    id: 'settings-123',
    userId: 'user-123',
    theme: 'light',
    language: 'fr',
    notifications: {},
    appearance: {},
    preferences: {},
    uiPreferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  } as UserSettings

  beforeEach(async () => {
    const mockUserRepository = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createQueryBuilder: vi.fn(),
    }

    const mockUserSettingsRepository = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSettings),
          useValue: mockUserSettingsRepository,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    userRepository = module.get(getRepositoryToken(User))
    userSettingsRepository = module.get(getRepositoryToken(UserSettings))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    const createUserDto = {
      email: 'new@example.com',
      password: 'test-p@ssw0rd-REPLACE-IN-PROD',
      nom: 'New',
      prenom: 'User',
      acronyme: 'NU',
      role: GlobalUserRole.USER,
    }

    it('should create a new user successfully', async () => {
      // Arrange
      const hashedPassword = '$2b$10$newhashedpassword'
      bcryptMock.hash.mockResolvedValue(hashedPassword)

      const newUser = { ...createUserDto, id: 'new-user-123', password: hashedPassword }
      userRepository.create.mockReturnValue(newUser as User)
      userRepository.save.mockResolvedValue(newUser as User)

      // Act
      const result = await service.create(createUserDto)

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10)
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      })
      expect(userRepository.save).toHaveBeenCalledWith(newUser)
      expect(result).toEqual(newUser)
    })

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      userRepository.save.mockRejectedValue({
        code: '23505', // PostgreSQL unique violation error code
        detail: 'Key (email)=(new@example.com) already exists.',
      })
      bcryptMock.hash.mockResolvedValue('hashedpassword')

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated users', async () => {
      // Arrange
      const users = [mockUser]
      const totalCount = 1
      userRepository.findAndCount.mockResolvedValue([users, totalCount])

      // Act
      const result = await service.findAll({ page: 1, limit: 10 })

      // Assert
      expect(result).toEqual({
        data: users,
        total: totalCount,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['settings'],
        where: {},
      })
    })

    it('should filter active users only when specified', async () => {
      // Arrange
      const activeUsers = [mockUser]
      userRepository.findAndCount.mockResolvedValue([activeUsers, 1])

      // Act
      const _result = await service.findAll({
        page: 1,
        limit: 10,
        active: true,
      })

      // Assert
      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['settings'],
        where: { actif: true },
      })
    })
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser)

      // Act
      const result = await service.findById('user-123')

      // Assert
      expect(result).toEqual(mockUser)
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['settings'],
      })
    })

    it('should return null when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null)

      // Act
      const result = await service.findById('invalid-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser)

      // Act
      const result = await service.findByEmail('test@example.com')

      // Assert
      expect(result).toEqual(mockUser)
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['settings'],
      })
    })
  })

  describe('findByEmailOrAcronym', () => {
    it('should find user by email', async () => {
      // Arrange
      const queryBuilder = {
        where: vi.fn().mockReturnThis(),
        orWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockUser),
      }
      userRepository.createQueryBuilder.mockReturnValue(queryBuilder as unknown)

      // Act
      const result = await service.findByEmailOrAcronym('test@example.com')

      // Assert
      expect(result).toEqual(mockUser)
      expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :identifier', {
        identifier: 'test@example.com',
      })
      expect(queryBuilder.orWhere).toHaveBeenCalledWith('user.acronyme = :identifier', {
        identifier: 'test@example.com',
      })
    })

    it('should find user by acronym', async () => {
      // Arrange
      const queryBuilder = {
        where: vi.fn().mockReturnThis(),
        orWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockUser),
      }
      userRepository.createQueryBuilder.mockReturnValue(queryBuilder as unknown)

      // Act
      const result = await service.findByEmailOrAcronym('JD')

      // Assert
      expect(result).toEqual(mockUser)
    })
  })

  describe('update', () => {
    const updateData = {
      nom: 'Updated Name',
      prenom: 'Updated FirstName',
    }

    it('should update user successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, ...updateData }
      userRepository.findOne.mockResolvedValue(mockUser)
      userRepository.save.mockResolvedValue(updatedUser)

      // Act
      const result = await service.update('user-123', updateData)

      // Assert
      expect(result).toEqual(updatedUser)
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateData,
      })
    })

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(service.update('invalid-id', updateData)).rejects.toThrow(NotFoundException)
    })

    it('should hash password when updating password', async () => {
      // Arrange
      const hashedPassword = '$2b$10$newhashedpassword'
      bcryptMock.hash.mockResolvedValue(hashedPassword)

      userRepository.findOne.mockResolvedValue(mockUser)
      const updatedUser = { ...mockUser, password: hashedPassword }
      userRepository.save.mockResolvedValue(updatedUser)

      // Act
      const result = await service.update('user-123', { password: 'newpassword' })

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10)
      expect(result.password).toEqual(hashedPassword)
    })
  })

  describe('updateLastLogin', () => {
    it('should update user last login time', async () => {
      // Arrange
      const updateResult = { affected: 1 }
      userRepository.update.mockResolvedValue(updateResult as unknown)

      // Act
      await service.updateLastLogin('user-123')

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        lastLogin: expect.any(Date),
      })
    })
  })

  describe('delete', () => {
    it('should soft delete user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser)
      userRepository.save.mockResolvedValue({ ...mockUser, actif: false })

      // Act
      await service.delete('user-123')

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        actif: false,
        deletedAt: expect.any(Date),
      })
    })

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(service.delete('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getUserSettings', () => {
    it('should return user settings', async () => {
      // Arrange
      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings)

      // Act
      const result = await service.getUserSettings('user-123')

      // Assert
      expect(result).toEqual(mockUserSettings)
      expect(userSettingsRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      })
    })

    it('should create default settings when none exist', async () => {
      // Arrange
      userSettingsRepository.findOne.mockResolvedValue(null)
      const defaultSettings = {
        userId: 'user-123',
        theme: 'light',
        language: 'fr',
        notifications: {},
        appearance: {},
        preferences: {},
        uiPreferences: {},
      }
      userSettingsRepository.create.mockReturnValue(defaultSettings as UserSettings)
      userSettingsRepository.save.mockResolvedValue(defaultSettings as UserSettings)

      // Act
      const result = await service.getUserSettings('user-123')

      // Assert
      expect(userSettingsRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        theme: 'light',
        language: 'fr',
        notifications: {},
        appearance: {},
        preferences: {},
        uiPreferences: {},
      })
      expect(userSettingsRepository.save).toHaveBeenCalled()
      expect(result).toEqual(defaultSettings)
    })
  })

  describe('updateUserSettings', () => {
    const settingsUpdate = {
      theme: 'dark' as const,
      language: 'en' as const,
      notifications: { email: true },
    }

    it('should update existing settings', async () => {
      // Arrange
      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings)
      const updatedSettings = { ...mockUserSettings, ...settingsUpdate }
      userSettingsRepository.save.mockResolvedValue(updatedSettings)

      // Act
      const result = await service.updateUserSettings('user-123', settingsUpdate)

      // Assert
      expect(result).toEqual(updatedSettings)
      expect(userSettingsRepository.save).toHaveBeenCalledWith({
        ...mockUserSettings,
        ...settingsUpdate,
      })
    })

    it('should create settings if they do not exist', async () => {
      // Arrange
      userSettingsRepository.findOne.mockResolvedValue(null)
      const newSettings = {
        userId: 'user-123',
        theme: 'light',
        language: 'fr',
        notifications: {},
        appearance: {},
        preferences: {},
        uiPreferences: {},
        ...settingsUpdate,
      }
      userSettingsRepository.create.mockReturnValue(newSettings as UserSettings)
      userSettingsRepository.save.mockResolvedValue(newSettings as UserSettings)

      // Act
      const result = await service.updateUserSettings('user-123', settingsUpdate)

      // Assert
      expect(userSettingsRepository.create).toHaveBeenCalledWith(newSettings)
      expect(result).toEqual(newSettings)
    })
  })

  describe('search', () => {
    it('should search users by query', async () => {
      // Arrange
      const queryBuilder = {
        where: vi.fn().mockReturnThis(),
        orWhere: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockUser], 1]),
      }
      userRepository.createQueryBuilder.mockReturnValue(queryBuilder as unknown)

      // Act
      const result = await service.search({
        query: 'john',
        page: 1,
        limit: 10,
      })

      // Assert
      expect(result).toEqual({
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
      expect(queryBuilder.where).toHaveBeenCalledWith(
        '(LOWER(user.nom) LIKE LOWER(:query) OR LOWER(user.prenom) LIKE LOWER(:query) OR LOWER(user.email) LIKE LOWER(:query) OR LOWER(user.acronyme) LIKE LOWER(:query))',
        { query: '%john%' }
      )
    })
  })
})
