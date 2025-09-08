import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CsrfMiddleware } from './csrf.middleware'
import { CsrfService } from './csrf.service'

describe('CSRF Protection', () => {
  let csrfService: CsrfService
  let csrfMiddleware: CsrfMiddleware
  let configService: ConfigService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CsrfService,
        CsrfMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              switch (key) {
                case 'NODE_ENV':
                  return 'test'
                case 'CSRF_SECRET':
                  return 'test-secret-key-for-csrf-protection-123'
                case 'CSRF_COOKIE_NAME':
                  return '_csrf'
                case 'CSRF_HEADER_NAME':
                  return 'x-csrf-token'
                case 'CSRF_VALUE_NAME':
                  return '_csrf'
                default:
                  return undefined
              }
            }),
          },
        },
      ],
    }).compile()

    csrfService = module.get<CsrfService>(CsrfService)
    csrfMiddleware = module.get<CsrfMiddleware>(CsrfMiddleware)
    configService = module.get<ConfigService>(ConfigService)
  })

  describe('CsrfService', () => {
    describe('token generation', () => {
      it('should generate valid tokens', () => {
        const req = { cookies: {} } as Request
        const tokens = csrfService.generateTokens(req)

        expect(tokens).toHaveProperty('secret')
        expect(tokens).toHaveProperty('token')
        expect(typeof tokens.secret).toBe('string')
        expect(typeof tokens.token).toBe('string')
        expect(tokens.secret.length).toBeGreaterThan(0)
        expect(tokens.token.length).toBeGreaterThan(0)
      })

      it('should generate different tokens each time', () => {
        const req = { cookies: {} } as Request
        const tokens1 = csrfService.generateTokens(req)
        const tokens2 = csrfService.generateTokens(req)

        expect(tokens1.token).not.toBe(tokens2.token)
        expect(tokens1.secret).not.toBe(tokens2.secret)
      })
    })

    describe('token validation', () => {
      it('should validate correct tokens', () => {
        const req = {
          cookies: {},
          get: vi.fn(),
          body: {},
          query: {},
        } as unknown as Request

        const tokens = csrfService.generateTokens(req)

        // Mock the request with valid token
        ;(req.get as ReturnType<typeof vi.fn>).mockImplementation((header: string) => {
          if (header === 'x-csrf-token') return tokens.token
          return undefined
        })
        req.cookies = { _csrf: tokens.secret }

        const isValid = csrfService.validateToken(req)
        expect(isValid).toBe(true)
      })

      it('should reject invalid tokens', () => {
        const req = {
          cookies: { _csrf: 'invalid-secret' },
          get: vi.fn(() => 'invalid-token'),
          body: {},
          query: {},
        } as unknown as Request

        const isValid = csrfService.validateToken(req)
        expect(isValid).toBe(false)
      })

      it('should reject missing tokens', () => {
        const req = {
          cookies: {},
          get: vi.fn(() => undefined),
          body: {},
          query: {},
        } as unknown as Request

        const isValid = csrfService.validateToken(req)
        expect(isValid).toBe(false)
      })
    })

    describe('route protection rules', () => {
      it('should protect POST routes by default', () => {
        const req = { method: 'POST', path: '/api/users' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(true)
      })

      it('should protect PUT routes by default', () => {
        const req = { method: 'PUT', path: '/api/users/1' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(true)
      })

      it('should protect PATCH routes by default', () => {
        const req = { method: 'PATCH', path: '/api/users/1' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(true)
      })

      it('should protect DELETE routes by default', () => {
        const req = { method: 'DELETE', path: '/api/users/1' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(true)
      })

      it('should not protect GET routes', () => {
        const req = { method: 'GET', path: '/api/users' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(false)
      })

      it('should not protect login routes', () => {
        const req = { method: 'POST', path: '/api/auth/login' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(false)
      })

      it('should not protect refresh routes', () => {
        const req = { method: 'POST', path: '/api/auth/refresh' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(false)
      })

      it('should not protect webhook routes', () => {
        const req = { method: 'POST', path: '/api/webhooks/stripe' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(false)
      })

      it('should not protect health check routes', () => {
        const req = { method: 'POST', path: '/api/health' } as Request
        expect(csrfService.shouldProtectRoute(req)).toBe(false)
      })
    })

    describe('cookie management', () => {
      it('should set CSRF cookies correctly', () => {
        const req = { cookies: {} } as Request
        const res = {
          cookie: vi.fn(),
          setHeader: vi.fn(),
        } as unknown as Response

        csrfService.setCsrfCookies(req, res)

        expect(res.cookie).toHaveBeenCalledTimes(2)
        expect(res.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String))

        const cookieCalls = (res.cookie as ReturnType<typeof vi.fn>).mock.calls
        expect(cookieCalls[0][0]).toBe('_csrf') // secret cookie
        expect(cookieCalls[1][0]).toBe('_csrf-token') // token cookie
        expect(cookieCalls[0][2]).toHaveProperty('httpOnly', true) // secret should be httpOnly
        expect(cookieCalls[1][2]).toHaveProperty('httpOnly', false) // token should be accessible
      })
    })

    describe('token extraction', () => {
      it('should extract token from headers', () => {
        const req = {
          get: vi.fn((header: string) => {
            if (header === 'x-csrf-token') return 'header-token'
            return undefined
          }),
          body: {},
          query: {},
        } as unknown as Request

        const token = csrfService.extractTokenFromRequest(req)
        expect(token).toBe('header-token')
      })

      it('should extract token from body', () => {
        const req = {
          get: vi.fn(() => undefined),
          body: { _csrf: 'body-token' },
          query: {},
        } as unknown as Request

        const token = csrfService.extractTokenFromRequest(req)
        expect(token).toBe('body-token')
      })

      it('should extract token from query', () => {
        const req = {
          get: vi.fn(() => undefined),
          body: {},
          query: { _csrf: 'query-token' },
        } as unknown as Request

        const token = csrfService.extractTokenFromRequest(req)
        expect(token).toBe('query-token')
      })

      it('should prioritize header over body and query', () => {
        const req = {
          get: vi.fn((header: string) => {
            if (header === 'x-csrf-token') return 'header-token'
            return undefined
          }),
          body: { _csrf: 'body-token' },
          query: { _csrf: 'query-token' },
        } as unknown as Request

        const token = csrfService.extractTokenFromRequest(req)
        expect(token).toBe('header-token')
      })
    })
  })

  describe('CsrfMiddleware', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: ReturnType<typeof vi.fn>

    beforeEach(() => {
      req = {
        method: 'POST',
        path: '/api/users',
        ip: '127.0.0.1',
        get: vi.fn(),
        cookies: {},
        body: {},
        query: {},
      }
      res = {
        cookie: vi.fn(),
        setHeader: vi.fn(),
      }
      next = vi.fn()
    })

    it('should allow GET requests without CSRF validation', () => {
      req.method = 'GET'

      csrfMiddleware.use(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(res.setHeader).toHaveBeenCalled() // Should set new tokens
    })

    it('should block POST requests without CSRF token', () => {
      expect(() => {
        csrfMiddleware.use(req as Request, res as Response, next)
      }).toThrow(BadRequestException)

      expect(next).not.toHaveBeenCalled()
    })

    it('should block POST requests with invalid CSRF token', () => {
      ;(req.get as ReturnType<typeof vi.fn>).mockReturnValue('invalid-token')
      req.cookies = { _csrf: 'invalid-secret' }

      expect(() => {
        csrfMiddleware.use(req as Request, res as Response, next)
      }).toThrow(ForbiddenException)

      expect(next).not.toHaveBeenCalled()
    })

    it('should allow POST requests with valid CSRF token', () => {
      // Generate valid tokens first
      const tokens = csrfService.generateTokens(req as Request)

      // Mock request with valid token
      ;(req.get as ReturnType<typeof vi.fn>).mockImplementation((header: string) => {
        if (header === 'x-csrf-token') return tokens.token
        return undefined
      })
      req.cookies = { _csrf: tokens.secret }

      csrfMiddleware.use(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })

    it('should skip CSRF validation for excluded routes', () => {
      req.path = '/api/auth/login'

      csrfMiddleware.use(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = csrfService.getConfiguration()

      expect(config).toHaveProperty('cookieName', '_csrf')
      expect(config).toHaveProperty('headerName', 'x-csrf-token')
      expect(config).toHaveProperty('valueName', '_csrf')
      expect(config).toHaveProperty('isProduction', false)
      expect(config).toHaveProperty('cookieOptions')
      expect(config.cookieOptions).toHaveProperty('httpOnly', true)
      expect(config.cookieOptions).toHaveProperty('secure', false) // test environment
      expect(config.cookieOptions).toHaveProperty('sameSite', 'lax')
    })

    it('should use secure cookies in production', () => {
      // Mock production environment
      ;(configService.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production'
        return 'test-value'
      })

      // Create new service instance for production config
      const prodCsrfService = new CsrfService(configService)
      const config = prodCsrfService.getConfiguration()

      expect(config.isProduction).toBe(true)
      expect(config.cookieOptions?.secure).toBe(true)
      expect(config.cookieOptions?.sameSite).toBe('strict')
    })
  })
})
