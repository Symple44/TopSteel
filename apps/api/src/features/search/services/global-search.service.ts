import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type {
  ISearchStrategy,
  SearchOptions,
  SearchResponse,
} from '../interfaces/search.interfaces'
import type { SearchDocument, SearchStatistics } from '../types/search-types'
import type { ElasticsearchSearchService } from './elasticsearch-search.service'
import type { PostgreSQLSearchService } from './postgresql-search.service'
import type { SearchIndexingOperationsService } from './search-indexing-operations.service'

// Re-export interfaces for backwards compatibility
export type {
  SearchOptions,
  SearchResponse,
  SearchResult,
} from '../interfaces/search.interfaces'

// Main search service with adaptive strategy
@Injectable()
export class GlobalSearchService implements OnModuleInit {
  private readonly logger = new Logger(GlobalSearchService.name)
  private searchStrategy: ISearchStrategy

  constructor(
    private readonly elasticsearchService: ElasticsearchSearchService,
    private readonly postgresqlService: PostgreSQLSearchService,
    private readonly indexingService: SearchIndexingOperationsService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    await this.initializeSearchStrategy()

    // Create ElasticSearch index if available
    if (this.searchStrategy === this.elasticsearchService) {
      await this.elasticsearchService.createIndex()
    }
  }

  private async initializeSearchStrategy() {
    const useElasticsearch = this.configService.get<boolean>('ELASTICSEARCH_ENABLED', true)

    if (useElasticsearch) {
      const isElasticsearchAvailable = await this.elasticsearchService.isAvailable()

      if (isElasticsearchAvailable) {
        this.logger.log('✅ Using ElasticSearch for global search')
        this.searchStrategy = this.elasticsearchService
      } else {
        this.logger.warn('⚠️ ElasticSearch not available, falling back to PostgreSQL')
        this.searchStrategy = this.postgresqlService
      }
    } else {
      this.logger.log('ℹ️ ElasticSearch disabled, using PostgreSQL for global search')
      this.searchStrategy = this.postgresqlService
    }
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    try {
      // Add default values
      const searchOptions: SearchOptions = {
        ...options,
        limit: options.limit || 10,
        offset: options.offset || 0,
      }

      // Log search in development only
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Searching for: "${options.query}" with engine: ${this.getSearchEngineStatus().engine}`
        )
      }

      return await this.searchStrategy.search(searchOptions)
    } catch (error) {
      // If ElasticSearch fails, try with PostgreSQL
      if (this.searchStrategy === this.elasticsearchService) {
        this.logger.warn('ElasticSearch search failed, trying PostgreSQL fallback')
        return await this.postgresqlService.search(options)
      }
      throw error
    }
  }

  async indexDocument(type: string, id: string, document: SearchDocument): Promise<void> {
    return this.indexingService.indexDocument(type, id, document)
  }

  async deleteDocument(type: string, id: string): Promise<void> {
    return this.indexingService.deleteDocument(type, id)
  }

  async reindexAll(tenantId?: string): Promise<number> {
    return this.indexingService.reindexAll(tenantId)
  }

  getSearchEngineStatus(): { engine: string; available: boolean; info?: string } {
    return {
      engine: this.searchStrategy === this.elasticsearchService ? 'elasticsearch' : 'postgresql',
      available: true,
      info:
        this.searchStrategy === this.elasticsearchService
          ? '🚀 High-performance search with ElasticSearch'
          : '📊 Database search with PostgreSQL',
    }
  }

  async getSearchStatistics(): Promise<SearchStatistics> {
    const stats: SearchStatistics = {
      totalSearches: 0, // This would come from analytics/logging
      averageResponseTime: 0, // This would come from performance monitoring
      popularQueries: [], // This would come from search analytics
      searchEngineStatus:
        this.searchStrategy === this.elasticsearchService ? 'healthy' : 'degraded',
      indexCounts: {}, // This would come from index status
      lastIndexUpdate: new Date(),
    }

    return stats
  }
}
