// apps/api/src/modules/auth/guards/jwt-auth.guard.ts
import {
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Vérifier si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Appeler la logique d'authentification parent
    return super.canActivate(context);
  }

  handleRequest(err: boolean, user: boolean, info: boolean, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Log des tentatives d'accès en développement
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Auth attempt: ${request.method} ${request.url}`);
    }

    // Gestion des erreurs spécifiques
    if (err || !user) {
      let errorMessage = 'Accès non autorisé';
      
      if (info) {
        switch (info.name) {
          case 'JsonWebTokenError':
            errorMessage = 'Token JWT malformé';
            break;
          case 'TokenExpiredError':
            errorMessage = 'Token expiré';
            break;
          case 'NotBeforeError':
            errorMessage = 'Token pas encore valide';
            break;
          default:
            errorMessage = info.message || errorMessage;
        }
      }

      // Log des échecs d'authentification
      this.logger.warn(
        `Authentication failed: ${errorMessage} for ${request.method} ${request.url}`,
      );

      throw new UnauthorizedException(errorMessage);
    }

    // Log des succès en développement
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`User ${user.email} authenticated successfully`);
    }

    return user;
  }
}
