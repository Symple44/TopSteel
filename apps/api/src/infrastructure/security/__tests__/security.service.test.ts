import 'reflect-metadata'
import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock crypto for testing
vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(),
  }),
  createHmac: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(),
  }),
  timingSafeEqual: vi.fn(),
  scrypt: vi.fn(),
  randomInt: vi.fn(),
}))

// Import after mock is defined
import * as crypto from 'crypto'
import { SecurityService } from '../security.service'

const mockCrypto = vi.mocked(crypto)

interface MockConfigService {
  get: ReturnType<typeof vi.fn>
}

describe('SecurityService', () => {
  let service: SecurityService
  let _configService: MockConfigService
  let mockConfigService: { get: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    mockConfigService = {
      get: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<SecurityService>(SecurityService)
    _configService = module.get<ConfigService>(ConfigService) as unknown as MockConfigService
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should initialize with default configuration', () => {
      mockConfigService.get
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('your-secret-key') // SECRET_KEY
        .mockReturnValueOnce('your-encryption-key') // ENCRYPTION_KEY

      expect(service).toBeDefined()
    })
  })

  describe('Hash Generation', () => {
    it('should generate SHA-256 hash', () => {
      const testData = 'test-data'
      const expectedHash = 'hashed-value'

      mockCrypto.createHash().digest.mockReturnValue(expectedHash)

      const result = service.generateHash(testData)

      expect(mockCrypto.createHash).toHaveBeenCalledWith('sha256')
      expect(mockCrypto.createHash().update).toHaveBeenCalledWith(testData)
      expect(mockCrypto.createHash().digest).toHaveBeenCalledWith('hex')
      expect(result).toBe(expectedHash)
    })

    it('should generate hash with custom algorithm', () => {
      const testData = 'test-data'
      const algorithm = 'sha512'
      const expectedHash = 'sha512-hash'

      mockCrypto.createHash().digest.mockReturnValue(expectedHash)

      const result = service.generateHash(testData, algorithm)

      expect(mockCrypto.createHash).toHaveBeenCalledWith(algorithm)
      expect(result).toBe(expectedHash)
    })

    it('should handle empty string input', () => {
      const expectedHash = 'empty-hash'
      mockCrypto.createHash().digest.mockReturnValue(expectedHash)

      const result = service.generateHash('')

      expect(result).toBe(expectedHash)
    })
  })

  describe('HMAC Generation', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-secret-key')
    })

    it('should generate HMAC with secret key', () => {
      const testData = 'test-message'
      const expectedHmac = 'hmac-signature'

      mockCrypto.createHmac().digest.mockReturnValue(expectedHmac)

      const result = service.generateHmac(testData)

      expect(mockCrypto.createHmac).toHaveBeenCalledWith('sha256', 'test-secret-key')
      expect(mockCrypto.createHmac().update).toHaveBeenCalledWith(testData)
      expect(mockCrypto.createHmac().digest).toHaveBeenCalledWith('hex')
      expect(result).toBe(expectedHmac)
    })

    it('should generate HMAC with custom secret', () => {
      const testData = 'test-message'
      const customSecret = 'custom-secret'
      const expectedHmac = 'custom-hmac'

      mockCrypto.createHmac().digest.mockReturnValue(expectedHmac)

      const result = service.generateHmac(testData, customSecret)

      expect(mockCrypto.createHmac).toHaveBeenCalledWith('sha256', customSecret)
      expect(result).toBe(expectedHmac)
    })

    it('should verify HMAC signature correctly', () => {
      const testData = 'test-message'
      const signature = 'expected-signature'

      mockCrypto.createHmac().digest.mockReturnValue(signature)
      mockCrypto.timingSafeEqual.mockReturnValue(true)

      const result = service.verifyHmac(testData, signature)

      expect(mockCrypto.timingSafeEqual).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should reject invalid HMAC signature', () => {
      const testData = 'test-message'
      const validSignature = 'valid-signature'
      const invalidSignature = 'invalid-signature'

      mockCrypto.createHmac().digest.mockReturnValue(validSignature)
      mockCrypto.timingSafeEqual.mockReturnValue(false)

      const result = service.verifyHmac(testData, invalidSignature)

      expect(result).toBe(false)
    })
  })

  describe('Secure Token Generation', () => {
    it('should generate secure random token', () => {
      const tokenLength = 32
      const randomBytes = Buffer.from('random-bytes')
      const expectedToken = 'random-token-hex'

      mockCrypto.randomBytes.mockReturnValue(randomBytes)
      randomBytes.toString = vi.fn().mockReturnValue(expectedToken)

      const result = service.generateSecureToken(tokenLength)

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(tokenLength)
      expect(result).toBe(expectedToken)
    })

    it('should generate token with default length', () => {
      const randomBytes = Buffer.from('default-random-bytes')
      const expectedToken = 'default-token'

      mockCrypto.randomBytes.mockReturnValue(randomBytes)
      randomBytes.toString = vi.fn().mockReturnValue(expectedToken)

      const result = service.generateSecureToken()

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32) // Default length
      expect(result).toBe(expectedToken)
    })

    it('should generate different tokens on successive calls', () => {
      const token1Bytes = Buffer.from('bytes1')
      const token2Bytes = Buffer.from('bytes2')

      mockCrypto.randomBytes.mockReturnValueOnce(token1Bytes).mockReturnValueOnce(token2Bytes)

      token1Bytes.toString = vi.fn().mockReturnValue('token1')
      token2Bytes.toString = vi.fn().mockReturnValue('token2')

      const result1 = service.generateSecureToken()
      const result2 = service.generateSecureToken()

      expect(result1).not.toBe(result2)
      expect(result1).toBe('token1')
      expect(result2).toBe('token2')
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>'
      const _expectedOutput = 'Safe content'

      const result = service.sanitizeInput(maliciousInput)

      // Should remove script tags but keep safe HTML
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
      expect(result).toContain('Safe content')
    })

    it('should handle empty input', () => {
      const result = service.sanitizeInput('')
      expect(result).toBe('')
    })

    it('should handle null/undefined input', () => {
      expect(service.sanitizeInput(null as unknown)).toBe('')
      expect(service.sanitizeInput(undefined as unknown)).toBe('')
    })

    it('should preserve safe HTML content', () => {
      const safeInput = '<p>This is safe content</p><strong>Bold text</strong>'

      const result = service.sanitizeInput(safeInput)

      expect(result).toContain('This is safe content')
      expect(result).toContain('Bold text')
    })

    it('should remove dangerous attributes', () => {
      const inputWithBadAttrs = '<div onclick="alert(1)" style="color:red;">Content</div>'

      const result = service.sanitizeInput(inputWithBadAttrs)

      expect(result).not.toContain('onclick')
      expect(result).toContain('Content')
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should escape SQL special characters', () => {
      const maliciousInput = "'; DROP TABLE users; --"

      const result = service.escapeSqlInput(maliciousInput)

      expect(result).not.toContain("';")
      expect(result).not.toContain('DROP TABLE')
      expect(result).not.toContain('--')
    })

    it('should handle normal text input', () => {
      const normalInput = 'John Doe'

      const result = service.escapeSqlInput(normalInput)

      expect(result).toBe('John Doe')
    })

    it('should validate SQL parameters', () => {
      const validParams = { id: 123, name: 'John' }
      const invalidParams = { id: "'; DROP TABLE", name: 'John' }

      expect(service.validateSqlParameters(validParams)).toBe(true)
      expect(service.validateSqlParameters(invalidParams)).toBe(false)
    })
  })

  describe('Rate Limiting Helpers', () => {
    it('should generate rate limit key', () => {
      const ip = '192.168.1.1'
      const endpoint = '/api/login'

      const result = service.generateRateLimitKey(ip, endpoint)

      expect(result).toContain(ip)
      expect(result).toContain(endpoint)
    })

    it('should check if request should be rate limited', () => {
      const currentCount = 5
      const limit = 10
      const timeWindow = 60000 // 1 minute

      const shouldLimit = service.shouldRateLimit(currentCount, limit, timeWindow)

      expect(shouldLimit).toBe(false) // Under limit
    })

    it('should rate limit when over threshold', () => {
      const currentCount = 15
      const limit = 10
      const timeWindow = 60000

      const shouldLimit = service.shouldRateLimit(currentCount, limit, timeWindow)

      expect(shouldLimit).toBe(true) // Over limit
    })
  })

  describe('Password Security', () => {
    it('should validate password strength', () => {
      const strongPassword = 'StrongPass123!@#'
      const weakPassword = 'weak'

      expect(service.validatePasswordStrength(strongPassword)).toBe(true)
      expect(service.validatePasswordStrength(weakPassword)).toBe(false)
    })

    it('should require minimum password criteria', () => {
      const passwords = [
        'Short1!', // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!', // No numbers
        'NoSpecialChars123', // No special chars
        'ValidPassword123!', // Valid
      ]

      const results = passwords.map((pwd) => service.validatePasswordStrength(pwd))

      expect(results[0]).toBe(false) // Too short
      expect(results[1]).toBe(false) // No uppercase
      expect(results[2]).toBe(false) // No lowercase
      expect(results[3]).toBe(false) // No numbers
      expect(results[4]).toBe(false) // No special chars
      expect(results[5]).toBe(true) // Valid
    })
  })

  describe('Session Security', () => {
    it('should generate secure session ID', () => {
      const sessionBytes = Buffer.from('session-random-bytes')
      const expectedSessionId = 'secure-session-id'

      mockCrypto.randomBytes.mockReturnValue(sessionBytes)
      sessionBytes.toString = vi.fn().mockReturnValue(expectedSessionId)

      const result = service.generateSessionId()

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32)
      expect(result).toBe(expectedSessionId)
    })

    it('should validate session format', () => {
      const validSession = 'a'.repeat(64) // 64 hex chars
      const invalidSession = 'invalid-session'

      expect(service.validateSessionId(validSession)).toBe(true)
      expect(service.validateSessionId(invalidSession)).toBe(false)
    })

    it('should check if session is expired', () => {
      const currentTime = Date.now()
      const validSession = { createdAt: currentTime - 30000, maxAge: 60000 } // 30s ago, 1min max
      const expiredSession = { createdAt: currentTime - 90000, maxAge: 60000 } // 90s ago, 1min max

      expect(service.isSessionExpired(validSession)).toBe(false)
      expect(service.isSessionExpired(expiredSession)).toBe(true)
    })
  })

  describe('IP Address Security', () => {
    it('should validate IP address format', () => {
      const validIPs = ['192.168.1.1', '10.0.0.1', '127.0.0.1']
      const invalidIPs = ['invalid', '999.999.999.999', '']

      validIPs.forEach((ip) => {
        expect(service.validateIpAddress(ip)).toBe(true)
      })

      invalidIPs.forEach((ip) => {
        expect(service.validateIpAddress(ip)).toBe(false)
      })
    })

    it('should check if IP is in allowed range', () => {
      const allowedRanges = ['192.168.1.0/24', '10.0.0.0/8']
      const testIPs = [
        '192.168.1.100', // Allowed
        '10.5.10.15', // Allowed
        '172.16.1.1', // Not allowed
      ]

      expect(service.isIpAllowed(testIPs[0], allowedRanges)).toBe(true)
      expect(service.isIpAllowed(testIPs[1], allowedRanges)).toBe(true)
      expect(service.isIpAllowed(testIPs[2], allowedRanges)).toBe(false)
    })
  })

  describe('Security Headers', () => {
    it('should generate security headers', () => {
      const headers = service.getSecurityHeaders()

      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff')
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY')
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block')
      expect(headers).toHaveProperty('Strict-Transport-Security')
      expect(headers).toHaveProperty('Content-Security-Policy')
    })

    it('should generate CSP header with nonce', () => {
      const nonce = 'random-nonce-value'
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('nonce-bytes'))
      Buffer.from('nonce-bytes').toString = vi.fn().mockReturnValue(nonce)

      const csp = service.generateCSPHeader()

      expect(csp).toContain(`'nonce-${nonce}'`)
      expect(csp).toContain("default-src 'self'")
    })
  })

  describe('Error Handling', () => {
    it('should handle crypto errors gracefully', () => {
      mockCrypto.randomBytes.mockImplementation(() => {
        throw new Error('Crypto error')
      })

      expect(() => service.generateSecureToken()).toThrow('Crypto error')
    })

    it('should handle hash errors gracefully', () => {
      mockCrypto.createHash.mockImplementation(() => {
        throw new Error('Hash error')
      })

      expect(() => service.generateHash('test')).toThrow('Hash error')
    })

    it('should handle HMAC errors gracefully', () => {
      mockCrypto.createHmac.mockImplementation(() => {
        throw new Error('HMAC error')
      })

      expect(() => service.generateHmac('test')).toThrow('HMAC error')
    })
  })
})
