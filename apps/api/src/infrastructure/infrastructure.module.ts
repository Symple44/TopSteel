import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { CsrfModule } from './security/csrf'
import { EnhancedThrottlerGuard } from './security/guards/enhanced-throttler.guard'
import { LogSanitizationModule } from './security/log-sanitization'
import { RateLimitingModule } from './security/rate-limiting/rate-limiting.module'

/**
 * Infrastructure Module
 *
 * Contains all technical infrastructure components:
 * - Security middleware and guards (CSRF, Enhanced Security, etc.)
 * - Advanced Rate Limiting with granular per-user controls
 * - JWT configuration
 * - CSRF protection module
 * - Log sanitization for production security
 * - WebSockets (when needed)
 * - File upload/storage (when needed)
 * - Message queues (when needed)
 */
@Global()
@Module({
  imports: [
    // Protection CSRF
    CsrfModule,

    // Sanitisation des logs
    LogSanitizationModule,

    // Advanced Rate Limiting with comprehensive features
    RateLimitingModule.forRoot({
      enableMonitoring: process.env.NODE_ENV === 'production',
      enableProgressivePenalties: process.env.NODE_ENV === 'production',
    }),

    // JWT pour middleware global
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret && process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be defined in production environment')
        }
        // En développement seulement, générer un secret temporaire
        const secret =
          jwtSecret ||
          (process.env.NODE_ENV === 'development'
            ? `dev-only-secret-${Date.now()}-min-32-chars-long`
            : undefined)

        if (!secret) {
          throw new Error('JWT_SECRET is required')
        }

        return {
          secret,
          signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
        }
      },
      global: true,
    }),
  ],
  providers: [
    EnhancedThrottlerGuard,
    // Note: Middleware are not provided here, they are applied in AppModule.configure()
  ],
  exports: [
    JwtModule,
    EnhancedThrottlerGuard,
    CsrfModule,
    LogSanitizationModule,
    RateLimitingModule,
  ],
})
export class InfrastructureModule {}
