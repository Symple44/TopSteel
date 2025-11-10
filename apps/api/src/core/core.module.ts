import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TerminusModule } from '@nestjs/terminus'
import { ThrottlerModule } from '@nestjs/throttler'
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus'
// Monitoring
import { CircuitBreakerService } from '../infrastructure/monitoring/circuit-breaker.service'
import { CircuitBreakerHealthIndicator } from '../infrastructure/monitoring/circuit-breaker-health.indicator'
import { MetricsService } from '../infrastructure/monitoring/metrics.service'
import { MetricsSafeInterceptor } from '../infrastructure/monitoring/metrics-safe.interceptor'
import {
  CUSTOM_METRICS,
  prometheusAsyncConfig,
} from '../infrastructure/monitoring/prometheus.config'
// Configuration
import { appConfig } from './config/app.config'
import { databaseConfig } from './config/database.config'
import { jwtConfig } from './config/jwt.config'
import { redisConfig } from './config/redis.config'
import { throttlerAsyncConfig } from './config/throttler.config'
// Database
import { DatabaseMultiTenantModule } from './database/database-multi-tenant.module'
// Health
import { HealthController } from './health/health.controller'
import { IntegrityService } from './health/integrity.service'
import { SystemHealthService } from './health/system-health-simple.service'
// Redis
import { RedisModule } from './redis/redis.module'

/**
 * Core Module
 *
 * Contains all core infrastructure components:
 * - Configuration management
 * - Database connections
 * - Cache (Redis)
 * - Health checks
 * - Monitoring and metrics
 * - Scheduling
 * - Rate limiting
 */
@Global()
@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'], // Cherche d'abord dans apps/api, puis à la racine
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      expandVariables: true,
    }),

    // Database
    DatabaseMultiTenantModule,

    // Scheduling
    ScheduleModule.forRoot(),

    // Health checks
    TerminusModule,

    // Cache
    RedisModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRootAsync(throttlerAsyncConfig),

    // Metrics
    PrometheusModule.registerAsync(prometheusAsyncConfig),
  ],
  controllers: [HealthController],
  providers: [
    // Health services
    IntegrityService,
    SystemHealthService,

    // Monitoring services
    MetricsService,
    MetricsSafeInterceptor,
    CircuitBreakerService,
    CircuitBreakerHealthIndicator,

    // Prometheus metrics
    makeCounterProvider(CUSTOM_METRICS.HTTP_REQUESTS_TOTAL),
    makeHistogramProvider(CUSTOM_METRICS.HTTP_REQUEST_DURATION),
    makeCounterProvider(CUSTOM_METRICS.AUTH_FAILURES),
    makeGaugeProvider(CUSTOM_METRICS.DB_CONNECTIONS),
    makeCounterProvider(CUSTOM_METRICS.CACHE_OPERATIONS),
    makeHistogramProvider(CUSTOM_METRICS.UPLOAD_SIZE),
    makeGaugeProvider(CUSTOM_METRICS.ACTIVE_SESSIONS),
  ],
  exports: [
    ConfigModule,
    DatabaseMultiTenantModule,
    RedisModule,
    MetricsService,
    MetricsSafeInterceptor,
    CircuitBreakerService,
  ],
})
export class CoreModule {}
