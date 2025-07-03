/**
 * 🔒 TESTS DE SÉCURITÉ - TopSteel ERP
 */
import { SecurityUtils } from '../lib/security-enhanced'
import { useSecureValidation } from '../hooks/use-secure-validation'
import { renderHook } from '@testing-library/react'

describe('SecurityUtils', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const malicious = '<div>Safe content</div><script>alert("xss")</script>'
      const sanitized = SecurityUtils.sanitizeHtml(malicious)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).toContain('Safe content')
    })

    it('should remove iframe tags', () => {
      const malicious = '<div>Content</div><iframe src="malicious.com"></iframe>'
      const sanitized = SecurityUtils.sanitizeHtml(malicious)
      
      expect(sanitized).not.toContain('<iframe>')
      expect(sanitized).not.toContain('malicious.com')
      expect(sanitized).toContain('Content')
    })

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert()">Click me</div>'
      const sanitized = SecurityUtils.sanitizeHtml(malicious)
      
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).toContain('Click me')
    })

    it('should allow safe HTML tags', () => {
      const safe = '<p><strong>Bold</strong> and <em>italic</em> text</p>'
      const sanitized = SecurityUtils.sanitizeHtml(safe)
      
      expect(sanitized).toContain('<p>')
      expect(sanitized).toContain('<strong>')
      expect(sanitized).toContain('<em>')
      expect(sanitized).toContain('Bold')
      expect(sanitized).toContain('italic')
    })
  })

  describe('validateEmailSecure', () => {
    it('should accept valid business emails', () => {
      const validEmails = [
        'contact@topsteel.com',
        'user@company.fr',
        'test.email@domain.co.uk'
      ]
      
      validEmails.forEach(email => {
        expect(SecurityUtils.validateEmailSecure(email)).toBe(true)
      })
    })

    it('should reject disposable emails', () => {
      const disposableEmails = [
        'test@tempmail.org',
        'user@10minutemail.com',
        'fake@guerrillamail.com'
      ]
      
      disposableEmails.forEach(email => {
        expect(SecurityUtils.validateEmailSecure(email)).toBe(false)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user name@domain.com'
      ]
      
      invalidEmails.forEach(email => {
        expect(SecurityUtils.validateEmailSecure(email)).toBe(false)
      })
    })

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@domain.com'
      expect(SecurityUtils.validateEmailSecure(longEmail)).toBe(false)
    })
  })

  describe('createRateLimiter', () => {
    it('should allow calls within the limit', () => {
      const limiter = SecurityUtils.createRateLimiter(3, 1000)
      const mockFn = jest.fn()
      const limited = limiter(mockFn)

      // Les 3 premiers appels doivent passer
      limited()
      limited()
      limited()
      
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should block calls exceeding the limit', () => {
      const limiter = SecurityUtils.createRateLimiter(2, 1000)
      const mockFn = jest.fn()
      const limited = limiter(mockFn)

      // Les 2 premiers appels passent
      limited()
      limited()
      
      // Le 3ème doit lever une erreur
      expect(() => limited()).toThrow('Trop de requêtes')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should reset after the time window', async () => {
      const limiter = SecurityUtils.createRateLimiter(1, 100) // 100ms window
      const mockFn = jest.fn()
      const limited = limiter(mockFn)

      // Premier appel
      limited()
      
      // Deuxième appel immédiat doit échouer
      expect(() => limited()).toThrow('Trop de requêtes')
      
      // Attendre la fin de la fenêtre
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Maintenant ça doit passer
      expect(() => limited()).not.toThrow()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongP@ss123',
        'MySecure#Password456',
        'Azerty!123456'
      ]
      
      strongPasswords.forEach(password => {
        const result = SecurityUtils.validatePasswordStrength(password)
        expect(result.isValid).toBe(true)
        expect(result.score).toBeGreaterThanOrEqual(4)
        expect(result.issues).toHaveLength(0)
      })
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'Password',
        'Password123'
      ]
      
      weakPasswords.forEach(password => {
        const result = SecurityUtils.validatePasswordStrength(password)
        expect(result.isValid).toBe(false)
        expect(result.issues.length).toBeGreaterThan(0)
      })
    })

    it('should provide specific feedback for password issues', () => {
      const result = SecurityUtils.validatePasswordStrength('weak')
      
      expect(result.issues).toContain('Au moins 8 caractères requis')
      expect(result.issues).toContain('Au moins une majuscule requise')
      expect(result.issues).toContain('Au moins un chiffre requis')
      expect(result.issues).toContain('Au moins un caractère spécial requis')
    })
  })
})

describe('useSecureValidation', () => {
  it('should validate required fields', () => {
    const { result } = renderHook(() => 
      useSecureValidation({
        email: { required: true, email: true },
        name: { required: true, minLength: 2 }
      })
    )

    const isValid = result.current.validate({
      email: '',
      name: ''
    })

    expect(isValid).toBe(false)
    expect(result.current.hasErrors).toBe(true)
    expect(result.current.getFieldErrors('email')).toContain('Ce champ est requis')
    expect(result.current.getFieldErrors('name')).toContain('Ce champ est requis')
  })

  it('should validate email format', () => {
    const { result } = renderHook(() => 
      useSecureValidation({
        email: { email: true }
      })
    )

    const isValid = result.current.validate({
      email: 'invalid-email'
    })

    expect(isValid).toBe(false)
    expect(result.current.getFieldErrors('email')).toContain('Email invalide ou non autorisé')
  })

  it('should validate minimum length', () => {
    const { result } = renderHook(() => 
      useSecureValidation({
        password: { minLength: 8 }
      })
    )

    const isValid = result.current.validate({
      password: 'short'
    })

    expect(isValid).toBe(false)
    expect(result.current.getFieldErrors('password')).toContain('Minimum 8 caractères')
  })

  it('should pass validation for valid data', () => {
    const { result } = renderHook(() => 
      useSecureValidation({
        email: { required: true, email: true },
        name: { required: true, minLength: 2 }
      })
    )

    const isValid = result.current.validate({
      email: 'user@topsteel.com',
      name: 'John Doe'
    })

    expect(isValid).toBe(true)
    expect(result.current.hasErrors).toBe(false)
  })
})
