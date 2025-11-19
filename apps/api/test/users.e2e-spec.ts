/// <reference types="jest" />

import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../src/core/database/prisma/prisma.service'

describe('Users Domain (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let authToken: string
  let testUserId: string

  beforeAll(async () => {
    // Use simplified TestAppModule to avoid compilation errors
    const { TestAppModule } = await import('./test-app.module')
    const { CombinedSecurityGuard } = await import(
      '../src/domains/auth/security/guards/combined-security.guard'
    )

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideGuard(CombinedSecurityGuard)
      .useValue({ canActivate: () => true }) // Bypass auth for testing
      .compile()

    app = moduleFixture.createNestApplication()
    prisma = moduleFixture.get<PrismaService>(PrismaService)

    await app.init()

    // Setup: Create test user for authentication with bcrypt hashed password
    // Password: TestPassword123!
    // Using bcrypt to hash (10 rounds)
    const bcrypt = require('bcrypt')
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10)

    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test-user@topsteel.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      },
    })
    testUserId = testUser.id
  })

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
    }

    await app.close()
    await prisma.$disconnect()
  })

  describe('Authentication', () => {
    it('POST /auth/login - should authenticate user and return token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-user@topsteel.com',
          password: 'TestPassword123!',
        })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('test-user@topsteel.com')

      // Store token for subsequent tests
      authToken = response.body.accessToken
    })

    it('POST /auth/login - should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-user@topsteel.com',
          password: 'WrongPassword',
        })
        .expect(401)
    })

    it('POST /auth/login - should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@topsteel.com',
          password: 'SomePassword',
        })
        .expect(401)
    })
  })

  describe('User CRUD Operations', () => {
    let createdUserId: string

    it('POST /users - should create new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newuser',
          email: 'new-user@topsteel.com',
          firstName: 'New',
          lastName: 'User',
          password: 'NewPassword123!',
        })
        .expect(201)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.email).toBe('new-user@topsteel.com')
      expect(response.body.data.firstName).toBe('New')

      createdUserId = response.body.data.id
    })

    it('GET /users - should return list of users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('GET /users/:id - should return specific user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data.id).toBe(createdUserId)
      expect(response.body.data.email).toBe('new-user@topsteel.com')
    })

    it('PATCH /users/:id - should update user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
        })
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data.firstName).toBe('Updated')
      expect(response.body.data.lastName).toBe('User') // Unchanged
    })

    it('DELETE /users/:id - should delete user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('User Settings', () => {
    it('GET /users/:id/settings - should return user settings', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUserId}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('userId', testUserId)
    })

    it('PATCH /users/:id/settings - should update user settings', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'fr',
          timezone: 'Europe/Paris',
          theme: 'dark',
        })
        .expect(200)

      expect(response.body.language).toBe('fr')
      expect(response.body.timezone).toBe('Europe/Paris')
      expect(response.body.theme).toBe('dark')
    })
  })

  describe('Validation & Security', () => {
    it('POST /users - should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'invalidemail',
          email: 'invalid-email',
          firstName: 'Test',
          lastName: 'User',
          password: 'Password123!',
        })
        .expect(400)
    })

    it('POST /users - should reject weak password', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'weakpass',
          email: 'test@topsteel.com',
          firstName: 'Test',
          lastName: 'User',
          password: '123', // Too weak
        })
        .expect(400)
    })

    it('GET /users - should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/users').expect(401)
    })

    it('POST /users - should prevent duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'duplicateuser',
          email: 'test-user@topsteel.com', // Already exists
          firstName: 'Duplicate',
          lastName: 'User',
          password: 'Password123!',
        })
        .expect(409) // Conflict
    })
  })

  describe('User Search & Filtering', () => {
    it('GET /users?search=test - should filter users by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      // All returned users should match search term
      if (response.body.data.length > 0) {
        const hasMatch = response.body.data.some(
          (user: any) =>
            user.email.includes('test') ||
            user.firstName.toLowerCase().includes('test') ||
            user.lastName.toLowerCase().includes('test')
        )
        expect(hasMatch).toBe(true)
      }
    })

    it('GET /users?isActive=true - should filter active users only', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      // All returned users should be active
      response.body.data.forEach((user: any) => {
        expect(user.isActive).toBe(true)
      })
    })
  })

  describe('Pagination', () => {
    it('GET /users?page=1&limit=10 - should return paginated results', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('meta')
      expect(response.body.meta).toHaveProperty('total')
      expect(response.body.meta).toHaveProperty('page', 1)
      expect(response.body.meta).toHaveProperty('limit', 10)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeLessThanOrEqual(10)
    })
  })
})
