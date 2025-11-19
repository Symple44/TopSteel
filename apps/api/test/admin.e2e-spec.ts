/// <reference types="jest" />

import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../src/core/database/prisma/prisma.service'

describe('Admin Domain (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let authToken: string
  let adminUserId: string
  let testMenuConfigId: string
  let testMenuItemId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import full app module here when ready
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    prisma = moduleFixture.get<PrismaService>(PrismaService)

    await app.init()

    // Setup: Create admin user with proper roles
    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        code: 'ADMIN',
        description: 'Administrator role for testing',
        isSystem: true,
      },
    })

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@topsteel.com',
        firstName: 'Admin',
        lastName: 'User',
        password: '$2b$10$hashedAdminPassword',
        isActive: true,
        emailVerified: true,
      },
    })
    adminUserId = adminUser.id

    // Assign admin role to user
    await prisma.userRole.create({
      data: {
        userId: adminUserId,
        roleId: adminRole.id,
      },
    })

    // Authenticate to get token
    // (In real implementation, this would call auth endpoint)
    authToken = 'mock-admin-token' // Replace with real auth flow
  })

  afterAll(async () => {
    // Cleanup
    if (testMenuItemId) {
      await prisma.menuItem.delete({ where: { id: testMenuItemId } }).catch(() => {})
    }
    if (testMenuConfigId) {
      await prisma.menuConfiguration
        .delete({ where: { id: testMenuConfigId } })
        .catch(() => {})
    }
    if (adminUserId) {
      await prisma.userRole.deleteMany({ where: { userId: adminUserId } })
      await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {})
    }

    await app.close()
    await prisma.$disconnect()
  })

  describe('Menu Configuration', () => {
    it('POST /admin/menu-configurations - should create menu configuration', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/menu-configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Menu Config',
          description: 'Menu configuration for E2E testing',
          isDefault: false,
          isActive: true,
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.name).toBe('Test Menu Config')
      expect(response.body.isActive).toBe(true)

      testMenuConfigId = response.body.id
    })

    it('GET /admin/menu-configurations - should return all menu configurations', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/menu-configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)

      const testConfig = response.body.find((c: any) => c.id === testMenuConfigId)
      expect(testConfig).toBeDefined()
    })

    it('GET /admin/menu-configurations/:id - should return specific menu configuration', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/menu-configurations/${testMenuConfigId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.id).toBe(testMenuConfigId)
      expect(response.body.name).toBe('Test Menu Config')
    })

    it('PATCH /admin/menu-configurations/:id - should update menu configuration', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/menu-configurations/${testMenuConfigId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Menu Config',
          description: 'Updated description',
        })
        .expect(200)

      expect(response.body.name).toBe('Updated Menu Config')
      expect(response.body.description).toBe('Updated description')
    })
  })

  describe('Menu Items', () => {
    it('POST /admin/menu-items - should create menu item', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/menu-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          menuConfigurationId: testMenuConfigId,
          label: 'Test Menu Item',
          path: '/test',
          icon: 'test-icon',
          order: 1,
          isActive: true,
          isVisible: true,
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.label).toBe('Test Menu Item')
      expect(response.body.path).toBe('/test')

      testMenuItemId = response.body.id
    })

    it('GET /admin/menu-items - should return all menu items', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/menu-items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })

    it('GET /admin/menu-items/:id - should return specific menu item', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/menu-items/${testMenuItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.id).toBe(testMenuItemId)
      expect(response.body.label).toBe('Test Menu Item')
    })

    it('PATCH /admin/menu-items/:id - should update menu item', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/menu-items/${testMenuItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          label: 'Updated Menu Item',
          order: 2,
        })
        .expect(200)

      expect(response.body.label).toBe('Updated Menu Item')
      expect(response.body.order).toBe(2)
    })

    it('GET /admin/menu-items?menuConfigurationId=:id - should filter by menu config', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/menu-items?menuConfigurationId=${testMenuConfigId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      response.body.forEach((item: any) => {
        expect(item.menuConfigurationId).toBe(testMenuConfigId)
      })
    })

    it('DELETE /admin/menu-items/:id - should delete menu item', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/menu-items/${testMenuItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/admin/menu-items/${testMenuItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      testMenuItemId = '' // Cleared for cleanup
    })
  })

  describe('Menu Hierarchy', () => {
    let parentItemId: string
    let childItemId: string

    it('should create parent menu item', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/menu-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          menuConfigurationId: testMenuConfigId,
          label: 'Parent Item',
          path: '/parent',
          icon: 'parent-icon',
          order: 1,
          isActive: true,
          isVisible: true,
        })
        .expect(201)

      parentItemId = response.body.id
    })

    it('should create child menu item with parent', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/menu-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          menuConfigurationId: testMenuConfigId,
          parentId: parentItemId,
          label: 'Child Item',
          path: '/parent/child',
          icon: 'child-icon',
          order: 1,
          isActive: true,
          isVisible: true,
        })
        .expect(201)

      expect(response.body.parentId).toBe(parentItemId)
      childItemId = response.body.id
    })

    it('GET /admin/menu-items/:id/children - should return child items', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/menu-items/${parentItemId}/children`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      const child = response.body.find((item: any) => item.id === childItemId)
      expect(child).toBeDefined()
    })

    afterAll(async () => {
      // Cleanup hierarchy
      if (childItemId) {
        await prisma.menuItem.delete({ where: { id: childItemId } }).catch(() => {})
      }
      if (parentItemId) {
        await prisma.menuItem.delete({ where: { id: parentItemId } }).catch(() => {})
      }
    })
  })

  describe('System Parameters', () => {
    let testParamId: string

    it('POST /admin/system-parameters - should create system parameter', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/system-parameters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'TEST_PARAM',
          value: 'test-value',
          description: 'Test parameter for E2E',
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.key).toBe('TEST_PARAM')
      expect(response.body.value).toBe('test-value')

      testParamId = response.body.id
    })

    it('GET /admin/system-parameters - should return all system parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/system-parameters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })

    it('GET /admin/system-parameters/:key - should return parameter by key', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/system-parameters/TEST_PARAM')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.key).toBe('TEST_PARAM')
      expect(response.body.value).toBe('test-value')
    })

    it('PATCH /admin/system-parameters/:key - should update parameter value', async () => {
      const response = await request(app.getHttpServer())
        .patch('/admin/system-parameters/TEST_PARAM')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 'updated-value',
        })
        .expect(200)

      expect(response.body.value).toBe('updated-value')
    })

    afterAll(async () => {
      if (testParamId) {
        await prisma.systemParameter
          .delete({ where: { id: testParamId } })
          .catch(() => {})
      }
    })
  })

  describe('Security & Permissions', () => {
    it('should reject non-admin users from creating menu configurations', async () => {
      const regularToken = 'mock-regular-user-token'

      await request(app.getHttpServer())
        .post('/admin/menu-configurations')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Unauthorized Config',
          isActive: true,
        })
        .expect(403) // Forbidden
    })

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/admin/menu-configurations')
        .expect(401) // Unauthorized
    })
  })

  describe('Menu Synchronization', () => {
    it('POST /admin/menu-sync - should synchronize discovered pages', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/menu-sync')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('synced')
      expect(typeof response.body.synced).toBe('number')
    })

    it('GET /admin/discovered-pages - should return discovered pages', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/discovered-pages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })
  })
})
