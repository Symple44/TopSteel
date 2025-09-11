/**
 * Advanced Rate Limiting Module
 * Centralized module for comprehensive rate limiting functionality
 */

import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
// Redis Module (assuming it exists)
import { RedisModule } from '../../../core/redis/redis.module'

// Services
import { AdvancedRateLimitingService } from './advanced-rate-limiting.service'
// Guards
import { AdvancedRateLimitGuard } from './guards/advanced-rate-limit.guard'
import { CombinedRateLimitGuard } from './guards/combined-rate-limit.guard'
import { RoleBasedRateLimitGuard } from './guards/role-based-rate-limit.guard'
import { UserRateLimitGuard } from './guards/user-rate-limit.guard'
// Configuration
import { rateLimitingConfig } from './rate-limiting.config'
import { ProgressivePenaltyService } from './services/progressive-penalty.service'
import { RateLimitingMonitoringService } from './services/rate-limiting-monitoring.service'

@Global()
@Module({
  imports: [ConfigModule.forFeature(rateLimitingConfig), RedisModule, ScheduleModule.forRoot()],
  providers: [
    // Core services
    AdvancedRateLimitingService,
    ProgressivePenaltyService,
    RateLimitingMonitoringService,

    // Guards
    AdvancedRateLimitGuard,
    UserRateLimitGuard,
    RoleBasedRateLimitGuard,
    CombinedRateLimitGuard,
  ],
  exports: [
    // Export services for use in other modules
    AdvancedRateLimitingService,
    ProgressivePenaltyService,
    RateLimitingMonitoringService,

    // Export guards for use in controllers
    AdvancedRateLimitGuard,
    UserRateLimitGuard,
    RoleBasedRateLimitGuard,
    CombinedRateLimitGuard,
  ],
})
export class RateLimitingModule {
  /**
   * Configure rate limiting with custom settings
   */
  static forRoot(options?: {
    enableMonitoring?: boolean
    enableProgressivePenalties?: boolean
    customConfig?: Record<string, unknown>
  }) {
    return {
      module: RateLimitingModule,
      imports: [
        ConfigModule.forFeature(() => ({
          rateLimiting: {
            ...rateLimitingConfig(),
            monitoring: {
              ...rateLimitingConfig().monitoring,
              enabled: options?.enableMonitoring ?? rateLimitingConfig().monitoring.enabled,
            },
            penalties: {
              ...rateLimitingConfig().penalties,
              enabled:
                options?.enableProgressivePenalties ?? rateLimitingConfig().penalties.enabled,
            },
            ...options?.customConfig,
          },
        })),
        RedisModule,
        ScheduleModule.forRoot(),
      ],
      providers: [
        AdvancedRateLimitingService,
        ProgressivePenaltyService,
        RateLimitingMonitoringService,
        AdvancedRateLimitGuard,
        UserRateLimitGuard,
        RoleBasedRateLimitGuard,
        CombinedRateLimitGuard,
      ],
      exports: [
        AdvancedRateLimitingService,
        ProgressivePenaltyService,
        RateLimitingMonitoringService,
        AdvancedRateLimitGuard,
        UserRateLimitGuard,
        RoleBasedRateLimitGuard,
        CombinedRateLimitGuard,
      ],
    }
  }

  /**
   * Configure rate limiting for feature modules
   */
  static forFeature(guards: ('advanced' | 'user' | 'role' | 'combined')[] = ['advanced']) {
    const guardProviders = []

    if (guards.includes('advanced')) guardProviders.push(AdvancedRateLimitGuard)
    if (guards.includes('user')) guardProviders.push(UserRateLimitGuard)
    if (guards.includes('role')) guardProviders.push(RoleBasedRateLimitGuard)
    if (guards.includes('combined')) guardProviders.push(CombinedRateLimitGuard)

    return {
      module: RateLimitingModule,
      providers: guardProviders,
      exports: guardProviders,
    }
  }
}
