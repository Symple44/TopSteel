/// <reference types="jest" />

import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../src/core/database/prisma.service'

describe('Auth Domain - Complete Flow (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let testUserId: string
  let testRoleId: string
  let testPermissionId: string
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import full app module here when ready
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    prisma = moduleFixture.get<PrismaService>(PrismaService)

    await app.init()
  })

  afterAll(async () => {
    // Cleanup all test data
    if (testUserId) {
      await prisma.userSession.deleteMany({ where: { userId: testUserId } })
      await prisma.userRole.deleteMany({ where: { userId: testUserId } })
      await prisma.userMfa.deleteMany({ where: { userId: testUserId } })
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
    }
    if (testRoleId) {
      await prisma.rolePermission.deleteMany({ where: { roleId: testRoleId } })
      await prisma.role.delete({ where: { id: testRoleId } }).catch(() => {})
    }
    if (testPermissionId) {
      await prisma.permission.delete({ where: { id: testPermissionId } }).catch(() => {})
    }

    await app.close()
    await prisma.$disconnect()
  })

  describe('User Registration', () => {
    it('POST /auth/register - should register new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@topsteel.com',
          firstName: 'New',
          lastName: 'User',
          password: 'SecurePassword123!',
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('email', 'newuser@topsteel.com')
      expect(response.body).not.toHaveProperty('password') // Should not return password

      testUserId = response.body.id
    })

    it('POST /auth/register - should reject weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'weakpass@topsteel.com',
          firstName: 'Weak',
          lastName: 'Pass',
          password: '123', // Too weak
        })
        .expect(400)
    })

    it('POST /auth/register - should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@topsteel.com', // Already registered
          firstName: 'Duplicate',
          lastName: 'User',
          password: 'SecurePassword123!',
        })
        .expect(409) // Conflict
    })
  })

  describe('Login & JWT Tokens', () => {
    it('POST /auth/login - should authenticate user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@topsteel.com',
          password: 'SecurePassword123!',
        })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('newuser@topsteel.com')

      // Store tokens for subsequent tests
      accessToken = response.body.accessToken
      refreshToken = response.body.refreshToken
    })

    it('POST /auth/login - should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@topsteel.com',
          password: 'WrongPassword123!',
        })
        .expect(401)
    })

    it('POST /auth/login - should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@topsteel.com',
          password: 'SomePassword123!',
        })
        .expect(401)
    })

    it('GET /auth/me - should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.id).toBe(testUserId)
      expect(response.body.email).toBe('newuser@topsteel.com')
    })

    it('GET /auth/me - should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })

    it('GET /auth/me - should reject missing token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401)
    })
  })

  describe('Token Refresh', () => {
    it('POST /auth/refresh - should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body.accessToken).not.toBe(accessToken) // New token

      // Update access token
      accessToken = response.body.accessToken
    })

    it('POST /auth/refresh - should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401)
    })
  })

  describe('Logout & Session Management', () => {
    it('POST /auth/logout - should invalidate current session', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      // Token should no longer work
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401)
    })

    it('POST /auth/logout-all - should invalidate all user sessions', async () => {
      // Re-login to get new tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@topsteel.com',
          password: 'SecurePassword123!',
        })
        .expect(200)

      const newAccessToken = loginResponse.body.accessToken

      // Logout all sessions
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)

      // Verify all sessions invalidated
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401)

      // Re-login for subsequent tests
      const reloginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@topsteel.com',
          password: 'SecurePassword123!',
        })

      accessToken = reloginResponse.body.accessToken
    })

    it('GET /auth/sessions - should return active sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })
  })

  describe('Password Management', () => {
    it('POST /auth/password/change - should change user password', async () => {
      await request(app.getHttpServer())
        .post('/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'SecurePassword123!',
          newPassword: 'NewSecurePassword456!',
        })
        .expect(200)

      // Login with new password should work
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@topsteel.com',
          password: 'NewSecurePassword456!',
        })
        .expect(200)

      accessToken = response.body.accessToken
    })

    it('POST /auth/password/change - should reject wrong current password', async () => {
      await request(app.getHttpServer())
        .post('/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword!',
          newPassword: 'AnotherPassword789!',
        })
        .expect(401)
    })

    it('POST /auth/password/forgot - should initiate password reset', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/password/forgot')
        .send({
          email: 'newuser@topsteel.com',
        })
        .expect(200)

      expect(response.body).toHaveProperty('message')
    })

    it('POST /auth/password/reset - should reset password with valid token', async () => {
      // In real implementation, get reset token from email
      // For testing, we'll need to mock this
      const mockResetToken = 'mock-reset-token-from-email'

      await request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({
          token: mockResetToken,
          newPassword: 'ResetPassword999!',
        })
        .expect(200)
    })
  })

  describe('Roles & Permissions', () => {
    beforeAll(async () => {
      // Create test permission
      const permission = await prisma.permission.create({
        data: {
          code: 'TEST_PERMISSION',
          name: 'Test Permission',
          description: 'Permission for E2E testing',
        },
      })
      testPermissionId = permission.id

      // Create test role
      const role = await prisma.role.create({
        data: {
          code: 'TEST_ROLE',
          name: 'Test Role',
          description: 'Role for E2E testing',
          isSystem: false,
        },
      })
      testRoleId = role.id

      // Assign permission to role
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId,
        },
      })
    })

    it('POST /auth/users/:id/roles - should assign role to user', async () => {
      const response = await request(app.getHttpServer())
        .post(`/auth/users/${testUserId}/roles`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roleId: testRoleId,
        })
        .expect(201)

      expect(response.body.userId).toBe(testUserId)
      expect(response.body.roleId).toBe(testRoleId)
    })

    it('GET /auth/users/:id/roles - should return user roles', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auth/users/${testUserId}/roles`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      const hasTestRole = response.body.some((r: any) => r.roleId === testRoleId)
      expect(hasTestRole).toBe(true)
    })

    it('GET /auth/users/:id/permissions - should return user permissions (via roles)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auth/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      const hasTestPermission = response.body.some(
        (p: any) => p.code === 'TEST_PERMISSION'
      )
      expect(hasTestPermission).toBe(true)
    })

    it('GET /auth/check-permission/:code - should verify user has permission', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check-permission/TEST_PERMISSION')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.hasPermission).toBe(true)
    })

    it('GET /auth/check-permission/:code - should reject missing permission', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check-permission/NONEXISTENT_PERMISSION')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.hasPermission).toBe(false)
    })

    it('DELETE /auth/users/:id/roles/:roleId - should remove role from user', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/users/${testUserId}/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      // Verify removal
      const response = await request(app.getHttpServer())
        .get(`/auth/users/${testUserId}/roles`)
        .set('Authorization', `Bearer ${accessToken}`)

      const hasTestRole = response.body.some((r: any) => r.roleId === testRoleId)
      expect(hasTestRole).toBe(false)
    })
  })

  describe('Multi-Factor Authentication (MFA)', () => {
    it('POST /auth/mfa/enable - should enable MFA for user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/mfa/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('secret')
      expect(response.body).toHaveProperty('qrCode')
    })

    it('POST /auth/mfa/verify - should verify MFA code', async () => {
      // In real implementation, use actual TOTP code
      const mockCode = '123456'

      await request(app.getHttpServer())
        .post('/auth/mfa/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: mockCode,
        })
        .expect(200)
    })

    it('POST /auth/mfa/disable - should disable MFA for user', async () => {
      await request(app.getHttpServer())
        .post('/auth/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })

    it('POST /auth/login - should require MFA code when MFA enabled', async () => {
      // Enable MFA
      await request(app.getHttpServer())
        .post('/auth/mfa/enable')
        .set('Authorization', `Bearer ${accessToken}`)

      // Login should require MFA
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@topsteel.com',
          password: 'NewSecurePassword456!',
        })
        .expect(200)

      expect(response.body).toHaveProperty('mfaRequired', true)
      expect(response.body).toHaveProperty('mfaToken')
    })
  })

  describe('Account Security', () => {
    it('POST /auth/verify-email - should verify user email', async () => {
      // Mock verification token
      const mockToken = 'mock-email-verification-token'

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({
          token: mockToken,
        })
        .expect(200)
    })

    it('should enforce rate limiting on login attempts', async () => {
      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'newuser@topsteel.com',
            password: 'WrongPassword!',
          })
          .expect(401)
      }

      // Next attempt should be rate-limited
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@topsteel.com',
          password: 'WrongPassword!',
        })
        .expect(429) // Too Many Requests
    })

    it('should track failed login attempts', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/security/failed-attempts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('count')
      expect(typeof response.body.count).toBe('number')
    })
  })

  describe('Audit Logs', () => {
    it('GET /auth/audit-logs - should return audit trail', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/audit-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      // Should have audit logs for user actions
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('action')
        expect(response.body[0]).toHaveProperty('userId')
        expect(response.body[0]).toHaveProperty('timestamp')
      }
    })

    it('GET /auth/audit-logs?userId=:id - should filter by user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auth/audit-logs?userId=${testUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      response.body.forEach((log: any) => {
        expect(log.userId).toBe(testUserId)
      })
    })

    it('GET /auth/audit-logs?action=LOGIN - should filter by action', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/audit-logs?action=LOGIN')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      response.body.forEach((log: any) => {
        expect(log.action).toBe('LOGIN')
      })
    })
  })

  describe('User Groups', () => {
    let testGroupId: string

    it('POST /auth/groups - should create user group', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/groups')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'TEST_GROUP',
          name: 'Test Group',
          description: 'Group for E2E testing',
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.code).toBe('TEST_GROUP')

      testGroupId = response.body.id
    })

    it('POST /auth/groups/:id/users - should add user to group', async () => {
      await request(app.getHttpServer())
        .post(`/auth/groups/${testGroupId}/users`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: testUserId,
        })
        .expect(201)
    })

    it('GET /auth/groups/:id/users - should return group members', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auth/groups/${testGroupId}/users`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      const hasMember = response.body.some((u: any) => u.userId === testUserId)
      expect(hasMember).toBe(true)
    })

    afterAll(async () => {
      if (testGroupId) {
        await prisma.userGroup.deleteMany({ where: { groupId: testGroupId } })
        await prisma.group.delete({ where: { id: testGroupId } }).catch(() => {})
      }
    })
  })
})
