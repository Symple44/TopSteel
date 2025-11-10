import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { MultiTenantJwtPayload } from '../../interfaces/jwt-payload.interface'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('Token manquant')
    }

    try {
      const payload = this.jwtService.verify(token) as MultiTenantJwtPayload

      // Vérifier que le token contient les informations de société
      if (!payload.societeId || !payload.societeCode) {
        throw new UnauthorizedException(
          'Token non multi-tenant. Veuillez vous connecter à une société.'
        )
      }

      // Ajouter les informations de tenant à la requête
      request.tenant = {
        societeId: payload.societeId,
        societeCode: payload.societeCode,
        siteId: payload.siteId,
        permissions: payload.permissions || [],
        tenantDatabase: payload.tenantDatabase,
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
      }

      return true
    } catch (_error) {
      throw new UnauthorizedException('Token invalide')
    }
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string }
  }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
