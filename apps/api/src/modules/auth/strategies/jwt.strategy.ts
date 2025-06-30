// apps/api/src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

// Interface étendue pour le payload JWT
export interface ExtendedJwtPayload {
  sub: number;
  email: string;
  role: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Extraction du token depuis l'en-tête Authorization
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Ne pas ignorer l'expiration
      ignoreExpiration: false,
      
      // Secret de vérification
      secretOrKey: configService.get<string>('jwt.secret'),
      
      // Options de validation (optionnelles)
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
      
      // Algorithmes autorisés
      algorithms: ['HS256'],
    });
  }

  /**
   * Valide le payload JWT et retourne l'utilisateur
   */
  async validate(payload: ExtendedJwtPayload) {
    try {
      // Vérification des champs obligatoires
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Token payload invalide');
      }

      // Vérification de l'émetteur si configuré
      const expectedIssuer = this.configService.get<string>('jwt.issuer');
      if (expectedIssuer && payload.iss && payload.iss !== expectedIssuer) {
        throw new UnauthorizedException('Token émetteur invalide');
      }

      // Récupération de l'utilisateur depuis la base
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      // Vérification que l'utilisateur est actif (si vous avez ce champ)
      // if (!user.isActive) {
      //   throw new UnauthorizedException('Compte utilisateur désactivé');
      // }

      // Vérification de cohérence email
      if (user.email !== payload.email) {
        throw new UnauthorizedException('Token email incohérent');
      }

      // Vérification de cohérence rôle
      if (user.role !== payload.role) {
        throw new UnauthorizedException('Token rôle incohérent');
      }

      // Log de l'accès (optionnel)
      if (this.configService.get('NODE_ENV') === 'development') {
        console.info(`✅ JWT: User ${user.email} authenticated successfully`);
      }

      // Retourner l'utilisateur (sans le mot de passe)
      const { password: _password, refreshToken: _refreshToken, ...userWithoutSensitiveData } = user;
      return userWithoutSensitiveData;

      } catch (_error) {
        // Log de l'erreur en développement
        if (this.configService.get('NODE_ENV') === 'development') {
          console.error('JWT Strategy validation error:', _error);
        }
        
        throw new UnauthorizedException('Token invalide');
      }
  }
}




