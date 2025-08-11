import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../../../users/users.service'
import type { JwtPayload, MultiTenantJwtPayload } from '../../interfaces/jwt-payload.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    const jwtSecret = configService?.get<string>('jwt.secret') || 'fallback-secret'

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: JwtPayload | MultiTenantJwtPayload) {
    const user = await this.usersService.findById(payload.sub)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (!user.actif) {
      throw new UnauthorizedException('User is inactive')
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password: _password, ...result } = user

    // Si c'est un token multi-tenant, ajouter les informations de société
    if ('societeId' in payload) {
      return {
        ...result,
        societeId: payload.societeId,
        societeCode: payload.societeCode,
        permissions: payload.permissions,
        tenantDatabase: payload.tenantDatabase,
        siteId: payload.siteId,
      }
    }

    return result
  }
}
