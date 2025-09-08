/**
 * Tests unitaires pour SanitizedLoggingInterceptor
 */

import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { of, throwError } from 'rxjs'
import { LogSanitizerService } from './log-sanitizer.service'
import { SanitizedLoggingInterceptor } from './sanitized-logging.interceptor'

describe('SanitizedLoggingInterceptor', () => {
  let interceptor: SanitizedLoggingInterceptor
  let logSanitizerService: LogSanitizerService
  let mockExecutionContext: ExecutionContext
  let mockCallHandler: CallHandler
  let mockRequest: any

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SanitizedLoggingInterceptor,
        {
          provide: LogSanitizerService,
          useValue: {
            sanitizeLogMessage: jest.fn((msg) => msg.replace(/password=\w+/g, 'password=[MASKED]')),
            sanitizeLogObject: jest.fn((obj) => ({
              ...obj,
              password: obj.password ? '[MASKED]' : obj.password,
            })),
          },
        },
      ],
    }).compile()

    interceptor = module.get<SanitizedLoggingInterceptor>(SanitizedLoggingInterceptor)
    logSanitizerService = module.get<LogSanitizerService>(LogSanitizerService)

    // Mock request object
    mockRequest = {
      method: 'POST',
      url: '/api/v1/auth/login',
      ip: '192.168.1.100',
      headers: {
        authorization: 'Bearer token123',
        'user-agent': 'Mozilla/5.0',
        'x-request-id': 'req_123',
      },
      body: {
        username: 'testuser',
        password: 'secret123',
      },
      query: {
        redirect: '/dashboard',
      },
      cookies: {
        session: 'session_123',
      },
      user: {
        id: 'user_123',
      },
    }

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as unknown

    // Mock console/logger
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(interceptor).toBeDefined()
  })

  describe('successful request', () => {
    beforeEach(() => {
      ;(mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ data: 'success', userId: 'user_123' })
      )
    })

    it('should log request and response data', (done) => {
      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ data: 'success', userId: 'user_123' })

          // Vérifier que le logger a été appelé
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              requestId: 'req_123',
              userId: 'user_123',
              method: 'POST',
              status: 'success',
              responseTime: expect.any(Number),
              type: 'http_request_success',
            })
          )
          done()
        },
      })
    })

    it('should sanitize sensitive data in logs', (done) => {
      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          // Vérifier que les méthodes de sanitisation ont été appelées
          expect(logSanitizerService.sanitizeLogMessage).toHaveBeenCalled()
          expect(logSanitizerService.sanitizeLogObject).toHaveBeenCalled()

          // Vérifier que le body a été sanitisé
          const logCall = loggerSpy.mock.calls[0][0]
          expect(logCall.body.password).toBe('[MASKED]')

          done()
        },
      })
    })

    it('should extract user ID from request.user', (done) => {
      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0]
          expect(logCall.userId).toBe('user_123')
          done()
        },
      })
    })

    it('should extract user ID from JWT token in authorization header', (done) => {
      // Modifier la requête pour ne pas avoir user mais avoir un token JWT
      mockRequest.user = undefined
      mockRequest.headers.authorization =
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ1NiJ9.test'

      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0]
          expect(logCall.userId).toBe('user_456')
          done()
        },
      })
    })

    it('should handle missing user ID gracefully', (done) => {
      mockRequest.user = undefined
      mockRequest.headers.authorization = undefined

      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0]
          expect(logCall.userId).toBeUndefined()
          done()
        },
      })
    })

    it('should generate request ID if not present', (done) => {
      mockRequest.headers['x-request-id'] = undefined

      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0]
          expect(logCall.requestId).toMatch(/^req_\d+$/)
          done()
        },
      })
    })
  })

  describe('error handling', () => {
    const mockError = new Error('Test error with password=secret123')
    mockError.stack = 'Error stack trace with token=abc123'

    beforeEach(() => {
      ;(mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => mockError))
    })

    it('should log error and sanitize sensitive data', (done) => {
      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'error')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (error) => {
          expect(error).toBe(mockError)

          // Vérifier que l'erreur a été loggée
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              status: 'error',
              error: expect.any(String),
              errorType: 'Error',
              responseTime: expect.any(Number),
              type: 'http_request_error',
            })
          )

          // Vérifier que les données sensibles ont été sanitissées
          expect(logSanitizerService.sanitizeLogMessage).toHaveBeenCalledWith(mockError.message)
          expect(logSanitizerService.sanitizeLogMessage).toHaveBeenCalledWith(mockError.stack)

          done()
        },
      })
    })

    it('should rethrow the original error', (done) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (error) => {
          expect(error).toBe(mockError)
          done()
        },
      })
    })
  })

  describe('IP address sanitization', () => {
    beforeEach(() => {
      ;(mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }))
    })

    it('should sanitize IP addresses when enabled', (done) => {
      process.env.LOG_MASK_IP_ADDRESSES = 'true'

      const _loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          // Vérifier que sanitizeLogMessage a été appelé avec l'IP
          expect(logSanitizerService.sanitizeLogMessage).toHaveBeenCalledWith('192.168.1.100')
          done()
        },
      })
    })

    it('should not sanitize IP addresses when disabled', (done) => {
      process.env.LOG_MASK_IP_ADDRESSES = 'false'

      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0]
          expect(logCall.ip).toBe('192.168.1.100')
          done()
        },
      })
    })
  })

  describe('performance', () => {
    beforeEach(() => {
      ;(mockCallHandler.handle as jest.Mock).mockReturnValue(of({ data: 'test' }))
    })

    it('should measure response time accurately', (done) => {
      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')
      const startTime = Date.now()

      setTimeout(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => {
            const logCall = loggerSpy.mock.calls[0][0]
            const responseTime = logCall.responseTime
            const actualTime = Date.now() - startTime

            // Le temps de réponse devrait être proche du temps réel (± 10ms)
            expect(responseTime).toBeGreaterThanOrEqual(10)
            expect(responseTime).toBeLessThan(actualTime + 10)

            done()
          },
        })
      }, 10)
    })

    it('should handle large response data', (done) => {
      const largeData = { data: 'x'.repeat(10000) }
      ;(mockCallHandler.handle as jest.Mock).mockReturnValue(of(largeData))

      const loggerSpy = jest.spyOn((interceptor as unknown).logger, 'log')

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0]
          expect(logCall.responseSize).toBeGreaterThan(0)
          done()
        },
      })
    })
  })
})
