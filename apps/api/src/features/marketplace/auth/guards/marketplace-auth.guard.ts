import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { Reflector } from '@nestjs/core'
import type { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from '../../../../core/common/decorators/public.decorator'

@Injectable()
export class MarketplaceAuthGuard extends AuthGuard('marketplace-jwt') {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('No token provided')
    }

    try {
      const jwtSecret =
        this.configService.get<string>('MARKETPLACE_JWT_SECRET') ||
        this.configService.get<string>('JWT_SECRET')

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      })

      // Ensure it's a marketplace customer token
      if (payload.type !== 'marketplace_customer') {
        throw new UnauthorizedException('Invalid token type')
      }

      // Attach user to request
      request.customer = payload
      request.user = payload // For compatibility

      return true
    } catch (_error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  private extractTokenFromHeader(request: unknown): string | undefined {
    const req = request as { headers: { authorization?: string } }
    const [type, token] = req.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
