/// <reference types="jest" />

import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../src/core/database/prisma.service'

describe('Societes (Tenants) Domain (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let authToken: string
  let superAdminUserId: string
  let testSocieteId: string
  let testSiteId: string
  let testUserSocieteId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import full app module here when ready
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    prisma = moduleFixture.get<PrismaService>(PrismaService)

    await app.init()

    // Setup: Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@topsteel.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: '$2b$10$hashedSuperAdminPassword',
        isActive: true,
        emailVerified: true,
      },
    })
    superAdminUserId = superAdmin.id

    // Mock auth token (in real implementation, call auth endpoint)
    authToken = 'mock-superadmin-token'
  })

  afterAll(async () => {
    // Cleanup
    if (testUserSocieteId) {
      await prisma.societeUser
        .delete({ where: { id: testUserSocieteId } })
        .catch(() => {})
    }
    if (testSiteId) {
      await prisma.site.delete({ where: { id: testSiteId } }).catch(() => {})
    }
    if (testSocieteId) {
      await prisma.societe.delete({ where: { id: testSocieteId } }).catch(() => {})
    }
    if (superAdminUserId) {
      await prisma.user.delete({ where: { id: superAdminUserId } }).catch(() => {})
    }

    await app.close()
    await prisma.$disconnect()
  })

  describe('Societe (Tenant) CRUD', () => {
    it('POST /societes - should create new societe', async () => {
      const response = await request(app.getHttpServer())
        .post('/societes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST_SOCIETE',
          name: 'Test Societe E2E',
          description: 'Societe created for E2E testing',
          isActive: true,
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.code).toBe('TEST_SOCIETE')
      expect(response.body.name).toBe('Test Societe E2E')
      expect(response.body.isActive).toBe(true)

      testSocieteId = response.body.id
    })

    it('GET /societes - should return all societes', async () => {
      const response = await request(app.getHttpServer())
        .get('/societes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)

      const testSociete = response.body.find((s: any) => s.id === testSocieteId)
      expect(testSociete).toBeDefined()
    })

    it('GET /societes/:id - should return specific societe', async () => {
      const response = await request(app.getHttpServer())
        .get(`/societes/${testSocieteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.id).toBe(testSocieteId)
      expect(response.body.code).toBe('TEST_SOCIETE')
    })

    it('PATCH /societes/:id - should update societe', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/societes/${testSocieteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Societe',
          description: 'Updated description',
        })
        .expect(200)

      expect(response.body.name).toBe('Updated Test Societe')
      expect(response.body.description).toBe('Updated description')
    })
  })

  describe('Sites Management', () => {
    it('POST /societes/:id/sites - should create site for societe', async () => {
      const response = await request(app.getHttpServer())
        .post(`/societes/${testSocieteId}/sites`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'SITE_001',
          name: 'Test Site',
          address: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'France',
          isActive: true,
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.code).toBe('SITE_001')
      expect(response.body.name).toBe('Test Site')
      expect(response.body.societeId).toBe(testSocieteId)

      testSiteId = response.body.id
    })

    it('GET /societes/:id/sites - should return all sites for societe', async () => {
      const response = await request(app.getHttpServer())
        .get(`/societes/${testSocieteId}/sites`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)

      const testSite = response.body.find((s: any) => s.id === testSiteId)
      expect(testSite).toBeDefined()
    })

    it('GET /sites/:id - should return specific site', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sites/${testSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.id).toBe(testSiteId)
      expect(response.body.code).toBe('SITE_001')
    })

    it('PATCH /sites/:id - should update site', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/sites/${testSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Site',
        })
        .expect(200)

      expect(response.body.name).toBe('Updated Test Site')
    })

    it('DELETE /sites/:id - should delete site', async () => {
      await request(app.getHttpServer())
        .delete(`/sites/${testSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/sites/${testSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      testSiteId = '' // Cleared for cleanup
    })
  })

  describe('User-Societe Associations', () => {
    let regularUserId: string

    beforeAll(async () => {
      // Create regular user for association tests
      const regularUser = await prisma.user.create({
        data: {
          email: 'regular@topsteel.com',
          firstName: 'Regular',
          lastName: 'User',
          password: '$2b$10$hashedPassword',
          isActive: true,
          emailVerified: true,
        },
      })
      regularUserId = regularUser.id
    })

    it('POST /societes/:id/users - should assign user to societe', async () => {
      const response = await request(app.getHttpServer())
        .post(`/societes/${testSocieteId}/users`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: regularUserId,
          isActive: true,
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.userId).toBe(regularUserId)
      expect(response.body.societeId).toBe(testSocieteId)
      expect(response.body.isActive).toBe(true)

      testUserSocieteId = response.body.id
    })

    it('GET /societes/:id/users - should return all users for societe', async () => {
      const response = await request(app.getHttpServer())
        .get(`/societes/${testSocieteId}/users`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)

      const userAssociation = response.body.find(
        (u: any) => u.userId === regularUserId
      )
      expect(userAssociation).toBeDefined()
    })

    it('GET /users/:id/societes - should return all societes for user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUserId}/societes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)

      const societeAssociation = response.body.find(
        (s: any) => s.societeId === testSocieteId
      )
      expect(societeAssociation).toBeDefined()
    })

    it('DELETE /societes/:id/users/:userId - should remove user from societe', async () => {
      await request(app.getHttpServer())
        .delete(`/societes/${testSocieteId}/users/${regularUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Verify removal
      const response = await request(app.getHttpServer())
        .get(`/societes/${testSocieteId}/users`)
        .set('Authorization', `Bearer ${authToken}`)

      const userAssociation = response.body.find(
        (u: any) => u.userId === regularUserId
      )
      expect(userAssociation).toBeUndefined()

      testUserSocieteId = '' // Cleared for cleanup
    })

    afterAll(async () => {
      if (regularUserId) {
        await prisma.user.delete({ where: { id: regularUserId } }).catch(() => {})
      }
    })
  })

  describe('Tenant Isolation & Security', () => {
    let otherSocieteId: string
    let tenant1UserId: string
    let tenant2UserId: string

    beforeAll(async () => {
      // Create another societe
      const otherSociete = await prisma.societe.create({
        data: {
          code: 'OTHER_SOCIETE',
          name: 'Other Societe',
          isActive: true,
        },
      })
      otherSocieteId = otherSociete.id

      // Create users for each tenant
      const tenant1User = await prisma.user.create({
        data: {
          email: 'tenant1@topsteel.com',
          firstName: 'Tenant1',
          lastName: 'User',
          password: '$2b$10$hashed',
          isActive: true,
          emailVerified: true,
        },
      })
      tenant1UserId = tenant1User.id

      const tenant2User = await prisma.user.create({
        data: {
          email: 'tenant2@topsteel.com',
          firstName: 'Tenant2',
          lastName: 'User',
          password: '$2b$10$hashed',
          isActive: true,
          emailVerified: true,
        },
      })
      tenant2UserId = tenant2User.id

      // Assign users to their respective tenants
      await prisma.societeUser.create({
        data: {
          userId: tenant1UserId,
          societeId: testSocieteId,
          isActive: true,
        },
      })

      await prisma.societeUser.create({
        data: {
          userId: tenant2UserId,
          societeId: otherSocieteId,
          isActive: true,
        },
      })
    })

    it('should enforce tenant isolation for data access', async () => {
      const tenant1Token = 'mock-tenant1-token'

      // Tenant 1 user should NOT see Tenant 2's data
      const response = await request(app.getHttpServer())
        .get(`/societes/${otherSocieteId}`)
        .set('Authorization', `Bearer ${tenant1Token}`)
        .set('X-Tenant-Id', testSocieteId)
        .expect(403) // Forbidden
    })

    it('should allow tenant to access their own data', async () => {
      const tenant1Token = 'mock-tenant1-token'

      const response = await request(app.getHttpServer())
        .get(`/societes/${testSocieteId}`)
        .set('Authorization', `Bearer ${tenant1Token}`)
        .set('X-Tenant-Id', testSocieteId)
        .expect(200)

      expect(response.body.id).toBe(testSocieteId)
    })

    afterAll(async () => {
      // Cleanup tenant isolation test data
      if (tenant1UserId) {
        await prisma.societeUser.deleteMany({ where: { userId: tenant1UserId } })
        await prisma.user.delete({ where: { id: tenant1UserId } }).catch(() => {})
      }
      if (tenant2UserId) {
        await prisma.societeUser.deleteMany({ where: { userId: tenant2UserId } })
        await prisma.user.delete({ where: { id: tenant2UserId } }).catch(() => {})
      }
      if (otherSocieteId) {
        await prisma.societe.delete({ where: { id: otherSocieteId } }).catch(() => {})
      }
    })
  })

  describe('Societe Activation & Status', () => {
    it('PATCH /societes/:id/activate - should activate societe', async () => {
      // First deactivate
      await request(app.getHttpServer())
        .patch(`/societes/${testSocieteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(200)

      // Then activate
      const response = await request(app.getHttpServer())
        .patch(`/societes/${testSocieteId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.isActive).toBe(true)
    })

    it('PATCH /societes/:id/deactivate - should deactivate societe', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/societes/${testSocieteId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.isActive).toBe(false)

      // Reactivate for cleanup
      await request(app.getHttpServer())
        .patch(`/societes/${testSocieteId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
    })

    it('should prevent operations on deactivated societe', async () => {
      // Deactivate
      await request(app.getHttpServer())
        .patch(`/societes/${testSocieteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })

      // Try to create site on deactivated societe
      await request(app.getHttpServer())
        .post(`/societes/${testSocieteId}/sites`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'INACTIVE_SITE',
          name: 'Should Fail',
        })
        .expect(400) // Bad request

      // Reactivate
      await request(app.getHttpServer())
        .patch(`/societes/${testSocieteId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
    })
  })

  describe('Societe Search & Filtering', () => {
    it('GET /societes?search=Test - should filter societes by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/societes?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      if (response.body.length > 0) {
        const hasMatch = response.body.some(
          (s: any) =>
            s.name.includes('Test') ||
            s.code.includes('TEST') ||
            (s.description && s.description.includes('Test'))
        )
        expect(hasMatch).toBe(true)
      }
    })

    it('GET /societes?isActive=true - should filter active societes only', async () => {
      const response = await request(app.getHttpServer())
        .get('/societes?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      response.body.forEach((s: any) => {
        expect(s.isActive).toBe(true)
      })
    })
  })
})
