import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { TypeOrmModule } from '@nestjs/typeorm'
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
    ConfigModule,
    EventEmitterModule,
    TypeOrmModule.forFeature([], 'default'), // Base auth
    TypeOrmModule.forFeature([], 'tenant'), // Base tenant
    RedisModule.forRoot(), // Import Redis module for caching
  ],
  controllers: [SearchController, SearchCacheController],
  providers: [
    // Redis service
    RedisService,

    // Provide REDIS_CLIENT for cache service
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
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
    PostgreSQLSearchService,
    SearchIndexingOperationsService,

    // Cache services
    SearchCacheService,
    SearchCacheInvalidationService,

    // Main orchestrator services
    GlobalSearchService,
    SearchIndexingService,

    // Enhanced cached search service
    CachedGlobalSearchService,
  ],
  exports: [
    // Core services
    GlobalSearchService,
    SearchIndexingService,
    SearchIndexingOperationsService,
    ElasticsearchSearchService,
    PostgreSQLSearchService,
    SearchResultFormatterService,

    // Cache services
    SearchCacheService,
    SearchCacheInvalidationService,
    CachedGlobalSearchService,
  ],
})
export class SearchModule {}
