/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { LicensingPrismaModule } from '../prisma/licensing-prisma.module'
import { LicensesController } from '../controllers/licenses.controller'
import { LicenseFeaturesController } from '../controllers/license-features.controller'
import { LicenseStatusController } from '../controllers/license-status.controller'
import { LicenseActivationsController } from '../controllers/license-activations.controller'
import { LicenseUsageController } from '../controllers/license-usage.controller'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/security/guards/roles.guard'
import { LicenseType, BillingCycle, LicenseStatus } from '@prisma/client'

// Mock guards to bypass authentication in tests
const mockJwtAuthGuard = {
  canActivate: (context: ExecutionContext) => true,
}

const mockRolesGuard = {
  canActivate: (context: ExecutionContext) => true,
}

/**
 * Licensing API E2E Tests
 *
 * Tests complets pour les endpoints Licensing:
 * - License CRUD (create, read, update, delete)
 * - License Status (activate, suspend, revoke, renew, validate)
 * - Features (add, enable, disable, check)
 * - Validation & Error handling
 */
describe('Licensing API (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let authToken: string
  let testSocieteId: string
  let testLicenseId: string
  let testLicenseKey: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        LicensingPrismaModule,
      ],
      controllers: [
        LicensesController,
        LicenseFeaturesController,
        LicenseStatusController,
        LicenseActivationsController,
        LicenseUsageController,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()

    prisma = moduleFixture.get<PrismaService>(PrismaService)

    // Setup: Create test societe for licenses
    const testSociete = await prisma.societe.create({
      data: {
        code: 'TEST-LIC',
        name: 'Test Company for Licensing',
        legalName: 'Test Company LLC',
        databaseName: 'topsteel_test_lic',
        siret: '12345678901234',
        address: '123 Test St',
        city: 'TestCity',
        postalCode: '12345',
        country: 'TestCountry',
      },
    })
    testSocieteId = testSociete.id

    // TODO: Get real auth token for tests
    // For now, we'll skip auth in tests or mock it
    authToken = 'mock-token'
  })

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testLicenseId) {
      await prisma.licenseFeature.deleteMany({ where: { licenseId: testLicenseId } })
      await prisma.licenseActivation.deleteMany({ where: { licenseId: testLicenseId } })
      await prisma.licenseUsage.deleteMany({ where: { licenseId: testLicenseId } })
      await prisma.license.delete({ where: { id: testLicenseId } }).catch(() => {})
    }
    if (testSocieteId) {
      await prisma.societe.delete({ where: { id: testSocieteId } }).catch(() => {})
    }

    await app.close()
  })

  // ============================================
  // LICENSE CRUD TESTS
  // ============================================

  describe('POST /api/licensing/licenses (Create License)', () => {
    it('should create a new license with valid data', async () => {
      const createDto = {
        societeId: testSocieteId,
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        type: LicenseType.PROFESSIONAL,
        billingCycle: BillingCycle.ANNUAL,
        maxUsers: 10,
        maxSites: 3,
        price: 1200,
        currency: 'EUR',
      }

      const response = await request(app.getHttpServer())
        .post('/api/licensing/licenses')
        .send(createDto)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('licenseKey')
      expect(response.body.customerName).toBe(createDto.customerName)
      expect(response.body.customerEmail).toBe(createDto.customerEmail)
      expect(response.body.type).toBe(createDto.type)
      expect(response.body.status).toBe(LicenseStatus.PENDING)
      expect(response.body.maxUsers).toBe(createDto.maxUsers)

      // Save for other tests
      testLicenseId = response.body.id
      testLicenseKey = response.body.licenseKey
    })

    it('should reject license creation with invalid email', async () => {
      const createDto = {
        societeId: testSocieteId,
        customerName: 'Test Customer',
        customerEmail: 'invalid-email', // Invalid email
        type: LicenseType.BASIC,
      }

      await request(app.getHttpServer())
        .post('/api/licensing/licenses')
        .send(createDto)
        .expect(400)
    })

    it('should reject license creation with missing required fields', async () => {
      const createDto = {
        customerName: 'Test Customer',
        // Missing societeId and customerEmail
      }

      await request(app.getHttpServer())
        .post('/api/licensing/licenses')
        .send(createDto)
        .expect(400)
    })
  })

  describe('GET /api/licensing/licenses/:id (Get License)', () => {
    it('should retrieve a license by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/licensing/licenses/${testLicenseId}`)
        .expect(200)

      expect(response.body.id).toBe(testLicenseId)
      expect(response.body).toHaveProperty('licenseKey')
      expect(response.body).toHaveProperty('societe')
      expect(response.body).toHaveProperty('features')
    })

    it('should return 404 for non-existent license', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      await request(app.getHttpServer())
        .get(`/api/licensing/licenses/${fakeId}`)
        .expect(404)
    })
  })

  describe('GET /api/licensing/licenses/key/:licenseKey (Get by Key)', () => {
    it('should retrieve a license by license key', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/licensing/licenses/key/${testLicenseKey}`)
        .expect(200)

      expect(response.body.licenseKey).toBe(testLicenseKey)
      expect(response.body.id).toBe(testLicenseId)
    })
  })

  describe('GET /api/licensing/licenses (List Licenses)', () => {
    it('should retrieve licenses filtered by societeId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/licensing/licenses')
        .query({ societeId: testSocieteId })
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0].societeId).toBe(testSocieteId)
    })
  })

  describe('PATCH /api/licensing/licenses/:id (Update License)', () => {
    it('should update license information', async () => {
      const updateDto = {
        maxUsers: 20,
        maxSites: 5,
        notes: 'Updated via E2E test',
      }

      const response = await request(app.getHttpServer())
        .patch(`/api/licensing/licenses/${testLicenseId}`)
        .send(updateDto)
        .expect(200)

      expect(response.body.maxUsers).toBe(updateDto.maxUsers)
      expect(response.body.maxSites).toBe(updateDto.maxSites)
      expect(response.body.notes).toBe(updateDto.notes)
    })
  })

  // ============================================
  // LICENSE STATUS TESTS
  // ============================================

  describe('POST /api/licensing/licenses/:id/activate (Activate License)', () => {
    it('should activate a pending license', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/licensing/licenses/${testLicenseId}/activate`)
        .send({ activatedBy: 'test-admin' })
        .expect(200)

      expect(response.body.status).toBe(LicenseStatus.ACTIVE)
      expect(response.body.activatedAt).toBeDefined()
      expect(response.body.activatedBy).toBe('test-admin')
    })
  })

  describe('POST /api/licensing/licenses/:id/suspend (Suspend License)', () => {
    it('should suspend an active license', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/licensing/licenses/${testLicenseId}/suspend`)
        .send({ reason: 'Payment overdue' })
        .expect(200)

      expect(response.body.status).toBe(LicenseStatus.SUSPENDED)
      expect(response.body.suspendedAt).toBeDefined()
      expect(response.body.suspendedReason).toBe('Payment overdue')
    })

    // Reactivate for other tests
    afterAll(async () => {
      await request(app.getHttpServer())
        .post(`/api/licensing/licenses/${testLicenseId}/activate`)
        .send({})
    })
  })

  describe('POST /api/licensing/licenses/:id/renew (Renew License)', () => {
    it('should renew a license with new expiration date', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const response = await request(app.getHttpServer())
        .post(`/api/licensing/licenses/${testLicenseId}/renew`)
        .send({ expiresAt: futureDate, price: 1500 })
        .expect(200)

      expect(response.body.price).toBe(1500)
      expect(response.body.lastRenewalDate).toBeDefined()
    })
  })

  describe('POST /api/licensing/licenses/validate (Validate License)', () => {
    it('should validate a valid license key', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/licensing/licenses/validate')
        .send({ licenseKey: testLicenseKey })
        .expect(200)

      expect(response.body.valid).toBe(true)
      expect(response.body.license).toBeDefined()
      expect(response.body.license.licenseKey).toBe(testLicenseKey)
    })

    it('should reject an invalid license key', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/licensing/licenses/validate')
        .send({ licenseKey: 'INVALID-KEY-12345' })
        .expect(200)

      expect(response.body.valid).toBe(false)
      expect(response.body.reason).toBeDefined()
    })
  })

  // ============================================
  // FEATURES TESTS
  // ============================================

  describe('POST /api/licensing/licenses/:id/features (Add Feature)', () => {
    it('should add a feature to a license', async () => {
      const featureDto = {
        featureCode: 'INVENTORY_MANAGEMENT',
        featureName: 'Inventory Management',
        description: 'Full inventory tracking',
        isEnabled: true,
        limit: 1000,
      }

      const response = await request(app.getHttpServer())
        .post(`/api/licensing/licenses/${testLicenseId}/features`)
        .send(featureDto)
        .expect(201)

      expect(response.body.featureCode).toBe(featureDto.featureCode)
      expect(response.body.featureName).toBe(featureDto.featureName)
      expect(response.body.isEnabled).toBe(true)
    })
  })

  describe('GET /api/licensing/licenses/:id/features (List Features)', () => {
    it('should retrieve all features of a license', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/licensing/licenses/${testLicenseId}/features`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })
  })

  describe('PATCH /api/licensing/licenses/:id/features/:code/disable (Disable Feature)', () => {
    it('should disable a feature', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/licensing/licenses/${testLicenseId}/features/INVENTORY_MANAGEMENT/disable`)
        .expect(200)

      expect(response.body.isEnabled).toBe(false)
      expect(response.body.disabledAt).toBeDefined()
    })
  })

  describe('PATCH /api/licensing/licenses/:id/features/:code/enable (Enable Feature)', () => {
    it('should enable a feature', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/licensing/licenses/${testLicenseId}/features/INVENTORY_MANAGEMENT/enable`)
        .expect(200)

      expect(response.body.isEnabled).toBe(true)
      expect(response.body.enabledAt).toBeDefined()
    })
  })

  describe('GET /api/licensing/licenses/:id/features/:code/availability (Check Availability)', () => {
    it('should check if a feature is available', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/licensing/licenses/${testLicenseId}/features/INVENTORY_MANAGEMENT/availability`)
        .expect(200)

      expect(response.body).toHaveProperty('available')
      expect(response.body).toHaveProperty('feature')
    })
  })

  // ============================================
  // VALIDATION & LIMITS TESTS
  // ============================================

  describe('GET /api/licensing/licenses/:id/expiration (Check Expiration)', () => {
    it('should check license expiration status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/licensing/licenses/${testLicenseId}/expiration`)
        .expect(200)

      expect(response.body).toHaveProperty('expired')
      expect(response.body).toHaveProperty('expiresAt')
    })
  })

  describe('GET /api/licensing/licenses/:id/limits (Check Limits)', () => {
    it('should check license usage limits', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/licensing/licenses/${testLicenseId}/limits`)
        .expect(200)

      expect(response.body).toHaveProperty('withinLimits')
      expect(response.body).toHaveProperty('limits')
    })
  })

  // ============================================
  // DELETE TEST (Last)
  // ============================================

  describe('DELETE /api/licensing/licenses/:id (Delete License)', () => {
    it('should delete a license', async () => {
      await request(app.getHttpServer())
        .delete(`/api/licensing/licenses/${testLicenseId}`)
        .expect(200)

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/licensing/licenses/${testLicenseId}`)
        .expect(404)

      // Prevent cleanup from failing
      testLicenseId = ''
    })
  })
})
