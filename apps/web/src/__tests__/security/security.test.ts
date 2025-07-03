/**
 * 🔒 TESTS DE SÉCURITÉ
 */
import { SecurityUtils } from '@/lib/security-enhanced'
import { SecurityUtils } from '@/lib/security/security-enhanced'

describe('SecurityUtils', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const malicious = '<div>Safe content</div><script>alert("xss")</script>'
      const sanitized = SecurityUtils.sanitizeHtmlHtmlHtml(malicious)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).toContain('Safe content')
    })

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert()">Click me</div>'
      const sanitized = SecurityUtils.sanitizeHtmlHtmlHtml(malicious)
      
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).toContain('Click me')
    })
  })

  describe('validateEmailStrict', () => {
    it('should reject disposable emails', () => {
      const disposableEmail = 'test@tempmail.org'
      const result = SecurityUtils.validateEmailStrict(disposableEmail)
      
      expect(result).toBe(false)
    })

    it('should accept valid business emails', () => {
      const businessEmail = 'contact@topsteel.com'
      const result = SecurityUtils.validateEmailStrict(businessEmail)
      
      expect(result).toBe(true)
    })
  })

  describe('createRateLimiter', () => {
    it('should limit calls correctly', () => {
      const limiter = SecurityUtils.createRateLimiter(2, 1000)
      const mockFn = jest.fn()
      const limited = limiter(mockFn)

      // Premiers appels OK
      limited()
      limited()
      
      // Troisième appel doit lever une erreur
      expect(() => limited()).toThrow('Trop de requêtes')
    })
  })
})
