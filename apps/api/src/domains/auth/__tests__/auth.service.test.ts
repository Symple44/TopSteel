import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from '../auth.service'
import { GlobalUserRole } from '../core/constants/roles.constants'
import { UserSession } from '../core/entities/user-session.entity'

// Mock bcrypt
vi.mock('bcrypt')
interface BcryptMock {
  compare: (data: string, encrypted: string) => Promise<boolean>
  hash: (data: string, saltOrRounds: number) => Promise<string>
}
const bcryptMock = bcrypt as unknown as BcryptMock

describe('AuthService', () => {
  let service: AuthService
  let usersService: {
    findOne: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    findByEmail: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  let jwtService: {
    sign: ReturnType<typeof vi.fn>
    verify: ReturnType<typeof vi.fn>
  }
  let configService: {
    get: ReturnType<typeof vi.fn>
  }
  let userSessionRepository: {
    save: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let sessionRedisService: {
    set: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let _geolocationService: {
    getLocationInfo: ReturnType<typeof vi.fn>
  }
  let mfaService: {
    generateSecret: ReturnType<typeof vi.fn>
    verifyToken: ReturnType<typeof vi.fn>
  }
  let _societesService: {
    findAll: ReturnType<typeof vi.fn>
  }
  let _societeUsersService: {
    findByUserId: ReturnType<typeof vi.fn>
  }
  let _userSocieteRolesService: {
    findByUserId: ReturnType<typeof vi.fn>
  }
  let unifiedRolesService: {
    getUserRoles: ReturnType<typeof vi.fn>
  }
  let _performanceService: {
    track: ReturnType<typeof vi.fn>
  }
  let _licenseManagementService: {
    checkLicense: ReturnType<typeof vi.fn>
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    nom: 'Doe',
    prenom: 'John',
    role: GlobalUserRole.USER,
    actif: true,
  }

  const mockUserWithoutPassword = {
    id: 'user-123',
    email: 'test@example.com',
    nom: 'Doe',
    prenom: 'John',
    role: GlobalUserRole.USER,
    actif: true,
  }

  beforeEach(async () => {
    const mockUsersService = {
      findByEmailOrAcronym: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateLastLogin: vi.fn(),
    }

    const mockJwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    }

    const mockConfigService = {
      get: vi.fn(),
    }

    const mockUserSessionRepository = {
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      createQueryBuilder: vi.fn(),
    }

    const mockSessionRedisService = {
      addActiveSession: vi.fn(),
      updateSessionActivity: vi.fn(),
      removeActiveSession: vi.fn(),
      forceLogoutUser: vi.fn(),
      forceLogoutSession: vi.fn(),
      getAllActiveSessions: vi.fn(),
      getSessionStats: vi.fn(),
      cleanupExpiredSessions: vi.fn(),
    }

    const mockGeolocationService = {
      extractRealIP: vi.fn().mockReturnValue('127.0.0.1'),
      getLocationFromIP: vi.fn().mockResolvedValue({ city: 'Paris', country: 'France' }),
      parseUserAgent: vi.fn().mockReturnValue({ browser: 'Chrome', os: 'Windows' }),
    }

    const mockMfaService = {
      hasMFAEnabled: vi.fn(),
      getUserMFAMethods: vi.fn(),
      getMFAStats: vi.fn(),
      disableMFA: vi.fn(),
      mfaSessionRepository: {
        findOne: vi.fn(),
      },
    }

    const mockSocietesService = {
      findById: vi.fn(),
      findActive: vi.fn(),
    }

    const mockSocieteUsersService = {
      findByUser: vi.fn(),
      setDefault: vi.fn(),
    }

    const mockUserSocieteRolesService = {
      setDefaultSociete: vi.fn(),
    }

    const mockUnifiedRolesService = {
      getUserSocieteRoles: vi.fn(),
      getUserSocieteRole: vi.fn(),
    }

    const mockPerformanceService = {
      trackOperation: vi.fn((_name, fn) => fn()),
    }

    const mockLicenseManagementService = {
      checkLicenseForAuthentication: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UsersService',
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(UserSession, 'auth'),
          useValue: mockUserSessionRepository,
        },
        {
          provide: 'SessionRedisService',
          useValue: mockSessionRedisService,
        },
        {
          provide: 'GeolocationService',
          useValue: mockGeolocationService,
        },
        {
          provide: 'MFAService',
          useValue: mockMfaService,
        },
        {
          provide: 'SocietesService',
          useValue: mockSocietesService,
        },
        {
          provide: 'SocieteUsersService',
          useValue: mockSocieteUsersService,
        },
        {
          provide: 'UserSocieteRolesService',
          useValue: mockUserSocieteRolesService,
        },
        {
          provide: 'UnifiedRolesService',
          useValue: mockUnifiedRolesService,
        },
        {
          provide: 'AuthPerformanceService',
          useValue: mockPerformanceService,
        },
        {
          provide: 'LicenseManagementService',
          useValue: mockLicenseManagementService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    usersService = module.get('UsersService')
    jwtService = module.get<JwtService>(JwtService)
    configService = module.get<ConfigService>(ConfigService)
    userSessionRepository = module.get(getRepositoryToken(UserSession, 'auth'))
    sessionRedisService = module.get('SessionRedisService')
    _geolocationService = module.get('GeolocationService')
    mfaService = module.get('MFAService')
    _societesService = module.get('SocietesService')
    _societeUsersService = module.get('SocieteUsersService')
    _userSocieteRolesService = module.get('UserSocieteRolesService')
    unifiedRolesService = module.get('UnifiedRolesService')
    _performanceService = module.get('AuthPerformanceService')
    _licenseManagementService = module.get('LicenseManagementService')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      // Arrange
      usersService.findByEmailOrAcronym.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)

      // Act
      const result = await service.validateUser('test@example.com', 'password')

      // Assert
      expect(result).toEqual(mockUserWithoutPassword)
      expect(usersService.findByEmailOrAcronym).toHaveBeenCalledWith('test@example.com')
      expect(bcrypt.compare).toHaveBeenCalledWith('password', mockUser.password)
    })

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      usersService.findByEmailOrAcronym.mockResolvedValue(null)
      bcryptMock.compare.mockResolvedValue(false)

      // Act & Assert
      await expect(service.validateUser('invalid@example.com', 'password')).rejects.toThrow(
        UnauthorizedException
      )

      expect(bcrypt.compare).toHaveBeenCalledWith('password', '$2b$10$dummyhash')
    })

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      usersService.findByEmailOrAcronym.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(false)

      // Act & Assert
      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException
      )
    })
  })

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password',
      nom: 'New',
      prenom: 'User',
    }

    it('should create new user successfully', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null)
      const newUser = { ...registerDto, id: 'new-user-123' }
      usersService.create.mockResolvedValue(newUser)

      // Act
      const result = await service.register(registerDto)

      // Assert
      expect(result).toEqual({ ...newUser, password: undefined })
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email)
      expect(usersService.create).toHaveBeenCalledWith(registerDto)
    })

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser)

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException)

      expect(usersService.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const loginDto = {
      login: 'test@example.com',
      password: 'password',
    }

    it('should return MFA requirement when MFA is enabled', async () => {
      // Arrange
      usersService.findByEmailOrAcronym.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)
      mfaService.hasMFAEnabled.mockResolvedValue(true)
      mfaService.getUserMFAMethods.mockResolvedValue([
        { type: 'totp', isEnabled: true, isVerified: true, lastUsedAt: new Date() },
      ])

      // Act
      const result = await service.login(loginDto)

      // Assert
      expect(result).toEqual({
        requiresMFA: true,
        userId: mockUser.id,
        email: mockUser.email,
        availableMethods: [
          {
            type: 'totp',
            isEnabled: true,
            lastUsed: expect.any(Date),
          },
        ],
        message: 'Authentification à deux facteurs requise',
      })
    })

    it('should complete login when MFA is not enabled', async () => {
      // Arrange
      usersService.findByEmailOrAcronym.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)
      mfaService.hasMFAEnabled.mockResolvedValue(false)
      unifiedRolesService.getUserSocieteRoles.mockResolvedValue([])
      configService.get.mockReturnValue('test-secret')
      jwtService.signAsync.mockResolvedValue('jwt-token')
      userSessionRepository.save.mockResolvedValue({} as UserSession)

      // Act
      const result = await service.login(loginDto)

      // Assert
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('refreshToken', () => {
    it('should generate new tokens for valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token'
      const mockSession = {
        sessionId: 'session-123',
        userId: mockUser.id,
        refreshToken: refreshToken,
        isActive: true,
        lastActivity: new Date(),
        save: vi.fn(),
      }

      configService.get.mockReturnValue('refresh-secret')
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        sessionId: 'session-123',
      })
      userSessionRepository.findOne.mockResolvedValue(mockSession)
      usersService.findById.mockResolvedValue(mockUser)
      jwtService.signAsync.mockResolvedValue('new-jwt-token')
      userSessionRepository.save.mockResolvedValue(mockSession)

      // Act
      const result = await service.refreshToken(refreshToken)

      // Assert
      expect(result).toEqual({
        accessToken: 'new-jwt-token',
        refreshToken: 'new-jwt-token',
        expiresIn: 24 * 60 * 60,
      })
      expect(userSessionRepository.save).toHaveBeenCalled()
      expect(sessionRedisService.updateSessionActivity).toHaveBeenCalledWith('session-123')
    })

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token'
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'))

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logout', () => {
    it('should logout specific session', async () => {
      // Arrange
      const userId = 'user-123'
      const sessionId = 'session-123'
      const mockSession = {
        sessionId,
        userId,
        endSession: vi.fn(),
      }
      userSessionRepository.findOne.mockResolvedValue(mockSession)
      userSessionRepository.save.mockResolvedValue(mockSession)

      // Act
      await service.logout(userId, sessionId)

      // Assert
      expect(sessionRedisService.removeActiveSession).toHaveBeenCalledWith(sessionId)
      expect(mockSession.endSession).toHaveBeenCalledWith('normal')
      expect(userSessionRepository.save).toHaveBeenCalledWith(mockSession)
    })

    it('should logout all user sessions when sessionId is not provided', async () => {
      // Arrange
      const userId = 'user-123'

      // Act
      await service.logout(userId)

      // Assert
      expect(sessionRedisService.forceLogoutUser).toHaveBeenCalledWith(userId)
      expect(userSessionRepository.update).toHaveBeenCalledWith(
        { userId, status: 'active' },
        {
          status: 'ended',
          logoutTime: expect.any(Date),
          isActive: false,
        }
      )
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = 'user-123'
      const currentPassword = 'oldpassword'
      const newPassword = 'newpassword'
      const hashedNewPassword = '$2b$10$newhashedpassword'

      usersService.findById.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)
      bcryptMock.hash.mockResolvedValue(hashedNewPassword)

      // Act
      await service.changePassword(userId, currentPassword, newPassword)

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password)
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10)
      expect(usersService.update).toHaveBeenCalledWith(userId, { password: hashedNewPassword })
    })

    it('should throw BadRequestException when current password is incorrect', async () => {
      // Arrange
      const userId = 'user-123'
      const currentPassword = 'wrongpassword'
      const newPassword = 'newpassword'

      usersService.findById.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(false)

      // Act & Assert
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(
        BadRequestException
      )

      expect(usersService.update).not.toHaveBeenCalled()
    })
  })

  describe('getProfile', () => {
    it('should return user profile without sensitive data', async () => {
      // Arrange
      const userWithSensitiveData = {
        ...mockUser,
        refreshToken: 'sensitive-token',
      }
      usersService.findById.mockResolvedValue(userWithSensitiveData)

      // Act
      const result = await service.getProfile('user-123')

      // Assert
      expect(result).toEqual(mockUserWithoutPassword)
      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('refreshToken')
    })

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getProfile('invalid-user')).rejects.toThrow(UnauthorizedException)
    })
  })
})
