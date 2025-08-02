// apps/api/src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { TerminusModule } from '@nestjs/terminus'
import { ThrottlerModule } from '@nestjs/throttler'
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus'
// Controllers
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EnhancedThrottlerGuard } from '../infrastructure/security/guards/enhanced-throttler.guard'
import { MetricsSafeInterceptor } from '../infrastructure/monitoring/metrics-safe.interceptor'
// Middleware
import { ConsolidatedSecurityMiddleware } from '../infrastructure/security/enhanced-security.middleware'
import { EnhancedMiddleware } from '../core/common/middleware/enhanced.middleware'
import { LoggerMiddleware } from '../core/common/middleware/logger.middleware'
import { TokenVersionMiddleware } from '../infrastructure/middleware/token-version.middleware'
import { CircuitBreakerService } from '../infrastructure/monitoring/circuit-breaker.service'
import { MetricsService } from '../infrastructure/monitoring/metrics.service'
// Configuration
import { appConfig } from '../core/config/app.config'
import { databaseConfig } from '../core/config/database.config'
import { jwtConfig } from '../core/config/jwt.config'
import { CUSTOM_METRICS, prometheusAsyncConfig } from '../infrastructure/monitoring/prometheus.config'
import { redisConfig } from '../core/config/redis.config'
import { throttlerAsyncConfig } from '../core/config/throttler.config'
import { CircuitBreakerHealthIndicator } from '../infrastructure/monitoring/circuit-breaker-health.indicator'
import { HealthController } from '../core/health/health.controller'
import { IntegrityService } from '../core/health/integrity.service'
import { SystemHealthService } from '../core/health/system-health-simple.service'
// Module d'administration
import { AdminModule } from '../features/admin/admin.module'
// Module d'authentification
import { AuthModule } from '../domains/auth/auth.module'
import { RoleAuthModule } from '../domains/auth/role-auth.module'
// Modules système
// import { DatabaseProductionModule } from '../core/database/database-production.module'
import { DatabaseModule } from '../core/database/database.module'
import { DatabaseMultiTenantModule } from '../core/database/database-multi-tenant.module'
// Module Database Core
import { DatabaseCoreModule } from '../features/database-core/database-core.module'
import { MarketplaceAppModule } from '../features/marketplace/marketplace.module'
import { MenuModule } from '../features/menu/menu.module'
// Module de paramètres
import { ParametersModule } from '../features/parameters/parameters.module'
import { QueryBuilderModule } from '../features/query-builder/query-builder.module'
import { SharedModule } from '../features/shared/shared.module'
// Modules multi-tenant
import { SocietesModule } from '../features/societes/societes.module'
// Modules métier harmonisés
// import { NotificationsModule } from '../features/notifications/notifications.module'
import { UsersModule } from '../domains/users/users.module'
// Module de pricing sectoriel
import { PricingModule } from '../modules/pricing/pricing.module'
// Nouveau module business centralisé (architecture DDD)
import { BusinessModule } from '../domains/business.module'
import { RedisModule } from '../core/redis/redis.module'
// Service d'initialisation automatique
import { DatabaseStartupService } from '../core/services/database-startup.service'
import { TestController } from '../api/controllers/test.controller'

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      expandVariables: true,
    }),
    
    // JWT pour middleware global
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'default-secret',
        signOptions: { expiresIn: '1h' },
      }),
      global: true,
    }),

    // Modules système
    DatabaseMultiTenantModule,
    DatabaseCoreModule,
    // DatabaseProductionModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    RedisModule.forRoot(),
    ThrottlerModule.forRootAsync(throttlerAsyncConfig),
    PrometheusModule.registerAsync(prometheusAsyncConfig),

    // Authentification
    AuthModule,
    RoleAuthModule,

    // Administration
    AdminModule,
    ParametersModule,

    // Marketplace - supprimé pour simplifier
    // MarketplaceAppModule,

    // Modules multi-tenant
    SocietesModule,
    SharedModule,

    // Modules métier essentiels (activés)
    UsersModule,
    MenuModule,
    PricingModule,

    // Nouveau module business centralisé (architecture DDD)
    BusinessModule,

    // Modules métier à réactiver progressivement (supprimés pour optimiser)
    // NotificationsModule,
    QueryBuilderModule, // Activé pour le test multi-tenant
  ],
  controllers: [AppController, TestController, HealthController],
  providers: [
    AppService,
    IntegrityService,
    DatabaseStartupService,
    SystemHealthService,
    MetricsService,
    MetricsSafeInterceptor,
    CircuitBreakerService,
    CircuitBreakerHealthIndicator,
    EnhancedThrottlerGuard,
    // Métriques Prometheus personnalisées
    makeCounterProvider(CUSTOM_METRICS.HTTP_REQUESTS_TOTAL),
    makeHistogramProvider(CUSTOM_METRICS.HTTP_REQUEST_DURATION),
    makeCounterProvider(CUSTOM_METRICS.AUTH_FAILURES),
    makeGaugeProvider(CUSTOM_METRICS.DB_CONNECTIONS),
    makeCounterProvider(CUSTOM_METRICS.CACHE_OPERATIONS),
    makeHistogramProvider(CUSTOM_METRICS.UPLOAD_SIZE),
    makeGaugeProvider(CUSTOM_METRICS.ACTIVE_SESSIONS),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Ordre d'exécution des middleware (du premier au dernier)
    // 1. Sécurité - doit être appliqué en premier
    consumer
      .apply(ConsolidatedSecurityMiddleware)
      .forRoutes('*')
    
    // 2. Validation des tokens - après la sécurité de base
    consumer
      .apply(TokenVersionMiddleware)
      .forRoutes('*')
    
    // 3. Métriques et performance - avant le logging
    consumer
      .apply(EnhancedMiddleware)
      .forRoutes('*')
    
    // 4. Logging - en dernier pour capturer toutes les informations
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*')
  }
}
