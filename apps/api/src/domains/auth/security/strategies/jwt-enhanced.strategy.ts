import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import type { Request } from 'express'
import { ExtractJwt, Strategy, type StrategyOptionsWithRequest } from 'passport-jwt'
import { TokenVersionMiddleware } from '../../../../infrastructure/middleware/token-version.middleware'

interface JwtPayload {
  sub: string
  email: string
  iat?: number
  exp?: number
}

@Injectable()
export class JwtEnhancedStrategy extends PassportStrategy(Strategy, 'jwt-enhanced') {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get('jwt.secret')
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction && !jwtSecret) {
      throw new Error('JWT secret is not configured. Please set JWT_SECRET environment variable.')
    }

    if (jwtSecret && jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long')
    }

    // Use a development default only in non-production environments
    const finalSecret =
      jwtSecret || (isProduction ? '' : 'jwt-enhanced-dev-secret-min-32-characters')

    if (!finalSecret) {
      throw new Error('JWT secret cannot be empty')
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.accessToken
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: finalSecret,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest)
  }

  async validate(req: Request, payload: JwtPayload) {
    // Vérifier si le token a été émis avant le redémarrage du serveur
    if (payload.iat) {
      const tokenIssuedAt = new Date(payload.iat * 1000)
      const serverStartTime = new Date(TokenVersionMiddleware.getServerStartTime())

      if (tokenIssuedAt < serverStartTime) {
        throw new UnauthorizedException('Token invalidé - Le serveur a redémarré')
      }
    }

    // Ajouter un header pour informer le client de la version du serveur
    if (req.res) {
      req.res.setHeader('X-Server-Start-Time', TokenVersionMiddleware.getServerStartTime())
    }

    return {
      userId: payload.sub,
      email: payload.email,
    }
  }
}
