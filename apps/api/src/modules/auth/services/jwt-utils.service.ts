// apps/api/src/modules/auth/services/jwt-utils.service.ts
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Redis } from "ioredis";
import { JwtPayload } from "../auth.service";

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
    @Optional() @Inject("REDIS_CLIENT") private readonly redisClient?: Redis,
  ) {}

  /**
   * Vérifie un token sans lever d'exception
   */
  async verifyTokenSafely(
    token: string,
    isrefreshToken = false,
  ): Promise<TokenInfo> {
    try {
      const secret = isrefreshToken
        ? this.configService.get<string>("jwt.refreshSecret")
        : this.configService.get<string>("jwt.secret");

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
  private handleExpiredOrInvalidToken(
    token: string,
    error: unknown,
  ): TokenInfo {
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
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : "Unknown error",
    };
  }

  private isTokenExpiredError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "TokenExpiredError"
    );
  }

  private buildExpiredTokenInfo(
    decoded: ExtendedJwtPayload,
    error: unknown,
  ): TokenInfo {
    return {
      isValid: false,
      isExpired: true,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : undefined,
      payload: decoded,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : "Unknown error",
    };
  }

  /**
   * Décode un token sans le valider (pour les tokens expirés)
   */
  private tryDecodeToken(token: string): ExtendedJwtPayload | null {
    try {
      const decoded = this.jwtService.decode(token, { json: true });
      return decoded as ExtendedJwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si un token est dans la blacklist Redis
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (!this.redisClient) {
      console.log('🚫 Redis non disponible - token blacklist ignorée');
      return false;
    }

    try {
      const exists = await this.redisClient.exists(`blacklist:${jti}`);
      return exists === 1;
    } catch (error) {
      console.error("Error checking token blacklist:", error);
      return false;
    }
  }

  /**
   * Ajoute un token à la blacklist Redis
   */
  async blacklistToken(jti: string, expiresAt?: Date): Promise<void> {
    if (!this.redisClient) {
      console.log('🚫 Redis non disponible - blacklist token ignorée');
      return;
    }

    try {
      const key = `blacklist:${jti}`;

      if (expiresAt) {
        const ttl = Math.max(
          0,
          Math.floor((expiresAt.getTime() - Date.now()) / 1000),
        );
        await this.redisClient.setex(key, ttl, "1");
      } else {
        // TTL par défaut de 24h si pas d'expiration fournie
        await this.redisClient.setex(key, 86400, "1");
      }
    } catch (error) {
      console.error("Error blacklisting token:", error);
      // Ne pas lever d'exception pour ne pas bloquer la déconnexion
    }
  }

  /**
   * Supprime un token de la blacklist (pour les tests)
   */
  async removeFromBlacklist(jti: string): Promise<void> {
    if (!this.redisClient) {
      console.log('🚫 Redis non disponible - removeFromBlacklist ignorée');
      return;
    }

    try {
      await this.redisClient.del(`blacklist:${jti}`);
    } catch (error) {
      console.error("Error removing token from blacklist:", error);
    }
  }

  /**
   * Génère un JTI unique pour un token
   */
  generateJti(): string {
    return `jwt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Indique si Redis est disponible
   */
  get isRedisAvailable(): boolean {
    return !!this.redisClient && this.redisClient.status === 'ready';
  }
}
