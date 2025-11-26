/**
 * Tenant-Aware Cache Module
 *
 * Module de cache multi-tenant avec isolation automatique.
 *
 * Usage:
 *   import { CacheModule, TenantCacheService } from '@/core/cache'
 */

export { CacheModule } from './cache.module'
export { TenantCacheService } from './tenant-cache.service'
export { TenantRedisCacheService } from './tenant-redis-cache.service'
