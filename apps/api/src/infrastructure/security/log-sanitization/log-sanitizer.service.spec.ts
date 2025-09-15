/**
 * Tests unitaires pour le service LogSanitizerService
 */
import { Test, type TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'
import { LogSanitizerService } from './log-sanitizer.service'

describe('LogSanitizerService', () => {
  let service: LogSanitizerService

  beforeEach(async () => {
    // Forcer le mode production pour les tests AVANT de créer le service
    process.env.NODE_ENV = 'production'
    process.env.LOG_SANITIZATION_ENABLED = 'true'

    const module: TestingModule = await Test.createTestingModule({
      providers: [LogSanitizerService],
    }).compile()

    service = module.get<LogSanitizerService>(LogSanitizerService)
  })

  afterEach(() => {
    // Restaurer l'environnement
    delete process.env.NODE_ENV
    delete process.env.LOG_SANITIZATION_ENABLED
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('sanitizeLogMessage', () => {
    it('should mask passwords', () => {
      const message = 'User login with password: "secretPassword123"'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('User login with password: "[MASKED]"')
    })

    it('should mask JWT tokens', () => {
      const message =
        'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('Token: eyJ[JWT_TOKEN_MASKED]')
    })

    it('should mask bearer tokens', () => {
      const message = 'Authorization: Bearer abc123def456ghi789'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('Authorization: Bearer [TOKEN_MASKED]')
    })

    it('should mask credit card numbers', () => {
      const message = 'Payment with card 4532015112830366'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('Payment with card [CARD_NUMBER_MASKED]')
    })

    it('should partially mask emails', () => {
      const message = 'User email: john.doe@example.com'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('User email: joh***@example.com')
    })

    it('should mask phone numbers', () => {
      const message = 'Contact: +33123456789'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('Contact: +[PHONE_MASKED]')
    })

    it('should partially mask IP addresses', () => {
      const message = 'Request from 192.168.1.100'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('Request from 192.168.1.***')
    })

    it('should mask sensitive URL parameters', () => {
      const message = 'URL: https://api.example.com?token=abc123&data=test'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('URL: https://api.example.com?token=[MASKED]&data=test')
    })

    it('should mask API keys', () => {
      const message = 'api_key: "sk_test_123456789"'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('api_key: "[MASKED]"')
    })

    it('should mask multiple sensitive data types in one message', () => {
      const message =
        'Login attempt: email=john@test.com, password="secret123", token=eyJhbGciOiJIUzI1NiJ9.test'
      const result = service.sanitizeLogMessage(message)
      expect(result).toContain('email=joh***@test.com')
      expect(result).toContain('password="[MASKED]"')
      expect(result).toContain('token=eyJ[JWT_TOKEN_MASKED]')
    })

    it('should not sanitize in development mode', () => {
      process.env.NODE_ENV = 'development'
      const message = 'Password: secretPassword123'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('Password: secretPassword123')
    })

    it('should not sanitize when disabled', () => {
      process.env.LOG_SANITIZATION_ENABLED = 'false'
      const message = 'Password: secretPassword123'
      const result = service.sanitizeLogMessage(message)
      expect(result).toBe('Password: secretPassword123')
    })
  })

  describe('sanitizeLogObject', () => {
    it('should sanitize object properties', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiJ9.test',
        data: 'normal data',
      }
      const result = service.sanitizeLogObject(obj)
      expect(result.username).toBe('john')
      expect(result.password).toBe('[MASKED]')
      expect(result.token).toBe('[MASKED]')
      expect(result.data).toBe('normal data')
    })

    it('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret123',
            api_key: 'sk_test_123',
          },
        },
        metadata: {
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        },
      }
      const result = service.sanitizeLogObject(obj)
      expect(result.user.credentials.password).toBe('[MASKED]')
      expect(result.user.credentials.api_key).toBe('[MASKED]')
      expect(result.metadata.ip).toBe('192.168.1.***')
    })

    it('should sanitize arrays', () => {
      const obj = {
        tokens: ['eyJhbGciOiJIUzI1NiJ9.test1', 'eyJhbGciOiJIUzI1NiJ9.test2'],
        passwords: ['secret1', 'secret2'],
      }
      const result = service.sanitizeLogObject(obj)
      // Debug: test what's actually in the array
      expect(Array.isArray(result.tokens)).toBe(true)
      expect(result.tokens).toHaveLength(2)
      expect(result.tokens[0]).toBe('eyJ[JWT_TOKEN_MASKED]')
      expect(result.tokens[1]).toBe('eyJ[JWT_TOKEN_MASKED]')
      expect(result.passwords[0]).toBe('secret1') // String dans array, pas de clé sensible
    })

    it('should handle null and undefined values', () => {
      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        password: 'secret',
      }
      const result = service.sanitizeLogObject(obj)
      expect(result.nullValue).toBeNull()
      expect(result.undefinedValue).toBeUndefined()
      expect(result.emptyString).toBe('')
      expect(result.password).toBe('[MASKED]')
    })
  })

  describe('isSensitiveKey', () => {
    it('should identify sensitive keys', () => {
      const sensitiveKeys = [
        'password',
        'pwd',
        'secret',
        'token',
        'key',
        'authorization',
        'auth',
        'bearer',
        'jwt',
        'apikey',
        'api_key',
        'session_id',
        'sessionid',
        'cvv',
        'cvc',
        'security_code',
        'private_key',
        'client_secret',
        'refresh_token',
        'access_token',
      ]

      sensitiveKeys.forEach((key) => {
        expect(
          (service as unknown as { isSensitiveKey: (key: string) => boolean }).isSensitiveKey(key)
        ).toBe(true)
        expect(
          (service as unknown as { isSensitiveKey: (key: string) => boolean }).isSensitiveKey(
            key.toUpperCase()
          )
        ).toBe(true)
      })
    })

    it('should not flag non-sensitive keys', () => {
      const normalKeys = ['username', 'email', 'name', 'data', 'id', 'timestamp']
      normalKeys.forEach((key) => {
        expect(
          (service as unknown as { isSensitiveKey: (key: string) => boolean }).isSensitiveKey(key)
        ).toBe(false)
      })
    })
  })

  describe('temporaryBypass', () => {
    it('should temporarily disable sanitization in production', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      service.temporaryBypass(1000, 'Testing bypass functionality')

      // Vérifier que la sanitisation est désactivée
      expect(process.env.LOG_SANITIZATION_ENABLED).toBe('false')

      consoleWarnSpy.mockRestore()
    })

    it('should ignore bypass request in development', () => {
      process.env.NODE_ENV = 'development'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      service.temporaryBypass(1000, 'Should be ignored')

      expect(process.env.LOG_SANITIZATION_ENABLED).toBe('true')

      consoleWarnSpy.mockRestore()
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const stats = service.getStats()
      expect(stats).toEqual({
        isEnabled: true,
        isProduction: true,
        rulesCount: expect.any(Number),
        auditEnabled: false,
      })
      expect(stats.rulesCount).toBeGreaterThan(10) // Nous avons plusieurs règles
    })
  })

  describe('Performance tests', () => {
    it('should handle large messages efficiently', () => {
      const largeMessage = 'password=secret123 '.repeat(1000)
      const startTime = Date.now()
      const result = service.sanitizeLogMessage(largeMessage)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Moins de 100ms
      expect(result).toContain('[MASKED]')
    })

    it('should handle deep nested objects', () => {
      const deepObj = { level1: { level2: { level3: { password: 'secret' } } } }
      const result = service.sanitizeLogObject(deepObj)
      expect(result.level1.level2.level3.password).toBe('[MASKED]')
    })
  })
})
