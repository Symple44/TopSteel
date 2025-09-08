import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { CsrfService } from './csrf.service'

// Décorateur pour désactiver la protection CSRF sur des routes spécifiques
export const SkipCsrf = () => SetMetadata('skipCsrf', true)

// Décorateur pour forcer la protection CSRF même sur des routes normalement exclues
export const RequireCsrf = () => SetMetadata('requireCsrf', true)

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name)

  constructor(
    private readonly csrfService: CsrfService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const handler = context.getHandler()
    const classRef = context.getClass()

    // Vérifier les métadonnées pour skipCsrf
    const skipCsrf = this.reflector.getAllAndOverride<boolean>('skipCsrf', [handler, classRef])

    if (skipCsrf) {
      this.logger.debug(`Protection CSRF désactivée pour ${request.method} ${request.path}`)
      return true
    }

    // Vérifier les métadonnées pour requireCsrf
    const requireCsrf = this.reflector.getAllAndOverride<boolean>('requireCsrf', [
      handler,
      classRef,
    ])

    // Si requireCsrf est défini, forcer la protection
    const shouldProtect = requireCsrf || this.csrfService.shouldProtectRoute(request)

    if (!shouldProtect) {
      return true
    }

    try {
      // Extraire le token de la requête
      const token = this.csrfService.extractTokenFromRequest(request)

      if (!token) {
        this.logger.warn('🔒 Token CSRF manquant dans le guard', {
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          path: request.path,
          method: request.method,
          handler: handler.name,
          timestamp: new Date().toISOString(),
        })

        throw new ForbiddenException({
          message: 'Token CSRF requis',
          error: 'CSRF_TOKEN_MISSING',
          statusCode: 403,
        })
      }

      // Valider le token CSRF
      const isValidToken = this.csrfService.validateToken(request)

      if (!isValidToken) {
        this.logger.warn('🔒 Token CSRF invalide dans le guard', {
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          path: request.path,
          method: request.method,
          handler: handler.name,
          token: `${token.substring(0, 8)}...`, // Log seulement les premiers caractères
          timestamp: new Date().toISOString(),
        })

        throw new ForbiddenException({
          message: 'Token CSRF invalide',
          error: 'CSRF_TOKEN_INVALID',
          statusCode: 403,
        })
      }

      this.logger.debug(`✅ Token CSRF validé dans le guard pour ${request.method} ${request.path}`)
      return true
    } catch (error) {
      // Si c'est déjà une exception HTTP, la relancer
      if (error instanceof ForbiddenException) {
        throw error
      }

      // Autres erreurs
      this.logger.error('❌ Erreur dans le guard CSRF:', error)
      throw new ForbiddenException({
        message: 'Erreur de validation CSRF',
        error: 'CSRF_VALIDATION_ERROR',
        statusCode: 403,
      })
    }
  }
}
