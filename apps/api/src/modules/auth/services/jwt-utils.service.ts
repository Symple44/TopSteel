// apps/api/src/modules/auth/services/jwt-utils.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { JwtPayload } from '../auth.service';

export interface TokenInfo {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
  payload?: ExtendedJwtPayload | null;
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
    private readonly redisClient: Redis, // Inject Redis client
  ) {}

  /**
   * Vérifie un token sans lever d'exception
   */
  async verifyTokenSafely(token: string, isrefreshToken = false): Promise<TokenInfo> {
    try {
      const secret = isrefreshToken
        ? this.configService.get<string>('jwt.refreshSecret')
        : this.configService.get<string>('jwt.secret');

      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      return {
        isValid: true,
        isExpired: false,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
        payload,
      };
    } catch (error: unknown) {
      return this.handleExpiredOrInvalidToken(token, error);
    }
  }

  /**
   * Handles expired or invalid token cases for verifyTokenSafely
   */
  private handleExpiredOrInvalidToken(token: string, error: unknown): TokenInfo {
    const isExpired = this.isTokenExpiredError(error);

    if (isExpired) {
      const decoded = this.tryDecodeToken(token);
      if (decoded) {
        return this.buildExpiredTokenInfo(decoded, error);
      }
    }

    return {
      isValid: false,
      isExpired,
      error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : 'Unknown error',
    };
  }

  private isTokenExpiredError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'TokenExpiredError';
  }

  private buildExpiredTokenInfo(decoded: ExtendedJwtPayload, error: unknown): TokenInfo {
    return {
      isValid: false,
      isExpired: true,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : undefined,
      payload: decoded,
      error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : 'Unknown error',
    };
  }

  /**
   * Tries to decode a token and returns the payload or null
   */
  private tryDecodeToken(token: string): ExtendedJwtPayload | null {
    try {
      return this.jwtService.decode(token);
    } catch {
      return null;
    }
  }

  /**
   * Extrait les informations d'un token sans validation
   */
  decodeToken(token: string): ExtendedJwtPayload | null {
    try {
      return this.jwtService.decode(token);
    } catch (_error) {
      console.error('Failed to decode token:', _error);
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
      isrefreshToken?: boolean;
      additionalClaims?: Record<string, unknown>;
    }
  ): Promise<string> {
    const { expiresIn, isrefreshToken = false, additionalClaims = {} } = options || {};

    const secret = isrefreshToken
      ? this.configService.get<string>('jwt.refreshSecret')
      : this.configService.get<string>('jwt.secret');

    const defaultExpiry = isrefreshToken
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
      expiresIn: expiresIn ?? defaultExpiry,
    });
  }


  /**
   * Blackliste un token (implémenté avec Redis)
   */
  async blacklistToken(token: string): Promise<void> {
    const decoded = this.decodeToken(token);
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisClient.set(`blacklist_${token}`, '1', 'EX', ttl);
        console.info('Token blacklisted in Redis:', token.substring(0, 20) + '...');
        return;
      }
    }
  }

  /**
   * Vérifie si un token est blacklisté
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`blacklist_${token}`);
    return exists === 1;
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
  validateCustomClaims(payload: Record<string, unknown>): boolean {
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


