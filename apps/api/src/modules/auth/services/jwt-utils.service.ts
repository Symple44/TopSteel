// apps/api/src/modules/auth/services/jwt-utils.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth.service';

export interface TokenInfo {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
  payload?: any;
  error?: string;
}

export interface ExtendedJwtPayload extends JwtPayload {
  iss?: string;
  aud?: string;
  jti?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
}

@Injectable()
export class JwtUtilsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Vérifie un token sans lever d'exception
   */
  async verifyTokenSafely(token: string, isRefreshToken = false): Promise<TokenInfo> {
    try {
      const secret = isRefreshToken
        ? this.configService.get<string>('jwt.refreshSecret')
        : this.configService.get<string>('jwt.secret');

      const payload = await this.jwtService.verifyAsync(token, { secret }) as ExtendedJwtPayload;
      
      return {
        isValid: true,
        isExpired: false,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
        payload,
      };
    } catch (error: any) {
      const isExpired = error.name === 'TokenExpiredError';
      
      // Si le token est expiré, on peut quand même extraire les infos
      if (isExpired) {
        try {
          const decoded = this.jwtService.decode(token) as ExtendedJwtPayload;
          if (decoded) {
            return {
              isValid: false,
              isExpired: true,
              expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
              issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : undefined,
              payload: decoded,
              error: error.message,
            };
          }
        } catch (decodeError) {
          // Token complètement invalide
        }
      }

      return {
        isValid: false,
        isExpired,
        error: error.message,
      };
    }
  }

  /**
   * Extrait les informations d'un token sans validation
   */
  decodeToken(token: string): ExtendedJwtPayload | null {
    try {
      return this.jwtService.decode(token) as ExtendedJwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Vérifie si un token expire bientôt
   */
  async isTokenExpiringSoon(token: string, minutesThreshold = 5): Promise<boolean> {
    const info = await this.verifyTokenSafely(token);
    
    if (!info.isValid || !info.expiresAt) {
      return false;
    }

    const now = new Date();
    const timeDiff = info.expiresAt.getTime() - now.getTime();
    const minutesRemaining = timeDiff / (1000 * 60);

    return minutesRemaining <= minutesThreshold;
  }

  /**
   * Génère un token avec des claims personnalisés
   */
  async generateCustomToken(
    payload: JwtPayload,
    options?: {
      expiresIn?: string;
      isRefreshToken?: boolean;
      additionalClaims?: Record<string, any>;
    }
  ): Promise<string> {
    const { expiresIn, isRefreshToken = false, additionalClaims = {} } = options || {};

    const secret = isRefreshToken
      ? this.configService.get<string>('jwt.refreshSecret')
      : this.configService.get<string>('jwt.secret');

    const defaultExpiry = isRefreshToken
      ? this.configService.get<string>('jwt.refreshExpiresIn')
      : this.configService.get<string>('jwt.expiresIn');

    const tokenPayload: ExtendedJwtPayload = {
      ...payload,
      ...additionalClaims,
      iss: this.configService.get<string>('jwt.issuer'),
      aud: this.configService.get<string>('jwt.audience'),
      jti: this.generateJti(),
    };

    return this.jwtService.signAsync(tokenPayload, {
      secret,
      expiresIn: expiresIn || defaultExpiry,
    });
  }

  /**
   * Blackliste un token (à implémenter avec Redis)
   */
  async blacklistToken(token: string): Promise<void> {
    // TODO: Implémenter avec Redis
    // const decoded = this.decodeToken(token);
    // if (decoded && decoded.exp) {
    //   const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    //   await this.redisService.set(`blacklist_${token}`, '1', 'EX', ttl);
    // }
    console.log('Token blacklisted:', token.substring(0, 20) + '...');
  }

  /**
   * Vérifie si un token est blacklisté
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    // TODO: Implémenter avec Redis
    // return await this.redisService.exists(`blacklist_${token}`);
    return false;
  }

  /**
   * Génère un JWT ID unique
   */
  generateJti(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Valide les claims personnalisés
   */
  validateCustomClaims(payload: any): boolean {
    const requiredClaims = ['sub', 'email', 'role'];
    
    return requiredClaims.every(claim => payload[claim] !== undefined);
  }

  /**
   * Obtient le temps restant avant expiration (en secondes)
   */
  async getTimeToExpiry(token: string): Promise<number | null> {
    const info = await this.verifyTokenSafely(token);
    
    if (!info.isValid || !info.expiresAt) {
      return null;
    }

    const now = new Date();
    return Math.max(0, Math.floor((info.expiresAt.getTime() - now.getTime()) / 1000));
  }
}