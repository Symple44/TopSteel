// apps/api/src/config/jwt.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  // Validation des secrets en production
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set and at least 32 characters long in production'
      );
    }
    if (!refreshSecret || refreshSecret.length < 32) {
      throw new Error(
        'JWT_REFRESH_SECRET must be set and at least 32 characters long in production'
      );
    }
    if (secret === refreshSecret) {
      throw new Error(
        'JWT_SECRET and JWT_REFRESH_SECRET must be different in production'
      );
    }
  }

  return {
    // Access Token Configuration
    secret: secret ?? 'dev-access-secret-not-for-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    
    // Refresh Token Configuration
    refreshSecret: refreshSecret ?? 'dev-refresh-secret-not-for-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    
    // Token Settings
    issuer: process.env.JWT_ISSUER ?? 'topsteel-erp',
    audience: process.env.JWT_AUDIENCE ?? 'topsteel-users',
    
    // Security Options
    algorithm: 'HS256',
    noTimestamp: false,
    clockTolerance: 30, // 30 seconds
    
    // Validation Options
    ignoreExpiration: false,
    ignoreNotBefore: false,
    
    // Custom Claims
    customClaims: {
      company: process.env.COMPANY_NAME ?? 'TopSteel',
      version: process.env.APP_VERSION ?? '1.0.0',
    },
  };
});