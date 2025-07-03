/**
 * 🔒 SECURITY UTILS ENTERPRISE - VERSION RENFORCÉE
 */
import DOMPurify from 'dompurify'
import { z } from 'zod'
import { SecurityUtils } from '@/lib/security/security-enhanced'

export class SecurityUtils {
  /**
   * Sanitisation XSS robuste avec DOMPurify
   */
  static sanitizeHtml(html: string): string {
    if (typeof window === 'undefined') {
      return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    }
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['class'],
      KEEP_CONTENT: false
    })
  }

  /**
   * Validation email renforcée
   */
  static validateEmailStrict(email: string): boolean {
    const emailSchema = z.string()
      .email()
      .max(254)
      .refine(email => !this.isDisposableEmail(email), 'Email temporaire non autorisé')

    return emailSchema.safeParse(email).success
  }

  /**
   * Détection emails temporaires
   */
  static isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()
    const disposableDomains = [
      'tempmail.org', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'yopmail.com', 'temp-mail.org'
    ]
    return disposableDomains.includes(domain)
  }

  /**
   * Rate limiting côté client
   */
  static createRateLimiter(maxCalls: number, windowMs: number) {
    const calls: number[] = []
    
    return function rateLimited<T extends (...args: any[]) => any>(fn: T): T {
      return ((...args: any[]) => {
        const now = Date.now()
        const windowStart = now - windowMs
        
        // Nettoyer les anciens appels
        while (calls.length > 0 && calls[0] < windowStart) {
          calls.shift()
        }
        
        if (calls.length >= maxCalls) {
          throw new Error('Trop de requêtes. Veuillez patienter.')
        }
        
        calls.push(now)
        return fn(...args)
      }) as T
    }
  }

  /**
   * Logger sécurisé
   */
  static logSecurityEvent(event: string, details: Record<string, any> = {}) {
    const sanitizedDetails = Object.fromEntries(
      Object.entries(details).map(([key, value]) => [
        key,
        typeof value === 'string' ? this.maskSensitiveData(value) : value
      ])
    )

    console.warn('🔐 Security Event:', {
      event,
      timestamp: new Date().toISOString(),
      details: sanitizedDetails
    })
  }

  /**
   * Masquage données sensibles
   */
  private static maskSensitiveData(data: string): string {
    return data
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '***@***.***')
      .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '****-****-****-****')
      .replace(/\b\d{14}\b/g, '**************')
  }
}
