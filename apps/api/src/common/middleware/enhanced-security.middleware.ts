import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import * as helmet from 'helmet'

@Injectable()
export class EnhancedSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(EnhancedSecurityMiddleware.name)

  use(req: Request, res: Response, next: NextFunction) {
    // Headers de sécurité renforcés
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    // CSP pour les uploads
    if (req.path.includes('/upload')) {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'none'")
    }

    // Cache control pour API
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      res.setHeader('Pragma', 'no-cache')
    }

    // Log des requêtes suspectes
    if (this.isSuspiciousRequest(req)) {
      this.logger.warn('Requête suspecte détectée', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
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
    ]

    const checkString = `${req.path}${req.query}${JSON.stringify(req.body || {})}`
    return suspiciousPatterns.some((pattern) => pattern.test(checkString))
  }
}
