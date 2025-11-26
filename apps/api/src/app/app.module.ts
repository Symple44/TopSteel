// apps/api/src/app.module.ts
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
// Controllers
import { TestController } from '../api/controllers/test.controller'
// Middleware
import { EnhancedMiddleware } from '../core/common/middleware/enhanced.middleware'
import { LoggerMiddleware } from '../core/common/middleware/logger.middleware'
// Core modules
import { CoreModule } from '../core/core.module'
import { SecurityModule } from '../core/security/security.module'
// Multi-tenant
import { MultiTenantModule, TenantGuard, TenantRLSInterceptor } from '../core/multi-tenant'
// Domain modules
import { AuthModule } from '../domains/auth/auth.module'
import { AuthPrismaModule } from '../domains/auth/prisma/auth-prisma.module'
import { RoleAuthModule } from '../domains/auth/role-auth.module'
import { BusinessModule } from '../domains/business.module'
import { UsersModule } from '../domains/users/users.module'
import { UsersPrismaModule } from '../domains/users/prisma/users-prisma.module'
import { ApiControllersModule } from '../domains/api-controllers.module'
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

    // Multi-tenant support (RLS, context, middleware)
    MultiTenantModule,

    // Enhanced security with CSP and nonce support
    SecurityModule,

    // Technical infrastructure (JWT, Security)
    InfrastructureModule,

    // Authentication & Authorization
    AuthModule,
    AuthPrismaModule, // Phase 1-7: Prisma auth (login, roles, sessions)
    RoleAuthModule,

    // Core business domains
    BusinessModule,
    UsersModule,
    UsersPrismaModule, // Phase 6-7: Prisma users management

    // Phase 9: API Controllers with standard routes (no -prisma suffix)
    ApiControllersModule, // Wires new Prisma controllers: /users, /auth, /societes, etc.

    // Application features
    FeaturesModule,
  ],
  controllers: [AppController, TestController],
  providers: [
    AppService,
    // Multi-tenant global guard (applies to all routes)
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // Multi-tenant RLS interceptor (configures PostgreSQL session variables)
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantRLSInterceptor,
    },
  ],
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
