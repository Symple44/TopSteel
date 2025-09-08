import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  type NestMiddleware,
} from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import type { CsrfService } from './csrf.service'

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name)

  constructor(private readonly csrfService: CsrfService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // Toujours définir les cookies CSRF pour les requêtes GET
      if (req.method === 'GET') {
        this.csrfService.setCsrfCookies(req, res)
        next()
        return
      }

      // Vérifier si cette route doit être protégée
      if (!this.csrfService.shouldProtectRoute(req)) {
        this.logger.debug(`Route non protégée: ${req.method} ${req.path}`)
        next()
        return
      }

      // Extraire le token de la requête
      const token = this.csrfService.extractTokenFromRequest(req)

      if (!token) {
        this.logger.warn('🔒 Token CSRF manquant', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
        })

        throw new BadRequestException({
          message: 'Token CSRF requis',
          error: 'CSRF_TOKEN_MISSING',
          statusCode: 400,
        })
      }

      // Valider le token CSRF
      const isValidToken = this.csrfService.validateToken(req)

      if (!isValidToken) {
        this.logger.warn('🔒 Token CSRF invalide', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          token: `${token.substring(0, 8)}...`, // Log seulement les premiers caractères
          timestamp: new Date().toISOString(),
        })

        throw new ForbiddenException({
          message: 'Token CSRF invalide',
          error: 'CSRF_TOKEN_INVALID',
          statusCode: 403,
        })
      }

      // Régénérer les tokens après une validation réussie
      this.csrfService.setCsrfCookies(req, res)

      this.logger.debug(`✅ Token CSRF validé pour ${req.method} ${req.path}`)
      next()
    } catch (error) {
      // Si c'est déjà une exception HTTP, la relancer
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error
      }

      // Autres erreurs
      this.logger.error('❌ Erreur dans le middleware CSRF:', error)
      throw new ForbiddenException({
        message: 'Erreur de validation CSRF',
        error: 'CSRF_VALIDATION_ERROR',
        statusCode: 403,
      })
    }
  }
}
