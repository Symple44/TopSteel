// apps/api/src/modules/auth/guards/jwt-auth.guard.ts
import { type ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Observable } from 'rxjs'
import type { User } from '@prisma/client'

/**
 * JWT Authentication Guard
 *
 * This guard validates JWT tokens when explicitly applied via @UseGuards(JwtAuthGuard).
 * Unlike the global TenantGuard, this guard does NOT check for @Public() decorator
 * because when you explicitly apply this guard, you WANT JWT validation.
 *
 * Use case: Routes that need JWT validation but bypass tenant validation (like /auth/verify)
 * - Mark route with @Public() to bypass global TenantGuard
 * - Apply @UseGuards(JwtAuthGuard) to enforce JWT validation
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name)

  override canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Always validate JWT when this guard is explicitly applied
    // No @Public() check - that's handled by the global TenantGuard
    return super.canActivate(context)
  }

  // Signature avec types spécifiques
  override handleRequest<TUser = User>(
    err: Error | null,
    user: TUser,
    info: { name?: string; message?: string } | undefined,
    context: ExecutionContext,
    _status?: number
  ): TUser {
    const request = context.switchToHttp().getRequest()

    // Log des tentatives d'accès en développement (sans données sensibles)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Auth attempt: ${request.method} ${request.url}`)

      // Vérification de la présence du header sans logger le token
      const authHeader = request.headers.authorization
      if (authHeader) {
        // Ne jamais logger le token, même partiellement
        this.logger.debug('Authorization header present')
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
