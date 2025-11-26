import { Module, Global } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TenantCacheService } from './tenant-cache.service'
import { TenantRedisCacheService } from './tenant-redis-cache.service'
import { MultiTenantModule } from '../multi-tenant/multi-tenant.module'

/**
 * CacheModule
 *
 * Module global de cache tenant-aware.
 *
 * Fournit deux implémentations:
 * - TenantCacheService: Cache mémoire (développement/tests)
 * - TenantRedisCacheService: Cache Redis (production)
 *
 * Configuration:
 *   CACHE_PROVIDER=memory|redis (défaut: memory)
 *   CACHE_ENABLED=true|false (défaut: true)
 *   REDIS_HOST=localhost
 *   REDIS_PORT=6379
 *
 * Usage:
 *   constructor(
 *     @Inject('TENANT_CACHE') private cache: TenantCacheService
 *   ) {}
 *
 *   // Ou directement
 *   constructor(private cache: TenantCacheService) {}
 */
@Global()
@Module({
  imports: [ConfigModule, MultiTenantModule],
  providers: [
    TenantCacheService,
    TenantRedisCacheService,
    {
      provide: 'TENANT_CACHE',
      useFactory: (
        configService: ConfigService,
        memoryCache: TenantCacheService,
        redisCache: TenantRedisCacheService
      ) => {
        const provider = configService.get<string>('CACHE_PROVIDER', 'memory')

        if (provider === 'redis') {
          return redisCache
        }

        return memoryCache
      },
      inject: [ConfigService, TenantCacheService, TenantRedisCacheService],
    },
  ],
  exports: [TenantCacheService, TenantRedisCacheService, 'TENANT_CACHE'],
})
export class CacheModule {}
