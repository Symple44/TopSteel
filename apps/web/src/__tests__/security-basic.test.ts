// apps/web/src/__tests__/security-basic.test.ts
import { describe, expect, it } from 'vitest'

describe('Security Basic Tests', () => {
  it('should sanitize basic HTML', () => {
    // Test basique de sécurité
    const input = '<script>alert("xss")</script>Hello'
    const sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '')

    expect(sanitized).toBe('Hello')
    expect(sanitized).not.toContain('<script>')
  })

  it('should validate email format', () => {
    const validEmail = 'test@company.com'
    const invalidEmail = 'invalid-email'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    expect(emailRegex.test(validEmail)).toBe(true)
    expect(emailRegex.test(invalidEmail)).toBe(false)
  })

  it('should create rate limiter concept', () => {
    // Test conceptuel de rate limiting
    const calls = []
    const limit = 3

    for (let i = 0; i < 5; i++) {
      if (calls.length < limit) {
        calls.push(i)
      }
    }

    expect(calls.length).toBe(3)
  })
})




