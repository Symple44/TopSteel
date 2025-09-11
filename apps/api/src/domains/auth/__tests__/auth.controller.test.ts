import { Test, type TestingModule } from '@nestjs/testing'
import type { Request } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthController } from '../auth.controller'
import { GlobalUserRole } from '../core/constants/roles.constants'

describe('AuthController', () => {
  let controller: AuthController
  let authService: {
    login: vi.MockedFunction<() => unknown>
    validateUser: vi.MockedFunction<() => unknown>
    register: vi.MockedFunction<() => unknown>
  }
  let sessionInvalidationService: { invalidateUserSessions: vi.MockedFunction<() => unknown> }
  let cacheService: { del: vi.MockedFunction<() => unknown>; set: vi.MockedFunction<() => unknown> }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    nom: 'Doe',
    prenom: 'John',
    role: GlobalUserRole.USER,
    actif: true,
  }

  beforeEach(async () => {
    const mockAuthService = {
      login: vi.fn(),
      loginWithMFA: vi.fn(),
      register: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      getProfile: vi.fn(),
      changePassword: vi.fn(),
      getUserSocietes: vi.fn(),
      loginWithSociete: vi.fn(),
      setDefaultSociete: vi.fn(),
      getDefaultSociete: vi.fn(),
    }

    const mockSessionInvalidationService = {
      forceInvalidateAllSessions: vi.fn(),
    }

    const mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: 'AuthService',
          useValue: mockAuthService,
        },
        {
          provide: 'SessionInvalidationService',
          useValue: mockSessionInvalidationService,
        },
        {
          provide: 'OptimizedCacheService',
          useValue: mockCacheService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get('AuthService')
    sessionInvalidationService = module.get('SessionInvalidationService')
    cacheService = module.get('OptimizedCacheService')
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginDto = { login: 'test@example.com', password: 'password' }
      const expectedResult = {
        user: mockUser,
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      }
      authService.login.mockResolvedValue(expectedResult)

      const mockRequest = { body: loginDto } as Request

      // Act
      const result = await controller.login(loginDto, mockRequest)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.login).toHaveBeenCalledWith(loginDto)
    })

    it('should use request body when DTO is empty', async () => {
      // Arrange
      const loginData = { login: 'test@example.com', password: 'password' }
      const emptyDto = {} as { login?: string; password?: string }
      const expectedResult = { requiresMFA: true, userId: mockUser.id }
      authService.login.mockResolvedValue(expectedResult)

      const mockRequest = { body: loginData } as Request

      // Act
      const result = await controller.login(emptyDto, mockRequest)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.login).toHaveBeenCalledWith(loginData)
    })

    it('should return MFA requirement when MFA is enabled', async () => {
      // Arrange
      const loginDto = { login: 'test@example.com', password: 'password' }
      const expectedResult = {
        requiresMFA: true,
        userId: mockUser.id,
        email: mockUser.email,
        availableMethods: [{ type: 'totp', isEnabled: true }],
        message: 'Authentification à deux facteurs requise',
      }
      authService.login.mockResolvedValue(expectedResult)

      const mockRequest = { body: loginDto } as Request

      // Act
      const result = await controller.login(loginDto, mockRequest)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.login).toHaveBeenCalledWith(loginDto)
    })
  })

  describe('loginWithMFA', () => {
    it('should complete login after MFA verification', async () => {
      // Arrange
      const mfaData = { userId: mockUser.id, mfaSessionToken: 'mfa-token-123' }
      const expectedResult = {
        user: mockUser,
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      }
      authService.loginWithMFA.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.loginWithMFA(mfaData)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.loginWithMFA).toHaveBeenCalledWith(mfaData.userId, mfaData.mfaSessionToken)
    })
  })

  describe('register', () => {
    it('should create new user successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'new@example.com',
        password: 'password',
        nom: 'New',
        prenom: 'User',
      }
      const expectedResult = { ...registerDto, id: 'new-user-123' }
      authService.register.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.register(registerDto)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.register).toHaveBeenCalledWith(registerDto)
    })
  })

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' }
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      }
      authService.refreshToken.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.refreshToken(refreshTokenDto)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken)
    })
  })

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      authService.logout.mockResolvedValue(undefined)

      // Act
      const result = await controller.logout(mockUser)

      // Assert
      expect(result).toEqual({ message: 'Logout successful' })
      expect(authService.logout).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const expectedProfile = { ...mockUser, password: undefined }
      authService.getProfile.mockResolvedValue(expectedProfile)

      // Act
      const result = await controller.getProfile(mockUser)

      // Assert
      expect(result).toEqual(expectedProfile)
      expect(authService.getProfile).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      }
      authService.changePassword.mockResolvedValue(undefined)

      // Act
      const result = await controller.changePassword(mockUser, changePasswordDto)

      // Assert
      expect(result).toEqual({ message: 'Password changed successfully' })
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      )
    })
  })

  describe('getUserSocietes', () => {
    it('should return societes from cache if available', async () => {
      // Arrange
      const cachedSocietes = [{ id: 'societe-1', nom: 'Société 1', code: 'SOC1' }]
      cacheService.get.mockResolvedValue(cachedSocietes)

      // Act
      const result = await controller.getUserSocietes(mockUser)

      // Assert
      expect(result).toEqual(cachedSocietes)
      expect(cacheService.get).toHaveBeenCalledWith(`auth:societes:${mockUser.id}`)
      expect(authService.getUserSocietes).not.toHaveBeenCalled()
    })

    it('should fetch societes from service and cache result when cache is empty', async () => {
      // Arrange
      const societes = [
        { id: 'societe-1', nom: 'Société 1', code: 'SOC1' },
        { id: 'societe-2', nom: 'Société 2', code: 'SOC2' },
      ]
      cacheService.get.mockResolvedValue(null)
      authService.getUserSocietes.mockResolvedValue(societes)

      // Act
      const result = await controller.getUserSocietes(mockUser)

      // Assert
      expect(result).toEqual(societes)
      expect(cacheService.get).toHaveBeenCalledWith(`auth:societes:${mockUser.id}`)
      expect(authService.getUserSocietes).toHaveBeenCalledWith(mockUser.id)
      expect(cacheService.set).toHaveBeenCalledWith(`auth:societes:${mockUser.id}`, societes, 300)
    })
  })

  describe('invalidateSocietesCache', () => {
    it('should invalidate societes cache successfully', async () => {
      // Arrange
      cacheService.delete.mockResolvedValue(true)

      // Act
      const result = await controller.invalidateSocietesCache(mockUser)

      // Assert
      expect(result).toEqual({ message: 'Cache invalidated successfully' })
      expect(cacheService.delete).toHaveBeenCalledWith(`auth:societes:${mockUser.id}`)
    })
  })

  describe('loginWithSociete', () => {
    it('should login with societe successfully', async () => {
      // Arrange
      const societeId = 'societe-123'
      const body = { siteId: 'site-456' }
      const mockRequest = {} as Request
      const expectedResult = {
        user: { ...mockUser, societe: { id: societeId, nom: 'Test Société' } },
        tokens: { accessToken: 'jwt-token', refreshToken: 'refresh-token' },
      }
      authService.loginWithSociete.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.loginWithSociete(mockUser, societeId, body, mockRequest)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.loginWithSociete).toHaveBeenCalledWith(
        mockUser.id,
        societeId,
        body.siteId,
        mockRequest
      )
    })
  })

  describe('setDefaultSociete', () => {
    it('should set default societe successfully', async () => {
      // Arrange
      const societeId = 'societe-123'
      const expectedResult = { success: true, message: 'Société définie par défaut avec succès' }
      authService.setDefaultSociete.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.setDefaultSociete(mockUser, societeId)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.setDefaultSociete).toHaveBeenCalledWith(mockUser.id, societeId)
    })
  })

  describe('setUserDefaultCompany', () => {
    it('should set user default company successfully', async () => {
      // Arrange
      const body = { companyId: 'company-123' }
      const expectedResult = { success: true, message: 'Société définie par défaut avec succès' }
      authService.setDefaultSociete.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.setUserDefaultCompany(mockUser, body)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.setDefaultSociete).toHaveBeenCalledWith(mockUser.id, body.companyId)
    })
  })

  describe('getUserDefaultCompany', () => {
    it('should get user default company successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        data: { id: 'company-123', nom: 'Test Company', code: 'TEST' },
      }
      authService.getDefaultSociete.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getUserDefaultCompany(mockUser)

      // Assert
      expect(result).toEqual(expectedResult)
      expect(authService.getDefaultSociete).toHaveBeenCalledWith(mockUser.id)
    })
  })

  describe('invalidateAllSessions', () => {
    it('should invalidate all sessions for admin user', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: GlobalUserRole.ADMIN }
      const affectedUsers = ['user1', 'user2', 'user3']
      sessionInvalidationService.forceInvalidateAllSessions.mockResolvedValue(affectedUsers)

      // Act
      const result = await controller.invalidateAllSessions(adminUser)

      // Assert
      expect(result).toEqual({
        message: 'Toutes les sessions ont été invalidées',
        affectedUsers,
        invalidatedBy: adminUser.email,
      })
      expect(sessionInvalidationService.forceInvalidateAllSessions).toHaveBeenCalled()
    })
  })

  describe('verify', () => {
    it('should verify token and return profile', async () => {
      // Arrange
      const expectedProfile = { ...mockUser, password: undefined }
      authService.getProfile.mockResolvedValue(expectedProfile)

      // Act
      const result = await controller.verify(mockUser)

      // Assert
      expect(result).toEqual(expectedProfile)
      expect(authService.getProfile).toHaveBeenCalledWith(mockUser.id)
    })
  })
})
