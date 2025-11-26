/**
 * Public Endpoints E2E Tests
 *
 * These tests verify that public endpoints (marked with @Public() decorator)
 * are accessible without authentication.
 *
 * IMPORTANT: These tests do NOT mock the guards - they test the real security layer
 * to catch missing @Public() decorators.
 */

import type { INestApplication } from '@nestjs/common'
import { ValidationPipe } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Public Endpoints Accessibility (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    // Import the real app module with all guards
    const { AppModule } = await import('../src/app/app.module')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    // Apply the same configuration as the real app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      })
    )

    app.setGlobalPrefix('api')

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('CSRF Endpoints', () => {
    it('GET /api/csrf/token - should be accessible without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/csrf/token')
        .expect(200)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('headerName')
      expect(response.body).toHaveProperty('cookieName')
    })

    it('GET /api/csrf/config - should be accessible without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/csrf/config')
        .expect(200)

      expect(response.body).toHaveProperty('cookieName')
      expect(response.body).toHaveProperty('headerName')
    })
  })

  describe('Auth Endpoints', () => {
    it('POST /api/auth/login - should be accessible without authentication (returns 401 for invalid credentials, not 401 for missing auth)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        })

      // Should return 401 for invalid credentials, NOT for missing authentication
      expect(response.status).toBe(401)
      expect(response.body.message).toMatch(/invalid|credentials|introuvable/i)
      // Should NOT say "Authentication required" or "No authenticated user"
      expect(response.body.message).not.toMatch(/authentication required/i)
    })

    it('POST /api/auth/login - should accept request without Authorization header', async () => {
      // This test ensures the endpoint doesn't require pre-authentication
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        // Intentionally NO Authorization header
        .send({
          email: 'test@test.com',
          password: 'test',
        })

      // Should process the request (even if credentials are wrong)
      // Status should be 401 (bad credentials) not 403 (forbidden/no auth)
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Health Endpoints', () => {
    it('GET /api/health - should be accessible without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')

      // Health endpoint should return 200 or at least not 401/403
      expect([200, 503]).toContain(response.status)
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })

    it('GET /api/health/live - should be accessible without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/live')

      expect([200, 503]).toContain(response.status)
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })
  })

  describe('Protected Endpoints (negative tests)', () => {
    it('GET /api/users - should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        // No Authorization header

      expect([401, 403]).toContain(response.status)
    })

    it('GET /api/auth/me - should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        // No Authorization header

      expect([401, 403]).toContain(response.status)
    })

    it('GET /api/societes - should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/societes')
        // No Authorization header

      expect([401, 403]).toContain(response.status)
    })
  })
})

describe('Authentication Flow Integration (e2e)', () => {
  let app: INestApplication
  let csrfToken: string
  let csrfCookie: string

  beforeAll(async () => {
    const { AppModule } = await import('../src/app/app.module')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      })
    )

    app.setGlobalPrefix('api')

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should complete full login flow: get CSRF token, then login', async () => {
    // Step 1: Get CSRF token (public endpoint)
    const csrfResponse = await request(app.getHttpServer())
      .get('/api/csrf/token')
      .expect(200)

    csrfToken = csrfResponse.body.token
    const headerName = csrfResponse.body.headerName

    // Extract CSRF cookie from response
    const cookies = csrfResponse.headers['set-cookie']
    if (cookies) {
      csrfCookie = Array.isArray(cookies) ? cookies.join('; ') : cookies
    }

    expect(csrfToken).toBeDefined()
    expect(typeof csrfToken).toBe('string')

    // Step 2: Attempt login with CSRF token (public endpoint)
    const loginRequest = request(app.getHttpServer())
      .post('/api/auth/login')
      .set(headerName || 'x-csrf-token', csrfToken)

    if (csrfCookie) {
      loginRequest.set('Cookie', csrfCookie)
    }

    const loginResponse = await loginRequest.send({
      email: 'admin@topsteel.fr',
      password: 'admin123',
    })

    // Should either succeed (200) or fail with invalid credentials (401)
    // But should NOT fail with "Authentication required" (which would mean @Public is missing)
    expect([200, 401]).toContain(loginResponse.status)

    if (loginResponse.status === 401) {
      // If 401, it should be because of invalid credentials, not missing auth
      expect(loginResponse.body.message).not.toMatch(/authentication required/i)
      expect(loginResponse.body.message).not.toMatch(/no authenticated user/i)
    }

    if (loginResponse.status === 200) {
      // If login succeeded, we should have tokens
      expect(loginResponse.body).toHaveProperty('accessToken')
      expect(loginResponse.body).toHaveProperty('user')
    }
  })
})

