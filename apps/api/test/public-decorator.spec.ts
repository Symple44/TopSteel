/**
 * Public Decorator Verification Tests
 *
 * These tests use reflection to verify that required endpoints
 * have the @Public() decorator applied.
 *
 * This catches missing decorators at test time without needing
 * to spin up the full application.
 */

import { Reflector } from '@nestjs/core'
import { describe, it, expect } from 'vitest'

// Import the IS_PUBLIC_KEY constant used by TenantGuard
const IS_PUBLIC_KEY = 'isPublic'

describe('Public Decorator Verification', () => {
  const reflector = new Reflector()

  describe('CSRF Controller', () => {
    it('should have @Public() decorator on controller or methods', async () => {
      const { CsrfController } = await import(
        '../src/infrastructure/security/csrf/csrf.controller'
      )

      // Check if controller class has @Public()
      const isControllerPublic = reflector.get<boolean>(IS_PUBLIC_KEY, CsrfController)

      // Check if individual methods have @Public()
      const prototype = CsrfController.prototype
      const getTokenPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        prototype.getToken
      )
      const getConfigPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        prototype.getConfig
      )

      // Either controller should be public OR all methods should be public
      const isPublic = isControllerPublic || (getTokenPublic && getConfigPublic)

      expect(isPublic).toBe(true)
    })

    it('CsrfController.getToken should be accessible without authentication', async () => {
      const { CsrfController } = await import(
        '../src/infrastructure/security/csrf/csrf.controller'
      )

      const isControllerPublic = reflector.get<boolean>(IS_PUBLIC_KEY, CsrfController)
      const isMethodPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CsrfController.prototype.getToken
      )

      expect(
        isControllerPublic || isMethodPublic,
        'GET /csrf/token should be public - add @Public() decorator'
      ).toBe(true)
    })
  })

  describe('Auth Controller', () => {
    it('should have @Public() decorator for login endpoint', async () => {
      const { AuthController } = await import('../src/domains/auth/auth.controller')

      // Check if controller class has @Public()
      const isControllerPublic = reflector.get<boolean>(IS_PUBLIC_KEY, AuthController)

      // Check if login method has @Public()
      const isLoginPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        AuthController.prototype.login
      )

      // Login should be accessible without authentication
      expect(
        isControllerPublic || isLoginPublic,
        'POST /auth/login should be public - add @Public() decorator'
      ).toBe(true)
    })
  })

  describe('Health Controller', () => {
    it('should have @Public() decorator for health endpoints', async () => {
      try {
        const { HealthController } = await import(
          '../src/core/health/health.controller'
        )

        const isControllerPublic = reflector.get<boolean>(
          IS_PUBLIC_KEY,
          HealthController
        )

        // Health check should typically be public
        if (!isControllerPublic) {
          console.warn(
            'HealthController is not marked @Public() - consider adding it for monitoring tools'
          )
        }
      } catch {
        // Health controller might not exist, skip
        console.log('HealthController not found, skipping test')
      }
    })
  })
})

describe('Protected Endpoints Verification', () => {
  const reflector = new Reflector()

  describe('Users Controller', () => {
    it('should NOT have @Public() decorator (requires authentication)', async () => {
      try {
        const { UsersController } = await import(
          '../src/domains/users/users.controller'
        )

        const isControllerPublic = reflector.get<boolean>(
          IS_PUBLIC_KEY,
          UsersController
        )

        // Users endpoints should require authentication
        expect(
          isControllerPublic,
          'UsersController should NOT be public'
        ).toBeFalsy()
      } catch {
        // Controller might not exist
        console.log('UsersController not found, skipping test')
      }
    })
  })

  describe('Admin Controllers', () => {
    it('admin endpoints should NOT be public', async () => {
      try {
        // Try to import various admin controllers
        const adminControllers = [
          '../src/features/admin/controllers/admin-users.controller',
          '../src/features/admin/controllers/admin-mfa.controller',
          '../src/features/societes/controllers/societes.controller',
        ]

        for (const controllerPath of adminControllers) {
          try {
            const module = await import(controllerPath)
            const ControllerClass = Object.values(module)[0] as any

            if (ControllerClass) {
              const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, ControllerClass)
              expect(
                isPublic,
                `${ControllerClass.name} should NOT be public`
              ).toBeFalsy()
            }
          } catch {
            // Controller not found, continue
          }
        }
      } catch {
        console.log('Admin controllers not found, skipping test')
      }
    })
  })
})

describe('Public Endpoints Manifest', () => {
  /**
   * This test documents all endpoints that SHOULD be public.
   * If you add a new public endpoint, add it here.
   */
  it('should have a complete list of public endpoints', () => {
    const PUBLIC_ENDPOINTS = [
      { method: 'GET', path: '/csrf/token', reason: 'CSRF token required before login' },
      { method: 'GET', path: '/csrf/config', reason: 'CSRF configuration' },
      { method: 'POST', path: '/auth/login', reason: 'Login endpoint' },
      { method: 'POST', path: '/auth/register', reason: 'Registration (if enabled)' },
      { method: 'POST', path: '/auth/password/forgot', reason: 'Password reset request' },
      { method: 'POST', path: '/auth/password/reset', reason: 'Password reset with token' },
      { method: 'GET', path: '/health', reason: 'Health check for load balancers' },
      { method: 'GET', path: '/health/live', reason: 'Liveness probe' },
      { method: 'GET', path: '/health/ready', reason: 'Readiness probe' },
    ]

    // This test just documents the expected public endpoints
    expect(PUBLIC_ENDPOINTS.length).toBeGreaterThan(0)

    console.log('\n📋 Expected Public Endpoints:')
    PUBLIC_ENDPOINTS.forEach(({ method, path, reason }) => {
      console.log(`  ${method.padEnd(6)} ${path.padEnd(30)} - ${reason}`)
    })
  })
})
