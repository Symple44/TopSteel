/**
 * AuthController Unit Tests
 *
 * Tests for authentication controller endpoints
 *
 * Coverage:
 * - POST /auth/login
 * - POST /auth/validate-token
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthController } from './auth.controller'

describe('AuthController', () => {
  let controller: AuthController
  let mockAuthPrismaService: any
  let mockSessionPrismaService: any
  let mockRolePrismaService: any
  let mockJwtService: any
  let mockConfigService: any

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    passwordHash: 'hashed',
    isEmailVerified: false,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    sessionId: 'session-uuid',
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    loginTime: new Date(),
    logoutTime: null,
    lastActivity: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    deviceInfo: null,
    location: null,
    isActive: true,
    isIdle: false,
    status: 'active',
    warningCount: 0,
    forcedLogoutBy: null,
    forcedLogoutReason: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockUserRoles = [
    {
      id: 'ur-1',
      userId: 'user-123',
      roleId: 'role-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: 'role-1',
        name: 'admin',
        label: 'Administrator',
        description: null,
        level: 100,
        isSystem: true,
        isActive: true,
        societeId: null,
        parentId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ]

  const mockSocieteRoles = [
    {
      id: 'usr-1',
      userId: 'user-123',
      societeId: 'societe-1',
      roleId: 'role-2',
      permissions: null,
      isActive: true,
      activatedAt: new Date(),
      deactivatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: 'role-2',
        name: 'manager',
        label: 'Manager',
        description: null,
        level: 50,
        isSystem: false,
        isActive: true,
        societeId: 'societe-1',
        parentId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ]

  beforeEach(() => {
    // Create mock services with default implementations
    mockAuthPrismaService = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      validatePassword: vi.fn(),
      createSession: vi.fn(),
      updateLastLogin: vi.fn(),
      getUserSocieteRoles: vi.fn(),
    }

    mockSessionPrismaService = {
      findSessionByToken: vi.fn(),
    }

    mockRolePrismaService = {
      getUserRoles: vi.fn(),
    }

    mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    }

    mockConfigService = {
      get: vi.fn().mockReturnValue('test-secret'),
    }

    // Directly instantiate the controller with mocks (Vitest pattern)
    controller = new AuthController(
      mockAuthPrismaService as any,
      mockSessionPrismaService as any,
      mockRolePrismaService as any,
      mockJwtService as any,
      mockConfigService as any
    )
  })

  describe('POST /auth/validate-token', () => {
    const validToken = 'valid.jwt.token'
    const decodedToken = {
      sub: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    }

    it('should validate a valid token successfully', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue(mockUser)
      mockSessionPrismaService.findSessionByToken.mockResolvedValue(mockSession)
      mockRolePrismaService.getUserRoles.mockResolvedValue(mockUserRoles)
      mockAuthPrismaService.getUserSocieteRoles.mockResolvedValue(mockSocieteRoles)

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(true)
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
      })
      expect(result.permissions?.roles).toEqual(['admin'])
      expect(result.permissions?.societes).toEqual([
        {
          societeId: 'societe-1',
          roles: ['manager'],
        },
      ])
      expect(result.session?.sessionId).toBe(mockSession.id)
      expect(result.session?.isActive).toBe(true)
      expect(mockJwtService.verify).toHaveBeenCalledWith(validToken, { secret: 'test-secret' })
    })

    it('should return invalid for expired/malformed token', async () => {
      // Arrange
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired')
      })

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid or expired token')
      expect(result.user).toBeUndefined()
    })

    it('should return invalid when user not found', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue(null)

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('should return invalid when user is inactive', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue({
        ...mockUser,
        isActive: false,
      })

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('User account is inactive')
    })

    it('should return invalid when session not found', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue(mockUser)
      mockSessionPrismaService.findSessionByToken.mockResolvedValue(null)

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Session not found or expired')
    })

    it('should return invalid when session is revoked', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue(mockUser)
      mockSessionPrismaService.findSessionByToken.mockResolvedValue({
        ...mockSession,
        isActive: false,
        status: 'revoked',
      })

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Session has been revoked or is inactive')
    })

    it('should return invalid when session is force logged out', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue(mockUser)
      mockSessionPrismaService.findSessionByToken.mockResolvedValue({
        ...mockSession,
        status: 'forced_logout',
      })

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Session has been revoked or is inactive')
    })

    it('should return invalid when session has logout time', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue(mockUser)
      mockSessionPrismaService.findSessionByToken.mockResolvedValue({
        ...mockSession,
        logoutTime: new Date(),
      })

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Session has been logged out')
    })

    it('should handle user with no roles', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockResolvedValue(mockUser)
      mockSessionPrismaService.findSessionByToken.mockResolvedValue(mockSession)
      mockRolePrismaService.getUserRoles.mockResolvedValue([])
      mockAuthPrismaService.getUserSocieteRoles.mockResolvedValue([])

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(true)
      expect(result.permissions?.roles).toEqual([])
      expect(result.permissions?.societes).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue(decodedToken)
      mockAuthPrismaService.findUserById.mockRejectedValue(
        new Error('Database error')
      )

      // Act
      const result = await controller.validateToken({ token: validToken })

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Internal server error during token validation')
    })
  })

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    }

    const mockRequest = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'test-agent' },
    }

    it('should login successfully with valid credentials', async () => {
      // Arrange
      mockAuthPrismaService.findUserByEmail.mockResolvedValue(mockUser)
      mockAuthPrismaService.validatePassword.mockResolvedValue(true)
      mockJwtService.sign.mockReturnValue('mock-access-token')
      mockAuthPrismaService.createSession.mockResolvedValue(undefined)
      mockAuthPrismaService.updateLastLogin.mockResolvedValue(undefined)

      // Act
      const result = await controller.login(loginDto, mockRequest as any)

      // Assert
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      })
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.refreshToken).toBe('mock-access-token')
      expect(result.sessionId).toBeDefined()
      expect(mockAuthPrismaService.findUserByEmail).toHaveBeenCalledWith(loginDto.email)
      expect(mockAuthPrismaService.validatePassword).toHaveBeenCalledWith(mockUser, loginDto.password)
      expect(mockAuthPrismaService.createSession).toHaveBeenCalled()
      expect(mockAuthPrismaService.updateLastLogin).toHaveBeenCalledWith(mockUser.id)
    })

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      mockAuthPrismaService.findUserByEmail.mockResolvedValue(null)

      // Act & Assert
      await expect(controller.login(loginDto, mockRequest as any)).rejects.toThrow('Invalid credentials')
    })

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      mockAuthPrismaService.findUserByEmail.mockResolvedValue(mockUser)
      mockAuthPrismaService.validatePassword.mockResolvedValue(false)

      // Act & Assert
      await expect(controller.login(loginDto, mockRequest as any)).rejects.toThrow('Invalid credentials')
    })

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false }
      mockAuthPrismaService.findUserByEmail.mockResolvedValue(inactiveUser)
      mockAuthPrismaService.validatePassword.mockResolvedValue(true)

      // Act & Assert
      await expect(controller.login(loginDto, mockRequest as any)).rejects.toThrow('Account is inactive')
    })

    it('should create session with IP and user agent', async () => {
      // Arrange
      mockAuthPrismaService.findUserByEmail.mockResolvedValue(mockUser)
      mockAuthPrismaService.validatePassword.mockResolvedValue(true)
      mockJwtService.sign.mockReturnValue('mock-token')
      mockAuthPrismaService.createSession.mockResolvedValue(undefined)
      mockAuthPrismaService.updateLastLogin.mockResolvedValue(undefined)

      // Act
      await controller.login(loginDto, mockRequest as any)

      // Assert
      expect(mockAuthPrismaService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          sessionId: expect.any(String),
          accessToken: 'mock-token',
          refreshToken: 'mock-token',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      )
    })

    it('should generate unique session ID', async () => {
      // Arrange
      mockAuthPrismaService.findUserByEmail.mockResolvedValue(mockUser)
      mockAuthPrismaService.validatePassword.mockResolvedValue(true)
      mockJwtService.sign.mockReturnValue('mock-token')
      mockAuthPrismaService.createSession.mockResolvedValue(undefined)
      mockAuthPrismaService.updateLastLogin.mockResolvedValue(undefined)

      // Act
      const result1 = await controller.login(loginDto, mockRequest as any)
      const result2 = await controller.login(loginDto, mockRequest as any)

      // Assert
      expect(result1.sessionId).not.toBe(result2.sessionId)
    })

    it('should parse expiresIn correctly', async () => {
      // Arrange
      mockAuthPrismaService.findUserByEmail.mockResolvedValue(mockUser)
      mockAuthPrismaService.validatePassword.mockResolvedValue(true)
      mockJwtService.sign.mockReturnValue('mock-token')
      mockAuthPrismaService.createSession.mockResolvedValue(undefined)
      mockAuthPrismaService.updateLastLogin.mockResolvedValue(undefined)
      mockConfigService.get.mockReturnValue('1h')

      // Act
      const result = await controller.login(loginDto, mockRequest as any)

      // Assert
      expect(result.expiresIn).toBe(3600) // 1 hour = 3600 seconds
    })
  })
})
