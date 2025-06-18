// apps/api/src/config/jwt.config.ts
export default () => ({
    jwt: {
      secret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        issuer: process.env.JWT_ISSUER || "erp-topsteel",
        audience: process.env.JWT_AUDIENCE || "erp-topsteel-users",
      },
      
      // Refresh token configuration
      refreshToken: {
        secret: process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production",
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      },
  
      // Password reset token
      passwordReset: {
        secret: process.env.JWT_PASSWORD_RESET_SECRET || "your-password-reset-secret",
        expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || "1h",
      },
  
      // Email verification token
      emailVerification: {
        secret: process.env.JWT_EMAIL_VERIFICATION_SECRET || "your-email-verification-secret",
        expiresIn: process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN || "24h",
      },
    },
  });