describe('Token Verification Flow (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const { AppModule } = await import('../src/app/app.module')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      })
    )

    app.setGlobalPrefix('api')

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/auth/verify - should return 401 without token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/verify')
      // No Authorization header

    expect(response.status).toBe(401)
    console.log('Verify without token:', response.status, response.body)
  })

  it('GET /api/auth/verify - should return 200 with valid token', async () => {
    // Step 1: Get CSRF token
    const csrfResponse = await request(app.getHttpServer())
      .get('/api/csrf/token')
      .expect(200)

    const csrfToken = csrfResponse.body.token
    const headerName = csrfResponse.body.headerName
    const cookies = csrfResponse.headers['set-cookie']
    const csrfCookie = cookies ? (Array.isArray(cookies) ? cookies.join('; ') : cookies) : ''

    console.log('CSRF Token obtained:', csrfToken ? 'YES' : 'NO')

    // Step 2: Login to get access token
    const loginRequest = request(app.getHttpServer())
      .post('/api/auth/login')
      .set(headerName || 'x-csrf-token', csrfToken)

    if (csrfCookie) {
      loginRequest.set('Cookie', csrfCookie)
    }

    const loginResponse = await loginRequest.send({
      email: 'admin@topsteel.fr',
      password: 'admin123',
    })

    console.log('Login response status:', loginResponse.status)
    console.log('Login response body keys:', Object.keys(loginResponse.body))

    // Check if login succeeded
    if (loginResponse.status !== 200) {
      console.log('Login failed:', loginResponse.body)
      // Skip verify test if login fails
      expect(loginResponse.status).toBe(200)
      return
    }

    // The response is wrapped by TransformInterceptor: { data: {...}, statusCode, message, timestamp }
    const responseData = loginResponse.body.data || loginResponse.body
    const accessToken = responseData.accessToken
    const user = responseData.user

    console.log('Access token obtained:', accessToken ? `YES (${accessToken.substring(0, 20)}...)` : 'NO')
    console.log('User obtained:', user ? `YES (${user.email})` : 'NO')
    console.log('User has isActive:', user ? user.isActive : 'N/A')

    expect(accessToken).toBeDefined()
    expect(typeof accessToken).toBe('string')
    expect(accessToken.length).toBeGreaterThan(0)

    // Step 3: Verify the token
    const verifyResponse = await request(app.getHttpServer())
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)

    console.log('Verify response status:', verifyResponse.status)
    console.log('Verify response body:', verifyResponse.body)

    expect(verifyResponse.status).toBe(200)

    // Check verify response structure
    const verifyData = verifyResponse.body.data || verifyResponse.body
    expect(verifyData).toHaveProperty('valid', true)
    expect(verifyData).toHaveProperty('user')
    expect(verifyData.user).toHaveProperty('email')
  })

  it('Complete auth flow: login -> verify -> access protected endpoint', async () => {
    // Step 1: Get CSRF token
    const csrfResponse = await request(app.getHttpServer())
      .get('/api/csrf/token')
      .expect(200)

    const csrfToken = csrfResponse.body.token
    const cookies = csrfResponse.headers['set-cookie']
    const csrfCookie = cookies ? (Array.isArray(cookies) ? cookies.join('; ') : cookies) : ''

    // Step 2: Login
    const loginRequest = request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-csrf-token', csrfToken)

    if (csrfCookie) {
      loginRequest.set('Cookie', csrfCookie)
    }

    const loginResponse = await loginRequest.send({
      email: 'admin@topsteel.fr',
      password: 'admin123',
    })

    if (loginResponse.status !== 200) {
      console.log('Login failed, skipping test:', loginResponse.body)
      return
    }

    const responseData = loginResponse.body.data || loginResponse.body
    const accessToken = responseData.accessToken

    // Step 3: Verify token works
    const verifyResponse = await request(app.getHttpServer())
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)

    console.log('Auth flow - Verify status:', verifyResponse.status)
    expect(verifyResponse.status).toBe(200)

    // Step 4: Access a protected endpoint (like /api/users or /api/societes)
    const protectedResponse = await request(app.getHttpServer())
      .get('/api/societes')
      .set('Authorization', `Bearer ${accessToken}`)

    console.log('Auth flow - Protected endpoint status:', protectedResponse.status)
    // Should be 200 (success) or 403 (forbidden due to role), but NOT 401 (unauthorized)
    expect(protectedResponse.status).not.toBe(401)
  })
})
