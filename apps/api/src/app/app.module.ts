// apps/api/src/app.module.ts
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
// Controllers
import { TestController } from '../api/controllers/test.controller'
// Middleware
import { EnhancedMiddleware } from '../core/common/middleware/enhanced.middleware'
import { LoggerMiddleware } from '../core/common/middleware/logger.middleware'
// Core modules
import { CoreModule } from '../core/core.module'
import { SecurityModule } from '../core/security/security.module'
// Domain modules
import { AuthModule } from '../domains/auth/auth.module'
import { RoleAuthModule } from '../domains/auth/role-auth.module'
import { BusinessModule } from '../domains/business.module'
import { UsersModule } from '../domains/users/users.module'
// Feature modules
import { FeaturesModule } from '../features/features.module'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'
import { TokenVersionMiddleware } from '../infrastructure/middleware/token-version.middleware'
import { CsrfMiddleware } from '../infrastructure/security/csrf'
import { ConsolidatedSecurityMiddleware } from '../infrastructure/security/enhanced-security.middleware'
import { AppController } from './app.controller'
import { AppService } from './app.service'

/**
 * Main Application Module
 *
 * This module has been simplified to import high-level feature modules
 * instead of individual modules. This makes the application structure
 * more maintainable and easier to understand.
 *
 * Module organization:
 * - CoreModule: Infrastructure (DB, Redis, Config, Health, Monitoring)
 * - InfrastructureModule: Technical components (JWT, Security)
 * - AuthModule & RoleAuthModule: Authentication and authorization
 * - BusinessModule: Core business domain logic
 * - FeaturesModule: Application features (Admin, Pricing, Search, etc.)
 * - UsersModule: User management
 */
@Module({
  imports: [
    // Core infrastructure (Config, DB, Redis, Health, Monitoring)
    CoreModule,

    // Enhanced security with CSP and nonce support
    SecurityModule,

    // Technical infrastructure (JWT, Security)
    InfrastructureModule,

    // Authentication & Authorization
    AuthModule,
    RoleAuthModule,

    // Core business domains
    BusinessModule,
    UsersModule,

    // Application features
    FeaturesModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Ordre d'exécution des middleware (du premier au dernier)
    // 1. Sécurité - doit être appliqué en premier
    consumer.apply(ConsolidatedSecurityMiddleware).forRoutes('*')

    // 2. Protection CSRF - après la sécurité de base, avant l'authentification
    consumer.apply(CsrfMiddleware).forRoutes('*')

    // 3. Validation des tokens - après CSRF
    consumer.apply(TokenVersionMiddleware).forRoutes('*')

    // 4. Métriques et performance - avant le logging
    consumer.apply(EnhancedMiddleware).forRoutes('*')

    // 5. Logging - en dernier pour capturer toutes les informations
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
