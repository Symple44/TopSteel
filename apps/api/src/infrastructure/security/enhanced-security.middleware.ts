import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class ConsolidatedSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ConsolidatedSecurityMiddleware.name)

  use(req: Request, res: Response, next: NextFunction) {
    // Headers de sécurité renforcés
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')

    // CSP pour les uploads
    if (req.path.includes('/upload')) {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'none'")
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
    }

    // Cache control pour API et données sensibles
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }

    // Protection contre les attaques de timing (pour les authentifications)
    if (req.path.includes('/auth/')) {
      const delay = Math.random() * 50 // Délai aléatoire réduit à 0-50ms
      setTimeout(() => {
        this.continueWithSecurityChecks(req, res, next)
      }, delay)
      return
    }

    this.continueWithSecurityChecks(req, res, next)
  }

  private continueWithSecurityChecks(req: Request, res: Response, next: NextFunction) {
    // Log des requêtes suspectes
    if (this.isSuspiciousRequest(req)) {
      this.logger.warn('Requête suspecte détectée', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      })
    }

    // Validation des headers critiques
    if (this.hasInvalidHeaders(req)) {
      this.logger.warn('Headers suspects détectés', {
        ip: req.ip,
        headers: this.getSafeHeaders(req),
        path: req.path,
      })
    }

    next()
  }

  private isSuspiciousRequest(req: Request): boolean {
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /<script/i, // XSS attempt
      /union.*select/i, // SQL injection
      /javascript:/i, // Protocol injection
      /eval\(/i, // Code injection
      /exec\(/i, // Command injection
      /\${.*}/, // Template injection
      /\bor\b.*=.*\bor\b/i, // SQL injection variation
    ]

    const checkString = `${req.path}${JSON.stringify(req.query)}${JSON.stringify(req.body || {})}`
    return suspiciousPatterns.some((pattern) => pattern.test(checkString))
  }

  private hasInvalidHeaders(req: Request): boolean {
    const userAgent = req.get('User-Agent') || ''
    const referer = req.get('Referer') || ''

    // Détecter les User-Agents suspects
    const suspiciousUAs = [/sqlmap/i, /nikto/i, /nmap/i, /burp/i, /scanner/i]

    return (
      suspiciousUAs.some((pattern) => pattern.test(userAgent)) ||
      suspiciousUAs.some((pattern) => pattern.test(referer))
    )
  }

  private getSafeHeaders(req: Request): Record<string, string> {
    return {
      'user-agent': req.get('User-Agent') || 'unknown',
      referer: req.get('Referer') || 'none',
      'x-forwarded-for': req.get('X-Forwarded-For') || 'none',
    }
  }
}
