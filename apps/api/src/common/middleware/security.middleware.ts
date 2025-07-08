// apps/api/src/common/middleware/security.middleware.ts
import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Headers de sécurité additionnels pour l'ERP

    // Protection contre le clickjacking spécifique aux ERPs
    res.setHeader('X-Frame-Options', 'DENY')

    // Protection contre les attaques MIME
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // Cache control pour les données sensibles
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }

    // Headers de sécurité pour les uploads
    if (req.path.includes('/upload')) {
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
    }

    // Protection contre les attaques de timing (pour les authentifications)
    if (req.path.includes('/auth/')) {
      const delay = Math.random() * 100 // Délai aléatoire de 0-100ms
      setTimeout(() => next(), delay)
      return
    }

    next()
  }
}
