import { Injectable, Logger } from '@nestjs/common'
import { getErrorMessage, hasStack } from '../../../core/common/utils'
import type {
  ISearchStrategy,
  SearchOptions,
  SearchResponse,
} from '../interfaces/search.interfaces'
import type { SearchDocument, SearchStatistics } from '../types/search-types'
import type { GlobalSearchService } from './global-search.service'
import type { SearchCacheService } from './search-cache.service'

/**
 * Cached wrapper for GlobalSearchService using decorator pattern
 * This service adds caching capabilities to the existing search functionality
 * without modifying the original GlobalSearchService
 */
@Injectable()
export class CachedGlobalSearchService implements ISearchStrategy {
  private readonly logger = new Logger(CachedGlobalSearchService.name)

  constructor(
    private readonly globalSearchService: GlobalSearchService,
    private readonly cacheService: SearchCacheService
  ) {}

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    // Check if the search service is available
    const searchStatus = this.globalSearchService.getSearchEngineStatus()
    const cacheAvailable = this.cacheService.isEnabled()
    return searchStatus.available && cacheAvailable
  }

  /**
   * Search with caching support
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    // Extract tenant ID from options (assuming it's passed in the context)
    const tenantId = this.extractTenantId(options)

    if (!tenantId) {
      this.logger.warn('No tenant ID found in search options, bypassing cache')
      return this.globalSearchService.search(options)
    }

    try {
      // Try to get results from cache first
      const cachedResults = await this.cacheService.getCachedSearchResults(tenantId, options)

      if (cachedResults) {
        this.logger.debug(`Cache hit for tenant ${tenantId}, query: "${options.query}"`)

        // Add cache hit indicator to response
        return {
          ...cachedResults,
          metadata: {
            ...cachedResults.metadata,
            cached: true,
            cacheHit: true,
          },
        }
      }

      // Cache miss - perform actual search
      this.logger.debug(`Cache miss for tenant ${tenantId}, query: "${options.query}"`)
      const searchResults = await this.globalSearchService.search(options)

      // Cache the results asynchronously (don't block the response)
      this.cacheSearchResults(tenantId, options, searchResults)

      // Add cache miss indicator to response
      return {
        ...searchResults,
        metadata: {
          ...searchResults.metadata,
          cached: false,
          cacheHit: false,
        },
      }
    } catch (error) {
      this.logger.error(
        `Search with cache failed: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )

      // Fallback to direct search if cache fails
      this.logger.debug('Falling back to direct search due to cache error')
      return this.globalSearchService.search(options)
    }
  }

  /**
   * Cache search results asynchronously
   */
  private async cacheSearchResults(
    tenantId: string,
    options: SearchOptions,
    results: SearchResponse
  ): Promise<void> {
    try {
      await this.cacheService.cacheSearchResults(tenantId, options, results)
    } catch (error) {
      this.logger.error(
        `Failed to cache search results: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      // Don't throw - caching is non-critical
    }
  }

  /**
   * Index document with cache invalidation
   */
  async indexDocument(type: string, id: string, document: SearchDocument): Promise<void> {
    // Perform the actual indexing
    await this.globalSearchService.indexDocument(type, id, document)

    // Invalidate cache for this entity type
    const tenantId = this.extractTenantIdFromDocument(document)
    if (tenantId) {
      await this.invalidateEntityCache(tenantId, type)
    }
  }

  /**
   * Delete document with cache invalidation
   */
  async deleteDocument(type: string, id: string): Promise<void> {
    // Perform the actual deletion
    await this.globalSearchService.deleteDocument(type, id)

    // Note: We can't extract tenant ID from just type and id
    // In a real implementation, you might need to pass tenant context
    // or maintain a mapping of document IDs to tenant IDs
    this.logger.debug(`Document deleted: ${type}:${id} - consider invalidating relevant caches`)
  }

  /**
   * Reindex all with full cache invalidation
   */
  async reindexAll(tenantId?: string): Promise<number> {
    const count = await this.globalSearchService.reindexAll(tenantId)

    // Clear relevant caches
    if (tenantId) {
      await this.cacheService.invalidateTenantCache(tenantId)
    } else {
      // Clear all caches if no specific tenant
      await this.cacheService.clearCache()
    }

    return count
  }

  /**
   * Get search engine status including cache status
   */
  async getSearchEngineStatus(): Promise<{ engine: string; available: boolean; info?: string }> {
    const baseStatus = this.globalSearchService.getSearchEngineStatus()
    const cacheHealthy = await this.cacheService.isHealthy()

    return {
      ...baseStatus,
      info: `${baseStatus.info} | Cache: ${cacheHealthy ? '✅ Active' : '❌ Disabled'}`,
    }
  }

  /**
   * Get enhanced search statistics including cache metrics
   */
  async getSearchStatistics(): Promise<SearchStatistics & { cache?: any }> {
    const baseStats = await this.globalSearchService.getSearchStatistics()
    const cacheStats = await this.cacheService.getCacheStatistics()

    return {
      ...baseStats,
      cache: {
        enabled: this.cacheService.getCacheConfig().enabled,
        statistics: cacheStats,
        health: await this.cacheService.isHealthy(),
      },
    }
  }

  /**
   * Warm cache with popular searches
   */
  async warmCacheForTenant(tenantId: string, popularQueries: string[]): Promise<void> {
    this.logger.log(`Warming cache for tenant ${tenantId} with ${popularQueries.length} queries`)

    for (const query of popularQueries) {
      try {
        const searchOptions: SearchOptions = {
          query,
          limit: 20, // Standard limit for cache warming
          offset: 0,
        }

        // Perform search to warm the cache
        await this.search(searchOptions)

        this.logger.debug(`Cache warmed for query: "${query}"`)
      } catch (error) {
        this.logger.warn(`Failed to warm cache for query "${query}": ${getErrorMessage(error)}`)
      }
    }
  }

  /**
   * Invalidate cache for specific entity type
   */
  async invalidateEntityCache(tenantId: string, entityType: string): Promise<void> {
    try {
      await this.cacheService.invalidateEntityCache(tenantId, entityType)
      this.logger.debug(`Cache invalidated for tenant ${tenantId}, entity type: ${entityType}`)
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  /**
   * Invalidate all cache for a tenant
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    try {
      await this.cacheService.invalidateTenantCache(tenantId)
      this.logger.debug(`All cache invalidated for tenant ${tenantId}`)
    } catch (error) {
      this.logger.error(
        `Failed to invalidate tenant cache: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
    }
  }

  /**
   * Get cache configuration
   */
  getCacheConfig() {
    return this.cacheService.getCacheConfig()
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics() {
    return this.cacheService.getCacheStatistics()
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    await this.cacheService.clearCache()
    this.logger.log('All search cache cleared')
  }

  // Private helper methods

  /**
   * Extract tenant ID from search options
   * This implementation assumes tenant ID is passed in the search context
   */
  private extractTenantId(options: SearchOptions): string | null {
    // Check if tenant ID is in the options context
    if ((options as unknown).tenantId) {
      return (options as unknown).tenantId
    }

    // Check if tenant ID is in filters
    if (options.filters?.tenantId) {
      return options.filters.tenantId as string
    }

    // In a real implementation, you might extract this from:
    // - Request context
    // - Authentication context
    // - Database connection context
    // For now, we'll return null to indicate no tenant context
    return null
  }

  /**
   * Extract tenant ID from search document
   */
  private extractTenantIdFromDocument(document: SearchDocument): string | null {
    // Check common tenant ID fields
    if ((document as any).tenantId) {
      return (document as any).tenantId
    }

    if ((document as any).tenant_id) {
      return (document as any).tenant_id
    }

    return null
  }
}
