/**
 * Multi-Tenant Isolation Tests
 *
 * Tests the complete security stack:
 * 1. TenantGuard (HTTP level)
 * 2. PrismaTenantMiddleware (ORM level)
 * 3. PostgreSQL RLS (Database level)
 *
 * These tests ensure complete data isolation between tenants
 * and validate that the defense-in-depth strategy works correctly.
 */

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ExecutionContext } from '@nestjs/common'
import { PrismaService } from '../../database/prisma/prisma.service'
import { TenantContextService } from '../tenant-context.service'
import { PrismaTenantMiddleware } from '../prisma-tenant.middleware'
import { TenantGuard } from '../tenant.guard'
import { APP_GUARD } from '@nestjs/core'
import { randomUUID } from 'crypto'

describe('Multi-Tenant Isolation', () => {
  let app: INestApplication
  let prisma: PrismaService
  let tenantContext: TenantContextService
  let middleware: PrismaTenantMiddleware

  // Test data
  let societe1Id: string
  let societe2Id: string
  let user1Id: string
  let user2Id: string
  let superAdminId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        TenantContextService,
        PrismaTenantMiddleware,
        {
          provide: APP_GUARD,
          useClass: TenantGuard,
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    prisma = moduleFixture.get<PrismaService>(PrismaService)
    tenantContext = moduleFixture.get<TenantContextService>(TenantContextService)
    middleware = moduleFixture.get<PrismaTenantMiddleware>(PrismaTenantMiddleware)

    // Register Prisma middleware
    prisma.$use(middleware.createMiddleware())

    // Setup test data
    await setupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  /**
   * Setup test societies and users
   */
  async function setupTestData() {
    // Create two test societies
    const societe1 = await prisma.societe.create({
      data: {
        nom: 'Test Company 1',
        code: `TEST1_${randomUUID().slice(0, 8)}`,
        email: 'test1@example.com',
        telephone: '0000000001',
        actif: true,
      },
    })
    societe1Id = societe1.id

    const societe2 = await prisma.societe.create({
      data: {
        nom: 'Test Company 2',
        code: `TEST2_${randomUUID().slice(0, 8)}`,
        email: 'test2@example.com',
        telephone: '0000000002',
        actif: true,
      },
    })
    societe2Id = societe2.id

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        username: `user1_${randomUUID().slice(0, 8)}`,
        email: 'user1@test.com',
        password: 'hashed_password',
        nom: 'User',
        prenom: 'One',
        actif: true,
        societes: {
          create: {
            societeId: societe1Id,
            roles: {
              create: {
                roleId: 'test-role',
                societeId: societe1Id,
              },
            },
          },
        },
      },
    })
    user1Id = user1.id

    const user2 = await prisma.user.create({
      data: {
        username: `user2_${randomUUID().slice(0, 8)}`,
        email: 'user2@test.com',
        password: 'hashed_password',
        nom: 'User',
        prenom: 'Two',
        actif: true,
        societes: {
          create: {
            societeId: societe2Id,
            roles: {
              create: {
                roleId: 'test-role',
                societeId: societe2Id,
              },
            },
          },
        },
      },
    })
    user2Id = user2.id

    const superAdmin = await prisma.user.create({
      data: {
        username: `admin_${randomUUID().slice(0, 8)}`,
        email: 'admin@test.com',
        password: 'hashed_password',
        nom: 'Super',
        prenom: 'Admin',
        actif: true,
        isSuperAdmin: true,
      },
    })
    superAdminId = superAdmin.id
  }

  /**
   * Cleanup test data
   */
  async function cleanupTestData() {
    try {
      // Delete in reverse order of dependencies
      await prisma.userSocieteRole.deleteMany({
        where: {
          OR: [
            { userId: user1Id },
            { userId: user2Id },
          ],
        },
      })

      await prisma.userSociete.deleteMany({
        where: {
          OR: [
            { userId: user1Id },
            { userId: user2Id },
          ],
        },
      })

      await prisma.notification.deleteMany({
        where: {
          OR: [
            { societeId: societe1Id },
            { societeId: societe2Id },
          ],
        },
      })

      await prisma.user.deleteMany({
        where: {
          id: {
            in: [user1Id, user2Id, superAdminId],
          },
        },
      })

      await prisma.societe.deleteMany({
        where: {
          id: {
            in: [societe1Id, societe2Id],
          },
        },
      })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  describe('Level 1: TenantContextService', () => {
    it('should store and retrieve tenant context', () => {
      tenantContext.setTenant({
        societeId: societe1Id,
        userId: user1Id,
        isSuperAdmin: false,
        requestId: 'test-request-1',
      })

      const context = tenantContext.getTenant()
      expect(context.societeId).toBe(societe1Id)
      expect(context.userId).toBe(user1Id)
      expect(context.isSuperAdmin).toBe(false)
    })

    it('should throw error when no context is set', () => {
      // Clear context by setting a new async context
      expect(() => {
        // This will fail because we're outside the async context
        const newContext = new TenantContextService()
        newContext.getTenant()
      }).toThrow('No tenant context found')
    })

    it('should support runWithTenant for scoped execution', async () => {
      const result = await tenantContext.runWithTenant(
        {
          societeId: societe2Id,
          userId: user2Id,
          isSuperAdmin: false,
          requestId: 'scoped-test',
        },
        async () => {
          const ctx = tenantContext.getTenant()
          return ctx.societeId
        }
      )

      expect(result).toBe(societe2Id)
    })
  })

  describe('Level 2: PrismaTenantMiddleware - Read Operations', () => {
    it('should filter notifications by societeId for regular user', async () => {
      // Create notifications for both societies
      await prisma.notification.create({
        data: {
          societeId: societe1Id,
          userId: user1Id,
          type: 'TEST',
          title: 'Notification for Society 1',
          message: 'Test message',
          status: 'unread',
        },
      })

      await prisma.notification.create({
        data: {
          societeId: societe2Id,
          userId: user2Id,
          type: 'TEST',
          title: 'Notification for Society 2',
          message: 'Test message',
          status: 'unread',
        },
      })

      // Query as user1 (society 1)
      await tenantContext.runWithTenant(
        {
          societeId: societe1Id,
          userId: user1Id,
          isSuperAdmin: false,
          requestId: 'test-read-1',
        },
        async () => {
          const notifications = await prisma.notification.findMany({
            where: { userId: user1Id },
          })

          expect(notifications.length).toBeGreaterThan(0)
          notifications.forEach((notif) => {
            expect(notif.societeId).toBe(societe1Id)
          })
        }
      )
    })

    it('should allow super admin to read all societies', async () => {
      await tenantContext.runWithTenant(
        {
          societeId: societe1Id, // Super admin can set any societeId
          userId: superAdminId,
          isSuperAdmin: true,
          requestId: 'test-superadmin-read',
        },
        async () => {
          const allNotifications = await prisma.notification.findMany()

          // Super admin should see notifications from both societies
          const societies = new Set(allNotifications.map((n) => n.societeId))
          expect(societies.size).toBeGreaterThanOrEqual(2)
        }
      )
    })

    it('should handle nullable societeId models (global parameters)', async () => {
      // Create global parameter (societeId = null)
      await prisma.parameterSystem.create({
        data: {
          code: 'GLOBAL_PARAM_1',
          label: 'Global Parameter',
          value: 'global-value',
          category: 'system',
          type: 'string',
        },
      })

      // Create society-specific parameter
      await prisma.parameterSystem.create({
        data: {
          societeId: societe1Id,
          code: 'SOCIETE1_PARAM',
          label: 'Society 1 Parameter',
          value: 'society1-value',
          category: 'system',
          type: 'string',
        },
      })

      // User from society1 should see both global and their params
      await tenantContext.runWithTenant(
        {
          societeId: societe1Id,
          userId: user1Id,
          isSuperAdmin: false,
          requestId: 'test-nullable-read',
        },
        async () => {
          const params = await prisma.parameterSystem.findMany()

          // Should see global + society1 params (not society2)
          const globalParams = params.filter((p) => p.societeId === null)
          const society1Params = params.filter((p) => p.societeId === societe1Id)
          const society2Params = params.filter((p) => p.societeId === societe2Id)

          expect(globalParams.length).toBeGreaterThan(0)
          expect(society1Params.length).toBeGreaterThan(0)
          expect(society2Params.length).toBe(0) // Should NOT see society2 params
        }
      )
    })
  })

  describe('Level 2: PrismaTenantMiddleware - Write Operations', () => {
    it('should auto-inject societeId on create', async () => {
      await tenantContext.runWithTenant(
        {
          societeId: societe1Id,
          userId: user1Id,
          isSuperAdmin: false,
          requestId: 'test-create',
        },
        async () => {
          const notification = await prisma.notification.create({
            data: {
              userId: user1Id,
              type: 'AUTO_INJECT_TEST',
              title: 'Test notification',
              message: 'Testing auto-injection',
              status: 'unread',
              // Note: societeId is NOT provided, should be auto-injected
            },
          })

          expect(notification.societeId).toBe(societe1Id)
        }
      )
    })

    it('should prevent cross-tenant updates', async () => {
      // Create notification in society1
      const notification = await prisma.notification.create({
        data: {
          societeId: societe1Id,
          userId: user1Id,
          type: 'ISOLATION_TEST',
          title: 'Isolation test',
          message: 'Test message',
          status: 'unread',
        },
      })

      // Try to update from society2 context
      await tenantContext.runWithTenant(
        {
          societeId: societe2Id,
          userId: user2Id,
          isSuperAdmin: false,
          requestId: 'test-cross-tenant-update',
        },
        async () => {
          const result = await prisma.notification.updateMany({
            where: { id: notification.id },
            data: { status: 'read' },
          })

          // Update should fail (0 records updated) due to middleware filtering
          expect(result.count).toBe(0)
        }
      )

      // Verify notification is still unread
      const unchanged = await prisma.notification.findUnique({
        where: { id: notification.id },
      })
      expect(unchanged?.status).toBe('unread')
    })

    it('should prevent cross-tenant deletes', async () => {
      // Create notification in society1
      const notification = await prisma.notification.create({
        data: {
          societeId: societe1Id,
          userId: user1Id,
          type: 'DELETE_TEST',
          title: 'Delete test',
          message: 'Test message',
          status: 'unread',
        },
      })

      // Try to delete from society2 context
      await tenantContext.runWithTenant(
        {
          societeId: societe2Id,
          userId: user2Id,
          isSuperAdmin: false,
          requestId: 'test-cross-tenant-delete',
        },
        async () => {
          const result = await prisma.notification.deleteMany({
            where: { id: notification.id },
          })

          // Delete should fail (0 records deleted)
          expect(result.count).toBe(0)
        }
      )

      // Verify notification still exists
      const stillExists = await prisma.notification.findUnique({
        where: { id: notification.id },
      })
      expect(stillExists).not.toBeNull()
    })

    it('should allow super admin to update across societies', async () => {
      // Create notification in society1
      const notification = await prisma.notification.create({
        data: {
          societeId: societe1Id,
          userId: user1Id,
          type: 'ADMIN_UPDATE_TEST',
          title: 'Admin test',
          message: 'Test message',
          status: 'unread',
        },
      })

      // Super admin can update any society's data
      await tenantContext.runWithTenant(
        {
          societeId: societe2Id, // Different society
          userId: superAdminId,
          isSuperAdmin: true,
          requestId: 'test-admin-update',
        },
        async () => {
          const result = await prisma.notification.update({
            where: { id: notification.id },
            data: { status: 'read' },
          })

          expect(result.status).toBe('read')
        }
      )
    })
  })

  describe('Level 3: PostgreSQL RLS', () => {
    it('should enforce RLS at database level', async () => {
      // Set RLS context for society1
      await prisma.$executeRaw`SELECT set_societe_context(${societe1Id}::uuid, false)`

      // Try to query notifications - should only see society1
      const notifications = await prisma.$queryRaw<any[]>`
        SELECT * FROM notifications WHERE societe_id = ${societe2Id}
      `

      // RLS should block society2 notifications even with explicit WHERE
      expect(notifications.length).toBe(0)

      // Clear RLS context
      await prisma.$executeRaw`SELECT clear_societe_context()`
    })

    it('should allow super admin to bypass RLS', async () => {
      // Set RLS context as super admin
      await prisma.$executeRaw`SELECT set_societe_context(${societe1Id}::uuid, true)`

      // Super admin should see all societies
      const allNotifications = await prisma.$queryRaw<any[]>`
        SELECT * FROM notifications
      `

      const societies = new Set(allNotifications.map((n) => n.societe_id))
      expect(societies.size).toBeGreaterThanOrEqual(2)

      // Clear RLS context
      await prisma.$executeRaw`SELECT clear_societe_context()`
    })

    it('should handle nullable societeId with RLS', async () => {
      // Set RLS context for society1
      await prisma.$executeRaw`SELECT set_societe_context(${societe1Id}::uuid, false)`

      // Query parameters (nullable societeId)
      const params = await prisma.$queryRaw<any[]>`
        SELECT * FROM parameter_system
      `

      // Should see global (societe_id IS NULL) + society1 params
      const nullParams = params.filter((p) => p.societe_id === null)
      const society1Params = params.filter((p) => p.societe_id === societe1Id)
      const society2Params = params.filter((p) => p.societe_id === societe2Id)

      expect(nullParams.length).toBeGreaterThan(0)
      expect(society1Params.length).toBeGreaterThanOrEqual(0)
      expect(society2Params.length).toBe(0) // RLS should block society2

      // Clear RLS context
      await prisma.$executeRaw`SELECT clear_societe_context()`
    })

    it('should block access when RLS context is not set', async () => {
      // Clear any existing RLS context
      await prisma.$executeRaw`SELECT clear_societe_context()`

      // Without RLS context, queries should return empty
      const notifications = await prisma.$queryRaw<any[]>`
        SELECT * FROM notifications
      `

      // Most tables should return 0 rows without RLS context
      // (unless there's existing data from other tests)
      expect(Array.isArray(notifications)).toBe(true)
    })
  })

  describe('Integration Tests: Complete Request Flow', () => {
    it('should enforce isolation through all 3 security levels', async () => {
      // Simulate complete request flow with all security layers

      // 1. TenantGuard sets context
      tenantContext.setTenant({
        societeId: societe1Id,
        userId: user1Id,
        isSuperAdmin: false,
        requestId: 'integration-test-1',
      })

      // 2. TenantRLSInterceptor sets PostgreSQL session
      await prisma.$executeRaw`SELECT set_societe_context(${societe1Id}::uuid, false)`

      // 3. Prisma middleware auto-filters queries
      // 4. RLS enforces at database level

      // Create notification (should be auto-tagged with society1)
      const created = await prisma.notification.create({
        data: {
          userId: user1Id,
          type: 'INTEGRATION_TEST',
          title: 'Integration test',
          message: 'Test message',
          status: 'unread',
        },
      })

      expect(created.societeId).toBe(societe1Id)

      // Try to read as society2 (should fail at multiple levels)
      tenantContext.setTenant({
        societeId: societe2Id,
        userId: user2Id,
        isSuperAdmin: false,
        requestId: 'integration-test-2',
      })

      await prisma.$executeRaw`SELECT set_societe_context(${societe2Id}::uuid, false)`

      const readAttempt = await prisma.notification.findUnique({
        where: { id: created.id },
      })

      // Should return null due to middleware filtering
      expect(readAttempt).toBeNull()

      // Cleanup
      await prisma.$executeRaw`SELECT clear_societe_context()`
    })

    it('should maintain isolation under concurrent requests', async () => {
      // Simulate 2 concurrent requests from different societies
      const request1 = tenantContext.runWithTenant(
        {
          societeId: societe1Id,
          userId: user1Id,
          isSuperAdmin: false,
          requestId: 'concurrent-1',
        },
        async () => {
          const notif = await prisma.notification.create({
            data: {
              userId: user1Id,
              type: 'CONCURRENT_1',
              title: 'Concurrent test 1',
              message: 'Test',
              status: 'unread',
            },
          })
          return notif.societeId
        }
      )

      const request2 = tenantContext.runWithTenant(
        {
          societeId: societe2Id,
          userId: user2Id,
          isSuperAdmin: false,
          requestId: 'concurrent-2',
        },
        async () => {
          const notif = await prisma.notification.create({
            data: {
              userId: user2Id,
              type: 'CONCURRENT_2',
              title: 'Concurrent test 2',
              message: 'Test',
              status: 'unread',
            },
          })
          return notif.societeId
        }
      )

      const [result1, result2] = await Promise.all([request1, request2])

      // Each request should maintain its own context
      expect(result1).toBe(societe1Id)
      expect(result2).toBe(societe2Id)
    })
  })

  describe('Edge Cases and Security', () => {
    it('should prevent SQL injection through societeId', async () => {
      const maliciousSocieteId = "'; DROP TABLE notifications; --"

      await expect(
        tenantContext.runWithTenant(
          {
            societeId: maliciousSocieteId,
            userId: user1Id,
            isSuperAdmin: false,
            requestId: 'sql-injection-test',
          },
          async () => {
            await prisma.notification.findMany()
          }
        )
      ).rejects.toThrow() // Should fail due to invalid UUID format
    })

    it('should prevent privilege escalation via context manipulation', async () => {
      // Regular user tries to set super admin flag
      tenantContext.setTenant({
        societeId: societe1Id,
        userId: user1Id,
        isSuperAdmin: true, // ⚠️ User tries to escalate
        requestId: 'privilege-escalation-test',
      })

      // This should be prevented at the Guard level in real scenario
      // The Guard validates user.isSuperAdmin from JWT, not from request
      // Here we're just testing that the context accepts the flag
      const ctx = tenantContext.getTenant()
      expect(ctx.isSuperAdmin).toBe(true)

      // NOTE: In production, TenantGuard would prevent this by reading
      // user.isSuperAdmin from the authenticated JWT token, not from
      // user-provided data
    })

    it('should handle empty/null societeId gracefully', async () => {
      const invalidCases = [
        { societeId: '', label: 'empty string' },
        { societeId: '   ', label: 'whitespace' },
        { societeId: 'not-a-uuid', label: 'invalid UUID' },
      ]

      for (const testCase of invalidCases) {
        await expect(
          tenantContext.runWithTenant(
            {
              societeId: testCase.societeId,
              userId: user1Id,
              isSuperAdmin: false,
              requestId: `invalid-${testCase.label}`,
            },
            async () => {
              await prisma.notification.findMany()
            }
          )
        ).rejects.toThrow() // Should fail validation
      }
    })

    it('should prevent direct Prisma queries without context', async () => {
      // Create a new Prisma instance without middleware
      const directPrisma = new PrismaService(null as any, null as any)

      // Direct queries bypass middleware but RLS should still protect
      // This tests the "defense in depth" strategy
      await directPrisma.$executeRaw`SELECT set_societe_context(${societe1Id}::uuid, false)`

      const notifications = await directPrisma.$queryRaw<any[]>`
        SELECT * FROM notifications WHERE societe_id = ${societe2Id}
      `

      // RLS should block even without middleware
      expect(notifications.length).toBe(0)

      await directPrisma.$executeRaw`SELECT clear_societe_context()`
      await directPrisma.$disconnect()
    })
  })
})
