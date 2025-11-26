import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'

import { RedisService } from '../../core/common/services/redis.service'
import { RedisModule } from '../../core/redis/redis.module'
import { SearchController } from './controllers/search.controller'
import { SearchCacheController } from './controllers/search-cache.controller'
import { CachedGlobalSearchService } from './services/cached-global-search.service'
import { ElasticsearchSearchService } from './services/elasticsearch-search.service'
import { GlobalSearchService } from './services/global-search.service'
import { PostgreSQLSearchService } from './services/postgresql-search.service'
import { SearchCacheService } from './services/search-cache.service'
import { SearchCacheInvalidationService } from './services/search-cache-invalidation.service'
import { SearchIndexingService } from './services/search-indexing.service'
import { SearchIndexingOperationsService } from './services/search-indexing-operations.service'
import { SearchResultFormatterService } from './services/search-result-formatter.service'

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    EventEmitterModule.forRoot(),
    // TypeORM repositories disabled - using Prisma services
    // // Base auth
    // // Base tenant
    RedisModule.forRoot(), // Import Redis module for caching
  ],
  controllers: [SearchController, SearchCacheController],
  providers: [
    // Redis service
    RedisService,

    // Provide REDIS_CLIENT for cache service (null when disabled)
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        if (process.env.CACHE_ENABLED === 'false') {
          return null
        }
        const Redis = require('ioredis')
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0', 10),
        })
      },
    },

    // Core services
    SearchResultFormatterService,
    ElasticsearchSearchService,
    PostgreSQLSearchService, // Clean - uses pure Prisma
    SearchIndexingOperationsService, // Clean - uses pure Prisma

    // Cache services
    SearchCacheService,
    SearchCacheInvalidationService,

    // Main orchestrator services
    GlobalSearchService, // Re-enabled - dependencies fixed
    SearchIndexingService,

    // Enhanced cached search service
    CachedGlobalSearchService
  ],
  exports: [
    // Core services
    // GlobalSearchService, // Disabled - may depend on disabled services
    // SearchIndexingService, // Disabled - may depend on disabled services
    // SearchIndexingOperationsService, // Disabled - uses @InjectDataSource('auth', 'tenant')
    ElasticsearchSearchService,
    // PostgreSQLSearchService, // Disabled - uses @InjectDataSource('auth', 'tenant')
    SearchResultFormatterService,

    // Cache services
    SearchCacheService,
    SearchCacheInvalidationService,
    // CachedGlobalSearchService, // Disabled - may depend on disabled services
  ],
})
export class SearchModule {}
