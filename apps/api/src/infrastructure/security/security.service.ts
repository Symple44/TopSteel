import * as crypto from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface SessionInfo {
  createdAt: number
  maxAge: number
}

@Injectable()
export class SecurityService {
  private readonly secretKey: string

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('SECRET_KEY') || 'default-secret-key'
  }

  /**
   * Generate a hash using specified algorithm (default: SHA-256)
   */
  generateHash(data: string, algorithm = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex')
  }

  /**
   * Generate HMAC signature
   */
  generateHmac(data: string, secret?: string): string {
    const key = secret || this.secretKey
    return crypto.createHmac('sha256', key).update(data).digest('hex')
  }

  /**
   * Verify HMAC signature
   */
  verifyHmac(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHmac(data, secret)
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const actualBuffer = Buffer.from(signature, 'hex')

    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Sanitize HTML input to prevent XSS
   */
  sanitizeInput(input: unknown): string {
    if (input === null || input === undefined) {
      return ''
    }

    const str = String(input)

    // Remove script tags and dangerous content
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/style\s*=/gi, '')
  }

  /**
   * Escape SQL input to prevent injection
   */
  escapeSqlInput(input: string): string {
    if (!input) return input

    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/xp_/gi, '')
      .replace(/sp_/gi, '')
      .replace(/drop\s+table/gi, '')
      .replace(/delete\s+from/gi, '')
      .replace(/insert\s+into/gi, '')
      .replace(/update\s+\w+\s+set/gi, '')
  }

  /**
   * Validate SQL parameters for safety
   */
  validateSqlParameters(params: Record<string, unknown>): boolean {
    for (const [_, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        const dangerous = [
          "';",
          'DROP TABLE',
          'DELETE FROM',
          'INSERT INTO',
          'UPDATE ',
          ' SET ',
          '--',
          '/*',
          '*/',
          'xp_',
          'sp_',
        ]

        const upperValue = value.toUpperCase()
        if (dangerous.some((pattern) => upperValue.includes(pattern))) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Generate rate limit key
   */
  generateRateLimitKey(ip: string, endpoint: string): string {
    return `rate_limit:${ip}:${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  /**
   * Check if request should be rate limited
   */
  shouldRateLimit(currentCount: number, limit: number, _timeWindow: number): boolean {
    return currentCount >= limit
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): boolean {
    if (password.length < 8) return false

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  }

  /**
   * Generate secure session ID
   */
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Validate session ID format
   */
  validateSessionId(sessionId: string): boolean {
    return /^[a-f0-9]{64}$/i.test(sessionId)
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session: SessionInfo): boolean {
    const now = Date.now()
    return now - session.createdAt > session.maxAge
  }

  /**
   * Validate IP address format
   */
  validateIpAddress(ip: string): boolean {
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipv4Regex.test(ip)
  }

  /**
   * Check if IP is in allowed range
   */
  isIpAllowed(ip: string, allowedRanges: string[]): boolean {
    // Simple implementation - in production you'd use a proper CIDR library
    for (const range of allowedRanges) {
      if (range.includes('/')) {
        const [network, bits] = range.split('/')
        const mask = parseInt(bits, 10)

        // Convert IPs to integers for comparison
        const ipInt = this.ipToInt(ip)
        const networkInt = this.ipToInt(network)
        const maskInt = (0xffffffff << (32 - mask)) >>> 0

        if ((ipInt & maskInt) === (networkInt & maskInt)) {
          return true
        }
      } else if (ip === range) {
        return true
      }
    }
    return false
  }

  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  }

  /**
   * Get security headers
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': this.generateCSPHeader(),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    }
  }

  /**
   * Generate Content Security Policy header
   */
  generateCSPHeader(): string {
    const nonce = crypto.randomBytes(16).toString('base64')

    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'none'",
      "worker-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "manifest-src 'self'",
    ].join('; ')
  }
}
