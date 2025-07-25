// apps/api/src/modules/auth/guards/jwt-auth.guard.ts
import { type ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import type { Observable } from 'rxjs'
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name)

  constructor(private readonly reflector: Reflector) {
    super()
  }

  override canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Vérifier si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    // Appeler la logique d'authentification parent
    return super.canActivate(context)
  }

  // Signature avec types spécifiques
  override handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    info: { name?: string; message?: string } | undefined,
    context: ExecutionContext,
    _status?: unknown
  ): TUser {
    const request = context.switchToHttp().getRequest()

    // Log des tentatives d'accès en développement
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Auth attempt: ${request.method} ${request.url}`)
      
      // Log du token pour debug
      const authHeader = request.headers.authorization
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        this.logger.debug(`Token (first 50 chars): ${token.substring(0, 50)}...`)
      } else {
        this.logger.debug('No authorization header')
      }
    }

    // Gestion des erreurs spécifiques
    if (err || !user) {
      let errorMessage = 'Accès non autorisé'

      if (info) {
        switch (info.name) {
          case 'JsonWebTokenError':
            errorMessage = 'Token JWT malformé'
            break
          case 'TokenExpiredError':
            errorMessage = 'Token expiré'
            break
          case 'NotBeforeError':
            errorMessage = 'Token pas encore valide'
            break
          default:
            errorMessage = info.message ?? errorMessage
        }
      }

      // Log des échecs d'authentification
      this.logger.warn(
        `Authentication failed: ${errorMessage} for ${request.method} ${request.url}`
      )

      throw new UnauthorizedException(errorMessage)
    }

    // Log des succès en développement
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `User ${user && typeof user === 'object' && 'email' in user ? (user as { email?: string }).email : ''} authenticated successfully`
      )
    }

    return user
  }
}
