import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

export interface TokenInfo {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
  payload?: any;
  error?: string;
}

interface ExtendedJwtPayload {
  sub: number;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
}

@Injectable()
export class JwtUtilsService {
  private readonly logger = new Logger(JwtUtilsService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateToken(token: string, isRefreshToken = false): Promise<TokenInfo> {
    try {
      const secret = isRefreshToken
        ? this.configService.get<string>("jwt.refreshSecret")
        : this.configService.get<string>("jwt.secret");

      if (!secret) {
        return {
          isValid: false,
          isExpired: false,
          error: "JWT secret not configured",
        };
      }

      const payload = await this.jwtService.verifyAsync(token, { secret });

      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;
      const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;

      return {
        isValid: true,
        isExpired: false,
        expiresAt,
        issuedAt,
        payload,
      };
    } catch (error) {
      return this.handleTokenError(error);
    }
  }

  extractPayload(token: string): any {
    try {
      const base64Payload = token.split(".")[1];
      if (!base64Payload) {
        return null;
      }

      const payload = Buffer.from(base64Payload, "base64").toString("utf-8");
      return JSON.parse(payload);
    } catch (error) {
      this.logger.warn("Failed to extract payload from token", error);
      return null;
    }
  }

  getTokenExpirationTime(token: string): Date | null {
    try {
      const payload = this.extractPayload(token);
      return payload?.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      this.logger.warn("Failed to get token expiration time", error);
      return null;
    }
  }

  private handleTokenError(error: any): TokenInfo {
    const payload = error.payload as ExtendedJwtPayload;
    const expiresAt = payload?.exp ? new Date(payload.exp * 1000) : undefined;
    const issuedAt = payload?.iat ? new Date(payload.iat * 1000) : undefined;

    if (error.name === "TokenExpiredError") {
      return {
        isValid: false,
        isExpired: true,
        expiresAt,
        issuedAt,
        payload,
        error: "Token expired",
      };
    }

    return {
      isValid: false,
      isExpired: false,
      expiresAt,
      issuedAt,
      payload,
      error: error.message || "Invalid token",
    };
  }
}
