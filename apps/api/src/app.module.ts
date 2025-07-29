// apps/api/src/app.module.ts
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TerminusModule } from '@nestjs/terminus'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrometheusModule, makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus'
// Controllers
import { AppController } from './app.controller'
import { TestController } from './test.controller'
import { AppService } from './app.service'
// Middleware
import { LoggerMiddleware } from './common/middleware/logger.middleware'
// Configuration
import { appConfig } from './config/app.config'
import { databaseConfig } from './config/database.config'
import { jwtConfig } from './config/jwt.config'
import { redisConfig } from './config/redis.config'
import { throttlerAsyncConfig } from './config/throttler.config'
import { prometheusAsyncConfig, CUSTOM_METRICS } from './config/prometheus.config'
// Modules système
// import { DatabaseProductionModule } from './database/database-production.module'
import { DatabaseMultiTenantModule } from './modules/database/database-multi-tenant.module'
import { HealthController } from './health/health.controller'
import { IntegrityService } from './health/integrity.service'
// Module d'authentification
import { AuthModule } from './modules/auth/auth.module'
import { RoleAuthModule } from './modules/auth/role-auth.module'
// Module d'administration
import { AdminModule } from './modules/admin/admin.module'
// Module de paramètres
import { ParametersModule } from './modules/parameters/parameters.module'
// Modules métier harmonisés
import { ClientsModule } from './modules/clients/clients.module'
import { CommandesModule } from './modules/commandes/commandes.module'
import { DevisModule } from './modules/devis/devis.module'
import { DocumentsModule } from './modules/documents/documents.module'
import { FacturationModule } from './modules/facturation/facturation.module'
import { FournisseursModule } from './modules/fournisseurs/fournisseurs.module'
import { MachinesModule } from './modules/machines/machines.module'
import { MaintenanceModule } from './modules/maintenance/maintenance.module'
import { MateriauxModule } from './modules/materiaux/materiaux.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { PlanningModule } from './modules/planning/planning.module'
import { ProductionModule } from './modules/production/production.module'
import { ProjetsModule } from './modules/projets/projets.module'
import { QualiteModule } from './modules/qualite/qualite.module'
import { StocksModule } from './modules/stocks/stocks.module'
import { TracabiliteModule } from './modules/tracabilite/tracabilite.module'
import { UsersModule } from './modules/users/users.module'
import { MenuModule } from './modules/menu/menu.module'
import { QueryBuilderModule } from './modules/query-builder/query-builder.module'
import { UiPreferencesModule } from './modules/ui-preferences.module'
import { RedisModule } from './redis/redis.module'
import { MarketplaceAppModule } from './modules/marketplace/marketplace.module'
// Modules multi-tenant
import { SocietesModule } from './modules/societes/societes.module'
import { SharedModule } from './modules/shared/shared.module'
// Module Database Core
import { DatabaseCoreModule } from './modules/database-core/database-core.module'
// Service d'initialisation automatique
import { DatabaseStartupService } from './services/database-startup.service'
import { SystemHealthService } from './health/system-health-simple.service'
import { MetricsService } from './common/services/metrics.service'
import { MetricsSafeInterceptor } from './common/interceptors/metrics-safe.interceptor'
import { CircuitBreakerService } from './common/services/circuit-breaker.service'
import { CircuitBreakerHealthIndicator } from './health/circuit-breaker-health.indicator'
import { EnhancedThrottlerGuard } from './common/guards/enhanced-throttler.guard'

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      expandVariables: true,
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

    // Marketplace
    MarketplaceAppModule,

    // Modules multi-tenant
    SocietesModule,
    SharedModule,

    // Modules métier essentiels (activés)
    UsersModule,
    MenuModule,
    
    // Modules métier à réactiver progressivement
    // ClientsModule,
    // FournisseursModule,
    // MateriauxModule,
    // StocksModule,
    // CommandesModule,
    
    // Modules métier avancés (désactivés temporairement)
    // DevisModule,
    // DocumentsModule,
    // FacturationModule,
    // NotificationsModule,
    // ProductionModule,
    // ProjetsModule,
    QueryBuilderModule, // Activé pour le test multi-tenant
    // UiPreferencesModule,
    // MachinesModule,
    // MaintenanceModule,
    // PlanningModule,
    // QualiteModule,
    // TracabiliteModule,
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
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
